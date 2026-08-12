<template>
  <v-container fluid class="mx-10 mt-3">
    <v-row>
      <v-col>
        <v-text-field prepend-inner-icon="mdi-magnify" v-model="textSearch" label="Search for anything..." />
        <v-progress-linear v-show="loading" class="mt-3" color="primary" indeterminate></v-progress-linear>
      </v-col>
    </v-row>

    <template v-if="sections && textSearch">
      <v-row v-for="section in sections" :key="section.type" class="mb-2">
        <v-col>
          <v-card v-if="section.results.length" class="ma-2" variant="flat">
            <v-card-title class="d-flex align-center">
              {{ labelFor(section.type) }}
              <v-chip class="ml-2" size="small" :text="String(section.total)"></v-chip>
            </v-card-title>
            <v-data-table
              :items="section.results"
              density="compact"
              hide-default-footer
              :headers="[
                { title: 'Name', key: 'name' },
                { title: 'Type', key: 'type' },
                { title: 'Tags', key: 'tags' },
                { title: 'Created on', key: 'created', width: '200px' }
              ]"
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
            </v-data-table>
            <v-card-actions v-if="section.total > section.results.length">
              <v-spacer></v-spacer>
              <v-btn variant="text" :to="routeFor(section.type)" size="small">
                See all {{ section.total }} in {{ labelFor(section.type) }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="!hasAnyResults">
        <v-col>
          <v-alert type="info" variant="tonal">No results for "{{ textSearch }}".</v-alert>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import _ from "lodash";
import moment from "moment";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions";
import { ENDPOINTS } from "@/services/objects";
import * as searchApi from "@/services/search";
import type { RootType, SearchResultSection } from "@/services/types";

const SECTION_LABELS: Record<string, string> = {
  entity: "Entities",
  indicator: "Indicators",
  dfiq: "DFIQ",
  observable: "Observables"
};

const route = useRoute();
const router = useRouter();

/** Maps a result's root_type to its details-route endpoint segment. */
function endpointFor(rootType: string): string {
  return ENDPOINTS[rootType as RootType] ?? "";
}

function routeFor(sectionType: string): string {
  return endpointFor(sectionType) || "/";
}

function labelFor(sectionType: string): string {
  return SECTION_LABELS[sectionType] ?? sectionType;
}

const textSearch = ref(typeof route.query.q === "string" ? route.query.q : "");
const sections = ref<SearchResultSection[] | null>(null);
const loading = ref(false);
const countPerType = ref(5);

const hasAnyResults = computed(() => (sections.value ?? []).some(section => section.results.length > 0));

async function loadObjects() {
  const term = textSearch.value;
  if (!term) {
    sections.value = null;
    return;
  }
  loading.value = true;
  try {
    const response = await searchApi.search({ query: term, count_per_type: countPerType.value });
    // Discard results for a term that's no longer current -- guards against
    // a slower earlier response arriving after a faster later one.
    if (term === textSearch.value) {
      sections.value = response.sections;
    }
  } finally {
    if (term === textSearch.value) {
      loading.value = false;
    }
  }
}

const loadObjectsDebounced = _.debounce(loadObjects, 300);

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
  if (textSearch.value) {
    loadObjects();
  }
});

watch(textSearch, () => {
  router.replace({ query: { q: textSearch.value } });
  loadObjectsDebounced();
});
</script>
