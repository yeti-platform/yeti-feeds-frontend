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
            <a href="#"> {{ observable.row.value }} </a>
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
            {{ observable.row.sources }}
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
            <section>
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
            </section>
          </b-tab-item>

          <b-tab-item label="Export">
            Export
          </b-tab-item>

          <b-tab-item label="Manage tags">
            <b-field label="Tag observables">
              <b-taginput
                v-model="selectedTags"
                :data="filterTags"
                autocomplete
                icon="tag"
                placeholder="e.g. Zeus"
                field="name"
              >
              </b-taginput>
            </b-field>
            <div v-if="selectedTags">
              <strong>{{ selectedTags.length }}</strong> tags will be applied to
              <strong>{{ tableSelectedItems.length }}</strong> observables
            </div>
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

export default {
  name: "ObservableList",
  data() {
    return {
      searchQuery: "",
      regexSearch: false,
      observables: [],
      activeTab: 0,
      existingTags: [],
      tagName: "",
      selectedTags: [],
      tablePage: 1,
      tablePerPage: 50,
      tableTotal: 10000,
      loading: false,
      tableSelectedItems: []
    };
  },
  mounted() {
    this.searchObservables();
    this.getExistingTags();
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
      this.loading = true;
      axios
        .post("http://localhost:5000/api/observablesearch/", params)
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
    getExistingTags() {
      axios
        .get("http://localhost:5000/api/tag/")
        .then(response => {
          return (this.existingTags = response.data);
        })
        .catch(error => {
          return console.log(error);
        });
    },

    changeTags(action) {
      var params = {
        tags: this.selectedTags.map(tag => tag.name),
        ids: this.tableSelectedItems.map(item => item.id)
      };
      axios
        .post(`http://localhost:5000/api/observable/bulk-${action}`, params)
        .then(() => {
          this.searchObservables();
          this.$buefy.notification.open(
            `${params["tags"].length} tags succesfully ${action === "tag" ? "added" : "removed"}.`
          );
          this.selectedTags = [];
          this.tableSelectedItems = [];
        })
        .catch(error => {
          return console.log(error);
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
    }
  }
};
</script>

<style>
.observable-table {
  margin-top: 0.4em;
}
</style>
