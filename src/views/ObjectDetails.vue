<template>
  <v-container fluid>
    <v-row align="start" no-gutters>
      <v-col>
        <v-card class="ma-2" variant="flat">
          <template v-slot:title>
            <div class="d-flex">
              <v-chip class="mr-3" color="primary" :text="object?.type" label></v-chip>
              <code class="me-auto">{{ object?.name }}</code>

              <v-dialog :width="editWidth" :fullscreen="fullScreenEdit">
                <template v-slot:activator="{ props }">
                  <v-btn class="me-2" variant="tonal" color="primary" v-bind="props" append-icon="mdi-pencil"
                    >Edit
                  </v-btn>
                </template>

                <template v-slot:default="{ isActive }">
                  <edit-object
                    :object="object"
                    :is-active="isActive"
                    @success="obj => (object = obj)"
                    @toggle-fullscreen="toggleFullscreen"
                  />
                </template>
              </v-dialog>

              <v-dialog :width="editWidth">
                <template v-slot:activator="{ props }">
                  <v-btn variant="tonal" color="primary" v-bind="props" append-icon="mdi-link">new link </v-btn>
                </template>

                <template v-slot:default="{ isActive }">
                  <link-object :object="object" :is-active="isActive" />
                </template>
              </v-dialog>
            </div>
          </template>
          <v-card-text class="yeti-description" v-if="object">
            <yeti-DFIQ-approach-template
              v-if="object.root_type === 'dfiq' && object.type === 'approach'"
              :description="object.description"
              :view="object.view"
              :dfiq-type="object.type"
            />
            <yeti-markdown v-else :text="object.description || 'No description provided'" />
          </v-card-text>
        </v-card>
        <v-card v-if="object?.pattern" class="ma-2" variant="flat">
          <v-card-title>Pattern</v-card-title>
          <v-card-text class="yeti-pattern-code"
            ><code>{{ object.pattern }}</code></v-card-text
          ></v-card
        >
      </v-col>
      <v-col cols="4">
        <v-card class="ma-2" variant="flat">
          <v-card-title>Info</v-card-title>
          <v-table density="compact">
            <tbody>
              <tr v-for="field in getObjectInfoFields">
                <th>{{ field.label }}</th>
                <td v-if="field.type === 'list'">
                  <v-chip v-for="item in object[field.field]" :text="item" class="mr-1" />
                </td>
                <td v-else-if="field.type === 'date'">
                  {{ moment(object[field.field]).toISOString() }}
                </td>
                <td v-else>{{ object[field.field] }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
        <v-card class="ma-2" variant="flat" v-if="object?.root_type !== 'indicator'">
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
            <template v-slot:chip="tag"> <v-chip :text="tag.item.value" label size="large" color="primary" /></template>
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
              @click="autoTab = false"
            >
              <v-icon size="x-large" start>{{ entityType.icon }}</v-icon>
              {{ entityType.name }} {{ relatedObjectTabCount[entityType.type] }}
            </v-tab>
            <v-tab value="related-indicators"
              ><v-icon size="x-large" start>mdi-flash</v-icon>Related indicators
              <v-chip class="ml-3" density="comfortable"> {{ relatedObjectTabCount["indicators"] }}</v-chip></v-tab
            >
            <v-tab value="related-observables"
              ><v-icon size="x-large" start>mdi-text-search</v-icon>Related observables
              <v-chip class="ml-3" density="comfortable">{{ relatedObjectTabCount["observables"] }}</v-chip></v-tab
            >
            <v-tab value="related-dfiq"
              ><v-icon size="x-large" start>mdi-chat-question</v-icon>Related DFIQ
              <v-chip class="ml-3" density="comfortable">{{ relatedObjectTabCount["dfiq"] }}</v-chip></v-tab
            >
            <v-tab value="related-tagged"
              ><v-icon size="x-large" start>mdi-tag</v-icon>Tag relationships
              <v-chip class="ml-3" density="comfortable">{{ relatedObjectTabCount["tagged"] }}</v-chip></v-tab
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
                @totalUpdated="value => countObjects(entityType.type, value)"
              />
            </v-window-item>

            <v-window-item value="related-indicators" eager class="my-4">
              <related-objects
                :id="id"
                :source-type="typeToEndpointMapping[objectType]"
                :target-types="objectTypes['indicator'].map(def => def.type)"
                @totalUpdated="value => countObjects('indicators', value)"
              />
            </v-window-item>

            <v-window-item value="related-observables" eager class="my-4">
              <related-objects
                :id="id"
                :source-type="typeToEndpointMapping[objectType]"
                :target-types="objectTypes['observable'].map(def => def.type)"
                @totalUpdated="value => countObjects('observables', value)"
              />
            </v-window-item>

            <v-window-item value="related-dfiq" eager class="my-4">
              <related-objects
                :id="id"
                :source-type="typeToEndpointMapping[objectType]"
                :target-types="objectTypes['dfiq'].map(def => def.type)"
                @totalUpdated="value => countObjects('dfiq', value)"
              />
            </v-window-item>

            <v-window-item value="related-tagged" eager class="my-4">
              <related-objects
                :id="id"
                :source-type="typeToEndpointMapping[objectType]"
                :hops="2"
                graph="tagged"
                :target-types="objectTypes['observable'].map(def => def.type)"
                @totalUpdated="value => countObjects('tagged', value)"
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
import EditObject from "@/components/EditObject.vue";
import LinkObject from "@/components/LinkObject.vue";
import YetiMarkdown from "@/components/YetiMarkdown.vue";
import YetiDFIQApproachTemplate from "@/components/YetiDFIQApproachTemplate.vue";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions.js";

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
    RelatedObjects,
    EditObject,
    LinkObject,
    YetiMarkdown,
    YetiDFIQApproachTemplate
  },
  data() {
    return {
      object: null,
      activeTab: "related-indicators",
      autoTab: true,
      objectTypes: {
        entity: ENTITY_TYPES,
        observable: OBSERVABLE_TYPES,
        indicator: INDICATOR_TYPES,
        dfiq: DFIQ_TYPES
      },
      typeToEndpointMapping: {
        entity: "entities",
        observable: "observables",
        indicator: "indicators",
        dfiq: "dfiq"
      },
      objectTags: [],
      relatedObjectTabCount: {},
      hideFieldsInfoBox: ["name", "description", "tags", "pattern"],
      fullScreenEdit: false,
      editWidth: "50%"
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
    countObjects(key: string, value: number) {
      this.relatedObjectTabCount[key] = value;
      if (!this.$route.hash && this.autoTab) {
        this.navigateToFirstPopulatedTab();
      }
    },
    navigateToFirstPopulatedTab() {
      let tabKeys = this.objectTypes.entity.map(entityType => entityType.type);
      tabKeys = tabKeys.concat(["indicators", "observables", "tagged", "dfiq"]);

      for (const key of tabKeys) {
        if (this.relatedObjectTabCount[key] > 0) {
          this.activeTab = `related-${key}`;
          return;
        }
      }
    },
    toggleFullscreen(fullscreen: boolean) {
      this.fullScreenEdit = !this.fullScreenEdit;
      this.editWidth = fullscreen ? "100%" : "50%";
    }
  },
  computed: {
    getObjectTypeDefintions() {
      return this.objectTypes[this.objectType].find(typeDef => typeDef.type === this.object?.type);
    },
    getObjectInfoFields() {
      return this.getObjectTypeDefintions?.fields.filter(field => !this.hideFieldsInfoBox.includes(field.field));
    },
    displayedEntityTypes() {
      return this.objectTypes["entity"].filter(type => this.relatedObjectTabCount[type.type] > 0);
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
.v-card-text.yeti-description,
.v-card-text.yeti-pattern-code {
  font-size: 1rem;
}
</style>
