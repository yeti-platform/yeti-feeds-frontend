<template>
  <v-container fluid>
    <v-row align="start" no-gutters>
      <v-col>
        <v-card class="ma-2" variant="flat" :loading="!object">
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
          @update:context="updateContext"
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
                  <v-chip v-for="item in object?.[field.field]" :text="item" class="mr-1" />
                </td>
                <td v-else-if="field.type === 'yara'">
                  <v-chip v-for="item in object?.[field.field]" class="mr-1" density="compact">{{ item }} </v-chip>
                </td>
                <td v-else-if="field.type === 'date'">
                  {{ moment(object?.[field.field]).toISOString() }}
                </td>
                <td v-else>{{ object?.[field.field] }}</td>
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
                  <ACL-edit v-if="object" :object="object" :is-active="isActive" :allow-groups="true" />
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
                  :object="object ?? undefined"
                  :is-active="isActive"
                  @success="obj => (object = obj)"
                  @toggle-fullscreen="toggleFullscreen"
                />
                <edit-object
                  v-else
                  :object="object ?? undefined"
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
                        <link-object v-if="object" :object="object" :is-active="isActive" />
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
                      <link-observables v-if="object" :linkTarget="object" :is-active="isActive" />
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
        <v-sheet v-if="object">
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
              <graph-objects :object="object" :source-type="typeToEndpointMapping[objectType]" />
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
          </v-window>
        </v-sheet>
      </v-container>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import moment from "moment";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import ACLEdit from "@/components/ACLEdit.vue";
import DFIQApproaches from "@/components/DFIQ/DFIQApproaches.vue";
import DFIQTree from "@/components/DFIQ/DFIQTree.vue";
import EditDFIQObject from "@/components/DFIQ/EditDFIQObject.vue";
import DirectNeighbors from "@/components/DirectNeighbors.vue";
import EditObject from "@/components/EditObject.vue";
import GraphObjects from "@/components/GraphObjects.vue";
import LinkObject from "@/components/LinkObject.vue";
import LinkObservables from "@/components/LinkObservables.vue";
import ObjectContext from "@/components/ObjectContext.vue";
import Timeline from "@/components/Timeline.vue";
import YetiMarkdown from "@/components/YetiMarkdown.vue";

import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions";
import type { ObjectTypeDefinition } from "@/definitions/types";

import { eventBus } from "@/plugins/eventbus";
import * as objectsApi from "@/services/objects";
import type { DetailRootType, LooseYetiObject, TaggableRootType } from "@/services/types";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";

const props = defineProps<{
  id: string;
  /** ObjectDetails serves entity/indicator/dfiq; observables have their own view. */
  objectType: DetailRootType;
}>();

const route = useRoute();
const userStore = useUserStore();
const appStore = useAppStore();

const objectTypes: Record<string, ObjectTypeDefinition[]> = {
  entity: ENTITY_TYPES,
  observable: OBSERVABLE_TYPES,
  indicator: INDICATOR_TYPES,
  dfiq: DFIQ_TYPES
};

const HIDE_FIELDS_IN_INFO_BOX = ["name", "description", "tags", "pattern"];

/** root_type -> API path segment. The template builds child-component URLs from it. */
const typeToEndpointMapping = objectsApi.ENDPOINTS;

const object = ref<LooseYetiObject | null>(null);
const objectTags = ref<string[]>([]);
const activeTab = ref("related-indicators");
const autoTab = ref(true);
const relatedObjectTabCount = ref<Record<string, number>>({});
const fullScreenEdit = ref(false);
const editWidth = ref("75%");
const newLinkMenu = ref(false);

const user = computed(() => userStore.user);
const activeHash = computed(() => route.hash);
const hasEditPerms = computed(() => (object.value ? userStore.hasEditPerms(object.value) : false));
const hasOwnerPerms = computed(() => (object.value ? userStore.hasOwnerPerms(object.value) : false));
const RBACEnabled = computed(() => appStore.RBACEnabled);

const getObjectTypeDefintions = computed(() =>
  objectTypes[props.objectType]?.find(typeDef => typeDef.type === object.value?.type)
);

const getObjectInfoFields = computed(() =>
  getObjectTypeDefintions.value?.fields.filter(field => !HIDE_FIELDS_IN_INFO_BOX.includes(field.field))
);

const displayedEntityTypes = computed(() =>
  objectTypes.entity.filter(type => relatedObjectTabCount.value[type.type] > 0)
);

function updateContext(context: unknown[]) {
  if (object.value) {
    object.value.context = context;
  }
}

function emitRefreshGraph() {
  window.dispatchEvent(new Event("refreshGraphView"));
}

function navigateToFirstPopulatedTab() {
  if (object.value?.root_type === "dfiq") {
    activeTab.value = "related-dfiq-tree";
    return;
  }
  const tabKeys = objectTypes.entity
    .map(entityType => entityType.type)
    .concat(["indicators", "observables", "tagged", "dfiq"]);

  for (const key of tabKeys) {
    if (relatedObjectTabCount.value[key] > 0) {
      activeTab.value = `related-${key}`;
      return;
    }
  }
}

async function getObjectDetails() {
  // Errors are surfaced by the http interceptor's snackbar.
  object.value = await objectsApi.details(props.objectType, props.id);
  objectTags.value = object.value.tags?.map((tag: { name: string }) => tag.name) ?? [];
  navigateToFirstPopulatedTab();
  appStore.setPageTitleFromObject(object.value);
}

async function saveTags() {
  if (!object.value) {
    return;
  }
  // The tag editor is hidden for DFIQ (there is no /dfiq/tag endpoint), so the
  // objectType here is always taggable.
  await objectsApi.tag(props.objectType as TaggableRootType, {
    ids: [String(object.value.id)],
    tags: objectTags.value,
    strict: true
  });
  await getObjectDetails();
  eventBus.emit("displayMessage", { message: "Tags saved successfully", status: "success" });
}

function countObjects(key: string, value: number) {
  relatedObjectTabCount.value[key] = value;
  if (!route.hash && autoTab.value) {
    navigateToFirstPopulatedTab();
  }
}

function toggleFullscreen(fullscreen: boolean) {
  fullScreenEdit.value = !fullScreenEdit.value;
  editWidth.value = fullscreen ? "100%" : "75%";
}

watch(() => props.id, getObjectDetails);
watch(activeHash, () => {
  activeTab.value = "related-" + activeHash.value.replace("#", "");
});

onMounted(() => {
  getObjectDetails();
  if (activeHash.value) {
    autoTab.value = false;
    activeTab.value = "related-" + activeHash.value.replace("#", "");
  }
});
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
