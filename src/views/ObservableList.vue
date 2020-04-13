<template>
  <div class="observable-list columns">
    <div class="column is-three-quarters">
      <b-table :data="observables" :hoverable="true" :narrowed="true">
        <template v-slot:default="observable">
          <b-table-column field="value" label="Value">
            <a href="#"> {{ observable.row.value }} </a>
          </b-table-column>

          <b-table-column field="tags" label="Tags">
            <b-taglist>
              <b-tag
                v-for="tag in observable.row.tags"
                v-bind:key="tag.name"
                :type="tag.fresh ? 'is-primary' : ''"
              >
                {{ tag.name }}
              </b-tag>
            </b-taglist>
          </b-table-column>

          <b-table-column field="context" label="Context">
            <b-taglist>
              <b-tag
                v-for="context in observable.row.context"
                v-bind:key="context.source"
              >
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
      </b-table>
    </div>
    <div class="column">
      <section>
        <b-tabs v-model="activeTab" position="is-centered" :animated="false">
          <b-tab-item label="Search">
            <div class="search">
              <div class="field">
                <b-input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search query + ⏎"
                  icon="search"
                />
              </div>
              <div class="field">
                <b-checkbox v-model="regexSearch">
                  Use regex (slower)
                </b-checkbox>
              </div>
            </div>
          </b-tab-item>

          <b-tab-item label="Export">
            Export
          </b-tab-item>

          <b-tab-item label="Manage tags">
            Manage tags
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
      activeTab: 0
    };
  },
  mounted() {
    this.searchObservables();
  },
  methods: {
    searchObservables() {
      var params = {};
      axios
        .post("http://localhost:5000/api/observablesearch/", params)
        .then(response => {
          return (this.observables = response.data);
        })
        .catch(error => {
          return console.log(error);
        });
    }
  }
};
</script>
