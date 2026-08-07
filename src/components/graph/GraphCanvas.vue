<template>
  <div ref="container" class="graph-canvas" data-testid="graph-canvas" aria-label="Graph visualization"></div>
</template>

<script setup lang="ts">
import { MultiDirectedGraph } from "graphology";
import { Sigma } from "sigma";
import { extremityArrow, pathCurved, pathLine } from "sigma/rendering";
import { DEFAULT_STYLES } from "sigma/types";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

export interface GraphCanvasNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color?: string;
  size?: number;
}

export interface GraphCanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  color?: string;
}

const props = withDefaults(
  defineProps<{
    nodes: GraphCanvasNode[];
    edges: GraphCanvasEdge[];
    selectedEdgeId?: string | null;
  }>(),
  { selectedEdgeId: null }
);

const emit = defineEmits<{ selectEdge: [id: string | null] }>();
const container = ref<HTMLElement | null>(null);
const graph = new MultiDirectedGraph();
let renderer: Sigma | null = null;
let highlightedEdgeId: string | null = null;

function syncGraph() {
  graph.clear();
  for (const node of props.nodes) {
    graph.addNode(node.id, {
      label: node.label,
      x: node.x,
      y: node.y,
      color: node.color ?? "#607d8b",
      size: node.size ?? 5
    });
  }
  for (const edge of props.edges) {
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue;
    graph.addDirectedEdgeWithKey(edge.id, edge.source, edge.target, {
      label: edge.label,
      color: edge.color ?? "#90a4ae",
      size: 1
    });
  }
  renderer?.refresh();
  updateHighlightedEdge(props.selectedEdgeId);
}

function updateHighlightedEdge(edgeId: string | null | undefined) {
  if (highlightedEdgeId && graph.hasEdge(highlightedEdgeId)) {
    renderer?.setEdgeState(highlightedEdgeId, { isHighlighted: false });
  }
  highlightedEdgeId = edgeId && graph.hasEdge(edgeId) ? edgeId : null;
  if (highlightedEdgeId) renderer?.setEdgeState(highlightedEdgeId, { isHighlighted: true });
}

function focusNode(nodeId: string) {
  if (!renderer || !graph.hasNode(nodeId)) return;
  const position = renderer.getNodeDisplayData(nodeId);
  if (position) renderer.getCamera().setState({ x: position.x, y: position.y, ratio: 0.2 });
}

function setEdgesHidden(hidden: boolean) {
  renderer?.setEdgesState(graph.edges(), { isHidden: hidden });
}

onMounted(() => {
  if (!container.value) return;
  syncGraph();
  renderer = new Sigma(graph, container.value, {
    primitives: {
      edges: {
        paths: [pathLine(), pathCurved()],
        extremities: [extremityArrow()]
      }
    },
    styles: {
      nodes: DEFAULT_STYLES.nodes,
      edges: [
        DEFAULT_STYLES.edges,
        { path: "straight", parallelPath: "curved", head: "arrow", color: { attribute: "color" } },
        { whenState: "isHighlighted", then: { color: "#1976d2", size: 3, depth: "topEdges" } }
      ]
    },
    settings: { enableEdgeEvents: true, renderEdgeLabels: false, autoRescale: "once" }
  });
  renderer.on("clickEdge", ({ edge }) => emit("selectEdge", edge));
  renderer.on("clickStage", () => emit("selectEdge", null));
  updateHighlightedEdge(props.selectedEdgeId);
});

watch(() => [props.nodes, props.edges], syncGraph);
watch(() => props.selectedEdgeId, updateHighlightedEdge);

onBeforeUnmount(() => {
  renderer?.kill();
  renderer = null;
  graph.clear();
});

defineExpose({ focusNode, setEdgesHidden });
</script>

<style scoped>
.graph-canvas {
  min-height: 32rem;
  width: 100%;
  background: rgb(var(--v-theme-surface));
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
