<template>
  <!-- Empty headers array to not mess up with CSS borders -->
  <div>
    <v-form>
      <v-row>
        <v-col>
          <v-text-field
            label="Filter regex (name, type, value, description, aliases)"
            density="compact"
            @update:model-value="searchFilterDebounced"
            clearable
            hide-details
          ></v-text-field>
        </v-col>
        <v-col>
          <!-- add a checkbox for inline display of description -->
          <v-checkbox-btn
            label="Dispay inline description"
            density="compact"
            hide-details
            color="primary"
            class="float-left mr-4 mt-1"
            v-model="inlineDescription"
          ></v-checkbox-btn>
          <v-checkbox-btn
            label="Inline markdown"
            density="compact"
            hide-details
            color="primary"
            class="float-left mt-1"
            v-model="inlineMarkdown"
          ></v-checkbox-btn>
        </v-col>
      </v-row>
    </v-form>
    <v-data-table-server
      density="compact"
      :items="processedPaths"
      :itemsLength="total"
      :items-per-page="perPage"
      v-model:page="page"
      :headers="headers"
      @update:options="fetchNeighbors"
      @update:items-per-page="perPage = $event"
      :sort-by="sortBy"
      :search="searchFilter"
      hover
      :loading="loading"
      loading-text="Loading data..."
    >
      <!-- <tr> -->
      <template v-slot:item.direction="{ item }">
        <v-icon v-if="item.target === extendedId">mdi-arrow-left</v-icon>
        <v-icon v-else-if="item.source === extendedId">mdi-arrow-right</v-icon>
      </template>

      <template v-slot:item.created="{ item }">
        {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss") }}
      </template>

      <template v-slot:item.modified="{ item }">
        {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss") }}
      </template>

      <template v-slot:item.relevant_node.type="{ item }">
        <v-chip density="compact" class="ml-2">
          <v-icon :icon="getIconForType(item.relevant_node.type)" start size="small"></v-icon>
          {{ item.relevant_node.type }}</v-chip
        >
      </template>

      <template v-slot:item.relevant_node.value="{ item }">
        <span v-if="item.relevant_node.root_type === 'observable'">
          <router-link :to="{ name: 'ObservableDetails', params: { id: item.relevant_node.id } }">
            <span class="short-links">{{ item.relevant_node.value }}</span>
          </router-link>
        </span>
        <span v-if="item.relevant_node.root_type === 'entity'">
          <router-link :to="{ name: 'EntityDetails', params: { id: item.relevant_node.id } }">
            <span class="short-links">{{ item.relevant_node.name }}</span>
          </router-link>
        </span>
        <span v-if="item.relevant_node.root_type === 'indicator'">
          <router-link :to="{ name: 'IndicatorDetails', params: { id: item.relevant_node.id } }">
            <span class="short-links">{{ item.relevant_node.name }}</span>
          </router-link>
        </span>
        <span v-if="item.relevant_node.root_type === 'dfiq'">
          <router-link :to="{ name: 'DFIQDetails', params: { id: item.relevant_node.id } }">
            <span class="short-links">{{ item.relevant_node.name }}</span>
          </router-link>
        </span>
      </template>

      <template v-slot:item.relevant_node.tags="{ item }">
        <v-chip
          v-if="item.relevant_node.tags"
          v-for="tag in item.relevant_node.tags"
          :key="tag.name"
          class="mr-2"
          :color="tag.fresh ? 'primary' : 'grey'"
          density="compact"
        >
          {{ tag.name }}
        </v-chip>
      </template>

      <template v-slot:item.description="{ item }">
        <span v-if="inlineDescription">
          <v-chip density="compact" class="mr-2" color="success">{{ item.type }} </v-chip>
          <span><yeti-markdown :text="item.description" :inline="inlineMarkdown" /></span>
        </span>
        <v-btn v-else size="small" variant="tonal" append-icon="mdi-information">
          <template v-slot:append>
            <v-icon v-if="item.description"></v-icon>
          </template>
          {{ item.type }}
          <v-menu activator="parent" v-if="item.description">
            <v-sheet class="px-5 py-2" color="background" width="auto" elevation="10" style="font-size: 0.8rem">
              <yeti-markdown :text="item.description" />
            </v-sheet>
          </v-menu>
        </v-btn>
      </template>

      <template v-slot:item.controls="{ item }">
        <v-btn
          icon="mdi-swap-horizontal"
          @click="swapLink(item.id)"
          density="compact"
          variant="tonal"
          color="primary"
          class="me-2"
        >
        </v-btn>
        <v-dialog width="700">
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-pencil" density="compact" variant="tonal" color="primary" class="me-2" v-bind="props">
            </v-btn>
          </template>

          <template v-slot:default="{ isActive }">
            <edit-link
              :vertices="vertices"
              :edge="item"
              :is-active="isActive"
              @success="linkUpdateSuccess(item, $event)"
            />
          </template>
        </v-dialog>
        <v-btn
          icon="mdi-link-off"
          @click="unlink(item.id)"
          density="compact"
          variant="tonal"
          color="error"
          class="me-2"
        >
        </v-btn>
      </template>
    </v-data-table-server>
  </div>
</template>

<script setup lang="ts">
import _ from "lodash";
import moment from "moment";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

import EditLink from "@/components/EditLink.vue";
import YetiMarkdown from "@/components/YetiMarkdown.vue";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions";
import { eventBus } from "@/plugins/eventbus";
import * as graphApi from "@/services/graph";
import type { LooseYetiObject } from "@/services/types";

const props = withDefaults(
  defineProps<{
    id: string;
    fields?: string[];
    sourceType?: string;
    targetTypes?: string[];
    inlineIcons?: boolean;
    graph?: string;
    hops?: number;
  }>(),
  {
    fields: () => ["value", "tags"],
    sourceType: "observable",
    targetTypes: () => [],
    inlineIcons: false,
    graph: "links",
    hops: 1
  }
);

const emit = defineEmits<{ totalUpdated: [total: number] }>();

/** A relationship edge, with the node on the other end resolved onto it. */
type ProcessedPath = LooseYetiObject & { relevant_node: LooseYetiObject };

interface SortItem {
  key: string;
  order?: boolean | "asc" | "desc";
}
interface TableOptions {
  page: number;
  itemsPerPage: number;
  sortBy: SortItem[];
}

const objectTypes = ENTITY_TYPES.concat(INDICATOR_TYPES).concat(DFIQ_TYPES).concat(OBSERVABLE_TYPES);

const headers = [
  { title: "", key: "direction", width: "10px" },
  { title: "First linked", key: "created", width: "170px", sortable: true },
  { title: "Last linked", key: "modified", width: "170px", sortable: true },
  { title: "Type", key: "relevant_node.type", width: "10px", sortable: false },
  { title: "Value", key: "relevant_node.value", maxWidth: "700px", sortable: false },
  { title: "Tags", key: "relevant_node.tags", sortable: false },
  { title: "Description", key: "description", sortable: false },
  { title: "Count", key: "count", sortable: true },
  { title: "", key: "controls", sortable: false }
];

const vertices = ref<Record<string, LooseYetiObject>>({});
const paths = ref<LooseYetiObject[][]>([]);
const processedPaths = ref<ProcessedPath[]>([]);
const tempChains = ref<unknown[]>([]);
const inlineDescription = ref(true);
const inlineMarkdown = ref(true);
const searchFilter = ref("");
const page = ref(1);
const perPage = ref(50);
const total = ref(0);
const loading = ref(false);
const showEditLink = ref(false);
const sortBy = ref<SortItem[]>([{ key: "modified", order: "desc" }]);

const extendedId = computed(() => `${props.sourceType}/${props.id}`);

function getLabelForField(field: string): string {
  const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
  return fieldName.replace(/_/g, " ");
}

function getIconForType(type: string): string | undefined {
  return objectTypes.find(objectType => objectType.type === type)?.icon;
}

function getVerticeFromNode(link: LooseYetiObject): LooseYetiObject {
  return link.source === extendedId.value ? vertices.value[link.target] : vertices.value[link.source];
}

function linkUpdateSuccess(edge: LooseYetiObject, updatedEdge: LooseYetiObject) {
  edge.type = updatedEdge.type;
  edge.description = updatedEdge.description;
}

async function fetchNeighbors({ page: requestedPage, itemsPerPage, sortBy: requestedSort }: TableOptions) {
  loading.value = true;
  // The same term is matched against several fields; the backend ORs them.
  const filter = ["type", "description", "value", "name"]
    .map(key => ({ key, value: searchFilter.value || "", operator: "=~" }))
    .concat([{ key: "aliases", value: searchFilter.value || "", operator: "in" }]);

  try {
    const response = await graphApi.search({
      source: extendedId.value,
      target_types: props.targetTypes,
      graph: props.graph,
      hops: props.hops,
      direction: "any",
      include_original: true,
      filter,
      count: itemsPerPage === -1 ? 0 : itemsPerPage,
      page: requestedPage - 1,
      sorting: requestedSort.map(sort => [sort.key, sort.order === "asc"])
    } as Parameters<typeof graphApi.search>[0]);

    vertices.value = response.vertices as Record<string, LooseYetiObject>;
    paths.value = response.paths as unknown as LooseYetiObject[][];
    processedPaths.value = paths.value.map(path => {
      const edge = path[0];
      const relevantNode = edge.source === extendedId.value ? edge.target : edge.source;
      return { ...edge, relevant_node: vertices.value[relevantNode] } as ProcessedPath;
    });
    total.value = response.total;
    emit("totalUpdated", total.value);
  } finally {
    loading.value = false;
  }
}

function refresh() {
  fetchNeighbors({ page: page.value, itemsPerPage: perPage.value, sortBy: sortBy.value });
}

async function swapLink(edgeId: string) {
  await graphApi.swap(edgeId);
  eventBus.emit("displayMessage", { message: "Link direction swapped succesfully!", status: "success" });
  refresh();
}

async function unlink(id: string) {
  if (!confirm("Are you sure you want to delete this link?")) {
    return;
  }
  await graphApi.remove(id);
  refresh();
}

const searchFilterDebounced = _.debounce((value: string) => {
  searchFilter.value = value;
}, 200);

/** Refresh when a link is created elsewhere and it touches one of our types. */
function onLinkCreated(data: unknown) {
  const link = data as { source?: { type?: string }; target?: { type?: string } };
  const sourceType = link.source?.type;
  const targetType = link.target?.type;
  if (
    (targetType && props.targetTypes.includes(targetType)) ||
    (sourceType && props.targetTypes.includes(sourceType))
  ) {
    refresh();
  }
}

onMounted(() => eventBus.on("linkCreated", onLinkCreated));
// The old Options-API version never removed this listener.
onUnmounted(() => eventBus.off("linkCreated", onLinkCreated));

watch(
  () => props.id,
  () => {
    page.value = 1;
    perPage.value = 20;
    refresh();
  }
);
</script>


<style>
.short-links {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  display: block;
}
</style>
