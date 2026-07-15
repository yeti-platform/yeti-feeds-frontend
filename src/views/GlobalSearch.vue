<template>
  <v-container fluid class="mx-10 mt-3">
    <v-row>
      <v-col>
        <v-text-field
          prepend-inner-icon="mdi-magnify"
          v-model="textSearch"
          label="Search for anything..."
          @keyup.enter="searchNow"
        />
        <v-progress-linear v-show="loading" class="mt-3" color="primary" indeterminate></v-progress-linear>
      </v-col>
    </v-row>

    <v-row v-if="searchResults && textSearch">
      <v-col>
        <v-row class="mb-4">
          <v-data-table-server
            :items="searchResults"
            density="compact"
            :headers="[
              { title: 'Name', key: 'name' },
              { title: 'Type', key: 'type' },
              { title: 'Tags', key: 'tags' },
              { title: 'Created on', key: 'created', width: '200px' }
            ]"
            :search="textSearch"
            @update:options="loadObjectDebounced"
            v-model:page="page"
            :items-per-page="perPage"
            :itemsLength="total"
            :loading="loading"
            :sort-by="sortBy"
          >
            <template v-slot:item.name="{ item }">
              <router-link :to="`${endpointFor(item.root_type)}/${item.id}`">{{ item.name || item.value }}</router-link>
            </template>

            <template v-slot:item.type="{ item }">
              <v-icon :icon="getIconForType(item.type)" class="mr-2"></v-icon>
              {{ item.type }}
            </template>

            <template v-slot:item.tags="{ item }">
              <v-chip v-for="tag in item.tags" :text="tag.name" class="mr-1" size="small"></v-chip>
            </template>
            <template v-slot:item.created="{ item }">
              {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss") }}
            </template>
          </v-data-table-server>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import _ from "lodash";
import moment from "moment";
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions";
import { ENDPOINTS } from "@/services/objects";
import * as searchApi from "@/services/search";
import type { LooseYetiObject, RootType } from "@/services/types";

/** Vuetify's v-data-table-server emits these on @update:options. */
interface SortItem {
  key: string;
  order?: boolean | "asc" | "desc";
}
interface TableOptions {
  page: number;
  itemsPerPage: number;
  sortBy: SortItem[];
}

const route = useRoute();
const router = useRouter();

/** Maps a result's root_type to its details-route endpoint segment. */
function endpointFor(rootType: string): string {
  return ENDPOINTS[rootType as RootType] ?? "";
}

const textSearch = ref(typeof route.query.q === "string" ? route.query.q : "");
const searchResults = ref<LooseYetiObject[] | null>(null);
const loading = ref(false);
const page = ref(1);
const perPage = ref(50);
const sortBy = ref<SortItem[]>([{ key: "name", order: "asc" }]);
const total = ref(1000);

async function loadObjects({ page: requestedPage, itemsPerPage, sortBy: requestedSort }: TableOptions) {
  loading.value = true;
  try {
    const response = await searchApi.search({
      query: { name: textSearch.value },
      filter_aliases: [
        ["value", "text"],
        ["tags", ""],
        ["dfiq_tags", "list"]
      ],
      page: requestedPage - 1,
      count: itemsPerPage,
      sorting: requestedSort.map(sort => [sort.key, sort.order === "asc"])
    });
    searchResults.value = response.results;
    total.value = response.total;
  } finally {
    // Errors already surfaced by the http interceptor's snackbar.
    loading.value = false;
  }
}

const loadObjectDebounced = _.debounce((options: TableOptions) => {
  loadObjects(options);
}, 200);

function searchNow() {
  loadObjects({ page: page.value, itemsPerPage: perPage.value, sortBy: sortBy.value });
}

function getIconForType(type: string): string {
  return (
    ENTITY_TYPES.find(t => t.type === type)?.icon ||
    OBSERVABLE_TYPES.find(t => t.type === type)?.icon ||
    INDICATOR_TYPES.find(t => t.type === type)?.icon ||
    DFIQ_TYPES.find(t => t.type === type)?.icon ||
    "mdi-help-circle"
  );
}

onMounted(() => {
  searchNow();
});

watch(textSearch, () => {
  router.replace({ query: { q: textSearch.value } });
});
</script>
