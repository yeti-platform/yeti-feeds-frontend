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

    <v-row v-else>
      <v-col cols="12" lg="4">
        <graph-scope-builder :loading="workspace.status.value === 'loading'" @submit="workspace.load" />
      </v-col>
      <v-col cols="12" lg="8">
        <v-alert v-if="workspace.error.value" type="error" variant="tonal" class="mb-3" role="alert">
          {{ workspace.error.value }}
        </v-alert>

        <div v-if="workspace.status.value === 'loading'" class="py-8" role="status" aria-live="polite">
          <v-progress-linear indeterminate color="primary" />
          <p class="text-body-2 mt-3">Loading the authorized graph…</p>
        </div>

        <v-empty-state
          v-else-if="workspace.status.value === 'idle'"
          icon="mdi-graph-outline"
          title="Start an investigation"
          text="Choose one or more objects or define a broader scope to begin."
        />

        <v-empty-state
          v-else-if="workspace.status.value === 'empty'"
          icon="mdi-graph-outline"
          title="No accessible matches"
          text="Try a different or broader starting scope."
        />

        <template v-if="workspace.response.value">
          <v-card variant="outlined" class="mb-3">
            <v-card-text class="d-flex flex-wrap align-center ga-4">
              <span><strong>{{ workspace.response.value.nodes.length }}</strong> objects</span>
              <span><strong>{{ workspace.response.value.edges.length }}</strong> relationships</span>
              <span v-if="workspace.response.value.scope.kind === 'query'">
                {{ workspace.response.value.scope.accessible_match_count }} accessible matches
              </span>
              <v-chip v-if="workspace.response.value.budget.is_truncated" color="warning" size="small">
                Truncated: {{ workspace.response.value.budget.reasons.join(", ") }}
              </v-chip>
              <v-btn
                v-if="workspace.expansions.value.length"
                size="small"
                variant="tonal"
                :loading="workspace.expanding.value"
                @click="workspace.undoExpansion"
              >
                Undo expansion
              </v-btn>
              <v-spacer />
              <v-btn size="small" variant="text" @click="workspace.clear">Clear workspace</v-btn>
            </v-card-text>
            <v-card-text v-if="workspace.response.value.scope.ranking" class="pt-0 text-body-2">
              Ranking: {{ formatRanking(workspace.response.value.scope.ranking) }}
            </v-card-text>
          </v-card>
          <graph-controls
            class="mb-3"
            :object-type-filter="workspace.objectTypeFilter.value"
            :relationship-type-filter="workspace.relationshipTypeFilter.value"
            :direction="workspace.direction.value"
            :search="workspace.loadedSearch.value"
            :search-result-label="workspace.searchResult.value?.label ?? ''"
            :selected-node-id="workspace.selectedNodeId.value"
            :visible-edge-count="workspace.visibleEdges.value.length"
            @update:object-type-filter="workspace.objectTypeFilter.value = $event"
            @update:relationship-type-filter="workspace.relationshipTypeFilter.value = $event"
            @update:direction="changeDirection"
            @update:search="workspace.loadedSearch.value = $event"
            @focus-search-result="focusSearchResult"
            @fit="canvas?.fit()"
            @toggle-pin="togglePin"
            @reset="resetInvestigation"
          />
          <graph-canvas
            ref="canvas"
            :nodes="workspace.canvasNodes.value"
            :edges="workspace.canvasEdges.value"
            :selected-node-id="workspace.selectedNodeId.value"
            :selected-edge-id="workspace.selectedEdgeId.value"
            @select-node="workspace.selectNode"
            @select-edge="workspace.selectEdge"
          />
          <graph-evidence-panel
            class="mt-3"
            :nodes="workspace.visibleNodes.value"
            :edges="workspace.visibleEdges.value"
            :selected-node-id="workspace.selectedNodeId.value"
            :selected-edge-id="workspace.selectedEdgeId.value"
            @select-node="workspace.selectNode"
            @select-edge="workspace.selectEdge"
            @expand="workspace.expand"
          />
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

import GraphCanvas from "@/components/graph/GraphCanvas.vue";
import type { GraphCanvasEdge, GraphCanvasNode } from "@/components/graph/GraphCanvas.vue";
import GraphControls from "@/components/graph/GraphControls.vue";
import GraphEvidencePanel from "@/components/graph/GraphEvidencePanel.vue";
import GraphScopeBuilder from "@/components/graph/GraphScopeBuilder.vue";
import { useGraphWorkspace } from "@/composables/useGraphWorkspace";
import type { GraphExploreRequest } from "@/services/types";

const route = useRoute();
const canvas = ref<InstanceType<typeof GraphCanvas> | null>(null);
const selectedEdgeId = ref<string | null>(null);
const lastInteractionMs = ref(0);
const edgesHidden = ref(false);
const workspace = useGraphWorkspace();
const pinnedNodes = new Set<string>();

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

function formatRanking(ranking: [string, boolean][]) {
  return ranking.map(([field, ascending]) => `${field} ${ascending ? "ascending" : "descending"}`).join(", ");
}

function focusSearchResult() {
  const result = workspace.searchResult.value;
  if (!result) return;
  workspace.selectNode(result.id);
  canvas.value?.focusNode(result.id);
}

function togglePin() {
  const nodeId = workspace.selectedNodeId.value;
  if (!nodeId) return;
  const pinned = !pinnedNodes.has(nodeId);
  if (pinned) pinnedNodes.add(nodeId);
  else pinnedNodes.delete(nodeId);
  canvas.value?.setNodePinned(nodeId, pinned);
}

function resetInvestigation() {
  workspace.reset();
  canvas.value?.fit();
}

function changeDirection(direction: GraphExploreRequest["direction"]) {
  workspace.direction.value = direction;
  if (workspace.scope.value) void workspace.load(workspace.scope.value);
}
</script>

<style scoped>
.graph-workspace {
  min-height: calc(100vh - 64px);
}
</style>
