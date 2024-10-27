
<template>
    <v-container id="graph_main_container" style="margin: 10px; height: 80vh" fluid>
      <v-row style="margin: 10px; width: 100%; height: 100%">
        <v-col  cols="3" style="border-width: 0">
          <v-card>
            <v-select label="Graph layout" v-model="graph_layout" :items="['circular', 'circlepack', 'random', 'noverlap']" @update:model-value="updateRenderer"></v-select>
          </v-card>
          <div style="margin: 10px;"></div>
          <v-card v-if="selected_node" variant="outlined">
            <template v-slot:prepend>
              <v-icon :icon=getIconForType(selected_node?.object_type)></v-icon>
            </template>
            <template v-slot:title>
                <v-label style="text-wrap: balance;">{{ selected_node?.label }}</v-label>
              </template>
              <template v-slot:subtitle>
                <v-label style="text-wrap: balance;">{{ selected_node?.object_type }}</v-label>
              </template>
          </v-card>
          <div style="margin: 10px;"></div>
          <v-card v-if="selected_node" variant="outlined" title="Properties" style="overflow: scroll;">
            <v-divider> </v-divider>
            <v-data-table-virtual
            :items="Object.entries(selected_node)"
            :hide-default-header="true"
            :hide-default-footer="true"
            height="400">
            <template v-slot:item="{ item }">
              <template v-if="!['object_type', 'id', 'root_type', 'label'].includes(item[0])">
                <tr>
                  <td v-if="item[0] === 'yeti_object_id'">
                    id
                  </td>
                  <td v-else>
                    {{ item[0].replace('_', ' ') }}
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
          <graph-tooltip max-width="100px" style="position:absolute" :style="{ width: '400px', top: graph_context_top+'px', left: graph_context_left+'px' }" v-model=tooltip_node v-show="show_tooltip" id="tooltip"></graph-tooltip>
          <v-container id="graph_context_menu" style="position: absolute; border-radius: 10px; max-width: 200px; border-style: solid; padding: 0px" :style="{ top: graph_context_top+'px', left: graph_context_left+'px'}" v-show="show_context_menu">
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

import { MultiGraph } from "graphology"; 
import EdgeCurveProgram from "@sigma/edge-curve";
import forceAtlas2 from 'graphology-layout-forceatlas2';
import FA2Layout from 'graphology-layout-forceatlas2/worker';
import forceLayout from 'graphology-layout-force';
import { animateNodes } from "sigma/utils";
import { circlepack, circular, random } from "graphology-layout";
import { EdgeArrowProgram } from "sigma/rendering";
import noverlap from 'graphology-layout-noverlap';

// import { h, render } from '@vue/runtime-dom'
import { createVNode, render } from 'vue'

// import { random } from "graphology-layout";
// import FA2Layout from "graphology-layout-forceatlas2/worker";
// import forceAtlas2 from "graphology-layout-forceatlas2";
import Sigma from "sigma";
// import { NodeImageProgram } from "@sigma/node-image";
import ForceSupervisor from "graphology-layout-force/worker";
import axios from "axios";

import { getCurrentInstance } from 'vue'

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions.js";

import GraphTooltip from "@/components/GraphTooltip.vue";

import { defineCustomElement } from 'vue'
import { exportNamespaceSpecifier } from "@babel/types";
import { MouseCoords } from "sigma/dist/declarations/src/types";
import { title } from "process";
import { string } from "yaml/dist/schema/common/string";

</script>

<script lang="ts">

let graph: MultiGraph;
let renderer: Sigma;
let shadow_container: HTMLDivElement;

// We are using shadow dom to encapsulate the sigma renderer
// This is necessary to avoid conflicts with the Vuetify components
// In order to propage events from the shadow dom to the parent component
// we need to use the event retargeting feature of the shadow dom
// https://pm.dartus.fr/posts/2021/shadow-dom-and-event-propagation/

export default {
  name: "GraphObjects",

  props: {
    id: { type: String, required: true },
    sourceType: { type: String, default: "observable" },
  },

  components: {
    GraphTooltip
  },


  data() {
    return {
      show_tooltip: false,
      show_context_menu: false,
      tooltip_node: null,
      selected_node: null,
      graph_layout: "noverlap",
      selected_observables: OBSERVABLE_TYPES.map(o => o.type),
      selected_entities: ENTITY_TYPES.map(o => o.type),
      selected_indicators: INDICATOR_TYPES.map(o => o.type),
      selected_dfiq: DFIQ_TYPES.map(o => o.type),
      graph_context_top: 0,
      graph_context_left: 0,
      objectTypes: ENTITY_TYPES.concat(INDICATOR_TYPES).concat(DFIQ_TYPES).concat(OBSERVABLE_TYPES),
    };
  },


  mounted() {
    graph = new MultiGraph();
    this.createSigmaShadow();

    renderer = new Sigma(graph, shadow_container, {
      allowInvalidContainer: true,
      defaultEdgeType: "straight",
      enableEdgeEvents: true,
      renderEdgeLabels: true,
      edgeProgramClasses: {
        straight: EdgeArrowProgram,
        curved: EdgeCurveProgram,
      },
    });
    // Put the mouse canvas on top, so events can be catched even if the logs container is in front
    renderer.getCanvases().mouse.style.cssText = "z-index: 100; position: absolute";

    // bind sigma events
    renderer.on("enterNode", ({ event, node }) => this.displayTooltip(event, node));
    renderer.on("leaveNode", () => {this.show_tooltip = false;});
    renderer.on("rightClickNode", ({ event, node }) => this.displayContextMenu(event, node));
    renderer.on("clickNode", ({ node }) => this.updateSelectedNode(node));

    window.addEventListener("refreshGraphView", (event) => { setTimeout(this.updateRenderer, 1000) });

    // bind global events
    const graphview = document.getElementById("graphview");
    if (graphview) {
      graphview.addEventListener("click", (event) => this.handleGraphViewClick(event), 1000);
      graphview.addEventListener("contextmenu", e => e.preventDefault());
    }
    this.getObjectDetails();
    this.initGraph();
  },

  unmounted() {
    console.log("Unmount GraphObjects");
    if (renderer) {
      renderer.kill();
    }
    const graphview = document.getElementById("graphview");
    if (graphview) {
      graphview.removeEventListener("click", (event) => this.handleGraphViewClick(event));
      graphview.removeEventListener("contextmenu", e => e.preventDefault());
    }
  },

  methods: {

    // ========================================
    // Graph view events
    // ========================================

    //
    // Handle click event on the graph view
    //
    handleGraphViewClick(event: MouseEvent) {
      // if the context menu is shown, discard the click event
      if (!this.show_context_menu) {
        return
      }
      const context_menu = document.getElementById("graph_context_menu");
      // if context_menu does not exist, discard the click event
      if (!context_menu) {
        this.show_context_menu = false;
        return;
      }

      // if the click event is outside the context menu, discard the click event
      const context_menu_rect = context_menu.getBoundingClientRect();
      if (event.x < context_menu_rect.left || event.x > context_menu_rect.right 
          || event.y < context_menu_rect.top || event.y > context_menu_rect.bottom) {
        this.show_context_menu = false;
        return;
      }

      // handle click event on context menu children
      this._clickGraphViewChildrenFromEvent(event, context_menu);
      this.show_context_menu = false;
    },

    //
    // Find and click button in the context menu button based on the click event
    // listened by the graph view
    //
    _clickGraphViewChildrenFromEvent(event: MouseEvent, element: Element) {
      for (var i = 0; i < element.children.length; i++) {
        const child = element.children[i];
        const rect = child.getBoundingClientRect();
        const element_type = child.getAttribute("type");
        if (element_type === "button") {
        }
        if (!element_type || element_type != "button") {
          this._clickGraphViewChildrenFromEvent(event, child);
        }
        else if (event.x >= rect.left && event.x <= rect.right && event.y >= rect.top && event.y <= rect.bottom) {
          const html_element = document.getElementById(child.id);
          html_element?.click();
        }
        else {
          this._clickGraphViewChildrenFromEvent(event, child);
        }
      }
    },

    //
    // Display tooltip
    //
    displayTooltip(event: MouseCoords, node: string) {
      // if the context menu is shown, do not show the tooltip
      if (this.show_context_menu) {
        return
      }
      this.setGraphContextPosition(event)
      const {x, y, size, color, tags, context, root_type, ...data} = graph.getNodeAttributes(node)
      this.tooltip_node = data
      this.show_tooltip = true;
    },

    //
    // Display context menu
    //
    displayContextMenu(event: MouseCoords, node: string) {
      this.show_tooltip = false;
      this.setGraphContextPosition(event)
      this.updateSelectedNode(node)
      this.show_context_menu = true;      
    },

    //
    // Context menu actions called by the buttons defined in the context menu
    //

    expandNode() {
      this._expandGraph(this.selected_node.yeti_object_id);
    },

    highlightNode() {
      console.log("Highlight node");
    },

    //
    // helper functions
    //
    setGraphContextPosition(event: MouseCoords) {
      // event.y is absolute to viewport
      this.graph_context_top = Math.floor(event.y)
      // use clientX because event.x is not absolute to viewport
      this.graph_context_left = Math.floor(event.original.clientX)
    },
    
    updateSelectedNode(node) {
      var {x, y, size, color, root_type, ...data} = graph.getNodeAttributes(node)
      this.selected_node = data
    },


    // ========================================
    // Sigma shadow container
    // ========================================
    createSigmaShadow() {
      if (window.customElements.get("sigma-shadow")) {
        console.log("Sigma already loaded");
        return;
      }
      window.customElements.define(
        "sigma-shadow",
        class extends HTMLElement {
          _container: HTMLDivElement | null = null;

          constructor() {
            super();
          }

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
            this._container = container;
            shadow_container = container;
            shadowRoot.appendChild(container);
          }
        }
      );
    },


    // ========================================
    // Graph methods
    // ========================================

    //
    // Initialize the graph with the current object based on the sourceType and id
    //
    initGraph() {
      let target_types = this.selected_observables.concat(this.selected_entities, this.selected_indicators, this.selected_dfiq);
      let graphSearchRequest = {
          source: `${this.sourceType}/${this.id}`,
          target_types: target_types,
          graph: "links",
          hops: 1,
          direction: "any",
          count: 0,
          include_original: true,
        };
      axios.post(`/api/v2/graph/search`, graphSearchRequest).then(response => {
        this._updateGraph(response.data, false);
      }).catch(error => {
        console.log(error);
      }) 
    },

    // 
    // Update the graph renderer with the current layout
    //
    updateRenderer() {
      console.log("Update renderer with layout " + this.graph_layout);
      if (this.graph_layout == "circular") {
        const positions = circular(graph);
        animateNodes(graph, positions, { duration: 2000 });
      }
      else if (this.graph_layout == "random") {
        const positions = random(graph);
        animateNodes(graph, positions, { duration: 2000 });
      }
      else if (this.graph_layout == "noverlap") {
        const positions = noverlap(graph);
        animateNodes(graph, positions, { duration: 2000 });
      }
      else if (this.graph_layout == "circlepack") {
        const positions = circlepack(graph);
        animateNodes(graph, positions, { duration: 2000 });
      }
      // backup
      // else if (this.graph_layout == "Force Atlas") {
      //   console.log("Apply Force Atlas layout");
      //   if (graph.size > 1000) {
      //     const settings = forceAtlas2.inferSettings(graph);
      //     const positions = forceAtlas2(graph, {
      //       iterations: 50,
      //     });
      //     const fa2Layout = new FA2Layout(graph, { iteration: 50, settings: settings });
      //     fa2Layout.start();
      //   }
      //   else {
      //     const positions = forceLayout(graph, {
      //       maxIterations: 50,
      //       settings: {
      //         gravity: 10
      //       }
      //     })
      //     forceLayout.assign(graph, {maxIterations: 50});
      //   } 
      // }
    },


    //
    // Expand the graph with the neighbors of the node represented by its id
    //
    _expandGraph(id: string) {
      console.log("Expand graph " + id);
      let target_types = this.selected_observables.concat(this.selected_entities, this.selected_indicators, this.selected_dfiq);
      let graphSearchRequest = {
        source: id,
        target_types: target_types,
        graph: "links",
        hops: 1,
        direction: "any",
        count: 0,
        include_original: true,
      };
      axios.post(`/api/v2/graph/search`, graphSearchRequest).then(response => {
        this._updateGraph(response.data, true);
      }).catch(error => {
        console.log(error);
      })
    },

    //
    // Update the graph with the neighbors and paths
    // This method is always called when dealing with graph updates
    //
    _updateGraph(neighbors: Object, update: boolean) {
      console.log("Update graph with " + Object.keys(neighbors.vertices).length + " vertices and " + neighbors.paths.length + " paths");
      let label;
      let x, y, i;
      i = 0;
      // random.assign(graph)
      for (const [id, data] of Object.entries(neighbors.vertices)) {
        if (graph.hasNode(id)) {
          continue
        }
        if (data.root_type == "observable") {
          label = data.value;
          delete data.value
        }
        else {
          label = data.name;
          delete data.name
        }
       data.object_type = data.type
       data.yeti_object_id = id
       delete data.type
       const angle = (++i * 2 * Math.PI) / graph.order;
       x = 100 * Math.cos(angle);
       y = 100 * Math.sin(angle);
       graph.addNode(id, {x: x, y: y, size: 15, label: label, color: "#7E57C2", ...data});
      }

      for (const path of neighbors.paths) {
        for (const edge of path) {
          if (graph.hasEdge(edge.source, edge.target)) {
            continue
          }
          graph.addEdge(edge.source, edge.target, {type: "curved", label: edge.type, size: 5});
        }
      }
      // force random layout
      random.assign(graph)
      if (update) {
        this.updateRenderer();
      }
    },

  },

//
// utils
//

    getIconForType(type: string) {
      return this.objectTypes.find(objectType => objectType.type === type)?.icon;
    },

    getObjectDetails() {
      axios
        .get(`/api/v2/${this.sourceType}/${this.id}`)
        .then(response => {
          var data = response.data;
          if (data.root_type == "observable") {
            var label = data.value;
            delete data.value
          }
          else {
            var label = data.name;
            delete data.name
          }
          data.label = label
          data.object_type = data.type
          delete data.type
          data.yeti_object_id = `${this.sourceType}/${this.id}`
          this.selected_node = { ...data}
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },

};

</script>

<style>
.might-overflow {
    text-overflow: ellipsis;
    overflow : hidden;
    white-space: nowrap;
    font-size: x-small;
}
</style>