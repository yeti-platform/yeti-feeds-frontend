<template>
  <div class="indicator-list columns">
    <div class="column is-three-quarters">
      <b-tabs v-model="activeMainTab" position="is-left" :animated="false">
        <b-tab-item :label="indicator.name" v-for="indicator in indicatorTypes" v-bind:key="indicator.type">
          <object-list search-type="indicator" :search-subtype="indicator.type" :fields="indicator.fields" />
        </b-tab-item>
      </b-tabs>
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
                  v-on:keyup.native.enter="searchIndicators"
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
                  <code>value</code> attribute of the indicators. To match against other attributes, use
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

          <b-tab-item label="New indicator">
            <b-field label="Indicator type">
              <b-select placeholder="Select an indicator type" expanded v-model="selectedindicatorType">
                <option v-for="template of indicatorTypes" :value="template" :key="template.name">
                  {{ template.name }}
                </option>
              </b-select>
            </b-field>
            <div v-if="selectedindicatorType">
              <b-field :label="field.label" v-for="field in selectedindicatorType.fields" :key="field.field">
                <b-input v-model="newIndicator[field.field]" v-if="field.type === 'text'" />
                <b-input v-model="newIndicator[field.field]" v-if="field.type === 'code'" custom-class="longcode" />
                <b-input type="textarea" v-model="newIndicator[field.field]" v-if="field.type === 'longtext'" />
                <b-input
                  type="textarea"
                  custom-class="longcode"
                  v-model="newIndicator[field.field]"
                  v-if="field.type === 'longcode'"
                />
                <b-select v-if="field.type === 'option'" v-model="newIndicator[field.field]">
                  <option v-for="(option, index) in field.choices" :value="String(index + 1)" :key="option">
                    {{ option }} {{ index }}</option
                  >
                </b-select>
                <b-taginput
                  label="Tags"
                  v-model="newIndicator[field.field]"
                  v-if="field.type === 'list'"
                  icon="tag"
                ></b-taginput>
              </b-field>
              <div class="buttons">
                <b-button type="is-primary" @click="saveIndicator">
                  Save
                </b-button>
              </div>
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
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import ObjectList from "@/components/ObjectList";

export default {
  name: "IndicatorList",
  components: {
    ObjectList
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
      indicators: [],
      tablePage: 1,
      tablePerPage: 50,
      tableTotal: 500, // 5 pages worth should be enough to have time to get a more accurate count
      loading: false,
      // New
      indicatorTypes: INDICATOR_TYPES,
      selectedindicatorType: null,
      newIndicator: {},
      // Panel
      activeTab: 0,
      activeMainTab: 0
    };
  },
  mounted() {
    this.searchIndicators();
  },
  methods: {
    onPageChange(tablePage) {
      this.tablePage = tablePage;
      this.searchIndicators(false);
    },
    searchIndicators(refreshTotal = true) {
      var params = {
        filter: this.generateSearchParams(this.searchQuery),
        params: {
          regex: this.regexSearch,
          page: this.tablePage
        }
      };
      console.log(params);
      if (refreshTotal) {
        this.countTotal(params);
      }
      this.loading = true;
      axios
        .post("/api/indicatorsearch/", params)
        .then(response => {
          this.indicators = response.data;
          this.loading = false;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    saveIndicator() {
      this.newIndicator.type = this.selectedindicatorType.type;
      axios
        .post("/api/indicator/", this.newIndicator)
        .then(response => {
          this.$buefy.toast.open({
            message: `indicator ${response.name} saved`,
            type: "is-success"
          });
          this.newIndicator = {};
          this.searchIndicators();
        })
        .catch(error => {
          this.$buefy.toast.open({
            message: "Error saving indicator: " + error,
            type: "is-danger"
          });
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
      return filter;
    },
    countTotal(params) {
      this.tableTotal = 500;
      axios
        .post("/api/indicatorsearch/total", params)
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
  computed: {}
};
</script>

<style>
.indicator-table {
  margin-top: 0.4em;
}

.longcode {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
}
</style>
