import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import type { GraphCanvasEdge, GraphCanvasNode } from "@/components/graph/GraphCanvas.vue";
import { explore } from "@/services/graph";
import type {
  GraphExploreItemScope,
  GraphExploreQueryScope,
  GraphExploreRequest,
  GraphExploreResponse
} from "@/services/types";

export type GraphScope = GraphExploreItemScope | GraphExploreQueryScope;
export type WorkspaceStatus = "idle" | "loading" | "ready" | "empty" | "error" | "cancelled";

interface GraphExpansion {
  originId: string;
  response: GraphExploreResponse;
}

interface SerializedGraphWorkspace {
  version: 1;
  scope: GraphScope;
  direction: GraphExploreRequest["direction"];
  link_types: string[];
  target_types: string[];
}

const DEFAULT_LIMITS = { nodes: 2000, edges: 10000 };

function parseWorkspaceHash(hash: string): SerializedGraphWorkspace | null {
  try {
    const raw = new URLSearchParams(hash.replace(/^#/, "")).get("state");
    if (!raw) return null;
    const state = JSON.parse(raw) as Partial<SerializedGraphWorkspace>;
    if (state.version !== 1 || !state.scope || !["items", "query"].includes(state.scope.kind)) return null;
    if (state.scope.kind === "items" && (!Array.isArray(state.scope.items) || state.scope.items.length === 0)) return null;
    return {
      version: 1,
      scope: state.scope,
      direction: state.direction ?? "any",
      link_types: Array.isArray(state.link_types) ? state.link_types : [],
      target_types: Array.isArray(state.target_types) ? state.target_types : []
    };
  } catch {
    return null;
  }
}

function serializeWorkspaceHash(state: SerializedGraphWorkspace): string {
  const parameters = new URLSearchParams();
  parameters.set("state", JSON.stringify(state));
  return `#${parameters.toString()}`;
}

export function graphWorkspaceHash(scope: GraphScope): string {
  return `#state=${JSON.stringify({ version: 1, scope, direction: "any", link_types: [], target_types: [] })}`;
}

export function itemScope(items: string[]): GraphExploreItemScope {
  return { kind: "items", items: [...new Set(items.map(item => item.trim()).filter(Boolean))].slice(0, 100) };
}

export function useGraphWorkspace() {
  const route = useRoute();
  const router = useRouter();
  const response = shallowRef<GraphExploreResponse | null>(null);
  const initialResponse = shallowRef<GraphExploreResponse | null>(null);
  const expansions = shallowRef<GraphExpansion[]>([]);
  const scope = shallowRef<GraphScope | null>(null);
  const status = ref<WorkspaceStatus>("idle");
  const error = ref("");
  const direction = ref<GraphExploreRequest["direction"]>("any");
  const linkTypes = ref<string[]>([]);
  const targetTypes = ref<string[]>([]);
  const selectedNodeId = ref<string | null>(null);
  const selectedEdgeId = ref<string | null>(null);
  const objectTypeFilter = ref("");
  const relationshipTypeFilter = ref("");
  const loadedSearch = ref("");
  const expanding = ref(false);
  let requestGeneration = 0;
  let expansionGeneration = 0;
  let activeRequest: AbortController | null = null;
  let activeExpansion: AbortController | null = null;

  const visibleNodes = computed(() => {
    const filter = objectTypeFilter.value.trim().toLowerCase();
    if (!filter) return response.value?.nodes ?? [];
    return (response.value?.nodes ?? []).filter(node =>
      `${node.root_type} ${node.object_type}`.toLowerCase().includes(filter)
    );
  });

  const visibleNodeIds = computed(() => new Set(visibleNodes.value.map(node => node.id)));
  const visibleEdges = computed(() => {
    const filter = relationshipTypeFilter.value.trim().toLowerCase();
    return (response.value?.edges ?? []).filter(
      edge =>
        visibleNodeIds.value.has(edge.source) &&
        visibleNodeIds.value.has(edge.target) &&
        (!filter || edge.type.toLowerCase().includes(filter))
    );
  });

  const searchResult = computed(() => {
    const term = loadedSearch.value.trim().toLowerCase();
    if (!term) return null;
    return (response.value?.nodes ?? []).find(node => `${node.label} ${node.id}`.toLowerCase().includes(term)) ?? null;
  });

  const canvasNodes = computed<GraphCanvasNode[]>(() => {
    const nodes = visibleNodes.value;
    return nodes.map((node, index) => {
      const angle = (index * 2 * Math.PI) / Math.max(nodes.length, 1);
      return {
        id: node.id,
        label: node.label,
        x: Math.cos(angle),
        y: Math.sin(angle),
        color: node.role === "anchor" ? "#1565c0" : node.role === "scope_match" ? "#6a1b9a" : "#546e7a",
        size: node.role === "neighbor" ? 5 : 8
      };
    });
  });

  const canvasEdges = computed<GraphCanvasEdge[]>(() =>
    visibleEdges.value.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.type
    }))
  );

  function buildRequest(nextScope: GraphScope): GraphExploreRequest {
    return {
      schema_version: 1,
      scope: nextScope,
      direction: direction.value,
      link_types: linkTypes.value,
      target_types: targetTypes.value,
      filters: [],
      requested_limits: DEFAULT_LIMITS
    };
  }

  async function load(nextScope: GraphScope, updateUrl = true) {
    activeRequest?.abort();
    const controller = new AbortController();
    activeRequest = controller;
    const generation = ++requestGeneration;
    scope.value = nextScope;
    status.value = "loading";
    error.value = "";
    if (updateUrl) {
      await router.replace({
        hash: serializeWorkspaceHash({
          version: 1,
          scope: nextScope,
          direction: direction.value,
          link_types: linkTypes.value,
          target_types: targetTypes.value
        })
      });
    }

    try {
      const result = await explore(buildRequest(nextScope), controller.signal);
      if (generation !== requestGeneration) return;
      response.value = result;
      initialResponse.value = structuredClone(result);
      expansions.value = [];
      selectedNodeId.value = null;
      selectedEdgeId.value = null;
      status.value = result.nodes.length === 0 ? "empty" : "ready";
    } catch (loadError) {
      if (generation !== requestGeneration) return;
      if (controller.signal.aborted) {
        status.value = "cancelled";
        return;
      }
      status.value = "error";
      const apiError = loadError as { response?: { status?: number } };
      error.value =
        apiError.response?.status === 404
          ? "One or more scope objects are unavailable. Edit the scope and try again."
          : "The graph could not be loaded. Try again or narrow the scope.";
    }
  }

  function mergeGraph() {
    if (!initialResponse.value) return;
    const base = structuredClone(initialResponse.value);
    const nodes = new Map(base.nodes.map(node => [node.id, node]));
    const edges = new Map(base.edges.map(edge => [edge.id, edge]));
    const reasons = new Set(base.budget.reasons);
    let truncated = base.budget.is_truncated;

    for (const expansion of expansions.value) {
      truncated ||= expansion.response.budget.is_truncated;
      expansion.response.budget.reasons.forEach(reason => reasons.add(reason));
      for (const node of expansion.response.nodes) {
        const existing = nodes.get(node.id);
        if (existing) {
          existing.origin_ids = [...new Set([...existing.origin_ids, ...node.origin_ids])];
        } else {
          nodes.set(node.id, { ...node, role: "neighbor" });
        }
      }
      expansion.response.edges.forEach(edge => edges.set(edge.id, edge));
    }
    base.nodes = [...nodes.values()];
    base.edges = [...edges.values()];
    base.budget = {
      ...base.budget,
      returned_nodes: base.nodes.length,
      returned_edges: base.edges.length,
      is_truncated: truncated,
      reasons: [...reasons]
    };
    response.value = base;
  }

  async function expand(nodeId: string) {
    activeExpansion?.abort();
    const controller = new AbortController();
    activeExpansion = controller;
    const generation = ++expansionGeneration;
    expanding.value = true;
    error.value = "";
    try {
      const result = await explore(buildRequest(itemScope([nodeId])), controller.signal);
      if (generation !== expansionGeneration) return;
      expansions.value = [...expansions.value, { originId: nodeId, response: result }];
      mergeGraph();
    } catch {
      if (generation === expansionGeneration && !controller.signal.aborted) {
        error.value = "This object could not be expanded. The current investigation is unchanged.";
      }
    } finally {
      if (generation === expansionGeneration) expanding.value = false;
    }
  }

  function undoExpansion() {
    if (expansions.value.length === 0) return;
    expansions.value = expansions.value.slice(0, -1);
    mergeGraph();
  }

  function reset() {
    activeExpansion?.abort();
    expansionGeneration += 1;
    expansions.value = [];
    response.value = initialResponse.value ? structuredClone(initialResponse.value) : null;
    objectTypeFilter.value = "";
    relationshipTypeFilter.value = "";
    loadedSearch.value = "";
    selectedNodeId.value = null;
    selectedEdgeId.value = null;
    error.value = "";
  }

  function selectNode(id: string | null) {
    selectedNodeId.value = id;
    if (id) selectedEdgeId.value = null;
  }

  function selectEdge(id: string | null) {
    selectedEdgeId.value = id;
    if (id) selectedNodeId.value = null;
  }

  function clear() {
    activeRequest?.abort();
    requestGeneration += 1;
    response.value = null;
    initialResponse.value = null;
    expansions.value = [];
    scope.value = null;
    status.value = "idle";
    error.value = "";
    void router.replace({ hash: "" });
  }

  watch(
    () => route.hash,
    hash => {
      const restored = parseWorkspaceHash(hash);
      if (!restored || scope.value) return;
      direction.value = restored.direction;
      linkTypes.value = restored.link_types;
      targetTypes.value = restored.target_types;
      void load(restored.scope, false);
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    activeRequest?.abort();
    activeExpansion?.abort();
  });

  return {
    response,
    scope,
    status,
    error,
    direction,
    linkTypes,
    targetTypes,
    selectedNodeId,
    selectedEdgeId,
    objectTypeFilter,
    relationshipTypeFilter,
    loadedSearch,
    searchResult,
    visibleNodes,
    visibleEdges,
    expansions,
    expanding,
    canvasNodes,
    canvasEdges,
    load,
    expand,
    undoExpansion,
    reset,
    selectNode,
    selectEdge,
    clear
  };
}
