<template>
  <v-card variant="outlined">
    <v-card-title><h2 class="text-h6">Cluster discovery</h2></v-card-title>
    <v-card-text>
      <p class="text-body-2 mb-3">Clusters suggest structure in the loaded graph; they are not analytical conclusions.</p>
      <v-list v-if="clusters.length" density="compact" aria-label="Detected graph clusters">
        <v-list-item v-for="cluster in clusters" :key="cluster.id">
          <v-list-item-title>{{ cluster.label }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ cluster.memberIds.length }} objects · dominant type {{ cluster.dominantType }}
          </v-list-item-subtitle>
          <details class="mt-1">
            <summary>Members</summary>
            <ul class="pl-5">
              <li v-for="memberId in cluster.memberIds" :key="memberId">{{ nodeLabel(memberId) }} · {{ memberId }}</li>
            </ul>
          </details>
          <template #append>
            <v-btn
              size="small"
              variant="text"
              :disabled="cluster.memberIds.length < 2"
              :aria-label="`${collapsed.has(cluster.id) ? 'Expand' : 'Collapse'} ${cluster.label}`"
              @click="emit('toggle', cluster.id)"
            >
              {{ collapsed.has(cluster.id) ? "Expand" : "Collapse" }}
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
      <p v-else class="text-body-2" role="status">Clusters will appear when the loaded graph has enough connected objects.</p>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { GraphCluster } from "@/composables/useGraphClusters";
import type { GraphExploreNode } from "@/services/types";

const props = defineProps<{ clusters: GraphCluster[]; collapsed: Set<string>; nodes: GraphExploreNode[] }>();
const emit = defineEmits<{ toggle: [id: string] }>();

function nodeLabel(id: string) {
  return props.nodes.find(node => node.id === id)?.label ?? id;
}
</script>
