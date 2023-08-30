<template>
  <div class="observable-list columns">
    <div class="column is-three-quarters">
      <b-table
        :data="observables"
        :hoverable="true"
        :narrowed="true"
        :checked-rows.sync="tableSelectedItems"
        checkable
        :total="tableTotal"
        :perPage="tablePerPage"
        backend-pagination
        @page-change="onPageChange"
        :loading="loading"
        paginated
        class="observable-table"
      >
        <template v-slot:default="observable">
          <b-table-column field="value" label="Value">
            <router-link :to="{ name: 'ObservableDetails', params: { id: observable.row.id } }">
              {{ observable.row.value }}
            </router-link>
          </b-table-column>

          <b-table-column field="tags" label="Tags">
            <b-taglist>
              <b-tag
                v-for="tag in Object.keys(observable.row.tags)"
                v-bind:key="tag"
                :type="observable.row.tags[tag].fresh ? 'is-primary' : ''"
              >
                {{ tag }}
              </b-tag>
            </b-taglist>
          </b-table-column>

          <b-table-column field="context" label="Context">
            <b-taglist>
              <b-tag
                v-for="contextSource in new Set(observable.row.context.map(c => c.source))"
                v-bind:key="contextSource"
              >
                {{ contextSource }}
              </b-tag>
            </b-taglist>
          </b-table-column>
          <b-table-column field="created" label="Created on (UTC)" width="180"
            ><span :title="'Localtime: ' + formatTimestamp(observable.row.created, true)">{{
              formatTimestamp(observable.row.created)
            }}</span>
          </b-table-column>

          <b-table-column field="sources" label="Sources">
            <b-taglist>
              <b-tag v-for="source in observable.row.sources" v-bind:key="source">
                {{ source }}
              </b-tag>
            </b-taglist>
          </b-table-column>
        </template>
        <template #bottom-left>
          <div v-if="tableSelectedItems.length">
            <b>Total selected</b>: {{ tableSelectedItems.length }}
            <b-button size="is-small" type="is-warning" icon-right="ban" @click="tableSelectedItems = []">
              Clear selection
            </b-button>
          </div>
        </template>
        <template #empty>
          <div class="has-text-centered">No records</div>
        </template>
      </b-table>
    </div>
    <div class="column">
      <section>
        <b-tabs v-model="activeTab" position="is-centered" :animated="false">
          <!-- Search tab item -->
          <b-tab-item label="Search">
            <div class="search">
              <div class="field">
                <b-input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search query + ⏎"
                  icon="search"
                  v-on:keyup.native.enter="searchObservables"
                />
              </div>
              <div class="field">
                <b-checkbox v-model="regexSearch">
                  Use regex (slower)
                </b-checkbox>
              </div>
            </div>
            <br />
            <article class="message tip">
              <div class="message-body content">
                <p>
                  You can run complex queries against the database using the input field above.
                </p>
                <p>
                  By default, the query will be matched against the
                  <code>value</code> attribute of the observables. To match against other attributes, use
                  <code>attribute=query</code>.
                </p>

                <p>Examples:</p>
                <ul>
                  <li>
                    <strong>Generic tag query</strong>:
                    <code>tags=crimeware</code>
                  </li>
                  <li><strong>Gate URLs</strong>: <code>tags=zeus .php$</code> (regex <code>on</code>)</li>
                  <li>
                    <strong>Ransomware C2s</strong>:
                    <code>tags=c2,ransomware</code>
                  </li>
                  <li>
                    <strong>Context</strong>:
                    <code>context.source=FeodoTracker</code>
                  </li>
                </ul>
              </div>
            </article>
          </b-tab-item>

          <b-tab-item label="Export">
            <b-field label="Select template" :message="totalSelectedItems + ' items will be exported.'">
              <b-select placeholder="Select a template" expanded v-model="selectedExportTemplate">
                <option v-for="template in exportTemplates" :value="template.id" :key="template.id">
                  {{ template.name }}
                </option>
              </b-select>
            </b-field>

            <div class="buttons">
              <b-button type="is-primary" @click="downloadExport">
                Export selection
              </b-button>
            </div>
          </b-tab-item>

          <b-tab-item label="Bulk tag">
            <b-field
              label="Select tags"
              :message="selectedTags.length + ' tags will be applied to ' + tableSelectedItems.length + ' observables'"
            >
              <b-taginput v-model="selectedTags" placeholder="e.g. CobaltStrike" icon="tag"></b-taginput>
            </b-field>

            <div class="buttons">
              <b-button type="is-primary" @click="changeTags('tag')">
                Add tag
              </b-button>
              <b-button type="is-danger" @click="changeTags('untag')">
                Remove tag
              </b-button>
            </div>
          </b-tab-item>
        </b-tabs>
      </section>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import utils from "@/utils";

export default {
  name: "ObservableList",
  components: {},
  props: {
    searchQuery: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      // Table
      regexSearch: false,
      observables: [],
      tablePage: 1,
      tablePerPage: 50,
      tableTotal: 500, // 5 pages worth should be enough to have time to get a more accurate count
      loading: false,
      // Exports
      tableSelectedItems: [],
      exportTemplates: [],
      selectedExportTemplate: null,
      // Tags
      selectedTags: [],
      // Panel
      activeTab: 0
    };
  },
  mounted() {
    this.getExportTemplates();
    this.searchObservables();
  },
  methods: {
    onPageChange(tablePage) {
      this.tablePage = tablePage;
      this.searchObservables();
    },
    searchObservables() {
      var params = {
        value: this.searchQuery,
        page: this.tablePage - 1,
        count: this.tablePerPage
      };
      this.loading = true;
      axios
        .post("/api/v2/observables/search", params)
        .then(response => {
          this.observables = response.data.observables;
          this.tableTotal = response.data.total;
        })
        .catch(error => {
          return console.log(error);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    generateSearchParams(searchQuery) {
      var filter = {};
      var queries = searchQuery.split(" ");
      var default_field = "value";

      for (var i in queries) {
        var splitted = queries[i].split("=");
        if (splitted.length == 2) {
          filter[splitted[0]] = splitted[1].split(",");
        } else if (queries[i] !== "") {
          filter[default_field] = queries[i];
        }
      }
      return filter;
    },
    changeTags(action) {
      var params = {
        tags: this.selectedTags,
        ids: this.tableSelectedItems.map(item => item.id),
        strict: false
      };
      axios
        .post(`/api/v2/observables/tag`, params)
        .then(() => {
          this.searchObservables();
          this.$buefy.notification.open(
            `${params.tags.length} tags succesfully ${action === "tag" ? "added" : "removed"}.`
          );
          this.selectedTags = [];
          this.tableSelectedItems = [];
        })
        .catch(error => {
          return console.log(error);
        });
    },
    getExportTemplates() {
      axios
        .post("/api/v2/templates/search", { name: "" })
        .then(response => {
          this.exportTemplates = response.data.templates;
        })
        .catch(error => {
          console.log(error);
        });
    },
    downloadExport() {
      var params = {
        template_id: this.selectedExportTemplate
      };
      if (this.tableSelectedItems.length) {
        params.observable_ids = this.tableSelectedItems.map(row => row.id);
      } else {
        params.search_query = this.searchQuery;
      }

      axios
        .post("/api/v2/templates/render", params)
        .then(response => {
          var fileURL = window.URL.createObjectURL(new Blob([response.data]));
          var fileLink = document.createElement("a");
          var fileName = response.headers["content-disposition"].split("filename=")[1];
          fileLink.href = fileURL;
          fileLink.setAttribute("download", fileName);
          document.body.appendChild(fileLink);

          fileLink.click();
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
    totalSelectedItems() {
      return this.tableSelectedItems.length > 0 ? this.tableSelectedItems.length : this.tableTotal;
    }
  }
};
</script>

<style>
.observable-table {
  margin-top: 0.4em;
}
</style>
