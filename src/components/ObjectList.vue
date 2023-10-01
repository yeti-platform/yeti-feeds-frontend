<template>
  <b-table
    :data="objects"
    :hoverable="true"
    :narrowed="true"
    :checkable="checkable"
    :total="tableTotal"
    :perPage="tablePerPage"
    backend-pagination
    @page-change="onPageChange"
    :loading="loading"
    paginated
    class="object-table"
  >
    <template v-slot:default="object">
      <b-table-column field="created" label="Created" width="180"
        ><span :title="'Localtime: ' + formatTimestamp(object.row.created, true)">{{
          formatTimestamp(object.row.created)
        }}</span>
      </b-table-column>

      <b-table-column
        v-for="field in fields.filter(field => field.displayList)"
        :field="field.field"
        :label="field.label"
        v-bind:key="field.field"
      >
        <span v-if="field.field === 'value' || field.field === 'name'">
          <router-link :to="`/${object.row.root_type}/${object.row.id}`">
            {{ object.row[field.field] }}
          </router-link>
        </span>

        <code v-else-if="field.type === 'code'"> {{ object.row[field.field] }} </code>
        <code v-else-if="field.type === 'longcode'"> {{ object.row[field.field] }} </code>

        <b-taglist v-else-if="field.field === 'tags' || field.type == 'list'">
          <b-tag
            v-for="tag in object.row[field.field]"
            v-bind:key="tag.name ? tag.name : tag"
            :type="tag.fresh ? 'is-primary' : ''"
          >
            {{ tag.name ? tag.name : tag }}
          </b-tag>
        </b-taglist>

        <span
          v-else-if="field.type === 'timestamp'"
          :title="'Localtime: ' + formatTimestamp(object.row[field.field], true)"
          >{{ formatTimestamp(object.row[field.field]) }}
        </span>

        <span v-else-if="field.type !== 'longtext'">{{ object.row[field.field] }}</span>
      </b-table-column>
    </template>
    <template #empty>
      <div class="has-text-centered">No records</div>
    </template>
  </b-table>
</template>

<script>
import axios from "axios";
import utils from "@/utils";
// import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import _ from "lodash";

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
    },
    checkable: {
      type: Boolean,
      default: false
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
    this.searchObjects();
  },
  created() {
    // This has to come here because we want the debounce functions to be created
    // within each component.
    this.$watch(
      "searchQuery",
      _.debounce(function() {
        this.searchObjects();
      }, 300)
    );
  },
  methods: {
    onPageChange(tablePage) {
      this.tablePage = tablePage;
      this.searchObjects(false);
    },
    searchObjects() {
      var params = {
        name: this.searchQuery,
        type: this.searchSubtype,
        count: this.tablePerPage,
        page: this.tablePage - 1
      };
      this.loading = true;
      axios
        .post(`/api/v2/${this.searchType}/search`, params)
        .then(response => {
          this.objects = response.data[this.searchType];
          this.tableTotal = response.data.total;
          this.$emit("totalUpdated", this.tableTotal);
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {
          this.loading = false;
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
