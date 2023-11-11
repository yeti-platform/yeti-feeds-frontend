<template>
  <div class="indicator-list columns">
    <div class="column is-three-quarters">
      <b-tabs v-model="activeMainTab" position="is-left" :animated="false" @input="trackTabChange">
        <b-tab-item v-for="indicator in indicatorTypes" v-bind:key="indicator.type" :value="indicator.type">
          <template slot="header">
            <b-icon :icon="indicator.icon"></b-icon>
            <span>
              {{ indicator.name }}
              <b-tag rounded>
                {{ indicatorCount[indicator.type] == null ? "?" : indicatorCount[indicator.type] }}</b-tag
              >
            </span>
          </template>
          <object-list
            search-type="indicators"
            :search-subtype="indicator.type"
            :fields="indicator.fields"
            :search-query="searchQuery"
            @totalUpdated="countIndicators(indicator.type, $event)"
            :ref="indicator.type + 'ObjectList'"
          />
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
                <b-input v-model="searchQuery" type="text" placeholder="Search query + ⏎" icon="search" />
              </div>
            </div>
            <br />
            <article class="message tip">
              <div class="message-body content">
                <p>
                  You can run advanced queries using the input field above.
                </p>
                <p>
                  By default, the query will be matched against the
                  <code>name</code> attribute of the indicators using regular expressions. To match against other
                  attributes, use <code>attribute=query</code>.
                </p>

                <p>Examples:</p>
                <ul>
                  <li>
                    <code>"Access logs" relevant_tags=nginx</code>
                  </li>
                  <li>
                    <code>query_type=opensearch in__target_systems=timesketch</code>
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
                  <option v-for="option in field.choices" :value="option" :key="option">
                    {{ option }}
                  </option>
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
  data() {
    return {
      indicatorCount: INDICATOR_TYPES.reduce((acc, cur) => {
        acc[cur.type] = null;
        return acc;
      }, {}),
      loading: false,
      // New
      indicatorTypes: INDICATOR_TYPES,
      selectedindicatorType: null,
      newIndicator: {},
      // Panel
      activeTab: 0,
      activeMainTab: 0,
      searchQuery: ""
    };
  },
  mounted() {
    if (this.$route.hash) {
      this.activeMainTab = this.$route.hash.replace("#", "");
    }
  },
  methods: {
    saveIndicator() {
      this.newIndicator.type = this.selectedindicatorType.type;
      axios
        .post("/api/v2/indicators", { indicator: this.newIndicator })
        .then(response => {
          this.$buefy.toast.open({
            message: `Indicator ${response.data.name} saved`,
            type: "is-success"
          });
          this.$refs[this.newIndicator.type + "ObjectList"][0].searchObjects();
          this.newIndicator = {};
        })
        .catch(error => {
          this.$buefy.toast.open({
            message: "Error saving indicator: " + error,
            type: "is-danger"
          });
        });
    },
    formatTimestamp(timestamp, local) {
      return utils.formatTimestamp(timestamp, local);
    },
    countIndicators(type, count) {
      this.indicatorCount[type] = count;
      if (!this.$route.hash) {
        this.navigateToFirstPopulatedTab();
      }
    },
    navigateToFirstPopulatedTab() {
      for (const indicatorType of this.indicatorTypes) {
        if (this.indicatorCount[indicatorType.type] > 0) {
          this.activeMainTab = indicatorType.type;
          break;
        }
      }
    },
    trackTabChange(value) {
      window.location.hash = value;
    }
  },
  watch: {
    $route(to) {
      if (to.hash) {
        this.activeMainTab = to.hash.replace("#", "");
      } else {
        this.navigateToFirstPopulatedTab();
      }
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
