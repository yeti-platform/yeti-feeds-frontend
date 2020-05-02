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
        <b-table-column field="value" label="Value">
          <router-link :to="{ name: 'ObservableDetails', params: { id: link.row.target.id } }">
            {{ link.row.target.value }}
          </router-link>
        </b-table-column>

        <b-table-column field="description" label="Description">
          {{ link.row.description }}
        </b-table-column>

        <b-table-column field="description" label="Tags">
          <b-taglist>
            <b-tag v-for="tag in link.row.target.tags" v-bind:key="tag.name" :type="tag.fresh ? 'is-primary' : ''">
              {{ tag.name }}
            </b-tag>
          </b-taglist>
        </b-table-column>

        <b-table-column field="description" label="Context">
          <b-tag v-for="context in link.row.target.context" v-bind:key="context.source">
            {{ context.source }}
          </b-tag>
        </b-table-column>
      </template>
    </b-table>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "RelatedObservables",
  props: ["id"],
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
    fetchNeighbors() {
      var pagination = {
        params: {
          page: this.page,
          range: this.perPage
        }
      };
      this.loading = true;
      axios
        .post(`/api/neighbors/tuples/Observable/${this.id}/Observable`, pagination)
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
        .get(`/api/neighbors/tuples/Observable/${this.id}/Observable/total`)
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
