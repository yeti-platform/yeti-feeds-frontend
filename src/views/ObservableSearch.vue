<template>
  <v-sheet class="ma-5" width="100%">
    <v-data-table-server
      v-model:page="page"
      :itemsLength="total"
      :items-per-page="perPage"
      :headers="headers"
      density="compact"
      :items="items"
      @update:options="loadObjects"
      :show-select="showSelect"
      :item-value="(item: Observable) => item.id"
      :items-per-page-options="[
        { value: 10, title: '10' },
        { value: 25, title: '25' },
        { value: 50, title: '50' },
        { value: 100, title: '100' }
      ]"
      :sort-by="sortBy"
      v-model="selectedObservables"
      hover
      :loading="loading"
      loading-text="Loading data..."
      class="fixed-table"
    >
      <template v-slot:item.value="{ item }">
        <span class="short-links">
          <v-tooltip activator="parent" location="top" :open-delay="200">{{ item.value }}</v-tooltip>
          <router-link :to="{ name: 'ObservableDetails', params: { id: item.id } }">{{ item.value }}</router-link>
        </span>
      </template>
      <template v-slot:item.tags="{ item }">
        <v-chip
          v-for="tag in item.tags"
          :key="tag.name"
          :color="tag.fresh ? 'blue ' : 'red'"
          :text="tag.name"
          class="mx-1"
          label
          size="small"
        ></v-chip>
      </template>
      <template v-slot:item.context="{ item }">
        <v-chip label color="green" size="small" class="mx-1" v-for="source in contextSources(item)" :key="source">
          {{ source }}
        </v-chip>
      </template>
      <template v-slot:item.created="{ item }"> {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss") }} </template>
    </v-data-table-server>
  </v-sheet>
  <v-navigation-drawer permament location="right" width="400" ref="drawer">
    <v-list-item class="mt-4">
      <v-text-field
        v-model="searchQuery"
        prepend-inner-icon="mdi-magnify"
        label="Search observables ↵"
        density="compact"
        class="mt-2"
        @click:prepend-inner="searchFromDrawer"
        @keyup.enter="searchFromDrawer"
      />
    </v-list-item>
    <v-list-item class="mb-4">
      <v-btn prepend-icon="mdi-plus">
        New Observable
        <v-menu activator="parent">
          <v-list>
            <v-dialog v-for="typeDef in observableTypes" :key="typeDef.type" :width="editWidth" :fullscreen="fullScreenEdit">
              <template v-slot:activator="{ props }">
                <v-list-item v-bind="props"> {{ typeDef.name }} </v-list-item>
              </template>
              <template v-slot:default="{ isActive }">
                <new-object
                  :object-type="typeDef.type"
                  @close="isActive.value = false"
                  @toggle-fullscreen="toggleNewObjectFullscreen"
                />
              </template>
            </v-dialog>
          </v-list>
        </v-menu>
      </v-btn>
    </v-list-item>
    <v-divider></v-divider>
    <v-expansion-panels>
      <v-expansion-panel title="Bulk actions" @group:selected="showSelect = $event.value">
        <v-expansion-panel-text>
          <v-card title="Bulk tag" class="pb-4" rounded="0" variant="flat">
            <v-combobox v-model="bulkTags" chips clearable multiple density="compact">
              <template v-slot:chip="tag"> <v-chip :text="tag.item.value" label /></template>
            </v-combobox>
            <v-btn density="compact" variant="tonal" color="primary" class="me-2" @click="changeTags">Apply</v-btn>
            <small>Will apply {{ bulkTags.length }} tags to {{ selectedObservables.length }} observables</small>
          </v-card>
          <v-card title="Export observables" class="pb-4" rounded="0" variant="flat">
            <v-autocomplete
              label="Select template"
              density="compact"
              :items="exportTemplates"
              item-title="name"
              item-value="id"
              v-model="selectedExportTemplate"
            ></v-autocomplete>
            <v-btn density="compact" variant="tonal" color="primary" class="me-2" @click="downloadExport">Export</v-btn>
            <small>Will export {{ selectedObservables.length || total }} observables</small>
          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import moment from "moment";
import { onMounted, ref } from "vue";

import NewObject from "@/components/NewObject.vue";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions";
import * as observablesApi from "@/services/observables";
import * as templatesApi from "@/services/templates";
import type { Observable, ObservableSearchRequest, Template } from "@/services/types";

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

const observableTypes = OBSERVABLE_TYPES;
const headers = [
  { title: "Created on", key: "created", width: "200px", sortable: true },
  { title: "Value", key: "value", sortable: true },
  { title: "Tags", key: "tags", width: "300px", sortable: false },
  { title: "Context", key: "context", width: "300px", sortable: false }
];

const items = ref<Observable[]>([]);
const total = ref(0);
const page = ref(1);
const perPage = ref(25);
const loading = ref(false);
const searchQuery = ref("");
const showSelect = ref(false);
const selectedObservables = ref<string[]>([]);
const bulkTags = ref<string[]>([]);
const exportTemplates = ref<Template[]>([]);
const selectedExportTemplate = ref<string | null>(null);
const fullScreenEdit = ref(false);
const editWidth = ref("50%");
const sortBy = ref<SortItem[]>([{ key: "created", order: "desc" }]);

/** The distinct context sources on an observable, for the chips column. */
function contextSources(observable: Observable): string[] {
  const sources = observable.context.map(entry => String((entry as Record<string, unknown>).source));
  return [...new Set(sources)];
}

/**
 * Turns the free-text search box into a query object.
 * `key=a,b` becomes a list; a bare or quoted term searches `defaultKey`.
 */
function extractParamsFromSearchQuery(searchTerm: string, defaultKey: string): ObservableSearchRequest["query"] {
  const pattern = /(?<key>\w+)=(?<keyed_terms>[^\s,]+(?:,[^\s,]+)*)|(?<isolated_term>[^"\s]+)|"(?<quoted_term>[^"]+)"/g;
  const result: ObservableSearchRequest["query"] = {};
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
  try {
    const response = await observablesApi.search({
      page: requestedPage - 1,
      count: itemsPerPage,
      query: extractParamsFromSearchQuery(searchQuery.value, "value"),
      sorting: requestedSort.map(sort => [sort.key, sort.order === "asc"])
    });
    items.value = response.observables;
    total.value = response.total;
  } finally {
    // Errors already surfaced by the http interceptor's snackbar.
    loading.value = false;
  }
}

function searchFromDrawer() {
  loadObjects({ page: 1, itemsPerPage: perPage.value, sortBy: sortBy.value });
}

async function loadExportTemplates() {
  const response = await templatesApi.search({ name: "" });
  exportTemplates.value = response.templates;
}

async function changeTags() {
  await observablesApi.tag({
    tags: bulkTags.value,
    ids: selectedObservables.value,
    strict: false
  });
  bulkTags.value = [];
  await loadObjects({ page: page.value, itemsPerPage: perPage.value, sortBy: [] });
}

async function downloadExport() {
  const useSelection = selectedObservables.value.length > 0;
  const response = await templatesApi.render({
    template_id: selectedExportTemplate.value,
    observable_ids: useSelection ? selectedObservables.value : [],
    search_query: useSelection ? "" : searchQuery.value
  });

  const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
  const fileName = String(response.headers["content-disposition"]).split("filename=")[1];
  const fileLink = document.createElement("a");
  fileLink.href = fileUrl;
  fileLink.setAttribute("download", fileName);
  document.body.appendChild(fileLink);
  fileLink.click();
}

function toggleNewObjectFullscreen(fullscreen: boolean) {
  fullScreenEdit.value = !fullScreenEdit.value;
  editWidth.value = fullscreen ? "100%" : "50%";
}

onMounted(loadExportTemplates);
</script>

<style>
.short-links {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  display: block;
}

.fixed-table table {
  table-layout: fixed;
}
</style>
