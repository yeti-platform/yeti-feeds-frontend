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
    >
      <template v-slot:default="link">
        <b-table-column v-for="field in fields" :field="field" :label="getLabelForField(field)" v-bind:key="field">
          <span v-if="field === 'value' || field === 'name'">
            <b-icon
              size="is-small"
              v-if="link.row.node.type && inlineIcons"
              :icon="getIconForType(link.row.node.type)"
            ></b-icon>
            <router-link :to="`/${link.row.node.root_type}/${link.row.node.id}`">
              {{ link.row.node[field] }}
            </router-link>
          </span>

          <b-taglist v-else-if="field === 'tags' || field === 'relevant_tags'">
            <b-tag
              v-for="tag in Object.keys(link.row.node[field])"
              v-bind:key="tag.name ? tag.name : tag"
              :type="tag.fresh ? 'is-primary' : ''"
            >
              {{ tag.name ? tag.name : tag }}
            </b-tag>
          </b-taglist>

          <span v-else>{{ link.row.node[field] }}</span>
        </b-table-column>

        <b-table-column field="relation" label="Relation">
          {{ link.row.description || "N/A" }}
        </b-table-column>

        <b-table-column field="unlink" label="Controls" width="10">
          <b-button type="is-text" icon-left="unlink" size="is-small" @click="unlink(link.row.id)"> </b-button>
        </b-table-column>
      </template>
    </b-table>
  </div>
</template>

<script>
import axios from "axios";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";

export default {
  name: "RelatedObjects",
  props: {
    id: { type: String, required: true },
    fields: { type: Array, default: () => ["value", "tags"] },
    sourceType: { type: String, default: "observable" },
    targetTypes: { type: Array, default: Array },
    inlineIcons: { type: Boolean, default: false }
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
        graph: "links",
        hops: 1,
        direction: "any",
        include_original: false,
        count: this.perPage,
        page: this.page - 1
      };
      axios
        .post(`/api/v2/graph/search`, graphSearchRequest)
        .then(response => {
          this.vertices = response.data.vertices;
          let links = response.data.edges;
          links.map(link => {
            link.node = link.target.includes(this.id) ? this.vertices[link.source] : this.vertices[link.target];
          });

          this.links = links;
          this.total = response.data.total;
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
    getIconForType(type) {
      return this.objectTypes.find(entityType => entityType.type === type).icon;
    },
    onPageChange(page) {
      this.page = page;
      this.fetchNeighbors();
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
