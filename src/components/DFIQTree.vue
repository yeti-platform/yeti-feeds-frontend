<template>
  <div>
    <v-container fluid v-if="topLevel">
      <v-row>
        <v-btn
          v-if="dfiqGraph.paths?.length > 0"
          @click="expandedControl = !expandedControl"
          class="me-2"
          variant="outlined"
        >
          <v-icon size="x-large">{{ expandedControl ? "mdi-chevron-down" : "mdi-chevron-right" }}</v-icon>
          {{ expandedControl ? "Collapse all" : "Expand all" }}</v-btn
        >
        <v-combobox
          v-model="indicatorTypesControl"
          :items="availableIndicatorTypes"
          density="compact"
          variant="outlined"
          label="Include indicator types"
          chips
          multiple
          hide-details
          hide-selected
          max-width="600"
          open-on-clear
          clearable
          prepend-inner-icon="mdi-filter"
        ></v-combobox>
      </v-row>
    </v-container>
    <ul class="ml-2 dfiq-tree cursor-pointer" v-if="shouldDisplay(dfiqTree)">
      <!-- Main entry display -->
      <li class="mt-2">
        <span @click="expanded = !expanded">
          <v-icon
            color="grey-darken-2"
            v-if="
              (dfiqTree.object?.type === 'question' && dfiqTree.object?.approaches.length > 0) ||
              (dfiqTree.children?.length > 0 && dfiqTree.object?.root_type === 'dfiq')
            "
            class="me-1"
            >{{ expanded ? "mdi-chevron-down" : "mdi-chevron-right" }}</v-icon
          >
          <v-divider v-else vertical class="mr-7"></v-divider>

          <v-icon color="grey-darken-2" size="x-small" class="me-2">{{ getDFIQIcon(dfiqTree) }}</v-icon>

          <span v-if="dfiqTree.object?.type === 'forensicartifact'">
            <code class="me-2">{{ dfiqTree.title }}</code>
            <v-chip density="compact" size="small">forensicartifact</v-chip>
          </span>
          <span v-else>
            <span class="me-2">{{ sanitizeTitle(dfiqTree) }}</span>
            <v-chip density="compact" size="small" v-if="dfiqTree.object.type === 'query'">{{
              dfiqTree.object.query_type
            }}</v-chip>
          </span>

          <span class="item-controls">
            <v-btn
              variant="text"
              size="small"
              icon="mdi-open-in-new"
              density="compact"
              :to="getDetailsLink(dfiqTree)"
              target="_blank"
              class="ml-2 me-2"
            >
              <v-icon>mdi-open-in-new</v-icon>
            </v-btn>

            <v-dialog :width="editWidth" :fullscreen="fullScreenEdit">
              <template v-slot:activator="{ props }">
                <v-btn
                  variant="text"
                  size="small"
                  icon="mdi-edit"
                  density="compact"
                  v-bind="props"
                  target="_blank"
                  class="me-2"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>

              <template v-slot:default="{ isActive }">
                <edit-DFIQ-object
                  v-if="dfiqTree.object?.root_type === 'dfiq'"
                  :object="dfiqTree.object"
                  :is-active="isActive"
                  :redirect="false"
                  @success="obj => emitDFIQUpdate(obj)"
                  @deleteSuccess="obj => emitDFIQUpdate(obj)"
                  @toggle-fullscreen="toggleFullscreen"
                />
                <edit-object
                  v-else
                  :object="dfiqTree.object"
                  :is-active="isActive"
                  @success="obj => (dfiqTree.object = obj)"
                  @toggle-fullscreen="toggleFullscreen"
                />
              </template>
            </v-dialog>

            <v-dialog
              :width="editWidth"
              :fullscreen="fullScreenEdit"
              v-if="Object.keys(DFIQHierarchy).includes(dfiqTree.object?.type)"
              v-for="dfiqType in DFIQHierarchy[dfiqTree.object.type]"
            >
              <template v-slot:activator="{ props }">
                <v-btn class="me-2" size="small" density="compact" variant="outlined" v-bind="props"
                  >new {{ dfiqType }}</v-btn
                >
              </template>
              <template v-slot:default="{ isActive }">
                <edit-DFIQ-object
                  :new-type="dfiqType"
                  :is-active="isActive"
                  :redirect="false"
                  :parent="dfiqTree.object"
                  @toggle-fullscreen="toggleFullscreen"
                  @close="isActive.value = false"
                  @success="obj => emitDFIQUpdate(obj)"
                />
              </template>
            </v-dialog>
          </span>
        </span>
      </li>

      <!-- Recursive DFIQ children -->
      <li class="ml-2 border-s" v-show="dfiqTree.children && expanded" v-for="child in dfiqTree.children">
        <DFIQ-tree
          v-if="dfiqTree.object?.root_type === 'dfiq' && dfiqTree.object?.type !== 'question'"
          :treeRoot="child"
          :expanded-control="expandedControl"
          :display-indicator-types="indicatorTypesControl"
        />
      </li>
      <!-- Stop recursion if we're doing a question -->
      <li v-show="expanded" class="ml-2" v-if="dfiqTree.object?.type === 'question'">
        <ul class="ml-2 dfiq-tree">
          <li class="my-2" v-for="(approach, index) in dfiqTree.object.approaches">
            <span @click="approach.expanded = !approach.expanded">
              <v-icon color="grey-darken-2" class="me-1">{{
                approach.expanded ? "mdi-chevron-down" : "mdi-chevron-right"
              }}</v-icon>
              <v-icon color="grey-darken-2" size="x-small" class="me-2">mdi-monitor </v-icon>{{ approach.name }}
              <span class="item-controls">
                <v-dialog :width="editWidth" :fullscreen="fullScreenEdit">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      variant="text"
                      size="small"
                      icon="mdi-edit"
                      density="compact"
                      v-bind="props"
                      target="_blank"
                      class="ml-2"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                  </template>

                  <template v-slot:default="{ isActive }">
                    <edit-DFIQ-object
                      v-if="dfiqTree.object?.root_type === 'dfiq'"
                      :object="dfiqTree.object"
                      :is-active="isActive"
                      :redirect="false"
                      @success="obj => emitDFIQUpdate(obj)"
                      @deleteSuccess="obj => emitDFIQUpdate(obj)"
                      @toggle-fullscreen="toggleFullscreen"
                      :approach="index + 1"
                    />
                  </template>
                </v-dialog>
              </span>
            </span>
            <ul class="ml-4 dfiq-tree" v-show="approach.expanded">
              <!-- <li class="mt-2 ml-6" v-for="step in approach.steps.filter(step => step.type.match(/artifact|query/gi))"> -->
              <li class="mt-2 ml-6" v-for="step in approach.steps">
                <v-icon color="grey-darken-2" size="x-small" class="me-2">{{ getDFIQStepIcon(step) }}</v-icon>
                <span v-if="step.type === 'ForensicArtifact'">
                  <code class="me-2">{{ step.value }}</code>
                  <v-chip density="compact" size="small">{{ step.type }}</v-chip>
                </span>
                <span v-else-if="step.type.match(/query/gi)">
                  <span class="me-2">{{ step.name }}</span>
                  <v-chip density="compact" size="small">{{ step.type }}</v-chip>
                  <div class="indicator-preview" @click="copyText(step.value)">
                    <v-btn
                      variant="text"
                      size="small"
                      color="grey"
                      icon="mdi-content-copy"
                      density="compact"
                      class="me-2 clipboard-copy"
                      title="Copy to clipboard"
                      ripple
                    /><code>{{ step.value }}</code>
                  </div>
                </span>

                <span v-else>??{{ step.type }} {{ step.value }}</span>
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import axios from "axios";

import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";

import EditDFIQObject from "@/components/DFIQ/EditDFIQObject.vue";
import EditObject from "@/components/EditObject.vue";

export default {
  components: {
    EditDFIQObject,
    EditObject
  },
  props: {
    dfiqObject: {
      type: Object,
      default: null
    },
    dfiqObjectId: {
      type: String
    },
    treeRoot: {
      type: Object,
      default: null
    },
    expandedControl: {
      type: Boolean,
      default: true
    },
    topLevel: {
      type: Boolean,
      default: false
    },
    displayIndicatorTypes: {
      type: Array,
      default: () => {
        return [];
      }
    }
  },
  data() {
    return {
      dfiqGraph: {},
      expanded: true,
      indicatorTypesControl: [],
      editWidth: "75%",
      fullScreenEdit: false,
      DFIQHierarchy: {
        scenario: ["facet", "question"],
        facet: ["question"]
      }
    };
  },
  methods: {
    getDFIQData() {
      let params = {
        count: 0,
        source: `dfiq/${this.dfiqObjectId}`,
        graph: "links",
        min_hops: 1,
        max_hops: 5,
        direction: "outbound",
        include_original: true,
        target_types: ["forensicartifact", "query", "dfiq"]
      };
      axios.post("/api/v2/graph/search", params).then(response => {
        this.dfiqGraph = response.data;
      });
    },
    getDFIQIcon(treeItem) {
      if (!treeItem?.object?.type) {
        return null;
      }
      return (
        DFIQ_TYPES.find(type => type.type === treeItem.object.type) ||
        INDICATOR_TYPES.find(type => type.type === treeItem.object.type)
      ).icon;
    },
    getDFIQStepIcon(step) {
      if (step.type.match(/forensicartifact/gi)) {
        return "mdi-script-text-outline";
      }
      if (step.type.match(/query/gi)) {
        return "mdi-database-search";
      }
    },
    getDetailsLink(treeItem) {
      return {
        name: treeItem.object?.root_type === "dfiq" ? "DFIQDetails" : "IndicatorDetails",
        params: { id: treeItem.object?.id }
      };
    },
    copyText(text) {
      navigator.clipboard.writeText(text);
      this.$eventBus.emit("displayMessage", {
        status: "info",
        message: "Query copied to clipboard!"
      });
    },
    shouldDisplay(treeItem) {
      if (this.displayIndicatorTypes.length === 0) {
        return true;
      }
      if (!treeItem.object) {
        return false;
      }
      if (treeItem.object.type === "query" && !this.displayIndicatorTypes.includes(treeItem.object.query_type)) {
        return false;
      }
      if (treeItem.object.type === "forensicartifact" && !this.displayIndicatorTypes.includes("forensicartifact")) {
        return false;
      }
      // don't display if children are only queries with no displayIndicatorTypes
      if (
        treeItem.children?.length > 0 &&
        treeItem.children?.every(
          child => child.object.type === "query" && !this.displayIndicatorTypes.includes(child.object.query_type)
        )
      ) {
        return false;
      }
      // display only if all the children have at least one reason to be displayed
      if (treeItem.children?.length > 0) {
        return treeItem.children?.some(child => this.shouldDisplay(child));
      }
      return true;
    },
    sanitizeTitle(dfiqItem) {
      if (dfiqItem.object.type !== "query") {
        return dfiqItem.title;
      }
      return dfiqItem.title.replace(/\s*\([^)]*\)\s*$/, "");
    },
    toggleFullscreen(fullscreen: boolean) {
      this.fullScreenEdit = !this.fullScreenEdit;
      this.editWidth = fullscreen ? "100%" : "75%";
    },
    DFIQUpdated(obj) {
      if (this.topLevel) {
        this.getDFIQData();
      }
    },
    emitDFIQUpdate(obj) {
      this.$eventBus.emit("DFIQupdated", obj);
    }
  },
  computed: {
    dfiqTree() {
      if (this.treeRoot !== null) {
        return this.treeRoot;
      }
      if (!this.dfiqGraph.paths || this.dfiqGraph.paths.length == 0) {
        if (this.dfiqObject !== null) {
          return {
            id: this.dfiqObject.id,
            title: this.dfiqObject.name,
            object: this.dfiqObject,
            children: []
          };
        } else {
          return [];
        }
      }
      let root = {
        id: this.dfiqGraph.paths[0][0].source,
        title: this.dfiqGraph.vertices[this.dfiqGraph.paths[0][0].source].name,
        object: this.dfiqGraph.vertices[this.dfiqGraph.paths[0][0].source],
        children: []
      };
      this.dfiqGraph.paths.forEach(path => {
        let currentNode = root;
        path.forEach(edge => {
          let child = currentNode.children?.find(child => child.id === edge.target);
          if (!child) {
            child = {
              id: edge.target,
              title: this.dfiqGraph.vertices[edge.target].name,
              object: this.dfiqGraph.vertices[edge.target]
            };
            if (!currentNode.children) {
              currentNode.children = [];
            }
            currentNode.children.push(child);
          }
          currentNode = child;
        });
      });

      return root;
    },
    availableIndicatorTypes() {
      if (this.dfiqGraph === null) {
        return [];
      }
      const queryTypes = Object.values(this.dfiqGraph.vertices || {})
        .filter(vertex => vertex.root_type === "indicator")
        .map(vertex => vertex.query_type || vertex.type);
      return [...new Set(queryTypes)];
    }
  },
  mounted() {
    if (this.dfiqObjectId) {
      this.getDFIQData();
    }
    this.$eventBus.on("DFIQupdated", this.DFIQUpdated);
  },
  beforeUnmount() {
    this.$eventBus.off("DFIQupdated", this.DFIQUpdated);
  },
  watch: {
    expandedControl() {
      this.expanded = this.expandedControl;
    },
    displayIndicatorTypes() {
      this.indicatorTypesControl = this.displayIndicatorTypes;
    },
    dfiqObjectId() {
      this.getDFIQData();
    }
  }
};
</script>

<style scoped>
.dfiq-tree {
  list-style-type: none;
  padding-left: 0;
}

.indicator-preview {
  font-size: 0.8em;
  opacity: 0.6;
}

li > .clipboard-copy {
  opacity: 0;
}

li:hover > .clipboard-copy {
  opacity: 1;
}

.dfiq-tree .item-controls {
  display: none;
}

.dfiq-tree li:hover > span > .item-controls {
  display: inline;
}
</style>
