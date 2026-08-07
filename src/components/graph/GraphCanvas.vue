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
    selectedNodeId?: string | null;
  }>(),
  { selectedEdgeId: null, selectedNodeId: null }
);

const emit = defineEmits<{ selectEdge: [id: string | null]; selectNode: [id: string | null] }>();
const container = ref<HTMLElement | null>(null);
const graph = new MultiDirectedGraph();
let renderer: Sigma | null = null;
let highlightedEdgeId: string | null = null;
let highlightedNodeId: string | null = null;
const savedPositions = new Map<string, { x: number; y: number }>();

function syncGraph() {
  const nextEdges = new Set(props.edges.map(edge => edge.id));
  const nextNodes = new Set(props.nodes.map(node => node.id));
  for (const edgeId of graph.edges()) {
    if (!nextEdges.has(edgeId)) graph.dropEdge(edgeId);
  }
  for (const nodeId of graph.nodes()) {
    if (!nextNodes.has(nodeId)) {
      const attributes = graph.getNodeAttributes(nodeId);
      savedPositions.set(nodeId, { x: attributes.x, y: attributes.y });
      graph.dropNode(nodeId);
    }
  }
  for (const node of props.nodes) {
    const attributes = {
      label: node.label,
      color: node.color ?? "#607d8b",
      size: node.size ?? 5
    };
    if (graph.hasNode(node.id)) graph.mergeNodeAttributes(node.id, attributes);
    else {
      const position = savedPositions.get(node.id) ?? { x: node.x, y: node.y };
      graph.addNode(node.id, { ...attributes, ...position });
    }
  }
  for (const edge of props.edges) {
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue;
    const attributes = {
      label: edge.label,
      color: edge.color ?? "#90a4ae",
      size: 1
    };
    if (graph.hasEdge(edge.id)) graph.mergeEdgeAttributes(edge.id, attributes);
    else graph.addDirectedEdgeWithKey(edge.id, edge.source, edge.target, attributes);
  }
  renderer?.refresh();
  updateHighlightedEdge(props.selectedEdgeId);
  updateHighlightedNode(props.selectedNodeId);
}

function updateHighlightedNode(nodeId: string | null | undefined) {
  if (highlightedNodeId && graph.hasNode(highlightedNodeId)) {
    renderer?.setNodeState(highlightedNodeId, { isHighlighted: false });
  }
  highlightedNodeId = nodeId && graph.hasNode(nodeId) ? nodeId : null;
  if (highlightedNodeId) renderer?.setNodeState(highlightedNodeId, { isHighlighted: true });
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

function fit() {
  renderer?.getCamera().setState({ x: 0.5, y: 0.5, ratio: 1, angle: 0 });
}

function setNodePinned(nodeId: string, pinned: boolean) {
  if (graph.hasNode(nodeId)) graph.setNodeAttribute(nodeId, "pinned", pinned);
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
      nodes: [
        DEFAULT_STYLES.nodes,
        { whenState: "isHighlighted", then: { color: "#f57c00", size: 10, depth: "topNodes" } }
      ],
      edges: [
        DEFAULT_STYLES.edges,
        { path: "straight", parallelPath: "curved", head: "arrow", color: { attribute: "color" } },
        { whenState: "isHighlighted", then: { color: "#1976d2", size: 3, depth: "topEdges" } }
      ]
    },
    settings: { enableEdgeEvents: true, renderEdgeLabels: false, autoRescale: "once" }
  });
  renderer.on("clickEdge", ({ edge }) => emit("selectEdge", edge));
  renderer.on("clickNode", ({ node }) => emit("selectNode", node));
  renderer.on("clickStage", () => {
    emit("selectEdge", null);
    emit("selectNode", null);
  });
  updateHighlightedEdge(props.selectedEdgeId);
  updateHighlightedNode(props.selectedNodeId);
});

watch(() => [props.nodes, props.edges], syncGraph);
watch(() => props.selectedEdgeId, updateHighlightedEdge);
watch(() => props.selectedNodeId, updateHighlightedNode);

onBeforeUnmount(() => {
  renderer?.kill();
  renderer = null;
  graph.clear();
  savedPositions.clear();
});

defineExpose({ focusNode, fit, setEdgesHidden, setNodePinned });
</script>

<style scoped>
.graph-canvas {
  min-height: 32rem;
  width: 100%;
  background: rgb(var(--v-theme-surface));
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
