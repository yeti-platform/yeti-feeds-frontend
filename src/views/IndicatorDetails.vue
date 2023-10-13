<template>
  <div class="columns" v-if="indicator">
    <div class="column is-8">
      <div class="tile is-ancestor">
        <div class="tile is-vertical is-parent">
          <nav class="tile panel is-child">
            <p class="panel-heading">
              <b-taglist attached>
                <b-tag size="is-large" type="is-dark">{{ indicator.name }}</b-tag>
                <b-tag size="is-large" type="is-info">{{ indicator.type }}</b-tag>
              </b-taglist>
            </p>
            <div class="panel-block">
              <div class="content">{{ indicator.description || "No description provided" }}</div>
            </div>
            <div class="panel-block">
              <div class="content">
                <pre>{{ indicator.pattern }}</pre>
              </div>
            </div>
          </nav>
          <div class="tile is-child">
            <b-tabs v-model="activeTab" position="is-left" :animated="false">
              <b-tab-item>
                <template slot="header">
                  <b-icon icon="sitemap"></b-icon>
                  <span>
                    Observables
                    <b-tag rounded> {{ totalRelatedObservables == null ? "?" : totalRelatedObservables }}</b-tag>
                  </span>
                </template>
                <related-objects
                  source-type="indicator"
                  :target-types="observableTypes.map(def => def.type)"
                  :id="id"
                  @totalUpdated="value => (totalRelatedObservables = value)"
                ></related-objects>
              </b-tab-item>
            </b-tabs>
          </div>
        </div>
      </div>
    </div>
    <div class="column">
      <div class="tile is-ancestor">
        <div class="tile is-vertical is-parent">
          <nav class="tile panel is-child">
            <p class="panel-heading">Info <b-button size="is-small" @click="editIndicator"> Edit </b-button></p>
            <div class="panel-block">
              <table class="table is-fullwidth">
                <tbody>
                  <tr v-for="field in indicatorInfoFields" v-bind:key="field.field">
                    <th>{{ field.label }}</th>
                    <td>
                      <span v-if="!indicator[field.field] || !indicator[field.field].length">N/A</span>
                      <b-taglist v-else-if="field.type == 'list'">
                        <b-tag v-for="item in indicator[field.field]" v-bind:key="item">
                          {{ item }}
                        </b-tag>
                      </b-taglist>
                      <span v-else>
                        {{ indicator[field.field] }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </nav>

          <nav class="tile panel is-child">
            <p class="panel-heading">Related indicators</p>
            <div class="panel-block">
              <related-objects
                v-show="totalRelatedIndicators > 0"
                source-type="indicator"
                inline-icons
                :fields="['name']"
                :target-types="indicatorTypes.map(def => def.type)"
                :id="id"
                @totalUpdated="value => (totalRelatedIndicators = value)"
                style="width: 100%"
                ref="relatdIndicatorsList"
              ></related-objects>
            </div>
            <div class="panel-block">
              <b-field class="expanded">
                <b-autocomplete
                  :open-on-focus="true"
                  :keep-first="true"
                  field="name"
                  :clearable="true"
                  :data="filteredIndicators"
                  placeholder="Link new indicator..."
                  v-model="linkedIndicatorNameFilter"
                  @select="option => (linkedIndicator = option)"
                  expanded
                >
                </b-autocomplete>
                <p class="control">
                  <button class="button is-primary" @click="linkIndicator">Link</button>
                </p>
              </b-field>
            </div>
          </nav>

          <nav class="tile panel is-child">
            <p class="panel-heading">Related entities</p>
            <div class="panel-block">
              <related-objects
                v-show="totalRelatedEntities > 0"
                source-type="indicator"
                inline-icons
                :fields="['name']"
                :target-types="entityTypes.map(def => def.type)"
                :id="id"
                @totalUpdated="value => (totalRelatedEntities = value)"
                style="width: 100%"
                ref="relatdEntitiesList"
              ></related-objects>
            </div>
            <div class="panel-block">
              <b-field class="expanded">
                <b-autocomplete
                  :open-on-focus="true"
                  :keep-first="true"
                  field="name"
                  :clearable="true"
                  :data="filteredEntities"
                  placeholder="Link new indicator..."
                  v-model="linkedEntityNameFilter"
                  @select="option => (linkedEntity = option)"
                  expanded
                >
                </b-autocomplete>
                <p class="control">
                  <button class="button is-primary" @click="linkEntity">Link</button>
                </p>
              </b-field>
            </div>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import _ from "lodash";

import RelatedObjects from "@/components/RelatedObjects";
import EditObject from "@/components/EditObject";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";

export default {
  props: ["id"],
  components: {
    RelatedObjects
  },
  data() {
    return {
      indicator: null,
      newTags: [],
      activeTab: null,
      totalRelatedObservables: null,
      totalRelatedIndicators: 0,
      totalRelatedEntities: 0,
      linkedIndicatorNameFilter: "",
      linkedEntityNameFilter: "",
      linkedIndicator: null,
      entities: [],
      indicators: [],
      entityTypes: ENTITY_TYPES,
      indicatorTypes: INDICATOR_TYPES,
      observableTypes: OBSERVABLE_TYPES
    };
  },
  mounted() {
    this.getindicatorDetails();
    this.getIndicatorAutocomplete();
    this.getEntityAutocomplete();
  },
  methods: {
    getindicatorDetails() {
      axios
        .get(`/api/v2/indicators/${this.id}`)
        .then(response => {
          this.indicator = response.data;
          // Switch back to Context view when reloading the page.
          this.activeTab = 0;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    editIndicator() {
      this.$buefy.modal.open({
        parent: this,
        component: EditObject,
        hasModalCard: true,
        customClass: "custom-class custom-class-2",
        trapFocus: true,
        props: {
          objectTypeName: this.indicator.type,
          object: this.indicator,
          endpoint: "indicators"
        },
        events: {
          refresh: newIndicator => {
            this.indicator = newIndicator;
          }
        }
      });
    },
    getIndicatorAutocomplete() {
      axios
        .post("/api/v2/indicators/search", {
          name: this.linkedIndicatorNameFilter,
          count: 20
        })
        .then(response => {
          this.indicators = response.data.indicators;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    getEntityAutocomplete() {
      this.entities = [];
      axios
        .post("/api/v2/entities/search", {
          name: this.linkedEntityNameFilter,
          count: 20
        })
        .then(response => {
          this.entities = response.data.entities.map(entity => {
            return {
              id: entity.id,
              name: entity.name
            };
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    linkIndicator() {
      var params = {
        source: `indicators/${this.indicator.id}`,
        target: `indicators/${this.linkedIndicator.id}`,
        link_type: "web",
        description: "Manual link."
      };
      axios
        .post("/api/v2/graph/add", params)
        .then(() => {
          // Refresh neighbors list.
          this.$refs.relatdIndicatorsList.fetchNeighbors();
          this.linkedIndicatorNameFilter = "";
          this.linkedIndicator = null;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    linkEntity() {
      var params = {
        source: `indicators/${this.indicator.id}`,
        target: `entities/${this.linkedEntity.id}`,
        link_type: "web",
        description: "Manual link."
      };
      axios
        .post("/api/v2/graph/add", params)
        .then(() => {
          // Refresh neighbors list.
          this.$refs.relatdEntitiesList.fetchNeighbors();
          this.linkedEntityNameFilter = "";
          this.linkedEntity = null;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    saveTags() {
      var params = {
        indicator: {
          id: this.indicator.id,
          name: this.indicator.name,
          relevant_tags: this.indicator.relevant_tags
        }
      };
      axios
        .post(`/api/v2/indicators/${this.id}`, params)
        .then(response => {
          this.indicator = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    }
  },
  computed: {
    filteredIndicators() {
      return this.indicators.filter(indicator => {
        return (
          indicator.name.toLowerCase().includes(this.linkedIndicatorNameFilter.toLowerCase()) &&
          indicator.id != this.indicator.id
        );
      });
    },
    filteredEntities() {
      return this.entities.filter(entity => {
        return entity.name.toLowerCase().includes(this.linkedEntityNameFilter.toLowerCase());
      });
    },
    indicatorTypeDefinition() {
      return this.indicatorTypes.filter(indicatorType => indicatorType.type == this.indicator.type)[0];
    },
    indicatorInfoFields() {
      const hideFields = ["name", "pattern", "description"];
      return this.indicatorTypeDefinition.fields.filter(field => !hideFields.includes(field.field));
    }
  },
  watch: {
    id: "getindicatorDetails",
    linkedEntityNameFilter: _.debounce(function() {
      this.getEntityAutocomplete();
    }, 50),
    linkedIndicatorNameFilter: _.debounce(function() {
      this.getIndicatorAutocomplete();
    }, 50)
  }
};
</script>

<style scoped lang="css">
.expanded {
  width: 100%;
}
</style>
