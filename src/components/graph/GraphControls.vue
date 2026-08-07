<template>
  <v-card variant="outlined">
    <v-card-title>Investigation controls</v-card-title>
    <v-card-text>
      <v-row density="comfortable">
        <v-col cols="12" sm="6" lg="3">
          <v-text-field
            :model-value="objectTypeFilter"
            label="Object type filter"
            clearable
            @update:model-value="emit('update:objectTypeFilter', $event ?? '')"
          />
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-text-field
            :model-value="relationshipTypeFilter"
            label="Relationship type filter"
            clearable
            @update:model-value="emit('update:relationshipTypeFilter', $event ?? '')"
          />
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-select
            :model-value="direction"
            label="Traversal direction"
            :items="['any', 'inbound', 'outbound']"
            @update:model-value="emit('update:direction', $event)"
          />
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-text-field
            :model-value="search"
            label="Search loaded graph"
            clearable
            @update:model-value="emit('update:search', $event ?? '')"
          />
        </v-col>
      </v-row>
      <div class="d-flex flex-wrap align-center ga-2">
        <v-btn size="small" :disabled="!searchResultLabel" @click="emit('focusSearchResult')">Focus search result</v-btn>
        <v-btn size="small" @click="emit('fit')">Fit graph</v-btn>
        <v-btn size="small" :disabled="!selectedNodeId" @click="emit('togglePin')">Pin selected object</v-btn>
        <v-btn size="small" variant="text" @click="emit('reset')">Reset investigation</v-btn>
        <span v-if="searchResultLabel" role="status">Focused object: {{ searchResultLabel }}</span>
        <v-spacer />
        <span>{{ visibleEdgeCount }} visible relationships</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { GraphExploreRequest } from "@/services/types";

defineProps<{
  objectTypeFilter: string;
  relationshipTypeFilter: string;
  direction: GraphExploreRequest["direction"];
  search: string;
  searchResultLabel: string;
  selectedNodeId: string | null;
  visibleEdgeCount: number;
}>();

const emit = defineEmits<{
  "update:objectTypeFilter": [value: string];
  "update:relationshipTypeFilter": [value: string];
  "update:direction": [value: GraphExploreRequest["direction"]];
  "update:search": [value: string];
  focusSearchResult: [];
  fit: [];
  togglePin: [];
  reset: [];
}>();
</script>
