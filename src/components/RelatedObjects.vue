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
              v-if="link.row.target.type && inlineIcons"
              :icon="getIconForType(link.row.target.type)"
            ></b-icon>
            <router-link
              :to="{
                name: field === 'value' ? 'ObservableDetails' : 'EntityDetails',
                params: { id: vertices[link.row.target].id }
              }"
            >
              {{ vertices[link.row.target][field] }}
            </router-link>
          </span>

          <b-taglist v-else-if="field === 'tags'">
            <b-tag
              v-for="tag in vertices[link.row.target].tags"
              v-bind:key="tag.name ? tag.name : tag"
              :type="tag.fresh ? 'is-primary' : ''"
            >
              {{ tag.name ? tag.name : tag }}
            </b-tag>
          </b-taglist>

          <span v-else>{{ vertices[link.row.target][field] }}</span>
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
    this.countTotal();
  },
  methods: {
    getLabelForField(field) {
      switch (field) {
        default:
          return field.charAt(0).toUpperCase() + field.slice(1);
      }
    },
    fetchNeighbors() {
      this.loading = true;
      let graphSearchRequest = {
        source: `${this.sourceType}/${this.id}`,
        target_types: this.targetTypes,
        hops: 1,
        direction: "any",
        include_original: false
      };
      axios
        .post(`/api/v2/graph/search/`, graphSearchRequest)
        .then(response => {
          this.links = response.data.edges;
          this.vertices = response.data.vertices;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => (this.loading = false));
    },
    unlink(id) {
      axios
        .delete(`/api/link/${id}`)
        .then(() => {
          this.fetchNeighbors();
          this.countTotal();
        })
        .catch(error => {
          console.log(error);
        });
    },
    countTotal() {
      axios
        .get(`/api/neighbors/tuples/${this.sourceType}/${this.id}/${this.targetType}/total`)
        .then(response => {
          this.total = response.data.total;
          this.$emit("totalUpdated", this.total);
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
      this.countTotal();
    }
  }
};
</script>
