<template>
  <v-container fluid>
    <v-row align="start" no-gutters>
      <v-col>
        <v-card class="ma-2" variant="flat">
          <template v-slot:title>
            <code>{{ entity?.name }}</code>
          </template>
          <template v-slot:subtitle>
            <v-chip color="primary" :text="entity?.type" label></v-chip>
          </template>
          <v-card-text v-if="entity?.description">
            {{ entity?.description }}
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
              <tr v-for="field in getEntityInfoFields">
                <th>{{ field.label }}</th>
                <td v-if="field.type === 'list'">
                  <v-chip v-for="item in entity[field.field]" color="primary" :text="item" label />
                </td>
                <td v-else>{{ entity[field.field] }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
        <v-card class="ma-2" variant="outlined">
          <v-card-title class="bg-grey-lighten-3">Tags</v-card-title>
          <v-combobox
            v-model="entityTags"
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
                  source-type="entities"
                  :target-types="observableTypes.map(def => def.type)"
                  @totalUpdated="value => (totalRelatedObservables = value)"
                />
              </v-window-item>

              <v-window-item value="related-entities" eager>
                <related-objects
                  :id="id"
                  source-type="entities"
                  :target-types="entityTypes.map(def => def.type)"
                  @totalUpdated="value => (totalRelatedEntities = value)"
                />
              </v-window-item>

              <v-window-item value="tag-relationships" eager>
                <related-objects
                  :id="id"
                  source-type="entities"
                  :hops="2"
                  graph="tagged"
                  :target-types="observableTypes.map(def => def.type)"
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
    RelatedObjects
  },
  data() {
    return {
      entity: null,
      activeTab: 0,
      entityTypes: ENTITY_TYPES,
      observableTypes: OBSERVABLE_TYPES,
      entityTags: [],
      totalRelatedObservables: 0,
      totalRelatedEntities: 0,
      totalTaggedObservables: 0
    };
  },
  methods: {
    getEntityDetails() {
      axios
        .get(`/api/v2/entities/${this.id}`)
        .then(response => {
          let tagNames: string[] = [];
          this.entity = response.data;
          this.entityTags = Object.keys(this.entity.tags);
          this.activeTab = 0;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    saveTags() {
      var params = {
        ids: [this.entity.id],
        tags: this.entityTags,
        strict: true
      };
      axios
        .post("/api/v2/entities/tag", params)
        .then(() => {
          this.getEntityDetails();
          this.$emit("displayMessage", { message: "Tags saved successfully", status: "success" });
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    }
  },
  computed: {
    getEntityTypeDefintiions() {
      return this.entityTypes.find(typeDef => typeDef.type === this.entity?.type);
    },
    getEntityInfoFields() {
      const hideFields = ["name", "description", "tags"];
      return this.getEntityTypeDefintiions?.fields.filter(field => !hideFields.includes(field.field));
    }
  },
  mounted() {
    this.getEntityDetails();
  },
  watch: {
    id() {
      this.getEntityDetails();
    }
  }
};
</script>

<style>
.yeti-card.v-card {
  border-color: #e0e0e0;
}
</style>
