<template>
  <v-container fluid>
    <v-row align="start" no-gutters>
      <v-col cols="8">
        <v-card class="ma-2 break-title" variant="flat">
          <template v-slot:title>
            <div class="d-flex">
              <v-chip class="mr-3 flex-shrink-0" color="primary" :text="observable?.type" label></v-chip>
              <code class="observable-value">{{ observable?.value }}</code>
              <v-dialog :width="editWidth" :fullscreen="fullScreenEdit">
                <template v-slot:activator="{ props }">
                  <v-btn class="ml-2" variant="tonal" color="primary" v-bind="props" append-icon="mdi-pencil"
                    >Edit
                  </v-btn>
                </template>

                <template v-slot:default="{ isActive }">
                  <edit-object
                    :object="observable"
                    :is-active="isActive"
                    @success="obs => (observable = obs)"
                    @toggle-fullscreen="toggleFullscreen"
                  />
                </template>
              </v-dialog>
            </div>
          </template>
        </v-card>
        <v-sheet class="ma-2">
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title v-slot="{ expanded }">
                <div>
                  Display full value
                  <v-btn
                    variant="text"
                    color="grey"
                    prepend-icon="mdi-content-copy"
                    density="compact"
                    title="Copy to clipboard"
                    class="ml-2"
                    ripple
                    @click="copyText(observable?.value)"
                    >Copy to clipboard</v-btn
                  >
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <code class="observable-value-long">{{ observable?.value }}</code>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-sheet>
        <v-sheet class="ma-2">
          <v-table density="compact">
            <tbody>
              <tr>
                <th>Context sources</th>
                <td>
                  <v-chip
                    label
                    color="green"
                    v-for="source in new Set(observable?.context.map(c => c.source))"
                    v-bind:key="source"
                  >
                    {{ source }}
                  </v-chip>
                </td>
              </tr>
              <tr v-for="field in getObservableInfoFields">
                <th>{{ field.label }}</th>
                <td v-if="field.field === 'created'">{{ moment(observable[field.field]).toISOString() }}</td>
                <td v-else>{{ observable[field.field] }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-sheet>
      </v-col>
      <v-col cols="4">
        <v-card class="ma-2" variant="flat">
          <v-card-title>Tags</v-card-title>

          <v-combobox
            v-model="observableTags"
            chips
            clearable
            multiple
            density="compact"
            :delimiters="[',', ' ', ';']"
            prepend-inner-icon="mdi-tag"
            class="ma-2"
          >
            <template v-slot:chip="tag">
              <v-chip
                :text="tag.item.value"
                label
                size="large"
                :color="observable?.tags[tag.item.value]?.fresh ? 'primary' : 'grey'"
            /></template>
            <template v-slot:append>
              <v-btn variant="tonal" color="primary" class="me-2" @click="saveTags">Save</v-btn>
            </template>
          </v-combobox>
        </v-card>
        <v-card class="ma-2" variant="flat">
          <v-card-title>Enabled analytics for {{ observable?.type }}</v-card-title>
          <task-list
            v-if="observable"
            task-type="oneshot"
            :acts-on-filter="[observable.type]"
            :act-on-value="observable.value"
            :display-columns="['name', 'description', 'refresh']"
            :only-enabled="true"
          ></task-list>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-container fluid>
        <v-sheet>
          <v-tabs v-model="activeTab" color="primary">
            <v-tab value="context"
              ><v-icon size="x-large" start>mdi-information</v-icon>Context
              <v-chip class="ml-3" density="comfortable">{{ observable?.context.length }}</v-chip></v-tab
            >
            <v-tab value="related-observables"
              ><v-icon size="x-large" start>mdi-graph</v-icon>Related observables
              <v-chip class="ml-3" density="comfortable">{{ totalRelatedObservables }}</v-chip></v-tab
            >
            <v-tab value="related-entities"
              ><v-icon size="x-large" start>mdi-brain</v-icon>Related entities
              <v-chip class="ml-3" density="comfortable">{{ totalRelatedEntities + totalTaggedRelationships }}</v-chip>
            </v-tab>
          </v-tabs>

          <v-window v-model="activeTab" class="pa-5">
            <v-window-item value="context" eager>
              <v-card v-for="(context, index) in observable?.context" elevation="0" variant="outlined">
                <v-card-title>{{ context.source }}</v-card-title>

                <v-table>
                  <tbody>
                    <tr v-for="key in Object.keys(context).filter(k => k !== 'source')" v-bind:key="key">
                      <th>{{ key }}</th>
                      <td>{{ context[key] }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card>
              <div v-if="observable?.context.length == 0"><em>No context for observable</em></div>
            </v-window-item>
            <v-window-item value="related-observables" eager>
              <direct-neighbors
                :id="id"
                source-type="observables"
                :target-types="observableTypes.map(def => def.type)"
                @totalUpdated="value => (totalRelatedObservables = value)"
              />
            </v-window-item>

            <v-window-item value="related-entities" eager>
              <v-card title="Direct links">
                <direct-neighbors
                  :id="id"
                  source-type="observables"
                  :target-types="entityTypes.map(def => def.type)"
                  @totalUpdated="value => (totalRelatedEntities = value)"
                />
              </v-card>
              <v-card title="Tagged">
                <related-objects
                  :id="id"
                  source-type="observables"
                  :hops="2"
                  graph="tagged"
                  :target-types="entityTypes.map(def => def.type)"
                  @totalUpdated="value => (totalTaggedRelationships = value)"
                ></related-objects>
              </v-card>
            </v-window-item>
          </v-window>
        </v-sheet>
      </v-container>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import axios from "axios";

import TaskList from "@/components/TaskList.vue";
import RelatedObjects from "@/components/RelatedObjects.vue";
import EditObject from "@/components/EditObject.vue";
import DirectNeighbors from "@/components/DirectNeighbors.vue";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import moment from "moment";
</script>

<script lang="ts">
export default {
  props: {
    id: {
      type: String,
      required: true
    }
  },
  components: {
    TaskList,
    RelatedObjects,
    EditObject
  },
  data() {
    return {
      observable: null,
      observableTags: [],
      activeTab: 0,
      observableTypes: OBSERVABLE_TYPES,
      entityTypes: ENTITY_TYPES,
      totalRelatedObservables: 0,
      totalTaggedRelationships: 0,
      totalRelatedEntities: 0,
      editWidth: 600,
      fullScreenEdit: false
    };
  },
  methods: {
    copyText(text) {
      navigator.clipboard.writeText(text);
      this.$eventBus.emit("displayMessage", {
        status: "info",
        message: "Observable value copied to clipboard!"
      });
    },
    getObservableDetails() {
      axios
        .get(`/api/v2/observables/${this.id}`)
        .then(response => {
          let tagNames: string[] = [];
          this.observable = response.data;
          this.observableTags = Object.keys(this.observable.tags);
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
        tags: this.observableTags
      };
      axios
        .post(`/api/v2/observables/tag`, params)
        .then(() => {
          this.getObservableDetails();
          this.$eventBus.emit("displayMessage", { message: "Tags saved successfully", status: "success" });
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    toggleFullscreen(fullscreen: boolean) {
      this.fullScreenEdit = !this.fullScreenEdit;
      this.editWidth = fullscreen ? "100%" : "50%";
    }
  },
  computed: {
    getObservableTypeDefinition() {
      return this.observableTypes.find(typeDef => typeDef.type === this.observable?.type);
    },
    getObservableInfoFields() {
      const hideFields = ["value", "tags", "description"];
      return this.getObservableTypeDefinition?.fields.filter(field => !hideFields.includes(field.field));
    }
  },
  mounted() {
    this.getObservableDetails();
  },
  watch: {
    id() {
      this.getObservableDetails();
    }
  }
};
</script>

<style>
.v-card-text.yeti-description {
  font-size: 1rem;
}

.break-title .v-card-title {
  white-space: normal;
}

.observable-value {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  /* display: block; */
}

.observable-value-long {
  overflow-wrap: break-word;
}
</style>
