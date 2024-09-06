<template>
  <!-- Empty headers array to not mess up with CSS borders -->
  <div>
    <v-form>
      <v-row>
        <v-col>
          <v-text-field
            label="Filter regex (name, type, value, description, aliases)"
            density="compact"
            @update:model-value="searchFilterDebounced"
            clearable
            hide-details
          ></v-text-field>
        </v-col>
        <v-col>
          <!-- add a checkbox for inline display of description -->
          <v-checkbox-btn
            label="Dispay inline description"
            density="compact"
            hide-details
            color="primary"
            class="float-left mr-4 mt-1"
            v-model="inlineDescription"
          ></v-checkbox-btn>
          <v-checkbox-btn
            label="Inline markdown"
            density="compact"
            hide-details
            color="primary"
            class="float-left mt-1"
            v-model="inlineMarkdown"
          ></v-checkbox-btn>
        </v-col>
      </v-row>
    </v-form>
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
      :search="searchFilter"
      hover
    >
      <!-- <tr> -->
      <template v-slot:item.direction="{ item }">
        <v-icon v-if="item.target === extendedId">mdi-arrow-left</v-icon>
        <v-icon v-else-if="item.source === extendedId">mdi-arrow-right</v-icon>
      </template>

      <template v-slot:item.created="{ item }">
        {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss") }}
      </template>

      <template v-slot:item.modified="{ item }">
        {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss") }}
      </template>

      <template v-slot:item.relevant_node.type="{ item }">
        <v-chip density="compact" class="ml-2">
          <v-icon :icon="getIconForType(item.relevant_node.type)" start size="small"></v-icon>
          {{ item.relevant_node.type }}</v-chip
        >
      </template>

      <template v-slot:item.relevant_node.value="{ item }">
        <span v-if="item.relevant_node.root_type === 'observable'">
          <router-link :to="{ name: 'ObservableDetails', params: { id: item.relevant_node.id } }">
            <span class="short-links">{{ item.relevant_node.value }}</span>
          </router-link>
        </span>
        <span v-if="item.relevant_node.root_type === 'entity'">
          <router-link :to="{ name: 'EntityDetails', params: { id: item.relevant_node.id } }">
            <span class="short-links">{{ item.relevant_node.name }}</span>
          </router-link>
        </span>
        <span v-if="item.relevant_node.root_type === 'indicator'">
          <router-link :to="{ name: 'IndicatorDetails', params: { id: item.relevant_node.id } }">
            <span class="short-links">{{ item.relevant_node.name }}</span>
          </router-link>
        </span>
        <span v-if="item.relevant_node.root_type === 'dfiq'">
          <router-link :to="{ name: 'DFIQDetails', params: { id: item.relevant_node.id } }">
            <span class="short-links">{{ item.relevant_node.name }}</span>
          </router-link>
        </span>
      </template>

      <template v-slot:item.relevant_node.tags="{ item }">
        <v-chip
          v-if="item.relevant_node.tags"
          v-for="tag in Object.keys(item.relevant_node.tags)"
          :key="tag"
          class="mr-2"
          :color="item.relevant_node.tags[tag].fresh ? 'primary' : 'grey'"
          density="compact"
        >
          {{ tag }}
        </v-chip>
      </template>

      <template v-slot:item.description="{ item }">
        <span v-if="inlineDescription">
          <v-chip density="compact" class="mr-2" color="success">{{ item.type }} </v-chip>
          <span><yeti-markdown :text="item.description" :inline="inlineMarkdown" /></span>
        </span>
        <v-btn v-else size="small" variant="tonal" append-icon="mdi-information">
          <template v-slot:append>
            <v-icon v-if="item.description"></v-icon>
          </template>
          {{ item.type }}
          <v-menu activator="parent" v-if="item.description">
            <v-sheet class="px-5 py-2" color="background" width="auto" elevation="10" style="font-size: 0.8rem">
              <yeti-markdown :text="item.description" />
            </v-sheet>
          </v-menu>
        </v-btn>
      </template>

      <template v-slot:item.controls="{ item }">
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
              :edge="item"
              :is-active="isActive"
              @success="linkUpdateSuccess(item, $event)"
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
      </template>
    </v-data-table-server>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";
import moment from "moment";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import EditLink from "@/components/EditLink.vue";
import YetiMarkdown from "@/components/YetiMarkdown.vue";

import _ from "lodash";
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
      inlineDescription: true,
      inlineMarkdown: true,
      searchFilter: "",
      page: 1,
      perPage: 50,
      total: 0,
      loading: false,
      objectTypes: ENTITY_TYPES.concat(INDICATOR_TYPES).concat(DFIQ_TYPES).concat(OBSERVABLE_TYPES),
      showEditLink: false,
      headers: [
        { title: "", key: "direction", width: "10px" },
        { title: "First linked", key: "created", width: "170px", sortable: true },
        { title: "Last linked", key: "modified", width: "170px", sortable: true },
        { title: "Type", key: "relevant_node.type", width: "10px", sortable: false },
        { title: "Value", key: "relevant_node.value", maxWidth: "700px", sortable: false },
        { title: "Tags", key: "relevant_node.tags", sortable: false },
        { title: "Description", key: "description", sortable: false },
        { title: "Count", key: "count", sortable: true },
        { title: "", key: "controls", sortable: false }
      ],
      sortBy: [{ key: "created", order: "asc" }]
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
      let filters = [
        {
          key: "type",
          value: this.searchFilter || "",
          operator: "=~"
        },
        {
          key: "description",
          value: this.searchFilter || "",
          operator: "=~"
        },
        {
          key: "value",
          value: this.searchFilter || "",
          operator: "=~"
        },
        {
          key: "name",
          value: this.searchFilter || "",
          operator: "=~"
        },
        {
          key: "aliases",
          value: this.searchFilter || "",
          operator: "in"
        }
      ];
      let graphSearchRequest = {
        source: `${this.sourceType}/${this.id}`,
        target_types: this.targetTypes,
        graph: this.graph,
        hops: this.hops,
        direction: "any",
        include_original: true,
        filter: filters,
        count: itemsPerPage === -1 ? 0 : itemsPerPage,
        page: page - 1,
        sorting: sortBy.map(sort => [sort.key, sort.order === "asc"])
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
          this.total = response.data.total;
          this.$emit("totalUpdated", this.total);
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => (this.loading = false));
    },
    getVerticeFromNode(link) {
      return link.source === this.extendedId ? this.vertices[link.target] : this.vertices[link.source];
    },
    swapLink(edgeId) {
      axios
        .post(`/api/v2/graph/${edgeId}/swap`)
        .then(response => {
          this.$eventBus.emit("displayMessage", { message: "Link direction swapped succesfully!", status: "success" });
          this.fetchNeighbors({ page: this.page, itemsPerPage: this.perPage, sortBy: this.sortBy });
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
          this.fetchNeighbors({ page: this.page, itemsPerPage: this.perPage, sortBy: this.sortBy });
        })
        .catch(error => {
          console.log(error);
        });
    },
    getIconForType(type) {
      return this.objectTypes.find(objectType => objectType.type === type)?.icon;
    },
    searchFilterDebounced: _.debounce(function (searchFilter) {
      this.searchFilter = searchFilter;
    }, 200)
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
      this.fetchNeighbors({ page: this.page, itemsPerPage: this.perPage, sortBy: this.sortBy });
    }
  }
};
</script>

<style>
.short-links {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  display: block;
}
</style>
