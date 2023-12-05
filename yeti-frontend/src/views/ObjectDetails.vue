<template>
  <v-container fluid>
    <v-row align="start" no-gutters>
      <v-col>
        <v-card class="ma-2" variant="flat">
          <template v-slot:title>
            <code>{{ object?.name }}</code>
          </template>
          <template v-slot:subtitle>
            <v-chip color="primary" :text="object?.type" label></v-chip>
          </template>
          <v-card-text v-if="object?.description">
            {{ object?.description }}
          </v-card-text>
          <v-card-text v-else>
            <em>No description provided</em>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card class="ma-2 yeti-card" variant="flat">
          <v-card-title class="bg-grey-lighten-3">Info</v-card-title>
          <v-table density="compact">
            <tbody>
              <tr v-for="field in getObjectInfoFields">
                <th>{{ field.label }}</th>
                <td v-if="field.type === 'list'">
                  <v-chip v-for="item in object[field.field]" color="primary" :text="item" label />
                </td>
                <td v-else>{{ object[field.field] }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
        <v-card class="ma-2" variant="outlined">
          <v-card-title class="bg-grey-lighten-3">Tags</v-card-title>
          <v-combobox
            v-model="objectTags"
            chips
            clearable
            multiple
            variant="outlined"
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
        <v-card variant="flat">
          <v-tabs v-model="activeTab" color="primary">
            <v-tab value="related-observables"
              ><v-icon size="x-large">mdi-graph</v-icon>Related observables {{ totalRelatedObservables }}</v-tab
            >
            <v-tab value="related-entities"
              ><v-icon size="x-large">mdi-brain</v-icon>Related entities {{ totalRelatedEntities }}</v-tab
            >
            <v-tab value="tag-relationships"
              ><v-icon size="x-large">mdi-tag</v-icon>Tag relationships {{ totalTaggedObservables }}</v-tab
            >
          </v-tabs>

          <v-card-text>
            <v-window v-model="activeTab">
              <v-window-item value="related-observables" eager>
                <related-objects
                  :id="id"
                  :source-type="typeToEndpointMapping[objectType]"
                  :target-types="objectTypes['observable'].map(def => def.type)"
                  @totalUpdated="value => (totalRelatedObservables = value)"
                />
              </v-window-item>

              <v-window-item value="related-entities" eager>
                <related-objects
                  :id="id"
                  :source-type="typeToEndpointMapping[objectType]"
                  :target-types="objectTypes['entity'].map(def => def.type)"
                  @totalUpdated="value => (totalRelatedEntities = value)"
                />
              </v-window-item>

              <v-window-item value="tag-relationships" eager>
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
          </v-card-text>
        </v-card>
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
      activeTab: 0,
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
      totalRelatedEntities: 0,
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
          this.activeTab = 0;
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
    }
  },
  computed: {
    getObjectTypeDefintiions() {
      return this.objectTypes[this.objectType].find(typeDef => typeDef.type === this.object?.type);
    },
    getObjectInfoFields() {
      const hideFields = ["name", "description", "tags"];
      return this.getObjectTypeDefintiions?.fields.filter(field => !hideFields.includes(field.field));
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
.yeti-card.v-card {
  border-color: #e0e0e0;
}
</style>
