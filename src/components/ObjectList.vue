<template>
  <v-sheet class="mt-2">
    <v-data-table-server
      v-model:page="page"
      :itemsLength="total"
      :items-per-page="perPage"
      :items-per-page-options="[
        { value: 10, title: '10' },
        { value: 25, title: '25' },
        { value: 50, title: '50' },
        { value: 100, title: '100' }
      ]"
      :headers="headers"
      density="compact"
      :items="items"
      @update:options="loadObjects"
      :search="searchQuery"
      :item-value="item => item.id"
      hover
      :sort-by="sortBy"
      :loading="loading"
      loading-text="Loading data..."
    >
      <template v-slot:item.name="{ item }">
        <span class="short-links">
          <v-tooltip activator="parent" location="top" :open-delay="200">{{ item.name }}</v-tooltip>
          <router-link :to="`${searchType}/${item.id}`">{{ item.name }}</router-link>
        </span>
      </template>
      <template v-slot:item.tags="{ item }">
        <v-chip
          v-for="tag in item.tags"
          :color="tag.fresh ? 'blue ' : 'red'"
          :text="tag.name"
          class="mr-1"
          size="small"
        ></v-chip>
      </template>
      <template v-slot:item.relevant_tags="{ item }">
        <v-chip v-for="name in item.relevant_tags" :text="name" class="mr-1" size="small"></v-chip>
      </template>
      <template v-slot:item.supported_os="{ item }">
        <v-chip v-for="name in item.supported_os" :text="name" class="mr-1" size="small"></v-chip>
      </template>
      <template v-slot:item.dfiq_tags="{ item }">
        <v-chip v-for="name in item.dfiq_tags" :text="name" class="mr-1" size="small"></v-chip>
      </template>
      <template v-slot:item.aliases="{ item }">
        <v-chip v-for="value in item.aliases" :text="value" class="mr-1" size="small"></v-chip>
      </template>
      <template v-slot:item.threat_actor_types="{ item }">
        <v-chip v-for="value in item.threat_actor_types" :text="value" class="mr-1" size="small"></v-chip>
      </template>
      <template v-slot:item.kill_chain_phases="{ item }">
        <v-chip v-for="value in item.kill_chain_phases" :text="value" class="mr-1" size="small">
          {{ value.split(":")[1] }}
        </v-chip>
      </template>
      <template v-slot:item.target_systems="{ item }">
        <v-chip v-for="value in item.target_systems" :text="value" class="mr-1" size="small"></v-chip>
      </template>
      <template v-slot:item.parent_ids="{ item }">
        <v-chip v-for="value in item.parent_ids" :text="value" class="mr-1" size="small"></v-chip>
      </template>
      <template v-slot:item.created="{ item }">
        {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss") }}
      </template>
      <template v-slot:item.modified="{ item }">
        {{ moment(item.modified).format("YYYY-MM-DD HH:mm:ss") }}
      </template>
      <template v-slot:item.last_seen="{ item }">
        {{ moment(item.last_seen).format("YYYY-MM-DD HH:mm:ss") }}
      </template>
      <template v-slot:item.first_seen="{ item }">
        {{ moment(item.first_seen).format("YYYY-MM-DD HH:mm:ss") }}
      </template>
    </v-data-table-server>
  </v-sheet>
</template>

<script setup lang="ts">
import moment from "moment";
import { ref } from "vue";

import * as objectsApi from "@/services/objects";
import type { LooseYetiObject } from "@/services/types";

const props = withDefaults(
  defineProps<{
    searchQuery?: string;
    /** The endpoint segment to search: "entities" | "indicators" | "dfiq" | ... */
    searchType?: string;
    searchSubtype?: string;
    headers?: Array<Record<string, unknown>>;
    /** [alias, fieldType] pairs the backend widens the search with. */
    filterAliases?: Array<[string, string]>;
    checkable?: boolean;
  }>(),
  {
    searchQuery: "",
    searchType: "entity",
    searchSubtype: "",
    headers: () => [
      { title: "Name", key: "name" },
      { title: "Tags", key: "tags" },
      { title: "Created on", key: "created", width: "200px" }
    ],
    filterAliases: () => [],
    checkable: false
  }
);

const emit = defineEmits<{ totalUpdated: [total: number] }>();

interface SortItem {
  key: string;
  order?: boolean | "asc" | "desc";
}
interface TableOptions {
  page: number;
  itemsPerPage: number;
  sortBy: SortItem[];
}

const items = ref<LooseYetiObject[]>([]);
const page = ref(1);
const perPage = ref(20);
const total = ref(0);
const loading = ref(true);
const sortBy = ref<SortItem[]>([{ key: "name", order: "asc" }]);

/**
 * Turns the free-text search box into a query object.
 * `key=a,b` becomes a list; a bare or quoted term searches `defaultKey`.
 */
function extractParamsFromSearchQuery(searchTerm: string, defaultKey: string): Record<string, string | string[]> {
  const pattern =
    /(?<key>\w+[<>~]?)=(?<keyed_terms>[^\s,]+(?:,[^\s,]+)*)|(?<isolated_term>[^"\s]+)|"(?<quoted_term>[^"]+)"/g;
  const result: Record<string, string | string[]> = {};
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(searchTerm)) !== null) {
    const groups = match.groups ?? {};
    const { key, keyed_terms: keyedTerms, isolated_term: isolatedTerm, quoted_term: quotedTerm } = groups;

    if (key && keyedTerms) {
      const isList = key.startsWith("in__") || key.endsWith("__in") || key === "tags" || keyedTerms.includes(",");
      result[key] = isList ? keyedTerms.split(",").map(term => term.trim()) : keyedTerms;
    }
    if (isolatedTerm) {
      result[defaultKey] = isolatedTerm;
    }
    if (quotedTerm) {
      result[defaultKey] = quotedTerm;
    }
  }
  return result;
}

async function loadObjects({ page: requestedPage, itemsPerPage, sortBy: requestedSort }: TableOptions) {
  loading.value = true;
  const request: Record<string, unknown> = {
    page: requestedPage - 1,
    count: itemsPerPage === -1 ? 0 : itemsPerPage,
    query: extractParamsFromSearchQuery(props.searchQuery, "name"),
    filter_aliases: props.filterAliases,
    sorting: requestedSort.map(sort => [sort.key, sort.order === "asc"])
  };
  if (props.searchSubtype !== "") {
    request.type = props.searchSubtype;
  }

  try {
    const response = await objectsApi.searchByEndpoint(props.searchType, request);
    items.value = response.items;
    if (response.total !== total.value) {
      total.value = response.total;
      emit("totalUpdated", total.value);
    }
  } finally {
    loading.value = false;
  }
}
</script>


<style>
.short-links {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  display: block;
}

.fixed-table {
  table-layout: fixed;
}
</style>
