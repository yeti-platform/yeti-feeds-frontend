<template>
  <v-container id="graph_main_container" style="margin: 10px; height: 80vh" fluid>
    <v-row style="margin: 10px; width: 100%; height: 100%">
      <v-col cols="3" style="border-width: 0">
        <v-card>
          <v-select
            label="Graph layout"
            v-model="graphLayout"
            :items="['circular', 'circlepack', 'random', 'noverlap']"
            @update:model-value="updateRenderer"
          ></v-select>
        </v-card>
        <div style="margin: 10px"></div>
        <v-card v-if="selectedNode" variant="outlined">
          <template v-slot:prepend>
            <v-icon :icon="getIconForType(selectedNode?.object_type)"></v-icon>
          </template>
          <template v-slot:title>
            <v-label style="text-wrap: balance">{{ selectedNode?.label }}</v-label>
          </template>
          <template v-slot:subtitle>
            <v-label style="text-wrap: balance">{{ selectedNode?.object_type }}</v-label>
          </template>
        </v-card>
        <div style="margin: 10px"></div>
        <v-card v-if="selectedNode" variant="outlined" title="Properties" style="overflow: scroll">
          <v-divider> </v-divider>
          <v-data-table-virtual
            :items="Object.entries(selectedNode)"
            :hide-default-header="true"
            :hide-default-footer="true"
            height="400"
          >
            <template v-slot:item="{ item }">
              <template v-if="!['object_type', 'id', 'root_type', 'label'].includes(item[0])">
                <tr>
                  <td v-if="item[0] === 'yeti_object_id'">id</td>
                  <td v-else>
                    {{ item[0].replace("_", " ") }}
                  </td>
                  <td>{{ item[1] }}</td>
                </tr>
              </template>
            </template>
          </v-data-table-virtual>
        </v-card>
      </v-col>
      <v-divider vertical></v-divider>
      <v-col cols="8" fluid id="graphview">
        <sigma-shadow></sigma-shadow>
        <graph-tooltip
          max-width="100px"
          style="position: absolute"
          :style="{ width: '400px', top: graphContextTop + 'px', left: graphContextLeft + 'px' }"
          v-model="tooltipNode"
          v-show="showTooltip"
          id="tooltip"
        ></graph-tooltip>
        <v-container
          id="graph_context_menu"
          style="position: absolute; border-radius: 10px; max-width: 200px; border-style: solid; padding: 0px"
          :style="{ top: graphContextTop + 'px', left: graphContextLeft + 'px' }"
          v-show="showContextMenu"
        >
          <v-card flat>
            <v-col>
              <v-btn variant="text" id="graph_context_menu_expand" @click="expandNode">Expand</v-btn>
            </v-col>
            <v-divider horizontal></v-divider>
            <v-col>
              <v-btn variant="text" id="graph_context_menu_highlight" @click="highlightNode">Highlight</v-btn>
            </v-col>
          </v-card>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import EdgeCurveProgram from "@sigma/edge-curve";
import { MultiGraph } from "graphology";
import { circlepack, circular, random } from "graphology-layout";
import noverlap from "graphology-layout-noverlap";
import { Sigma } from "sigma";
import type { MouseCoords } from "sigma/types";
import { EdgeArrowProgram } from "sigma/rendering";
import { animateNodes } from "sigma/utils";
import { onMounted, onUnmounted, ref } from "vue";

// These imports will be supported in the future
// import FA2Layout from "graphology-layout-forceatlas2/worker";
// import forceAtlas2 from "graphology-layout-forceatlas2";
// import { NodeImageProgram } from "@sigma/node-image";
// import ForceSupervisor from "graphology-layout-force/worker";

import GraphTooltip from "@/components/GraphTooltip.vue";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions";
import type { ObjectTypeDefinition } from "@/definitions/types";
import * as graphApi from "@/services/graph";
import type { GraphSearchResponse, LooseYetiObject } from "@/services/types";

// We are using shadow dom to encapsulate the sigma renderer
// This is necessary to avoid conflicts with the Vuetify components
// In order to propage events from the shadow dom to the parent component
// we need to use the event retargeting feature of the shadow dom
// https://pm.dartus.fr/posts/2021/shadow-dom-and-event-propagation/

const props = withDefaults(defineProps<{ object: LooseYetiObject; sourceType?: string }>(), {
  sourceType: "observable"
});

const DEFAULT_COLOR_MAP: Record<string, string> = {
  observable: "#A4A2A2",
  entity: "#72777B",
  indicator: "#83929D",
  dfiq: "#9AA3A0"
};

// Sigma/graphology own and mutate this graph directly outside Vue's
// reactivity; wrapping it in a ref would fight their internal render loop.
let graph: MultiGraph;
let renderer: Sigma | undefined;
let shadowContainer: HTMLDivElement;

const showTooltip = ref(false);
const showContextMenu = ref(false);
const tooltipNode = ref<LooseYetiObject | null>(null);
const selectedNode = ref<LooseYetiObject | null>(null);
const graphLayout = ref("noverlap");
const graphContextTop = ref(0);
const graphContextLeft = ref(0);

const selectedObservables = OBSERVABLE_TYPES.map(o => o.type);
const selectedEntities = ENTITY_TYPES.map(o => o.type);
const selectedIndicators = INDICATOR_TYPES.map(o => o.type);
const selectedDfiq = DFIQ_TYPES.map(o => o.type);
const objectTypes: ObjectTypeDefinition[] = ENTITY_TYPES.concat(INDICATOR_TYPES, DFIQ_TYPES, OBSERVABLE_TYPES);

function targetTypes(): string[] {
  return selectedObservables.concat(selectedEntities, selectedIndicators, selectedDfiq);
}

// ========================================
// Graph view events
// ========================================

function handleGraphViewClick(event: MouseEvent) {
  // if the context menu is shown, discard the click event
  if (!showContextMenu.value) {
    return;
  }
  const contextMenu = document.getElementById("graph_context_menu");
  // if context_menu does not exist, discard the click event
  if (!contextMenu) {
    showContextMenu.value = false;
    return;
  }

  // if the click event is outside the context menu, discard the click event
  const contextMenuRect = contextMenu.getBoundingClientRect();
  if (
    event.x < contextMenuRect.left ||
    event.x > contextMenuRect.right ||
    event.y < contextMenuRect.top ||
    event.y > contextMenuRect.bottom
  ) {
    showContextMenu.value = false;
    return;
  }

  // handle click event on context menu children
  clickGraphViewChildrenFromEvent(event, contextMenu);
  showContextMenu.value = false;
}

// Find and click the button in the context menu based on the click event
// listened by the graph view.
function clickGraphViewChildrenFromEvent(event: MouseEvent, element: Element) {
  for (const child of Array.from(element.children)) {
    const rect = child.getBoundingClientRect();
    const elementType = child.getAttribute("type");
    if (!elementType || elementType !== "button") {
      clickGraphViewChildrenFromEvent(event, child);
    } else if (event.x >= rect.left && event.x <= rect.right && event.y >= rect.top && event.y <= rect.bottom) {
      (document.getElementById(child.id) as HTMLElement | null)?.click();
    } else {
      clickGraphViewChildrenFromEvent(event, child);
    }
  }
}

function displayTooltip(event: MouseCoords, node: string) {
  // if the context menu is shown, do not show the tooltip
  if (showContextMenu.value) {
    return;
  }
  setGraphContextPosition(event);
  const { x, y, size, color, tags, context, root_type, ...data } = graph.getNodeAttributes(node);
  tooltipNode.value = data;
  showTooltip.value = true;
}

function displayContextMenu(event: MouseCoords, node: string) {
  showTooltip.value = false;
  setGraphContextPosition(event);
  updateSelectedNode(node);
  showContextMenu.value = true;
}

// ========================================
// Context menu actions called by the buttons defined in the context menu
// ========================================

function expandNode() {
  if (selectedNode.value) {
    expandGraph(selectedNode.value.yeti_object_id);
  }
}

function highlightNode() {
  console.log("Highlight node");
}

// ========================================
// helper functions
// ========================================

function setGraphContextPosition(event: MouseCoords) {
  // event.y is absolute to viewport
  graphContextTop.value = Math.floor(event.y);
  // use clientX because event.x is not absolute to viewport. Node events are
  // mouse-only in practice; touch events have no single clientX.
  const clientX = "clientX" in event.original ? event.original.clientX : 0;
  graphContextLeft.value = Math.floor(clientX);
}

function updateSelectedNode(node: string) {
  const { x, y, size, color, root_type, ...data } = graph.getNodeAttributes(node);
  selectedNode.value = data;
}

// ========================================
// Sigma shadow container
// ========================================
function createSigmaShadow() {
  if (window.customElements.get("sigma-shadow")) {
    console.log("Sigma already loaded");
    return;
  }
  window.customElements.define(
    "sigma-shadow",
    class extends HTMLElement {
      connectedCallback() {
        const shadowRoot = this.attachShadow({ mode: "open" });
        const container = document.createElement("div");
        container.style.cssText = `
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                `;
        shadowContainer = container;
        shadowRoot.appendChild(container);
      }
    }
  );
}

// ========================================
// Graph methods
// ========================================

// Initialize the graph with the current object based on the sourceType and id.
async function initGraph() {
  const response = await graphApi.search({
    source: `${props.sourceType}/${props.object.id}`,
    target_types: targetTypes(),
    link_types: [],
    graph: "links",
    hops: 1,
    direction: "any",
    filter: [],
    include_original: true,
    count: 0,
    page: 0,
    sorting: []
  });
  updateGraph(response, false);
}

// Update the graph renderer with the current layout.
function updateRenderer() {
  console.log("Update renderer with layout " + graphLayout.value);
  if (graphLayout.value == "circular") {
    animateNodes(graph, circular(graph), { duration: 2000 });
  } else if (graphLayout.value == "random") {
    animateNodes(graph, random(graph), { duration: 2000 });
  } else if (graphLayout.value == "noverlap") {
    animateNodes(graph, noverlap(graph), { duration: 2000 });
  } else if (graphLayout.value == "circlepack") {
    animateNodes(graph, circlepack(graph), { duration: 2000 });
  }
}

// Expand the graph with the neighbors of the node represented by its id.
async function expandGraph(id: string) {
  console.log("Expand graph " + id);
  const response = await graphApi.search({
    source: id,
    target_types: targetTypes(),
    link_types: [],
    graph: "links",
    hops: 1,
    direction: "any",
    filter: [],
    include_original: true,
    count: 0,
    page: 0,
    sorting: []
  });
  updateGraph(response, true);
}

// Update the graph with the neighbors and paths. This is always called when
// dealing with graph updates.
function updateGraph(neighbors: GraphSearchResponse, update: boolean) {
  console.log(
    "Update graph with " + Object.keys(neighbors.vertices).length + " vertices and " + neighbors.paths.length + " paths"
  );
  let i = 0;
  for (const [id, vertex] of Object.entries(neighbors.vertices) as [string, LooseYetiObject][]) {
    if (graph.hasNode(id)) {
      continue;
    }
    const data = { ...vertex };
    let label: string;
    if (data.root_type == "observable") {
      label = data.value;
      delete data.value;
    } else {
      label = data.name;
      delete data.name;
    }
    data.object_type = data.type;
    data.yeti_object_id = id;
    delete data.type;
    const angle = (++i * 2 * Math.PI) / graph.order;
    const x = 100 * Math.cos(angle);
    const y = 100 * Math.sin(angle);
    graph.addNode(id, { x: x, y: y, size: 15, label: label, color: getColorForObject(data), ...data });
  }

  for (const path of neighbors.paths) {
    for (const edge of path) {
      if (graph.hasEdge(edge.source, edge.target)) {
        continue;
      }
      graph.addEdge(edge.source, edge.target, { type: "curved", label: edge.type, size: 5 });
    }
  }
  // force random layout
  random.assign(graph);
  if (update) {
    updateRenderer();
  }
}

// ========================================
// utils
// ========================================

function getIconForType(type?: string): string | undefined {
  return objectTypes.find(objectType => objectType.type === type)?.icon;
}

function getColorForObject(node: LooseYetiObject): string {
  return (
    objectTypes.find(objectType => objectType.type === node.object_type)?.color ?? DEFAULT_COLOR_MAP[node.root_type]
  );
}

function getObjectDetails() {
  const data: LooseYetiObject = { ...props.object };
  let label: string;
  if (data.root_type == "observable") {
    label = data.value;
    delete data.value;
  } else {
    label = data.name;
    delete data.name;
  }
  data.label = label;
  data.object_type = data.type;
  delete data.type;
  data.yeti_object_id = `${props.sourceType}/${props.object.id}`;
  selectedNode.value = data;
}

onMounted(() => {
  graph = new MultiGraph();
  createSigmaShadow();

  try {
    renderer = new Sigma(graph, shadowContainer, {
      allowInvalidContainer: true,
      defaultEdgeType: "straight",
      enableEdgeEvents: true,
      renderEdgeLabels: true,
      edgeProgramClasses: {
        straight: EdgeArrowProgram,
        curved: EdgeCurveProgram
      }
    });
    // Put the mouse canvas on top, so events can be catched even if the logs container is in front
    renderer.getCanvases().mouse.style.cssText = "z-index: 100; position: absolute";

    // bind sigma events
    renderer.on("enterNode", ({ event, node }) => displayTooltip(event, node));
    renderer.on("leaveNode", () => {
      showTooltip.value = false;
    });
    renderer.on("rightClickNode", ({ event, node }) => displayContextMenu(event, node));
    renderer.on("clickNode", ({ node }) => updateSelectedNode(node));
  } catch (e) {
    console.warn("Failed to initialize Sigma renderer. Graph visualization will be disabled:", e);
  }

  window.addEventListener("refreshGraphView", () => {
    setTimeout(updateRenderer, 1000);
  });

  // bind global events
  const graphview = document.getElementById("graphview");
  if (graphview) {
    graphview.addEventListener("click", handleGraphViewClick);
    graphview.addEventListener("contextmenu", e => e.preventDefault());
  }
  getObjectDetails();
  initGraph();
});

onUnmounted(() => {
  console.log("Unmount GraphObjects");
  if (renderer) {
    renderer.kill();
  }
  const graphview = document.getElementById("graphview");
  if (graphview) {
    graphview.removeEventListener("click", handleGraphViewClick);
  }
});
</script>

<style>
.might-overflow {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: x-small;
}
</style>
