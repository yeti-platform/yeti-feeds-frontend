<template>
  <v-container fluid>
    <v-row align="start" no-gutters>
      <v-col>
        <v-card class="ma-2" variant="flat">
          <template v-slot:title>
            <code>{{ observable?.value }}</code>
          </template>
          <template v-slot:subtitle>
            <v-chip color="primary" :text="observable?.type" label></v-chip>
          </template>
        </v-card>
        <v-card class="ma-2 yeti-card" variant="flat">
          <v-table density="compact">
            <tbody>
              <tr>
                <th>Context sources</th>
                <td>
                  <v-chip label v-for="source in new Set(observable?.context.map(c => c.source))" v-bind:key="source">
                    {{ source }}
                  </v-chip>
                </td>
              </tr>
              <tr v-for="field in getObservableInfoFields">
                <th>{{ field.label }}</th>
                <td>{{ observable[field.field] }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card class="ma-2 yeti-card" variant="outlined">
          <v-card-title class="bg-grey-lighten-3">Tags</v-card-title>

          <v-combobox
            v-model="observableTags"
            chips
            clearable
            multiple
            variant="outlined"
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
        <v-card class="ma-2 yeti-card" variant="outlined">
          <v-card-title class="bg-grey-lighten-3">Enabled analytics for {{ observable?.type }}</v-card-title>
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
        <v-card variant="flat">
          <v-tabs v-model="activeTab" color="primary">
            <v-tab value="context"
              ><v-icon size="x-large">mdi-information</v-icon>Context {{ observable?.context.length }}</v-tab
            >
            <v-tab value="related-observables"
              ><v-icon size="x-large">mdi-graph</v-icon>Related observables {{ totalRelatedObservables }}</v-tab
            >
            <v-tab value="related-entities"
              ><v-icon size="x-large">mdi-brain</v-icon>Related entities
              {{ totalRelatedEntities + totalTaggedRelationships }}</v-tab
            >
          </v-tabs>

          <v-card-text>
            <v-window v-model="activeTab">
              <v-window-item value="context" eager>
                <v-card v-for="(context, index) in observable?.context" variant="outlined" class="yeti-card">
                  <v-card-title class="bg-grey-lighten-3">{{ context.source }}</v-card-title>

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
                <related-objects
                  :id="id"
                  source-type="observables"
                  :target-types="observableTypes.map(def => def.type)"
                  @totalUpdated="value => (totalRelatedObservables = value)"
                />
              </v-window-item>

              <v-window-item value="related-entities" eager>
                <v-card title="Direct links">
                  <related-objects
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
          </v-card-text>
        </v-card>
      </v-container>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import axios from "axios";

// import tasklist component
import TaskList from "@/components/TaskList.vue";
import RelatedObjects from "@/components/RelatedObjects.vue";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
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
    RelatedObjects
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
      totalRelatedEntities: 0
    };
  },
  methods: {
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
.yeti-card.v-card {
  border-color: #e0e0e0;
}
</style>
