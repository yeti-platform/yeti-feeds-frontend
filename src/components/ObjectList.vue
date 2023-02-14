<template>
  <b-table
    :data="objects"
    :hoverable="true"
    :narrowed="true"
    checkable
    :total="tableTotal"
    :perPage="tablePerPage"
    backend-pagination
    @page-change="onPageChange"
    :loading="loading"
    paginated
    class="object-table"
  >
    <template v-slot:default="object">
      <b-table-column
        v-for="field in fields.filter(field => field.displayList)"
        :field="field"
        :label="field.label"
        v-bind:key="field.field"
      >
        <span v-if="field.field === 'value' || field.field === 'name'">
          <router-link
            :to="{
              name: field === 'value' ? 'ObservableDetails' : 'EntityDetails',
              params: { id: object.row.id }
            }"
          >
            {{ object.row[field.field] }}
          </router-link>
        </span>

        <b-taglist v-else-if="field.field === 'tags' || field.field === 'aliases'">
          <b-tag
            v-for="tag in object.row[field.field]"
            v-bind:key="tag.name ? tag.name : tag"
            :type="tag.fresh ? 'is-primary' : ''"
          >
            {{ tag.name ? tag.name : tag }}
          </b-tag>
        </b-taglist>

        <span v-else-if="field.type !== 'longtext'">{{ object.row[field.field] }}</span>
      </b-table-column>
    </template>
  </b-table>
</template>

<script>
import axios from "axios";
import utils from "@/utils";
// import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";

export default {
  name: "objectList",
  components: {},
  props: {
    searchQuery: {
      type: String,
      default: ""
    },
    searchType: {
      type: String,
      default: "entity"
    },
    searchSubtype: {
      type: String,
      default: ""
    },
    fields: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      regexSearch: true,
      ignoreCase: true,
      objects: [],
      tablePage: 1,
      tablePerPage: 50,
      tableTotal: 500, // 5 pages worth should be enough to have time to get a more accurate count
      loading: false
    };
  },
  mounted() {
    this.searchEntities();
  },
  methods: {
    onPageChange(tablePage) {
      this.tablePage = tablePage;
      this.searchEntities(false);
    },
    searchEntities(refreshTotal = true) {
      var params = {
        filter: this.generateSearchParams(this.searchQuery),
        params: {
          regex: this.regexSearch,
          ignorecase: this.ignoreCase,
          page: this.tablePage
        }
      };
      if (refreshTotal) {
        this.countTotal(params);
      }
      this.loading = true;
      axios
        .post(`/api/${this.searchType}search/`, params)
        .then(response => {
          this.objects = response.data;
          this.loading = false;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    generateSearchParams(searchQuery) {
      var filter = {};
      var queries = searchQuery.split(" ");
      var default_field = "name";

      for (var i in queries) {
        var splitted = queries[i].split("=");
        if (splitted.length == 2) {
          filter[splitted[0]] = splitted[1].split(",");
        } else if (queries[i] !== "") {
          filter[default_field] = queries[i];
        }
      }

      if (this.searchSubtype !== "") {
        filter["_cls"] = `${this.searchSubtype}`;
      }
      return filter;
    },
    countTotal(params) {
      this.tableTotal = 500;
      axios
        .post(`/api/${this.searchType}search/total`, params)
        .then(response => {
          this.tableTotal = response.data.total;
        })
        .catch(error => {
          console.log(error);
        });
    },
    formatTimestamp(timestamp, local) {
      return utils.formatTimestamp(timestamp, local);
    }
  },
  computed: {
    detailView() {
      let type = this.searchType.charAt(0).toUpperCase() + this.searchType.slice(1);
      return type + "Details";
    }
  }
};
</script>

<style>
.entity-table {
  margin-top: 0.4em;
}
</style>
