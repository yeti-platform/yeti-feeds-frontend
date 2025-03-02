<template>
  <v-container fluid>
    <v-row align="start" no-gutters>
      <v-col cols="8">
        <v-card class="ma-2 break-title" variant="flat">
          <template v-slot:title>
            <div class="d-flex">
              <v-chip class="mr-3 flex-shrink-0" color="primary" :text="observable?.type" label></v-chip>
              <code class="observable-value">{{ observable?.value }}</code>
            </div>
          </template>
        </v-card>
        <v-sheet class="ma-2" v-if="observable?.value.length > 70">
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
                    size="small"
                  >
                    {{ source }}
                  </v-chip>
                </td>
              </tr>
              <tr v-for="field in getObservableDetailFields">
                <th>{{ field.label }}</th>
                <td>{{ observable[field.field] }}</td>
              </tr>
            </tbody>
          </v-table>
          <v-card>
            <v-treeview
              :items="ContextTreeView()"
              item-value="id"
              activatable
              open-on-click
              open-all
              density="compact"
              max-height="300"
              width="100%"
            >
            </v-treeview>
          </v-card>
        </v-sheet>
      </v-col>
      <v-col cols="4">
        <v-card class="ma-2" variant="flat" v-if="observable">
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
                  <timeline v-if="observable" :object="observable" :is-active="isActive" />
                </v-sheet>
              </template> </v-dialog
          ></v-card-title>
          <v-table density="compact">
            <tbody>
              <tr v-for="field in getObservableInfoFields">
                <th>{{ field.label }}</th>
                <td v-if="['created', 'modified'].includes(field.field)">
                  {{ moment(observable[field.field]).toISOString() }}
                </td>
                <td v-else>{{ observable[field.field] }}</td>
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
                  <ACL-edit v-if="observable" :object="observable" :allow-groups="true" />
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
                <edit-object
                  :object="observable"
                  :is-active="isActive"
                  @success="obs => (observable = obs)"
                  @toggle-fullscreen="toggleFullscreen"
                />
              </template>
            </v-dialog>

            <!-- link -->
            <v-menu v-model="newLinkMenu" persistent no-click-animation @click:outside="newLinkMenu = false">
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
                        <link-object :object="observable" :is-active="isActive" />
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
                      <link-observables :linkTarget="observable" :is-active="isActive" />
                    </template>
                  </v-dialog>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-actions>
        </v-card>
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
                :color="observable?.tags[tag.item.value]?.fresh ? 'primary' : 'grey'"
                size="default"
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
            <v-tab value="graph" @click="emitRefreshGraph"
              ><v-icon @click="emitRefreshGraph" size="x-large" start>mdi-graph</v-icon>Graph (Beta)
            </v-tab>
            <v-tab value="related-observables"
              ><v-icon size="x-large" start>mdi-graph</v-icon>Related observables
              <v-chip class="ml-3" density="comfortable">{{ totalRelatedObservables }}</v-chip></v-tab
            >
            <v-tab value="related-entities"
              ><v-icon size="x-large" start>mdi-brain</v-icon>Related entities
              <v-chip class="ml-3" density="comfortable">{{ totalRelatedEntities + totalTaggedRelationships }}</v-chip>
            </v-tab>
            <v-tab value="related-indicators"
              ><v-icon size="x-large" start>mdi-magnify</v-icon>Related indicators
              <v-chip class="ml-3" density="comfortable">{{ totalRelatedIndicators }}</v-chip>
            </v-tab>
          </v-tabs>

          <v-window v-model="activeTab" class="pa-5">
            <v-window-item value="graph">
              <graph-objects :id="id" source-type="observables" />
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
            <v-window-item value="related-indicators" eager>
              <direct-neighbors
                :id="id"
                source-type="observables"
                :target-types="indicatorTypes.map(def => def.type)"
                @totalUpdated="value => (totalRelatedIndicators = value)"
              />
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
import ACLEdit from "@/components/ACLEdit.vue";
import DirectNeighbors from "@/components/DirectNeighbors.vue";
import GraphObjects from "@/components/GraphObjects.vue";

import LinkObject from "@/components/LinkObject.vue";
import LinkObservables from "@/components/LinkObservables.vue";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import moment from "moment";
import { VTreeview } from "vuetify/labs/VTreeview";

import Timeline from "@/components/Timeline.vue";

import { useUserStore } from "@/store/user";
import { useAppStore } from "@/store/app";
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
    EditObject,
    LinkObject,
    LinkObservables,
    GraphObjects,
    Timeline,
    ACLEdit
  },
  data() {
    return {
      observable: null,
      observableTags: [],
      activeTab: 0,
      observableTypes: OBSERVABLE_TYPES,
      entityTypes: ENTITY_TYPES,
      indicatorTypes: INDICATOR_TYPES,
      totalRelatedObservables: 0,
      totalTaggedRelationships: 0,
      totalRelatedEntities: 0,
      totalRelatedIndicators: 0,
      editWidth: 600,
      fullScreenEdit: false,
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
          this.appStore.setPageTitleFromObject(this.observable);
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
      this.editWidth = fullscreen ? "100%" : "75%";
    },

    ContextTreeView() {
      var items = [];
      var id = 0;
      var id = 0;
      if (this.observable === null) {
        return items;
      }
      function treeify(root, data) {
        if (Array.isArray(data)) {
          var count = 0;
          for (const item of data) {
            var element = { id: id++, title: count.toString(), children: [] };
            root.push(element);
            count++;
            treeify(element.children, item);
          }
        } else if (typeof data === "object") {
          for (const [key, value] of Object.entries(data)) {
            if (key === "source") {
              continue;
            }
            if (value === null) {
              var title = key + ": N/A";
              var element = { id: id++, title: title };
              root.push(element);
            } else if (Array.isArray(value) || typeof value === "object") {
              element = { id: id++, title: key, children: [] };
              root.push(element);
              treeify(element.children, value);
            } else {
              var title = key + ": " + value;
              var element = { id: id++, title: title };
              root.push(element);
            }
          }
        }
      }
      for (const ctx of this.observable.context) {
        var element = { id: id++, title: ctx.source, children: [], color: "warning" };
        items.push(element);
        treeify(element.children, ctx);
      }
      return items;
    }
  },

  computed: {
    user() {
      return this.userStore.user;
    },
    getObservableTypeDefinition() {
      return this.observableTypes.find(typeDef => typeDef.type === this.observable?.type);
    },
    getObservableDetailFields() {
      const hideFields = ["value", "tags", "description", "created", "modified"];
      return this.getObservableTypeDefinition?.fields.filter(field => !hideFields.includes(field.field));
    },
    getObservableInfoFields() {
      const fields = ["created", "modified"];
      return this.getObservableTypeDefinition?.fields.filter(field => fields.includes(field.field));
    },
    hasEditPerms() {
      return this.userStore.hasEditPerms(this.observable);
    },
    hasOwnerPerms() {
      return this.userStore.hasOwnerPerms(this.observable);
    },
    RBACEnabled() {
      return this.appStore.RBACEnabled;
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
