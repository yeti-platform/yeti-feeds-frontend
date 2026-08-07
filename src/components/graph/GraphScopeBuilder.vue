<template>
  <v-card variant="outlined" class="scope-builder">
    <v-card-title>Starting scope</v-card-title>
    <v-card-text>
      <v-tabs v-model="mode" density="compact" aria-label="Graph starting scope">
        <v-tab value="items">Objects</v-tab>
        <v-tab value="query">Broad scope</v-tab>
      </v-tabs>

      <v-window v-model="mode" class="pt-4">
        <v-window-item value="items">
          <v-textarea
            v-model="itemIds"
            label="Yeti object IDs"
            hint="One observables/…, entities/…, indicators/…, or dfiq/… ID per line"
            persistent-hint
            rows="4"
            auto-grow
          />
          <p v-if="itemError" class="text-error text-body-2 mt-2" role="alert">{{ itemError }}</p>
          <v-btn class="mt-3" color="primary" :loading="loading" @click="submitItems">Explore objects</v-btn>
        </v-window-item>

        <v-window-item value="query">
          <v-row dense>
            <v-col cols="12">
              <v-text-field v-model="tags" label="Tags" hint="Comma-separated" persistent-hint />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="rootType"
                label="Object family"
                clearable
                :items="['observable', 'entity', 'indicator', 'dfiq']"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="objectType" label="Concrete object type" placeholder="hostname" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="modifiedFrom" label="Modified from" type="date" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="modifiedTo" label="Modified to" type="date" />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="additionalCriteria"
                label="Additional saved-search criteria (JSON)"
                hint='For example: {"name":"apt"}'
                persistent-hint
                rows="2"
              />
            </v-col>
          </v-row>
          <p v-if="queryError" class="text-error text-body-2 mt-2" role="alert">{{ queryError }}</p>
          <v-btn class="mt-3" color="primary" :loading="loading" @click="submitQuery">Explore broad scope</v-btn>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { itemScope } from "@/composables/useGraphWorkspace";
import type { GraphScope } from "@/composables/useGraphWorkspace";

defineProps<{ loading: boolean }>();
const emit = defineEmits<{ submit: [scope: GraphScope] }>();

const mode = ref<"items" | "query">("items");
const itemIds = ref("");
const itemError = ref("");
const tags = ref("");
const rootType = ref<string | null>(null);
const objectType = ref("");
const modifiedFrom = ref("");
const modifiedTo = ref("");
const additionalCriteria = ref("");
const queryError = ref("");

function submitItems() {
  const scope = itemScope(itemIds.value.split(/[\n,]/));
  if (scope.items.length === 0) {
    itemError.value = "Enter at least one Yeti object ID.";
    return;
  }
  itemError.value = "";
  itemIds.value = scope.items.join("\n");
  emit("submit", scope);
}

function submitQuery() {
  queryError.value = "";
  let query: Record<string, string | number | (string | number)[]> = {};
  if (additionalCriteria.value.trim()) {
    try {
      const parsed = JSON.parse(additionalCriteria.value) as unknown;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error();
      query = parsed as Record<string, string | number | (string | number)[]>;
    } catch {
      queryError.value = "Additional criteria must be a JSON object.";
      return;
    }
  }
  const selectedTags = tags.value.split(",").map(tag => tag.trim()).filter(Boolean);
  if (selectedTags.length) query.tags = selectedTags;
  if (rootType.value) query.root_type = rootType.value;
  if (objectType.value.trim()) query.type = objectType.value.trim();
  if (modifiedFrom.value) query.modified__gte = modifiedFrom.value;
  if (modifiedTo.value) query.modified__lte = modifiedTo.value;
  emit("submit", { kind: "query", query, sorting: [], filter_aliases: [] });
}
</script>

<style scoped>
.scope-builder {
  min-width: 0;
}
</style>
