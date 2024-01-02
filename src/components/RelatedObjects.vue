<template>
  <!-- Empty headers array to not mess up with CSS borders -->
  <v-data-table-server
    density="compact"
    :items="getNodeChain"
    :itemsLength="total"
    :items-per-page="perPage"
    v-model:page="page"
    @update:options="fetchNeighbors"
    :headers="[]"
    hover
  >
    <template v-slot:item="{ item }">
      <tr>
        <td
          v-for="node in item.nodeChain"
          v-bind:key="node.id"
          :class="{ object: !node.direction, link: node.direction }"
        >
          <span v-if="node.direction">
            <v-icon v-if="node.direction == 'out'">mdi-arrow-right</v-icon>
            <v-icon v-else-if="node.direction == 'in'">mdi-arrow-left</v-icon>

            <v-btn size="small" variant="text" append-icon="mdi-information" v-if="node.description">
              <template v-slot:append>
                <v-icon class="on-surface"></v-icon>
              </template>
              {{ node.type }}
              <v-menu activator="parent">
                <v-sheet class="px-5 py-2" color="background" width="auto" elevation="10" style="font-size: 0.8rem">
                  <yeti-markdown :text="node.description" />
                </v-sheet>
              </v-menu>
            </v-btn>
          </span>
          <span v-else-if="node.root_type === 'observable'" class="short-links">
            <v-tooltip activator="parent" location="top" :open-delay="200">{{ node.value }}</v-tooltip>
            <router-link :to="{ name: 'ObservableDetails', params: { id: node.id } }">
              {{ node.value }}
            </router-link>
          </span>
          <span v-else-if="node.root_type === 'entity'" class="short-links">
            <v-icon :icon="getIconForType(node.type)" start size="small"></v-icon>
            <span>
              <v-tooltip activator="parent" location="top" :open-delay="200">{{ node.name }}</v-tooltip>
              <router-link :to="{ name: 'EntityDetails', params: { id: node.id } }">
                {{ node.name }}
              </router-link>
            </span>
          </span>
          <span v-else-if="node.root_type === 'indicator'" class="short-links">
            <v-icon :icon="getIconForType(node.type)" start size="small"></v-icon>
            <span>
              <v-tooltip activator="parent" location="top" :open-delay="200">{{ node.name }}</v-tooltip>
              <router-link :to="{ name: 'IndicatorDetails', params: { id: node.id } }">
                {{ node.name }}
              </router-link>
            </span>
          </span>
          <span v-else>
            <v-chip> {{ node.name }}</v-chip>
          </span>
        </td>
        <td class="controls" v-if="hops === 1">
          <v-btn
            icon="mdi-link-off"
            @click="unlink(item.edges[0].id)"
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
                :edge="item.edges[0]"
                :is-active="isActive"
                @success="linkUpdateSuccess(item.edges[0], $event)"
              />
            </template>
          </v-dialog>
        </td>
      </tr>
    </template>
  </v-data-table-server>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import EditLink from "@/components/EditLink.vue";
import YetiMarkdown from "@/components/YetiMarkdown.vue";
</script>

<script lang="ts">
export default {
  name: "RelatedObjects",
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
        this.fetchNeighbors();
      }
    });
  },
  data() {
    return {
      tempChains: [],
      paths: [],
      vertices: {},
      page: 1,
      perPage: 20,
      total: 0,
      loading: false,
      objectTypes: ENTITY_TYPES.concat(INDICATOR_TYPES),
      showEditLink: false
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
    fetchNeighbors() {
      this.loading = true;
      let graphSearchRequest = {
        source: `${this.sourceType}/${this.id}`,
        target_types: this.targetTypes,
        graph: this.graph,
        hops: this.hops,
        direction: "any",
        include_original: true,
        count: this.perPage,
        page: this.page - 1
      };

      axios
        .post(`/api/v2/graph/search`, graphSearchRequest)
        .then(response => {
          this.vertices = response.data.vertices;
          this.paths = response.data.paths;
          this.total = response.data.total;
          this.$emit("totalUpdated", this.total);
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => (this.loading = false));
    },
    unlink(id) {
      axios
        .delete(`/api/v2/graph/${id}`)
        .then(() => {
          this.fetchNeighbors();
        })
        .catch(error => {
          console.log(error);
        });
    },
    getIconForType(type) {
      return this.objectTypes.find(objectType => objectType.type === type).icon;
    },
    onPageChange(page) {
      this.page = page;
      this.fetchNeighbors();
    }
  },
  computed: {
    extendedId() {
      return `${this.sourceType}/${this.id}`;
    },
    getNodeChain() {
      let chains = [];
      for (let i = 0; i < this.paths.length; i++) {
        let edges = this.paths[i];
        let nodeChain = [];
        for (let j = 0; j < edges.length; j++) {
          let edge = edges[j];
          if (j === 0) {
            if (edge.source === this.extendedId) {
              nodeChain.push(this.vertices[edge.source]);
              edge.direction = "out";
              nodeChain.push(edge);
              nodeChain.push(this.vertices[edge.target]);
            } else {
              nodeChain.push(this.vertices[edge.target]);
              edge.direction = "in";
              nodeChain.push(edge);
              nodeChain.push(this.vertices[edge.source]);
            }
          } else {
            if (edge.source != edges[j - 1].target) {
              edge.direction = "in";
              nodeChain.push(edge);
              nodeChain.push(this.vertices[edge.source]);
            } else {
              edge.direction = "out";
              nodeChain.push(edge);
              nodeChain.push(this.vertices[edge.target]);
            }
          }
        }
        chains.push({ edges: edges, nodeChain: nodeChain });
      }
      return chains;
    }
  },
  watch: {
    id: function () {
      this.page = 1;
      this.total = 500;
      this.fetchNeighbors();
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

td.controls {
  width: 110px;
}

td.link {
  width: 200px;
}
</style>
