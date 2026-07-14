<template>
  <!-- Empty headers array to not mess up with CSS borders -->
  <v-data-table-server
    density="compact"
    :items="getNodeChain"
    :itemsLength="total"
    :items-per-page="perPage"
    v-model:page="page"
    @update:options="fetchNeighbors"
    :headers="[]"
    hover
  >
    <template v-slot:item="{ item }">
      <tr>
        <td
          v-for="node in item.nodeChain"
          v-bind:key="node.id"
          :class="{ object: !node.direction, link: node.direction }"
        >
          <span v-if="node.direction">
            <v-icon v-if="node.direction == 'out'">mdi-arrow-right</v-icon>
            <v-icon v-else-if="node.direction == 'in'">mdi-arrow-left</v-icon>

            <v-btn size="small" variant="text" append-icon="mdi-information">
              <template v-slot:append>
                <v-icon class="on-surface" v-if="node.description"></v-icon>
              </template>
              {{ node.type }}
              <v-menu activator="parent" v-if="node.description">
                <v-sheet class="px-5 py-2" color="background" width="auto" elevation="10" style="font-size: 0.8rem">
                  <yeti-markdown :text="node.description" />
                </v-sheet>
              </v-menu>
            </v-btn>
          </span>
          <span v-else-if="node.root_type === 'observable'" class="short-links">
            <v-tooltip activator="parent" location="top" :open-delay="200">{{ node.value }}</v-tooltip>
            <router-link :to="{ name: 'ObservableDetails', params: { id: node.id } }">
              {{ node.value }}
            </router-link>
          </span>
          <span v-else-if="node.root_type === 'entity'" class="short-links">
            <v-icon :icon="getIconForType(node.type)" start size="small"></v-icon>
            <span>
              <v-tooltip activator="parent" location="top" :open-delay="200">{{ node.name }}</v-tooltip>
              <router-link :to="{ name: 'EntityDetails', params: { id: node.id } }">
                {{ node.name }}
              </router-link>
            </span>
          </span>
          <span v-else-if="node.root_type === 'indicator'" class="short-links">
            <v-icon :icon="getIconForType(node.type)" start size="small"></v-icon>
            <span>
              <v-tooltip activator="parent" location="top" :open-delay="200">{{ node.name }}</v-tooltip>
              <router-link :to="{ name: 'IndicatorDetails', params: { id: node.id } }">
                {{ node.name }}
              </router-link>
            </span>
          </span>
          <span v-else-if="node.root_type === 'dfiq'" class="short-links">
            <v-icon :icon="getIconForType(node.type)" start size="small"></v-icon>
            <span>
              <v-tooltip activator="parent" location="top" :open-delay="200">{{ node.name }}</v-tooltip>
              <router-link :to="{ name: 'DFIQDetails', params: { id: node.id } }">
                {{ node.name }}
              </router-link>
            </span>
          </span>
          <span v-else>
            <v-chip> {{ node.name }}</v-chip>
          </span>
        </td>
        <td class="controls" v-if="hops === 1">
          <v-btn
            icon="mdi-swap-horizontal"
            @click="swapLink(item.edges[0].id)"
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
                :edge="item.edges[0]"
                :is-active="isActive"
                @success="linkUpdateSuccess(item.edges[0], $event)"
              />
            </template>
          </v-dialog>
          <v-btn
            icon="mdi-link-off"
            @click="unlink(item.edges[0].id)"
            density="compact"
            variant="tonal"
            color="error"
            class="me-2"
          >
          </v-btn>
        </td>
      </tr>
    </template>
  </v-data-table-server>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

import EditLink from "@/components/EditLink.vue";
import YetiMarkdown from "@/components/YetiMarkdown.vue";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions";
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

type Edge = LooseYetiObject & { direction?: "in" | "out" };
interface NodeChain {
  edges: Edge[];
  nodeChain: LooseYetiObject[];
}

const objectTypes = ENTITY_TYPES.concat(INDICATOR_TYPES).concat(DFIQ_TYPES);

const vertices = ref<Record<string, LooseYetiObject>>({});
const paths = ref<Edge[][]>([]);
const tempChains = ref<unknown[]>([]);
const page = ref(1);
const perPage = ref(20);
const total = ref(0);
const loading = ref(false);
const showEditLink = ref(false);

const extendedId = computed(() => `${props.sourceType}/${props.id}`);

/**
 * Turns each path into an alternating [node, edge, node, ...] chain, tagging
 * every edge with the direction it is traversed in.
 */
const getNodeChain = computed<NodeChain[]>(() =>
  paths.value.map(edges => {
    const nodeChain: LooseYetiObject[] = [];
    edges.forEach((edge, index) => {
      if (index === 0) {
        const outbound = edge.source === extendedId.value;
        edge.direction = outbound ? "out" : "in";
        nodeChain.push(vertices.value[outbound ? edge.source : edge.target]);
        nodeChain.push(edge);
        nodeChain.push(vertices.value[outbound ? edge.target : edge.source]);
      } else {
        const outbound = edge.source === edges[index - 1].target;
        edge.direction = outbound ? "out" : "in";
        nodeChain.push(edge);
        nodeChain.push(vertices.value[outbound ? edge.target : edge.source]);
      }
    });
    return { edges, nodeChain };
  })
);

function getLabelForField(field: string): string {
  const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
  return fieldName.replace(/_/g, " ");
}

/** Optional: a type the backend knows but the frontend definitions don't. */
function getIconForType(type: string): string | undefined {
  return objectTypes.find(objectType => objectType.type === type)?.icon;
}

function linkUpdateSuccess(edge: Edge, updatedEdge: Edge) {
  edge.type = updatedEdge.type;
  edge.description = updatedEdge.description;
}

async function fetchNeighbors({ page: requestedPage, itemsPerPage }: { page: number; itemsPerPage: number }) {
  loading.value = true;
  try {
    const response = await graphApi.search({
      source: extendedId.value,
      target_types: props.targetTypes,
      graph: props.graph,
      hops: props.hops,
      direction: "any",
      include_original: true,
      count: itemsPerPage === -1 ? 0 : itemsPerPage,
      page: requestedPage - 1
    } as Parameters<typeof graphApi.search>[0]);

    vertices.value = response.vertices as Record<string, LooseYetiObject>;
    paths.value = response.paths as unknown as Edge[][];
    total.value = response.total;
    emit("totalUpdated", total.value);
  } finally {
    loading.value = false;
  }
}

function refresh() {
  fetchNeighbors({ page: page.value, itemsPerPage: perPage.value });
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

td.controls {
  width: 140px;
}

td.link {
  width: 200px;
}
</style>
