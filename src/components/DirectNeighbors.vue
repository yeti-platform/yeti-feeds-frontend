<template>
  <!-- Empty headers array to not mess up with CSS borders -->
  <v-data-table-server
    density="compact"
    :items="processedPaths"
    :itemsLength="total"
    :items-per-page="perPage"
    v-model:page="page"
    :headers="headers"
    @update:options="fetchNeighbors"
    @update:items-per-page="perPage = $event"
    :sort-by="sortBy"
    hover
  >
    <template v-slot:item="{ item }">
      <tr>
        <td>
          <v-icon v-if="item.target === extendedId">mdi-arrow-left</v-icon>
          <v-icon v-else-if="item.source === extendedId">mdi-arrow-right</v-icon>
        </td>
        <td>
          <v-chip density="compact" class="ml-2">{{ item.relevant_node.type }}</v-chip>
        </td>
        <td v-if="item.relevant_node.root_type === 'observable'">
          <router-link :to="{ name: 'ObservableDetails', params: { id: item.relevant_node.id } }">
            {{ item.relevant_node.value }}
          </router-link>
        </td>
        <td v-if="item.relevant_node.root_type === 'entity'">
          <v-icon :icon="getIconForType(item.relevant_node.type)" start size="small"></v-icon>
          <router-link :to="{ name: 'EntityDetails', params: { id: item.relevant_node.id } }">
            {{ item.relevant_node.name }}
          </router-link>
        </td>
        <td v-if="item.relevant_node.root_type === 'indicator'">
          <v-icon :icon="getIconForType(item.relevant_node.type)" start size="small"></v-icon>
          <router-link :to="{ name: 'IndicatorDetails', params: { id: item.relevant_node.id } }">
            {{ item.relevant_node.name }}
          </router-link>
        </td>
        <td v-if="item.relevant_node.root_type === 'dfiq'">
          <v-icon :icon="getIconForType(item.relevant_node.type)" start size="small"></v-icon>
          <router-link :to="{ name: 'DFIQDetails', params: { id: item.relevant_node.id } }">
            {{ item.relevant_node.name }}
          </router-link>
        </td>
        <td>
          <v-chip density="compact" class="mr-2">{{ item.type }} </v-chip>{{ item.description }}
        </td>
        <!-- <td>
          <v-btn size="small" variant="text" append-icon="mdi-information">
            <template v-slot:append>
              <v-icon class="on-surface" v-if="node.description"></v-icon>
            </template>
            {{ node.type }}
            <v-menu activator="parent" v-if="node.description">
              <v-sheet class="px-5 py-2" color="background" width="auto" elevation="10" style="font-size: 0.8rem">
                <yeti-markdown :text="node.description" />
              </v-sheet>
            </v-menu>
          </v-btn>
        </td> -->
        <td class="controls" v-if="hops === 1">
          <v-btn
            icon="mdi-swap-horizontal"
            @click="swapLink(item.id)"
            density="compact"
            variant="tonal"
            color="primary"
            class="me-2"
          >
          </v-btn>
          <v-dialog width="700">
            <template v-slot:activator="{ props }">
              <v-btn icon="mdi-pencil" density="compact" variant="tonal" color="primary" class="me-2" v-bind="props">
              </v-btn>
            </template>

            <template v-slot:default="{ isActive }">
              <edit-link
                :vertices="vertices"
                :edge="node"
                :is-active="isActive"
                @success="linkUpdateSuccess(node, $event)"
              />
            </template>
          </v-dialog>
          <v-btn
            icon="mdi-link-off"
            @click="unlink(item.id)"
            density="compact"
            variant="tonal"
            color="error"
            class="me-2"
          >
          </v-btn>
        </td>
      </tr>
    </template>
  </v-data-table-server>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions.js";
import EditLink from "@/components/EditLink.vue";
import YetiMarkdown from "@/components/YetiMarkdown.vue";
</script>

<script lang="ts">
export default {
  name: "DirectNeighbors",
  props: {
    id: { type: String, required: true },
    fields: { type: Array, default: () => ["value", "tags"] },
    sourceType: { type: String, default: "observable" },
    targetTypes: { type: Array, default: Array },
    inlineIcons: { type: Boolean, default: false },
    graph: { type: String, default: "links" },
    hops: { type: Number, default: 1 }
  },
  components: {
    EditLink,
    YetiMarkdown
  },
  mounted() {
    this.$eventBus.on("linkCreated", data => {
      const souceType = data.source.type;
      const targetType = data.target.type;
      if (this.targetTypes.includes(targetType) || this.targetTypes.includes(souceType)) {
        this.fetchNeighbors({ page: this.page, itemsPerPage: this.perPage, sortBy: this.sortBy });
      }
    });
  },
  data() {
    return {
      tempChains: [],
      paths: [],
      processedPaths: [],
      vertices: {},
      page: 1,
      perPage: 25,
      total: 0,
      loading: false,
      objectTypes: ENTITY_TYPES.concat(INDICATOR_TYPES).concat(DFIQ_TYPES),
      showEditLink: false,
      headers: [
        { title: "", key: "direction", width: "10px" },
        { title: "Type", key: "relevant_node.type", width: "10px" },
        { title: "Value", key: "relevant_node.value" },
        { title: "Description", key: "description" },
        { title: "", key: "controls" }
      ],
      sortBy: [{ key: "name", order: "asc" }]
    };
  },
  methods: {
    linkUpdateSuccess(edge, updatedEdge) {
      edge.type = updatedEdge.type;
      edge.description = updatedEdge.description;
    },
    getLabelForField(field) {
      let fieldName = field.charAt(0).toUpperCase() + field.slice(1);
      fieldName = fieldName.replace(/_/g, " ");
      return fieldName;
    },
    fetchNeighbors({
      page,
      itemsPerPage,
      sortBy
    }: {
      page: number;
      itemsPerPage: number;
      sortBy: Array<{ key: string; order: string }>;
    }) {
      this.loading = true;
      let graphSearchRequest = {
        source: `${this.sourceType}/${this.id}`,
        target_types: this.targetTypes,
        graph: this.graph,
        hops: this.hops,
        direction: "any",
        include_original: true,
        count: itemsPerPage === -1 ? 0 : itemsPerPage,
        page: page - 1
      };

      axios
        .post(`/api/v2/graph/search`, graphSearchRequest)
        .then(response => {
          this.vertices = response.data.vertices;
          this.paths = response.data.paths;
          this.processedPaths = response.data.paths.map(path => {
            let processedPath = path[0];
            let relevantNode = processedPath.source === this.extendedId ? processedPath.target : processedPath.source;
            processedPath.relevant_node = this.vertices[relevantNode];
            return processedPath;
          });
          console.log(this.processedPaths);
          this.total = response.data.total;
          this.$emit("totalUpdated", this.total);
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => (this.loading = false));
    },
    getVerticeFromNode(link) {
      console.log(link);
      return link.source === this.extendedId ? this.vertices[link.target] : this.vertices[link.source];
    },
    swapLink(edgeId) {
      axios
        .post(`/api/v2/graph/${edgeId}/swap`)
        .then(response => {
          this.$eventBus.emit("displayMessage", { message: "Link direction swapped succesfully!", status: "success" });
          console.log({ page: this.page, itemsPerPage: this.perPage });
          this.fetchNeighbors({ page: this.page, itemsPerPage: this.perPage });
        })
        .catch(error => {
          this.error = error;
          console.log(error);
        });
    },
    unlink(id) {
      if (!confirm("Are you sure you want to delete this link?")) {
        return;
      }
      axios
        .delete(`/api/v2/graph/${id}`)
        .then(() => {
          this.fetchNeighbors({ page: this.page, itemsPerPage: this.perPage });
        })
        .catch(error => {
          console.log(error);
        });
    },
    getIconForType(type) {
      return this.objectTypes.find(objectType => objectType.type === type).icon;
    }
  },
  computed: {
    extendedId() {
      return `${this.sourceType}/${this.id}`;
    }
  },
  watch: {
    id: function () {
      this.page = 1;
      this.perPage = 20;
      this.fetchNeighbors({ page: this.page, itemsPerPage: this.perPage });
    }
  }
};
</script>

<style></style>
