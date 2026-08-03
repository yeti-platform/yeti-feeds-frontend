<template>
  <v-autocomplete
    label="Search for entities or indicators"
    :items="items"
    item-title="name"
    v-model="selectedEntity"
    return-object
    clearable
    @update:search="updateItemsDebounced"
    @update:model-value="emitSelectedObject"
    :hide-details="inline"
    :density="inline ? 'compact' : 'default'"
    :persistent-hint="getHintForTypes.length > 0"
    :hint="getHintForTypes"
  >
    <template v-slot:no-data>
      <v-list-item>
        <v-list-item-title>No entities found...</v-list-item-title>
      </v-list-item>
    </template>
    <template v-slot:chip="{ props, item }">
      <v-chip
        v-if="item.type"
        v-bind="props"
        :text="item.name"
        :prepend-icon="getIconForType(item.type)"
      ></v-chip>
    </template>

    <template v-slot:item="{ props, item }">
      <!--
        v-bind="props" goes on this v-list-item itself, not a button nested
        inside it: Vuetify assigns role="option" to this element regardless
        of where the click/selection props are bound, so binding them here
        keeps the whole option's accessible role and its actual click
        behavior on the same element instead of splitting them across a
        wrapper + an inner button (which also meant two separately
        focusable controls -- name and "details" -- inside a single
        announced option).
      -->
      <v-list-item v-bind="props" :prepend-icon="getIconForType(item.type)">
        <template v-slot:append>
          <v-btn
            variant="text"
            :to="{ name: detailsRouteName(item.root_type), params: { id: item.id } }"
            target="_blank"
            prepend-icon="mdi-open-in-new"
            size="x-small"
            rounded="sm"
            @click.stop
            >details</v-btn
          >
        </template>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
import _ from "lodash";
import { computed, onMounted, ref, watch } from "vue";

import { getIconForType } from "@/definitions/typeIcons";
import * as objectsApi from "@/services/objects";
import type { LooseYetiObject } from "@/services/types";

const props = withDefaults(
  defineProps<{
    object?: LooseYetiObject | null;
    isActive?: { value: boolean };
    inline?: boolean;
    typeFilter?: string[];
  }>(),
  {
    object: null,
    inline: false,
    typeFilter: () => []
  }
);

/** The subset of an object this selector offers and emits. */
interface SelectableObject {
  id: string;
  root_type: string;
  name: string;
  type: string;
}

const emit = defineEmits<{ "selected-object": [object: SelectableObject | null] }>();

const items = ref<SelectableObject[]>([]);
const selectedEntity = ref<SelectableObject | null>(props.object as SelectableObject | null);

const getHintForTypes = computed(() =>
  props.typeFilter.length > 0
    ? `Filtering for ${props.typeFilter.join(", ")}`
    : "Filtering for all object types"
);

const DETAILS_ROUTE_BY_ROOT_TYPE: Record<string, string> = {
  entity: "EntityDetails",
  indicator: "IndicatorDetails",
  dfiq: "DFIQDetails"
};

function detailsRouteName(rootType: string): string {
  return DETAILS_ROUTE_BY_ROOT_TYPE[rootType] ?? "EntityDetails";
}

async function loadObjects(searchQuery = "") {
  const request = { query: { name: searchQuery }, count: 20 };
  // These were three sequential awaits; they are independent.
  const [entities, indicators, dfiq] = await Promise.all([
    objectsApi.searchByEndpoint("entities", request),
    objectsApi.searchByEndpoint("indicators", request),
    objectsApi.searchByEndpoint("dfiq", request)
  ]);

  let found = [...entities.items, ...indicators.items, ...dfiq.items].map(item => ({
    id: item.id,
    root_type: item.root_type,
    name: item.name,
    type: item.type
  })) as SelectableObject[];

  if (props.typeFilter.length > 0) {
    found = found.filter(
      item => props.typeFilter.includes(item.type) || props.typeFilter.includes(item.root_type)
    );
  }
  items.value = found;
}

const updateItemsDebounced = _.debounce((searchQuery: string) => loadObjects(searchQuery), 200);

function emitSelectedObject() {
  emit("selected-object", selectedEntity.value as SelectableObject | null);
}

watch(
  () => props.object,
  value => {
    selectedEntity.value = value as SelectableObject | null;
  },
  { deep: true }
);

onMounted(() => loadObjects(""));
</script>


<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
