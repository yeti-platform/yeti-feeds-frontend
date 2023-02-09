<template>
  <div>
    <b-table
      :data="links"
      :hoverable="true"
      :narrowed="true"
      v-if="links"
      :loading="loading"
      paginated
      backend-pagination
      :total="total"
      :per-page="perPage"
      :current-page.sync="page"
      @page-change="onPageChange"
    >
      <template v-slot:default="link">
        <b-table-column v-for="field in fields" :field="field" :label="getLabelForField(field)" v-bind:key="field">
          <router-link
            v-if="field === 'value' || field === 'name'"
            :to="{
              name: field === 'value' ? 'ObservableDetails' : 'EntityDetails',
              params: { id: link.row.target.id }
            }"
          >
            {{ link.row.target[field] }}
          </router-link>

          <b-taglist v-else-if="field === 'tags'">
            <b-tag v-for="tag in link.row.target.tags" v-bind:key="tag" :type="tag.fresh ? 'is-primary' : ''">
              {{ tag.name ? tag.name : tag }}
            </b-tag>
          </b-taglist>

          <span v-else>{{ link.row.target[field] }}</span>
        </b-table-column>
      </template>
    </b-table>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "RelatedEntities",
  props: {
    id: { type: String, required: true },
    fields: { type: Array, default: () => ["value", "tags"] },
    sourceType: { type: String, default: "Observable" },
    targetType: { type: String, default: "Observable" }
  },
  data() {
    return {
      links: [],
      page: 1,
      perPage: 10,
      total: 500,
      loading: false
    };
  },
  mounted() {
    this.fetchNeighbors();
    this.countTotal();
  },
  methods: {
    getLabelForField(field) {
      switch (field) {
        case "value":
          return "Value";
        case "name":
          return "Name";
        case "description":
          return "Description";
        case "tags":
          return this.targetType === "Observable" ? "Tags" : "Relevant tags";
        case "context":
          return "Context";
        default:
          return field.charAt(0).toUpperCase() + field.slice(1);
      }
    },
    fetchNeighbors() {
      var pagination = {
        params: {
          page: this.page,
          range: this.perPage
        }
      };
      this.loading = true;
      axios
        .post(`/api/neighbors/tuples/${this.sourceType}/${this.id}/${this.targetType}`, pagination)
        .then(response => {
          this.links = response.data.links;
          this.links.map(link => {
            link.target = link.dst.id === this.id ? link.src : link.dst;
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => (this.loading = false));
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
