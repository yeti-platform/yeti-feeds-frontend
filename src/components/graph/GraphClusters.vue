<template>
  <v-card variant="outlined">
    <v-card-title><h2 class="text-h6">Cluster discovery</h2></v-card-title>
    <v-card-text>
      <p class="text-body-2 mb-3">Clusters suggest structure in the loaded graph; they are not analytical conclusions.</p>
      <v-list v-if="clusters.length" density="compact" aria-label="Detected graph clusters">
        <v-list-item v-for="cluster in visibleClusters" :key="cluster.id">
          <v-list-item-title>{{ cluster.label }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ cluster.memberIds.length }} objects · dominant object {{ cluster.dominantObjectType }} · dominant relationship
            {{ cluster.dominantRelationshipType }}
          </v-list-item-subtitle>
          <details class="mt-1">
            <summary>Members</summary>
            <ul class="pl-5">
              <li v-for="memberId in visibleMembers(cluster)" :key="memberId">{{ nodeLabel(memberId) }} · {{ memberId }}</li>
            </ul>
            <div v-if="memberPages(cluster) > 1" class="d-flex align-center ga-2">
              <v-btn
                size="x-small"
                variant="text"
                :disabled="memberPage(cluster) === 1"
                @click="changeMemberPage(cluster, -1)"
              >
                Previous members
              </v-btn>
              <span class="text-caption">Member page {{ memberPage(cluster) }} of {{ memberPages(cluster) }}</span>
              <v-btn
                size="x-small"
                variant="text"
                :disabled="memberPage(cluster) === memberPages(cluster)"
                @click="changeMemberPage(cluster, 1)"
              >
                Next members
              </v-btn>
            </div>
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
      <div v-if="clusterPages > 1" class="d-flex align-center ga-2" role="navigation" aria-label="Cluster pages">
        <v-btn size="x-small" variant="text" :disabled="clusterPage === 1" @click="clusterPage -= 1">
          Previous clusters
        </v-btn>
        <span class="text-caption">Cluster page {{ clusterPage }} of {{ clusterPages }}</span>
        <v-btn size="x-small" variant="text" :disabled="clusterPage === clusterPages" @click="clusterPage += 1">
          Next clusters
        </v-btn>
      </div>
      <p v-else class="text-body-2" role="status">Clusters will appear when the loaded graph has enough connected objects.</p>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import type { GraphCluster } from "@/composables/useGraphClusters";
import type { GraphExploreNode } from "@/services/types";

const props = defineProps<{ clusters: GraphCluster[]; collapsed: Set<string>; nodes: GraphExploreNode[] }>();
const emit = defineEmits<{ toggle: [id: string] }>();

const PAGE_SIZE = 100;
const CLUSTER_PAGE_SIZE = 25;
const clusterPage = ref(1);
const memberPageByCluster = ref<Record<string, number>>({});
const clusterPages = computed(() => Math.max(1, Math.ceil(props.clusters.length / CLUSTER_PAGE_SIZE)));
const visibleClusters = computed(() => {
  const start = (clusterPage.value - 1) * CLUSTER_PAGE_SIZE;
  return props.clusters.slice(start, start + CLUSTER_PAGE_SIZE);
});

watch(
  () => props.clusters,
  () => {
    clusterPage.value = Math.min(clusterPage.value, clusterPages.value);
    memberPageByCluster.value = {};
  }
);

function memberPage(cluster: GraphCluster) {
  return memberPageByCluster.value[cluster.id] ?? 1;
}

function memberPages(cluster: GraphCluster) {
  return Math.max(1, Math.ceil(cluster.memberIds.length / PAGE_SIZE));
}

function visibleMembers(cluster: GraphCluster) {
  const start = (memberPage(cluster) - 1) * PAGE_SIZE;
  return cluster.memberIds.slice(start, start + PAGE_SIZE);
}

function changeMemberPage(cluster: GraphCluster, change: number) {
  const page = Math.min(memberPages(cluster), Math.max(1, memberPage(cluster) + change));
  memberPageByCluster.value = { ...memberPageByCluster.value, [cluster.id]: page };
}

function nodeLabel(id: string) {
  return props.nodes.find(node => node.id === id)?.label ?? id;
}
</script>
