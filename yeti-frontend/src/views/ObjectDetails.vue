<template>
  <v-container fluid>
    <v-row align="start" no-gutters>
      <v-col>
        <v-card class="ma-2 yeti-description">
          <template v-slot:title>
            <v-chip color="primary" :text="object?.type" label></v-chip> <code>{{ object?.name }}</code>
          </template>
          <template v-slot:subtitle> </template>
          <v-card-text class="yeti-description">
            {{ object?.description || "No description provided" }}
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card class="ma-2">
          <v-card-title>Info</v-card-title>
          <v-table density="compact">
            <tbody>
              <tr v-for="field in getObjectInfoFields">
                <th>{{ field.label }}</th>
                <td v-if="field.type === 'list'">
                  <v-chip v-for="item in object[field.field]" color="primary" :text="item" label />
                </td>
                <td v-else-if="field.type === 'date'">
                  {{ moment(object[field.field]).toISOString() }}
                </td>
                <td v-else>{{ object[field.field] }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
        <v-card class="ma-2" variant="flat">
          <v-card-title>Tags</v-card-title>
          <v-combobox
            v-model="objectTags"
            chips
            clearable
            multiple
            density="compact"
            :delimiters="[',', ' ', ';']"
            prepend-inner-icon="mdi-tag"
            class="ma-2"
          >
            <template v-slot:chip="tag"> <v-chip :text="tag.item.value" label size="large" color="primary"/></template>
            <template v-slot:append>
              <v-btn variant="tonal" color="primary" class="me-2" @click="saveTags">Save</v-btn>
            </template>
          </v-combobox>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-container fluid>
        <v-sheet>
          <v-tabs v-model="activeTab" color="primary">
            <v-tab
              :value="'related-' + entityType.type"
              v-for="entityType in displayedEntityTypes"
              v-bind:key="entityType.type"
            >
              <v-icon size="x-large" start>{{ entityType.icon }}</v-icon>
              {{ entityType.name }} {{ relatedEntitiesCount[entityType.type] }}
            </v-tab>
            <v-tab value="related-indicators"
              ><v-icon size="x-large" start>mdi-graph</v-icon>Related indicators
              <v-chip class="ml-3" density="comfortable"> {{ totalRelatedIndicators }}</v-chip></v-tab
            >
            <v-tab value="related-observables"
              ><v-icon size="x-large" start>mdi-graph</v-icon>Related observables
              <v-chip class="ml-3" density="comfortable">{{ totalRelatedObservables }}</v-chip></v-tab
            >
            <v-tab value="tag-relationships"
              ><v-icon size="x-large" start>mdi-tag</v-icon>Tag relationships
              <v-chip class="ml-3" density="comfortable">{{ totalTaggedObservables }}</v-chip></v-tab
            >
          </v-tabs>

          <v-window v-model="activeTab">
            <v-window-item
              v-for="entityType in objectTypes['entity']"
              v-bind:key="entityType.type"
              :value="'related-' + entityType.type"
              eager
              class="my-4"
            >
              <related-objects
                :id="id"
                :source-type="typeToEndpointMapping[objectType]"
                :target-types="[entityType.type]"
                @totalUpdated="value => countEntities(entityType.type, value)"
              />
            </v-window-item>

            <v-window-item value="related-indicators" eager class="my-4">
              <related-objects
                :id="id"
                :source-type="typeToEndpointMapping[objectType]"
                :target-types="objectTypes['indicator'].map(def => def.type)"
                @totalUpdated="value => (totalRelatedIndicators = value)"
              />
            </v-window-item>

            <v-window-item value="related-observables" eager class="my-4">
              <related-objects
                :id="id"
                :source-type="typeToEndpointMapping[objectType]"
                :target-types="objectTypes['observable'].map(def => def.type)"
                @totalUpdated="value => (totalRelatedObservables = value)"
              />
            </v-window-item>

            <v-window-item value="tag-relationships" eager class="my-4">
              <related-objects
                :id="id"
                :source-type="typeToEndpointMapping[objectType]"
                :hops="2"
                graph="tagged"
                :target-types="objectTypes['observable'].map(def => def.type)"
                @totalUpdated="value => (totalTaggedObservables = value)"
              ></related-objects>
            </v-window-item>
          </v-window>
        </v-sheet>
      </v-container>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import axios from "axios";

import RelatedObjects from "@/components/RelatedObjects.vue";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";

import moment from "moment";
</script>

<script lang="ts">
export default {
  props: {
    id: {
      type: String,
      required: true
    },
    objectType: {
      type: String,
      required: true
    }
  },
  components: {
    RelatedObjects
  },
  data() {
    return {
      object: null,
      activeTab: "related-indicators",
      objectTypes: {
        entity: ENTITY_TYPES,
        observable: OBSERVABLE_TYPES,
        indicator: INDICATOR_TYPES
      },
      typeToEndpointMapping: {
        entity: "entities",
        observable: "observables",
        indicator: "indicators"
      },
      objectTags: [],
      totalRelatedObservables: 0,
      totalRelatedIndicators: 0,
      relatedEntitiesCount: ENTITY_TYPES.reduce((acc, cur) => {
        acc[cur.type] = 0;
        return acc;
      }, {}),
      totalTaggedObservables: 0
    };
  },
  methods: {
    getObjectDetails() {
      axios
        .get(`/api/v2/${this.typeToEndpointMapping[this.objectType]}/${this.id}`)
        .then(response => {
          let tagNames: string[] = [];
          this.object = response.data;
          this.objectTags = Object.keys(this.object.tags);
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    saveTags() {
      var params = {
        ids: [this.object.id],
        tags: this.objectTags,
        strict: true
      };
      axios
        .post(`/api/v2/${this.typeToEndpointMapping[this.objectType]}/tag`, params)
        .then(() => {
          this.getObjectDetails();
          this.$eventBus.emit("displayMessage", { message: "Tags saved successfully", status: "success" });
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    countEntities(entityType: string, value: number) {
      this.relatedEntitiesCount[entityType] = value;
      this.navigateToFirstPopulatedTab();
    },
    navigateToFirstPopulatedTab() {
      for (const entityType of this.objectTypes.entity) {
        if (this.relatedEntitiesCount[entityType.type] > 0) {
          this.activeTab = `related-${entityType.type}`;
          return;
        }
      }
    }
  },
  computed: {
    getObjectTypeDefintiions() {
      return this.objectTypes[this.objectType].find(typeDef => typeDef.type === this.object?.type);
    },
    getObjectInfoFields() {
      const hideFields = ["name", "description", "tags"];
      return this.getObjectTypeDefintiions?.fields.filter(field => !hideFields.includes(field.field));
    },
    displayedEntityTypes() {
      return this.objectTypes[this.objectType].filter(type => this.relatedEntitiesCount[type.type] > 0);
    }
  },
  mounted() {
    this.getObjectDetails();
  },
  watch: {
    id() {
      this.getObjectDetails();
    }
  }
};
</script>

<style>
.v-card-text.yeti-description {
  font-size: 1rem;
}
</style>
