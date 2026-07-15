<template>
  <v-container fluid>
    <v-row align="start" no-gutters>
      <v-col cols="8">
        <v-card class="ma-2 break-title" variant="flat" :loading="!observable">
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
        <object-context
          v-if="observable"
          :context="observable.context"
          @update:context="updateContext"
          :update-endpoint="`observables/${observable.id}`"
        />
        <v-table>
          <tbody>
            <tr v-for="field in getObservableDetailFields">
              <th>{{ field.label }}</th>
              <td>{{ observable?.[field.field] }}</td>
            </tr>
          </tbody>
        </v-table>
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
                  <ACL-edit v-if="observable" :object="observable" :is-active="isActive" :allow-groups="true" />
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
              <v-chip :text="tag.item.value" :color="tagColor(tag.item.value)" size="default"
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
        <v-sheet v-if="observable">
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
              <v-chip class="ml-3" density="comfortable">{{ totalRelatedEntities }}</v-chip>
            </v-tab>
            <v-tab value="related-indicators"
              ><v-icon size="x-large" start>mdi-magnify</v-icon>Related indicators
              <v-chip class="ml-3" density="comfortable">{{ totalRelatedIndicators }}</v-chip>
            </v-tab>
          </v-tabs>

          <v-window v-model="activeTab" class="pa-5" v-if="observable">
            <v-window-item value="graph">
              <graph-objects :object="observable" source-type="observables" />
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
              <direct-neighbors
                :id="id"
                source-type="observables"
                :target-types="entityTypes.map(def => def.type)"
                @totalUpdated="value => (totalRelatedEntities = value)"
              />
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

<script setup lang="ts">
import moment from "moment";
import { computed, onMounted, ref, watch } from "vue";

import ACLEdit from "@/components/ACLEdit.vue";
import DirectNeighbors from "@/components/DirectNeighbors.vue";
import EditObject from "@/components/EditObject.vue";
import GraphObjects from "@/components/GraphObjects.vue";
import LinkObject from "@/components/LinkObject.vue";
import LinkObservables from "@/components/LinkObservables.vue";
import ObjectContext from "@/components/ObjectContext.vue";
import TaskList from "@/components/TaskList.vue";
import Timeline from "@/components/Timeline.vue";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions";

import { eventBus } from "@/plugins/eventbus";
import * as observablesApi from "@/services/observables";
import type { LooseYetiObject } from "@/services/types";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";

const props = defineProps<{ id: string }>();

const userStore = useUserStore();
const appStore = useAppStore();

const observableTypes = OBSERVABLE_TYPES;
const entityTypes = ENTITY_TYPES;
const indicatorTypes = INDICATOR_TYPES;

// Typed loosely for the same reason as ObjectDetails: the template indexes
// fields dynamically (observable[field.field]) off the type definitions.
const observable = ref<LooseYetiObject | null>(null);
const observableTags = ref<string[]>([]);
const activeTab = ref(0);
const totalRelatedObservables = ref(0);
const totalRelatedEntities = ref(0);
const totalRelatedIndicators = ref(0);
const editWidth = ref<string | number>(600);
const fullScreenEdit = ref(false);
const newLinkMenu = ref(false);

const user = computed(() => userStore.user);
const RBACEnabled = computed(() => appStore.RBACEnabled);
const hasEditPerms = computed(() => (observable.value ? userStore.hasEditPerms(observable.value) : false));
const hasOwnerPerms = computed(() => (observable.value ? userStore.hasOwnerPerms(observable.value) : false));

const getObservableTypeDefinition = computed(() =>
  observableTypes.find(typeDef => typeDef.type === observable.value?.type)
);

const getObservableDetailFields = computed(() => {
  const hideFields = ["value", "tags", "description", "created", "modified"];
  return getObservableTypeDefinition.value?.fields.filter(field => !hideFields.includes(field.field));
});

const getObservableInfoFields = computed(() => {
  const fields = ["created", "modified"];
  return getObservableTypeDefinition.value?.fields.filter(field => fields.includes(field.field));
});

function emitRefreshGraph() {
  window.dispatchEvent(new Event("refreshGraphView"));
}

/** Stale tags are greyed out. */
function tagColor(tagName: string): string {
  const tag = observable.value?.tags?.find((t: { name: string }) => t.name === tagName);
  return tag?.fresh ? "primary" : "grey";
}

function copyText(text: string) {
  navigator.clipboard.writeText(text);
  eventBus.emit("displayMessage", { status: "info", message: "Observable value copied to clipboard!" });
}

function updateContext(context: unknown[]) {
  if (observable.value) {
    observable.value.context = context;
  }
}

async function getObservableDetails() {
  // Errors surface via the http interceptor's snackbar.
  observable.value = await observablesApi.details(props.id);
  observableTags.value = observable.value.tags?.map((tag: { name: string }) => tag.name) ?? [];
  // Switch back to the Context view when reloading the page.
  activeTab.value = 0;
  appStore.setPageTitleFromObject(observable.value);
}

async function saveTags() {
  await observablesApi.tag({ ids: [props.id], strict: true, tags: observableTags.value });
  await getObservableDetails();
  eventBus.emit("displayMessage", { message: "Tags saved successfully", status: "success" });
}

function toggleFullscreen(fullscreen: boolean) {
  fullScreenEdit.value = !fullScreenEdit.value;
  editWidth.value = fullscreen ? "100%" : "75%";
}

watch(() => props.id, getObservableDetails);
onMounted(getObservableDetails);
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
