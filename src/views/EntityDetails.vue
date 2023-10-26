<template>
  <div class="columns" v-if="entity">
    <div class="column is-8">
      <div class="tile is-ancestor">
        <div class="tile is-vertical is-parent">
          <nav class="tile panel is-child">
            <p class="panel-heading">
              <b-taglist attached>
                <b-tag size="is-large" type="is-dark">{{ entity.name }}</b-tag>
                <b-tag size="is-large" type="is-info">{{ entity.type }}</b-tag>
              </b-taglist>
            </p>
            <div class="panel-block">
              <div class="content" v-html="markdownify(entity.description) || 'No description provided'"></div>
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
                  source-type="entity"
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
            <p class="panel-heading">Info <b-button size="is-small" @click="editEntity"> Edit </b-button></p>
            <div class="panel-block">
              <table class="table is-fullwidth">
                <tbody>
                  <tr v-for="field in entityInfoFields" v-bind:key="field.field">
                    <th>{{ field.label }}</th>
                    <td>
                      <span v-if="!entity[field.field] || !entity[field.field].length">N/A</span>
                      <b-taglist v-else-if="field.type == 'list'">
                        <b-tag v-for="item in entity[field.field]" v-bind:key="item">
                          {{ item }}
                        </b-tag>
                      </b-taglist>
                      <span v-else>
                        {{ entity[field.field] }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </nav>
          <nav class="tile panel is-child">
            <p class="panel-heading">Relevant tags</p>
            <div class="panel-block">
              <b-field class="expanded">
                <b-taginput expanded v-model="newTags" icon="tag" placeholder="e.g. CobaltStrike"></b-taginput>
                <p class="control">
                  <button class="button is-primary" @click="saveTags">Save</button>
                </p>
              </b-field>
            </div>
            <small class="panel-block">Observables tagged with these tags will be linked to this entity.</small>
          </nav>

          <nav class="tile panel is-child">
            <p class="panel-heading">Related indicators</p>
            <div class="panel-block">
              <related-objects
                v-show="totalRelatedIndicators > 0"
                source-type="entity"
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
                source-type="entity"
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
                  placeholder="Link new entity..."
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
import marked from "marked";
import DOMPurify from "isomorphic-dompurify";
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
      entity: null,
      newTags: [],
      activeTab: null,
      totalRelatedObservables: null,
      totalRelatedIndicators: 0,
      totalRelatedEntities: 0,
      linkedEntityNameFilter: "",
      linkedEntity: null,
      linkedIndicatorNameFilter: "",
      linkedIndicator: null,
      entities: [],
      indicators: [],
      entityTypes: ENTITY_TYPES,
      indicatorTypes: INDICATOR_TYPES,
      observableTypes: OBSERVABLE_TYPES
    };
  },
  mounted() {
    this.getentityDetails();
    this.getIndicatorAutocomplete();
    this.getEntityAutocomplete();
  },
  methods: {
    getentityDetails() {
      axios
        .get(`/api/v2/entities/${this.id}`)
        .then(response => {
          this.entity = response.data;
          this.newTags = Object.keys(this.entity.tags);
          // Switch back to Context view when reloading the page.
          this.activeTab = 0;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    editEntity() {
      this.$buefy.modal.open({
        parent: this,
        component: EditObject,
        hasModalCard: true,
        customClass: "custom-class custom-class-2",
        trapFocus: true,
        props: {
          objectTypeName: this.entity.type,
          object: this.entity,
          endpoint: "entities"
        },
        events: {
          refresh: newEntity => {
            this.entity = newEntity;
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
        source: `entity/${this.entity.id}`,
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
        source: `entities/${this.entity.id}`,
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
        ids: [this.entity.id],
        tags: this.newTags,
        strict: true
      };
      axios
        .post("/api/v2/entities/tag", params)
        .then(this.getentityDetails)
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    markdownify(text) {
      return DOMPurify.sanitize(marked.parse(text));
      // return text;
    }
  },
  computed: {
    filteredIndicators() {
      return this.indicators.filter(indicator => {
        return indicator.name.toLowerCase().includes(this.linkedIndicatorNameFilter.toLowerCase());
      });
    },
    filteredEntities() {
      return this.entities.filter(entity => {
        return (
          entity.name.toLowerCase().includes(this.linkedEntityNameFilter.toLowerCase()) && entity.id != this.entity.id
        );
      });
    },
    entityTypeDefinition() {
      return this.entityTypes.find(entityType => entityType.type === this.entity.type);
    },
    entityInfoFields() {
      const hideFields = ["name", "tags", "description"];
      return this.entityTypeDefinition.fields.filter(field => {
        return !hideFields.includes(field.field);
      });
    }
  },
  watch: {
    id: "getentityDetails",
    linkedEntityNameFilter: _.debounce(function() {
      this.getEntityAutocomplete();
    }, 50)
  }
};
</script>

<style scoped lang="css">
.expanded {
  width: 100%;
}
</style>
