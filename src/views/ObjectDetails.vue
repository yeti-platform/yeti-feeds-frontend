<template>
  <v-container fluid>
    <v-row align="start" no-gutters>
      <v-col>
        <v-card class="ma-2" variant="flat">
          <template v-slot:title>
            <div class="d-flex yeti-object-title">
              <div>
                <v-chip class="mr-3" color="primary" :text="object?.type" label></v-chip>
              </div>
              <code class="me-auto">{{ object?.name }}</code>
            </div>
          </template>
          <v-card-text class="yeti-description" v-if="object">
            <yeti-markdown :text="object.description || 'No description provided'" />
          </v-card-text>
        </v-card>
        <v-card class="ma-2" v-if="object?.root_type === 'dfiq' && object?.type === 'question'">
          <v-card-title>Approaches</v-card-title>
          <v-card-text> </v-card-text>
          <DFIQ-approaches :question="object"></DFIQ-approaches>
        </v-card>

        <v-card v-if="object?.pattern" class="ma-2" variant="flat">
          <v-card-title>Pattern</v-card-title>
          <v-card-text class="yeti-pattern-code">
            <pre>{{ object.pattern }}</pre>
          </v-card-text></v-card
        >

        <object-context
          v-if="object?.context"
          :context="object.context"
          @update:context="ctx => (object.context = ctx)"
          :update-endpoint="`${typeToEndpointMapping[objectType]}/${object.id}`"
        />
      </v-col>
      <v-col cols="4">
        <v-card class="ma-2" variant="flat">
          <v-card-title class="d-flex"
            ><span class="me-auto"> Info</span>

            <!-- timeline -->
            <v-dialog>
              <template v-slot:activator="{ props }">
                <v-btn class="me-2" variant="tonal" color="primary" size="small" v-bind="props" append-icon="mdi-clock">
                  timeline
                </v-btn>
              </template>
              <template v-slot:default="{ isActive }">
                <v-sheet>
                  <timeline v-if="object" :object="object" :is-active="isActive" />
                </v-sheet>
              </template>
            </v-dialog>
          </v-card-title>

          <v-table density="compact">
            <tbody>
              <tr v-for="field in getObjectInfoFields">
                <th>{{ field.label }}</th>
                <td v-if="field.type === 'list'">
                  <v-chip v-for="item in object[field.field]" :text="item" class="mr-1" />
                </td>
                <td v-else-if="field.type === 'yara'">
                  <v-chip v-for="item in object[field.field]" class="mr-1" density="compact">{{ item }} </v-chip>
                </td>
                <td v-else-if="field.type === 'date'">
                  {{ moment(object[field.field]).toISOString() }}
                </td>
                <td v-else>{{ object[field.field] }}</td>
              </tr>
            </tbody>
          </v-table>
          <v-card-actions>
            <!-- share -->
            <v-dialog v-if="hasOwnerPerms && RBACEnabled">
              <template v-slot:activator="{ props }">
                <v-btn variant="tonal" color="primary" size="small" v-bind="props" append-icon="mdi-account-plus">
                  share
                </v-btn>
              </template>
              <template v-slot:default="{ isActive }">
                <v-sheet>
                  <ACL-edit v-if="object" :object="object" :allow-groups="true" />
                </v-sheet>
              </template>
            </v-dialog>
            <!-- edit -->
            <v-dialog :width="editWidth" :fullscreen="fullScreenEdit" v-if="hasEditPerms">
              <template v-slot:activator="{ props }">
                <v-btn variant="tonal" color="primary" size="small" v-bind="props" append-icon="mdi-pencil"
                  >Edit
                </v-btn>
              </template>

              <template v-slot:default="{ isActive }">
                <edit-DFIQ-object
                  v-if="object?.root_type === 'dfiq'"
                  :object="object"
                  :is-active="isActive"
                  @success="obj => (object = obj)"
                  @toggle-fullscreen="toggleFullscreen"
                />
                <edit-object
                  v-else
                  :object="object"
                  :is-active="isActive"
                  @success="obj => (object = obj)"
                  @toggle-fullscreen="toggleFullscreen"
                />
              </template>
            </v-dialog>
            <!-- nwe link -->
            <v-menu
              v-model="newLinkMenu"
              persistent
              no-click-animation
              @click:outside="newLinkMenu = false"
              v-if="object?.root_type !== 'dfiq'"
            >
              <template v-slot:activator="{ props }">
                <v-btn variant="tonal" color="primary" size="small" v-bind="props" append-icon="mdi-link">
                  new link...
                </v-btn>
              </template>
              <v-list>
                <v-list-item density="compact">
                  <v-dialog :width="editWidth">
                    <template v-slot:activator="{ props }">
                      <v-btn class="me-2" variant="text" color="primary" v-bind="props" size="small"
                        >entities / indicators
                      </v-btn>
                    </template>

                    <template v-slot:default="{ isActive }">
                      <v-sheet>
                        <link-object :object="object" :is-active="isActive" />
                      </v-sheet>
                    </template>
                  </v-dialog>
                </v-list-item>
                <v-list-item density="compact">
                  <v-dialog :width="editWidth">
                    <template v-slot:activator="{ props }">
                      <v-btn variant="text" color="primary" v-bind="props" size="small">observables </v-btn>
                    </template>

                    <template v-slot:default="{ isActive }">
                      <link-observables :linkTarget="object" :is-active="isActive" />
                    </template>
                  </v-dialog>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-actions>
        </v-card>
        <v-card v-if="object?.root_type !== 'dfiq'" class="ma-2" variant="flat">
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
            <template v-slot:chip="tag"> <v-chip :text="tag.item.value" size="default" color="primary" /></template>
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
            <v-tab value="related-dfiq-tree" href="#dfiq-tree" v-if="object?.root_type === 'dfiq'"
              ><v-icon size="x-large" start>mdi-file-tree</v-icon>DFIQ tree</v-tab
            >
            <v-tab
              :value="'related-' + entityType.type"
              v-for="entityType in displayedEntityTypes"
              v-bind:key="entityType.type"
              @click="autoTab = false"
              :href="'#' + entityType.type"
            >
              <v-icon size="x-large" start>{{ entityType.icon }}</v-icon>
              {{ entityType.name }} {{ relatedObjectTabCount[entityType.type] }}
            </v-tab>
            <v-tab value="related-indicators" href="#indicators"
              ><v-icon size="x-large" start>mdi-flash</v-icon>Related indicators
              <v-chip class="ml-3" density="comfortable"> {{ relatedObjectTabCount["indicators"] }}</v-chip></v-tab
            >
            <v-tab value="related-graph" @click="emitRefreshGraph" href="#graph"
              ><v-icon @click="emitRefreshGraph" size="x-large" start>mdi-graph</v-icon>Graph (Beta)
            </v-tab>
            <v-tab value="related-observables" href="#observables"
              ><v-icon size="x-large" start>mdi-text-search</v-icon>Related observables
              <v-chip class="ml-3" density="comfortable">{{ relatedObjectTabCount["observables"] }}</v-chip></v-tab
            >
            <v-tab value="related-dfiq" href="#dfiq"
              ><v-icon size="x-large" start>mdi-chat-question</v-icon>Related DFIQ
              <v-chip class="ml-3" density="comfortable">{{ relatedObjectTabCount["dfiq"] }}</v-chip></v-tab
            >
            <v-tab value="related-tagged" href="#tagged"
              ><v-icon size="x-large" start>mdi-tag</v-icon>Tag relationships
              <v-chip class="ml-3" density="comfortable">{{ relatedObjectTabCount["tagged"] }}</v-chip></v-tab
            >
          </v-tabs>

          <v-window v-model="activeTab">
            <v-window-item value="related-dfiq-tree" eager class="my-4" v-if="object?.root_type === 'dfiq'">
              <v-sheet>
                <DFIQ-tree :dfiq-object-id="id" top-level :dfiq-object="object" />
              </v-sheet>
            </v-window-item>
            <v-window-item
              v-for="entityType in objectTypes['entity']"
              v-bind:key="entityType.type"
              :value="'related-' + entityType.type"
              eager
              class="my-4"
            >
              <direct-neighbors
                :id="id"
                :source-type="typeToEndpointMapping[objectType]"
                :target-types="[entityType.type]"
                @totalUpdated="value => countObjects(entityType.type, value)"
              />
            </v-window-item>

            <v-window-item value="related-indicators" eager class="my-4">
              <direct-neighbors
                :id="id"
                :source-type="typeToEndpointMapping[objectType]"
                :target-types="objectTypes['indicator'].map(def => def.type)"
                @totalUpdated="value => countObjects('indicators', value)"
              />
            </v-window-item>

            <v-window-item value="related-graph" eager>
              <graph-objects :id="id" :source-type="typeToEndpointMapping[objectType]" />
            </v-window-item>

            <v-window-item value="related-observables" eager class="my-4">
              <direct-neighbors
                :id="id"
                :source-type="typeToEndpointMapping[objectType]"
                :target-types="objectTypes['observable'].map(def => def.type)"
                @totalUpdated="value => countObjects('observables', value)"
              />
            </v-window-item>

            <v-window-item value="related-dfiq" eager class="my-4">
              <direct-neighbors
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
import DFIQTree from "@/components/DFIQ/DFIQTree.vue";
import ACLEdit from "@/components/ACLEdit.vue";
import DirectNeighbors from "@/components/DirectNeighbors.vue";
import GraphObjects from "@/components/GraphObjects.vue";
import EditObject from "@/components/EditObject.vue";
import EditDFIQObject from "@/components/DFIQ/EditDFIQObject.vue";
import LinkObject from "@/components/LinkObject.vue";
import LinkObservables from "@/components/LinkObservables.vue";
import YetiMarkdown from "@/components/YetiMarkdown.vue";
import ObjectContext from "@/components/ObjectContext.vue";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions.js";

import moment from "moment";
import Timeline from "@/components/Timeline.vue";
import { useUserStore } from "@/store/user";
import { useAppStore } from "@/store/app";
import DFIQApproaches from "@/components/DFIQ/DFIQApproaches.vue";
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
    DirectNeighbors,
    EditObject,
    EditDFIQObject,
    LinkObject,
    YetiMarkdown,
    DFIQApproaches,
    DFIQTree,
    GraphObjects,
    Timeline,
    ACLEdit,
    ObjectContext
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
      editWidth: "75%",
      newLinkMenu: false,
      userStore: useUserStore(),
      appStore: useAppStore()
    };
  },
  methods: {
    emitRefreshGraph() {
      console.log("Emitting refreshGraph");
      let refreshGraphViewEvent = new Event("refreshGraphView");
      window.dispatchEvent(refreshGraphViewEvent);
    },
    getObjectDetails() {
      axios
        .get(`/api/v2/${this.typeToEndpointMapping[this.objectType]}/${this.id}`)
        .then(response => {
          let tagNames: string[] = [];
          this.object = response.data;
          this.objectTags = this.object.tags ? Object.keys(this.object.tags) : [];
          this.navigateToFirstPopulatedTab();
          this.appStore.setPageTitleFromObject(this.object);
        })
        .catch(error => {
          console.log(error);
          this.$eventBus.emit("displayMessage", {
            status: "error",
            message: error.response.data.detail
          });
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
      if (this.object?.root_type === "dfiq") {
        this.activeTab = "related-dfiq-tree";
        return;
      }
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
      this.editWidth = fullscreen ? "100%" : "75%";
    }
  },
  computed: {
    user() {
      return this.userStore.user;
    },
    getObjectTypeDefintions() {
      return this.objectTypes[this.objectType].find(typeDef => typeDef.type === this.object?.type);
    },
    getObjectInfoFields() {
      return this.getObjectTypeDefintions?.fields.filter(field => !this.hideFieldsInfoBox.includes(field.field));
    },
    displayedEntityTypes() {
      return this.objectTypes["entity"].filter(type => this.relatedObjectTabCount[type.type] > 0);
    },
    activeHash() {
      return this.$route.hash;
    },
    hasEditPerms() {
      return this.userStore.hasEditPerms(this.object);
    },
    hasOwnerPerms() {
      return this.userStore.hasOwnerPerms(this.object);
    },
    RBACEnabled() {
      return this.appStore.RBACEnabled;
    }
  },
  mounted() {
    this.getObjectDetails();
    if (this.activeHash) {
      this.autoTab = false;
      this.activeTab = "related-" + this.activeHash.replace("#", "");
    }
  },
  watch: {
    id() {
      this.getObjectDetails();
    },
    activeHash() {
      this.activeTab = "related-" + this.activeHash.replace("#", "");
    }
  }
};
</script>

<style>
.v-card-text.yeti-description,
.v-card-text.yeti-pattern-code {
  font-size: 1rem;
}

.yeti-object-title code {
  white-space: normal;
}
</style>
