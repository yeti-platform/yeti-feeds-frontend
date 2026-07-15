<template>
  <v-container fluid>
    <v-data-table-server
      :items="tags"
      :items-length="totalTags"
      :headers="tagHeaders"
      :items-per-page="perPage"
      :page="page"
      density="compact"
      :search="tagFilterDebounced"
      @update:options="searchTags"
      :loading="loading"
      loading-text="Loading tags..."
    >
      <template v-slot:item.name="{ item }">
        <v-chip color="primary" @click="selectTag(item)" density="compact">{{ item.name }}</v-chip>
      </template>
      <template v-slot:item.default_expiration="{ item }">
        {{ expirationInDays(item.default_expiration) }}
      </template>
      <template v-slot:item.produces="{ item }">
        <v-chip class="me-2" density="compact" v-for="tag in item.produces" :key="tag">{{ tag }}</v-chip>
      </template>
      <template v-slot:item.replaces="{ item }">
        <v-chip class="me-2" density="compact" v-for="tag in item.replaces" :key="tag">{{ tag }}</v-chip>
      </template>
      <template v-slot:item.created="{ item }">
        {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss") }}
      </template>
    </v-data-table-server>

    <v-navigation-drawer permanent location="right" width="400">
      <v-list-item class="mt-5">
        <v-text-field v-model="tagFilter" prepend-inner-icon="mdi-magnify" label="Filter tags" density="compact" />
      </v-list-item>
      <v-divider class="mb-5" />
      <v-form>
        <v-list-item>
          <v-list-item-title class="text-h5 pb-2">Edit tag</v-list-item-title>
          <v-list-item-subtitle v-if="!selectedTag">Click on a tag's name to edit it.</v-list-item-subtitle>
        </v-list-item>
        <v-list-item v-if="selectedTag">
          <v-text-field v-model="selectedTag.name" label="Name" density="compact" class="pt-2" />
          <v-text-field v-model="selectedTag.description" label="Description" density="compact" class="pt-2" />
          <v-text-field
            v-model.number="selectedTagDefaultExpiration"
            type="number"
            label="Default expiration (days)"
            density="compact"
          />
          <v-combobox
            v-model="selectedTag.produces"
            label="Produces"
            :hint="`Extra tags that will be added to objects tagged with ${selectedTag.name}`"
            :delimiters="[',', ' ', ';']"
            density="compact"
            multiple
            chips
          />
          <v-combobox
            v-model="selectedTag.replaces"
            label="Replaces"
            :hint="`Objects tagged with these will be replaced by ${selectedTag.name}`"
            :delimiters="[',', ' ', ';']"
            density="compact"
            multiple
            chips
          />
          <v-btn variant="tonal" color="primary" class="me-2" @click="updateTag" :disabled="!selectedTag.name">
            Update
          </v-btn>
          <v-btn variant="text" color="cancel" @click="selectedTag = null">Cancel</v-btn>
        </v-list-item>
      </v-form>
      <v-divider class="my-5" />
      <v-form>
        <v-list-item>
          <v-list-item-title class="text-h5 pb-2 mb-3">Merge tags</v-list-item-title>
          <v-combobox
            v-model="mergeSource"
            label="Sources"
            :delimiters="[',', ' ', ';']"
            density="compact"
            chips
            multiple
            :items="tags.map(tag => tag.name)"
          />
          <v-combobox
            v-model="mergeTarget"
            label="Merge target"
            :delimiters="[',', ' ', ';']"
            density="compact"
            chips
            :items="tags.map(tag => tag.name).filter(name => !mergeSource.includes(name))"
          />
          <div class="d-flex">
            <v-checkbox-btn label="Make merge permanent" v-model="permanentMerge"></v-checkbox-btn>
            <v-btn variant="tonal" class="me-2" @click="mergeTags" :disabled="!mergeTarget || !mergeSource.length">
              Merge
            </v-btn>
          </div>
          <v-list-item-subtitle class="mt-5">
            Merge tags into another tag. All objects tagged with the source tags will be tagged with the target tag.
            <br /><br />
            If merge is permanent, the source tags will be deleted and any further tagging with source tags will be
            replaced with the target tag.
          </v-list-item-subtitle>
        </v-list-item>
      </v-form>
    </v-navigation-drawer>
  </v-container>
</template>

<script setup lang="ts">
import _ from "lodash";
import moment from "moment";
import { ref, watch } from "vue";

import { eventBus } from "@/plugins/eventbus";
import * as tagsApi from "@/services/tags";
import type { Tag } from "@/services/types";

/** Vuetify's v-data-table-server hands its state to @update:options. */
interface DataTableOptions {
  page: number;
  itemsPerPage: number;
}

const tagHeaders = [
  { title: "Name", key: "name" },
  { title: "Description", key: "description" },
  { title: "Default expiration (days)", key: "default_expiration" },
  { title: "Produces", key: "produces" },
  { title: "Replaces", key: "replaces" },
  { title: "Created (UTC)", key: "created" }
];

const tags = ref<Tag[]>([]);
const totalTags = ref(0);
const perPage = ref(50);
const page = ref(1);
const loading = ref(false);
const tagFilter = ref("");
const tagFilterDebounced = ref("");

// An editable copy of the clicked tag, plus its expiration expressed in days for
// the number field. Editing a clone keeps the table row untouched until save.
const selectedTag = ref<Tag | null>(null);
const selectedTagDefaultExpiration = ref<number | null>(null);

const mergeSource = ref<string[]>([]);
const mergeTarget = ref<string | null>(null);
const permanentMerge = ref(false);

/** Duration strings come back ISO 8601 ("P90D"); show them as a day count. */
function expirationInDays(duration: string): number {
  return moment.duration(duration).asDays();
}

async function searchTags(options: DataTableOptions) {
  page.value = options.page;
  perPage.value = options.itemsPerPage;
  loading.value = true;
  try {
    const response = await tagsApi.search({
      name: tagFilter.value,
      count: options.itemsPerPage,
      page: options.page - 1,
      produces: [],
      replaces: []
    });
    tags.value = response.tags;
    totalTags.value = response.total;
  } finally {
    loading.value = false;
  }
}

function refresh() {
  searchTags({ page: page.value, itemsPerPage: perPage.value });
}

function selectTag(tag: Tag) {
  selectedTag.value = { ...tag };
  selectedTagDefaultExpiration.value = expirationInDays(tag.default_expiration);
}

async function updateTag() {
  if (!selectedTag.value) {
    return;
  }
  await tagsApi.update(selectedTag.value.id, {
    name: selectedTag.value.name,
    description: selectedTag.value.description,
    produces: selectedTag.value.produces,
    replaces: selectedTag.value.replaces,
    default_expiration: moment.duration(selectedTagDefaultExpiration.value ?? 0, "days").toISOString()
  });
  eventBus.emit("displayMessage", {
    message: `Tag ${selectedTag.value.name} successfully updated`,
    status: "success"
  });
  selectedTag.value = null;
  refresh();
}

async function mergeTags() {
  if (!mergeTarget.value || mergeSource.value.length === 0) {
    return;
  }
  const result = await tagsApi.merge({
    merge: mergeSource.value,
    merge_into: mergeTarget.value,
    permanent: permanentMerge.value
  });
  eventBus.emit("displayMessage", {
    message: `${result.merged} tag(s) merged into ${result.into.name}`,
    status: "success"
  });
  mergeSource.value = [];
  mergeTarget.value = null;
  refresh();
}

watch(
  tagFilter,
  _.debounce(() => {
    tagFilterDebounced.value = tagFilter.value;
  }, 200)
);
</script>
