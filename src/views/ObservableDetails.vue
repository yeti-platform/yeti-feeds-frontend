<template>
  <div class="columns" v-if="observable">
    <div class="column is-8">
      <div class="tile is-ancestor">
        <div class="tile is-vertical is-parent">
          <nav class="tile panel is-child">
            <p class="panel-heading">
              <b-taglist attached>
                <b-tag size="is-large" type="is-dark">{{ observable.value }}</b-tag>
                <b-tag size="is-large" type="is-info">{{ observable.type }}</b-tag>
              </b-taglist>
            </p>
            <div class="panel-block">
              <div class="content">{{ observable.description || "No description provided" }}</div>
            </div>
          </nav>
          <div class="tile is-child">
            <b-tabs v-model="activeTab" position="is-left" :animated="false">
              <b-tab-item>
                <template slot="header">
                  <b-icon icon="info"></b-icon>
                  <span>
                    Context
                    <b-tag rounded>{{ observable.context.length }}</b-tag>
                  </span>
                </template>
                <nav class="panel" v-for="(context, index) in observable.context" v-bind:key="index">
                  <p class="panel-heading">{{ context.source }}</p>
                  <div class="panel-block">
                    <table class="table">
                      <tbody>
                        <tr v-for="key in Object.keys(context).filter(k => k !== 'source')" v-bind:key="key">
                          <th>{{ key }}</th>
                          <td>{{ context[key] }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </nav>
              </b-tab-item>
              <b-tab-item>
                <template slot="header">
                  <b-icon icon="sitemap"></b-icon>
                  <span>
                    Related observables
                    <b-tag rounded> {{ totalRelatedObservables == null ? "?" : totalRelatedObservables }}</b-tag>
                  </span>
                </template>
                <related-objects
                  :id="id"
                  source-type="observables"
                  :target-types="observableTypes.map(def => def.type)"
                  @totalUpdated="value => (totalRelatedObservables = value)"
                ></related-objects>
              </b-tab-item>
              <b-tab-item>
                <template slot="header">
                  <b-icon icon="tags"></b-icon>
                  <span>
                    Entities from tags
                    <b-tag rounded> {{ globalRelatedEntities }}</b-tag>
                  </span>
                </template>
                <b-tabs v-model="activeSubTab" position="is-left" :animated="false">
                  <b-tab-item
                    v-for="entity in entityTypes"
                    :key="entity.name"
                    :visible="displayEntityType(entity.type)"
                  >
                    <template slot="header">
                      <b-icon :icon="entity.icon"></b-icon>
                      <span>
                        {{ entity.name }}
                        <b-tag rounded>
                          {{
                            totalRelatedEntities[entity.type] == null ? "?" : totalRelatedEntities[entity.type]
                          }}</b-tag
                        >
                      </span>
                    </template>
                    <related-objects
                      :id="id"
                      :fields="['name', 'tags']"
                      source-type="observables"
                      :hops="2"
                      graph="tagged"
                      :target-types="[entity.type]"
                      @totalUpdated="countRelatedEntities(entity.type, $event)"
                    >
                    </related-objects>
                  </b-tab-item>
                </b-tabs>
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
            <p class="panel-heading">Info</p>
            <div class="panel-block">
              <observable-info-table :observable="observable"></observable-info-table>
            </div>
          </nav>
          <nav class="tile panel is-child">
            <p class="panel-heading">Tags</p>
            <div class="panel-block">
              <b-field>
                <b-taginput v-model="newTags" expanded icon="tag" placeholder="e.g. CobaltStrike"></b-taginput>
                <p class="control">
                  <button class="button is-primary" @click="saveTags">Save</button>
                </p>
              </b-field>
            </div>
          </nav>

          <nav class="tile panel is-child">
            <p class="panel-heading">Available analytics for {{ observable.type }}</p>
            <div class="panel-block">
              <task-list
                task-type="oneshot"
                :acts-on-filter="[observable.type]"
                :act-on-value="observable.value"
                :display-columns="['name', 'description', 'run']"
              >
              </task-list>
            </div>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import RelatedObjects from "@/components/RelatedObjects";
import TaskList from "@/views/TaskList.vue";
import ObservableInfoTable from "@/components/ObservableInfoTable";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";

export default {
  props: ["id"],
  components: {
    RelatedObjects,
    ObservableInfoTable,
    TaskList
  },
  data() {
    return {
      observable: null,
      newTags: [],
      activeTab: null,
      activeSubTab: null,
      totalRelatedObservables: null,
      totalRelatedEntities: ENTITY_TYPES.reduce((acc, cur) => {
        acc[cur.type] = null;
        return acc;
      }, {}),
      entityTypes: ENTITY_TYPES,
      observableTypes: OBSERVABLE_TYPES
    };
  },
  mounted() {
    this.getObservableDetails();
  },
  methods: {
    getObservableDetails() {
      axios
        .get(`/api/v2/observables/${this.id}`)
        .then(response => {
          this.observable = response.data;
          this.newTags = Object.keys(this.observable.tags);
          // Switch back to Context view when reloading the page.
          this.activeTab = 0;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    saveTags() {
      var params = {
        ids: [this.id],
        strict: true,
        tags: this.newTags
      };
      axios
        .post(`/api/v2/observables/tag`, params)
        .then(() => {
          this.getObservableDetails();
          this.$buefy.toast.open({
            message: "Tags saved!",
            type: "is-success"
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    countRelatedEntities(type, count) {
      this.totalRelatedEntities[type] = count;
      for (let i = 0; i < this.entityTypes.length; i++) {
        if (this.totalRelatedEntities[this.entityTypes[i].type] > 0) {
          this.activeSubTab = i;
          break;
        }
      }
    },
    displayEntityType(type) {
      return this.totalRelatedEntities[type] > 0;
    }
  },
  computed: {
    globalRelatedEntities() {
      return Object.values(this.totalRelatedEntities).reduce((a, b) => a + b, 0);
    }
  },
  watch: {
    id: "getObservableDetails"
  }
};
</script>

<style scoped lang="css"></style>
