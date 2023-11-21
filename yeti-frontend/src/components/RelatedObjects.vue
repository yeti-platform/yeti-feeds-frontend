<template>
  <v-data-table-server
    density="compact"
    :items="getNodeChain"
    :itemsLength="total"
    :items-per-page="perPage"
    v-model:page="page"
    @update:options="fetchNeighbors"
    hover
    :headers="[]"
  >
    <template v-slot:item="{ item }">
      <tr>
        <td v-for="node in item.nodeChain" v-bind:key="node.id" :class="{ object: !node.direction }">
          <span v-if="node.direction">
            <v-icon v-if="node.direction == 'out'">mdi-arrow-right</v-icon>
            <v-icon v-else-if="node.direction == 'in'">mdi-arrow-left</v-icon>
            {{ node.type }}
          </span>
          <span v-else-if="node.root_type === 'observable'" class="short-links">
            <router-link
              :to="{ name: 'ObservableDetails', params: { id: node.id } }"
              class="text-blue mr-2"
              style="text-decoration:none"
            >
              {{ node.value }}
            </router-link>
            <span v-if="fields.includes('tags')">
              <v-chip
                v-for="tag in Object.keys(node.tags)"
                :key="tag"
                :color="node.tags[tag].fresh ? 'blue' : ''"
                class="mx-1"
                size="x-small"
              >
                {{ tag }}
              </v-chip>
            </span>
          </span>
          <span v-else-if="node.root_type === 'entity'">
            <v-icon size="is-small" :icon="getIconForType(node.type)"></v-icon>
            <router-link :to="{ name: 'EntityDetails', params: { id: node.id } }">
              {{ node.name }}
            </router-link>
          </span>
          <span v-else-if="node.root_type === 'indicator'">
            <v-icon size="is-small" :icon="getIconForType(node.type)"></v-icon>
            <router-link :to="{ name: 'IndicatorDetails', params: { id: node.id } }">
              {{ node.name }}
            </router-link>
          </span>
          <span v-else>
            <v-chip> {{ node.name }}</v-chip>
          </span>
        </td>
        <td>
          <v-btn
            icon="mdi-link-off"
            @click="unlink(item.edges[0].id)"
            density="compact"
            variant="tonal"
            color="primary"
            class="me-2"
          >
          </v-btn>
          <v-btn
            icon="mdi-pencil"
            @click="editEdge(item.edges[0].id)"
            density="compact"
            variant="tonal"
            color="primary"
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
// import EditLink from "@/components/EditLink";
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
  data() {
    return {
      links: [],
      vertices: {},
      page: 1,
      perPage: 20,
      total: 0,
      loading: false,
      objectTypes: ENTITY_TYPES.concat(INDICATOR_TYPES)
    };
  },
  mounted() {
    this.fetchNeighbors();
  },
  methods: {
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
          let vertices = response.data.vertices;
          let paths = [];
          for (let i = 0; i < response.data.paths.length; i++) {
            let edges = response.data.paths[i];
            let nodeChain = [];
            for (let j = 0; j < edges.length; j++) {
              let edge = edges[j];
              if (j === 0) {
                if (edge.source === this.extendedId) {
                  nodeChain.push(vertices[edge.source]);
                  edge.direction = "out";
                  nodeChain.push(edge);
                  nodeChain.push(vertices[edge.target]);
                } else {
                  nodeChain.push(vertices[edge.target]);
                  edge.direction = "in";
                  nodeChain.push(edge);
                  nodeChain.push(vertices[edge.source]);
                }
              } else {
                if (edge.source != edges[j - 1].target) {
                  edge.direction = "in";
                  nodeChain.push(edge);
                  nodeChain.push(vertices[edge.source]);
                } else {
                  edge.direction = "ou";
                  nodeChain.push(edge);
                  nodeChain.push(vertices[edge.target]);
                }
              }
            }
            paths.push({ edges: edges, nodeChain: nodeChain });
          }
          this.links = paths;
          this.total = response.data.total;
          this.vertices = vertices;
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
    editEdge(edge) {
      this.$buefy.modal.open({
        parent: this,
        component: EditLink,
        hasModalCard: true,
        trapFocus: true,
        props: {
          edge: edge,
          vertices: this.vertices
        },
        events: {
          refresh: this.fetchNeighbors
        }
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
      return this.links;
    }
  },
  watch: {
    id: function() {
      this.page = 1;
      this.total = 500;
      this.fetchNeighbors();
    }
  }
};
</script>

<style></style>
