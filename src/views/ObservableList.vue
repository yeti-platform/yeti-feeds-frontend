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
              <b-tag v-for="tag in observable.row.tags" v-bind:key="tag.name" :type="tag.fresh ? 'is-primary' : ''">
                {{ tag.name }}
              </b-tag>
            </b-taglist>
          </b-table-column>

          <b-table-column field="context" label="Context">
            <b-taglist>
              <b-tag v-for="context in observable.row.context" v-bind:key="context.source">
                {{ context.source }}
              </b-tag>
            </b-taglist>
          </b-table-column>

          <b-table-column field="created" label="Created on">
            {{ new Date(observable.row.created).toISOString() }}
          </b-table-column>

          <b-table-column field="sources" label="Sources">
            <b-taglist>
              <b-tag v-for="source in observable.row.sources" v-bind:key="source">
                {{ source }}
              </b-tag>
            </b-taglist>
          </b-table-column>
        </template>
        <template slot="bottom-left">
          <div v-if="tableSelectedItems.length">
            <b>Total selected</b>: {{ tableSelectedItems.length }}
            <b-button size="is-small" type="is-warning" icon-right="ban" @click="tableSelectedItems = []">
              Clear selection
            </b-button>
          </div>
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
              <yeti-tag-input v-model="selectedTags"></yeti-tag-input>
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
import YetiTagInput from "@/components/YetiTagInput";

export default {
  name: "ObservableList",
  components: {
    YetiTagInput
  },
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
        filter: this.generateSearchParams(this.searchQuery),
        params: {
          regex: this.regexSearch,
          page: this.tablePage
        }
      };
      console.log(params);
      this.countTotal(params);
      this.loading = true;
      axios
        .post("/api/observablesearch/", params)
        .then(response => {
          return (this.observables = response.data);
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
        tags: this.selectedTags.map(tag => tag.name),
        ids: this.tableSelectedItems.map(item => item.id)
      };
      axios
        .post(`/api/observable/bulk-${action}`, params)
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
        .get("/api/exporttemplate/")
        .then(response => {
          this.exportTemplates = response.data;
        })
        .catch(error => {
          console.log(error);
        });
    },
    downloadExport() {
      var params = {
        id: this.selectedExportTemplate
      };
      if (this.tableSelectedItems.length) {
        params.observables = this.tableSelectedItems.map(row => row.id);
      } else {
        params.query = { filter: this.generateSearchParams(this.searchQuery) };
        params.query.params = {
          regex: this.regexSearch,
          page: this.tablePage
        };
      }

      console.log(params);
      axios
        .post("/api/exporttemplate/export", params)
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
    countTotal(params) {
      axios
        .post("/api/observablesearch/total", params)
        .then(response => {
          this.tableTotal = response.data.total;
        })
        .catch(error => {
          console.log(error);
        });
    }
  },
  computed: {
    filterTags() {
      return this.existingTags.filter(tag => {
        return (
          tag.name
            .toString()
            .toLowerCase()
            .indexOf(this.tagName.toLowerCase()) >= 0
        );
      });
    },
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
