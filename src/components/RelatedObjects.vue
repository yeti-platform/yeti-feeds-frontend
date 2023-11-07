<template>
  <div>
    <b-table
      :data="links"
      :hoverable="true"
      :narrowed="true"
      v-if="links"
      :loading="loading"
      :paginated="total > perPage"
      backend-pagination
      :total="total"
      :per-page="perPage"
      :current-page.sync="page"
      @page-change="onPageChange"
      class="related-objects"
    >
      <template v-slot:default="link">
        <b-table-column
          v-for="node in link.row.nodeChain"
          v-bind:key="node.id"
          :class="{ arrow: !!node.direction, object: !node.direction }"
        >
          <span v-if="node.direction">{{
            node.direction == "out" ? `→ ${node.type || ""}` : `← ${node.type || ""}`
          }}</span>
          <span v-else-if="node.root_type === 'observable'" class="short-links">
            <router-link :to="{ name: 'ObservableDetails', params: { id: node.id } }">
              {{ node.value }}
            </router-link>
            <span v-if="fields.includes('tags')">
              <b-taglist>
                <b-tag
                  v-for="tag in Object.keys(node.tags)"
                  :key="tag"
                  :type="node.tags[tag].fresh ? 'is-primary' : ''"
                  size="is-small"
                >
                  {{ tag }}
                </b-tag>
              </b-taglist>
            </span>
          </span>
          <span v-else-if="node.root_type === 'entity'">
            <b-icon size="is-small" :icon="getIconForType(node.type)"></b-icon>
            <router-link :to="{ name: 'EntityDetails', params: { id: node.id } }">
              {{ node.name }}
            </router-link>
          </span>
          <span v-else-if="node.root_type === 'indicator'">
            <b-icon size="is-small" :icon="getIconForType(node.type)"></b-icon>
            <router-link :to="{ name: 'IndicatorDetails', params: { id: node.id } }">
              {{ node.name }}
            </router-link>
          </span>
          <span v-else>
            <b-tag> {{ node.name }}</b-tag>
          </span>
        </b-table-column>

        <b-table-column v-if="hops === 1" field="unlink" label="Controls" width="10">
          <b-button type="is-text" icon-left="unlink" size="is-small" @click="unlink(link.row.edges[0].id)"> </b-button>
          <b-button type="is-text" icon-left="pen" size="is-small" @click="editEdge(link.row.edges[0])"> </b-button>
        </b-table-column>
      </template>
    </b-table>
  </div>
</template>

<script>
import axios from "axios";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import EditLink from "@/components/EditLink";

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
      perPage: 10,
      total: 500,
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
                  edge.direction = "out";
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
          this.$emit("totalUpdated", this.links.length);
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

<style>
.related-objects thead {
  display: none;
}

td.arrow {
  width: 10px;
}

td.object {
  max-width: 300px;
}

span.short-links {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
</style>
