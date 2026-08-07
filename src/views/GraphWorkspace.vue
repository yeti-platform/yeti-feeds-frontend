<template>
  <v-container fluid class="graph-workspace pa-4">
    <h1 class="text-h4 mb-2">Graph investigation</h1>

    <template v-if="showRendererSpike">
      <p class="text-body-2 mb-3">2,000 nodes · 10,000 directed edges</p>
      <span class="d-none" data-testid="renderer-fixture-bytes">{{ rendererFixtureBytes }}</span>
      <div class="d-flex flex-wrap ga-2 mb-3">
        <v-btn size="small" @click="selectEdge('spike-edge-1')">Select parallel relationship spike-edge-1</v-btn>
        <v-btn size="small" @click="selectEdge('spike-edge-2')">Select parallel relationship spike-edge-2</v-btn>
        <v-btn size="small" @click="measureInteraction(() => canvas?.focusNode('spike-node-0'))">
          Focus sample node
        </v-btn>
        <v-btn size="small" @click="toggleEdges">Toggle relationship visibility</v-btn>
      </div>
      <p class="text-body-2" role="status">
        <span v-if="selectedEdgeId">Selected relationship: {{ selectedEdgeId }}. </span>
        Last renderer interaction: {{ lastInteractionMs }} ms
      </p>
      <graph-canvas
        ref="canvas"
        :nodes="rendererFixture.nodes"
        :edges="rendererFixture.edges"
        :selected-edge-id="selectedEdgeId"
        @select-edge="selectEdge"
      />
    </template>

    <v-empty-state
      v-else
      icon="mdi-graph-outline"
      title="Start an investigation"
      text="Choose one or more objects or define a broader scope to begin."
    />
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

import GraphCanvas from "@/components/graph/GraphCanvas.vue";
import type { GraphCanvasEdge, GraphCanvasNode } from "@/components/graph/GraphCanvas.vue";

const route = useRoute();
const canvas = ref<InstanceType<typeof GraphCanvas> | null>(null);
const selectedEdgeId = ref<string | null>(null);
const lastInteractionMs = ref(0);
const edgesHidden = ref(false);

const showRendererSpike = computed(() => import.meta.env.DEV && route.query.renderer === "spike");

const rendererFixture = computed(() => {
  if (!showRendererSpike.value) return { nodes: [], edges: [] };
  const nodes: GraphCanvasNode[] = Array.from({ length: 2_000 }, (_, index) => {
    const angle = (index * 2 * Math.PI) / 2_000;
    return {
      id: `spike-node-${index}`,
      label: `Synthetic object ${index}`,
      x: Math.cos(angle) * (1 + (index % 11) / 20),
      y: Math.sin(angle) * (1 + (index % 11) / 20),
      color: index === 0 ? "#1976d2" : "#607d8b",
      size: index === 0 ? 8 : 3
    };
  });
  const edges: GraphCanvasEdge[] = [
    { id: "spike-edge-1", source: "spike-node-0", target: "spike-node-1", label: "resolves" },
    { id: "spike-edge-2", source: "spike-node-0", target: "spike-node-1", label: "communicates-with" }
  ];
  for (let index = 2; index < 10_000; index += 1) {
    edges.push({
      id: `spike-edge-${index + 1}`,
      source: `spike-node-${index % 2_000}`,
      target: `spike-node-${(index * 17 + 1) % 2_000}`
    });
  }
  return { nodes, edges };
});
const rendererFixtureBytes = computed(() => new Blob([JSON.stringify(rendererFixture.value)]).size);

function measureInteraction(action: () => void) {
  const startedAt = performance.now();
  action();
  lastInteractionMs.value = Number((performance.now() - startedAt).toFixed(1));
}

function selectEdge(edgeId: string | null) {
  measureInteraction(() => {
    selectedEdgeId.value = edgeId;
  });
}

function toggleEdges() {
  measureInteraction(() => {
    edgesHidden.value = !edgesHidden.value;
    canvas.value?.setEdgesHidden(edgesHidden.value);
  });
}
</script>

<style scoped>
.graph-workspace {
  min-height: calc(100vh - 64px);
}
</style>
