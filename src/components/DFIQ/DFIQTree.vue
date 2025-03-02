<template>
  <div>
    <v-container fluid v-if="topLevel">
      <v-row>
        <v-btn @click="expandAll = !expandAll" class="me-2" variant="outlined">
          <v-icon size="x-large">{{ expandAll ? "mdi-chevron-down" : "mdi-chevron-right" }}</v-icon>
          {{ expandAll ? "Collapse all" : "Expand all" }}</v-btn
        >
        <v-text-field
          v-model="dfiqTreeFilterControl"
          density="compact"
          variant="outlined"
          label="Filter items"
          hide-details
          max-width="600"
          clearable
          prepend-inner-icon="mdi-filter"
        ></v-text-field>
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
            {{ sanitizeTitle(dfiqTree) }}

            <span>
              <v-chip
                class="mr-2"
                density="comfortable"
                variant="tonal"
                color="primary"
                size="small"
                rounded
                v-for="tag in dfiqTree.object.dfiq_tags"
                >{{ tag }}</v-chip
              >
            </span>

            <span class="me-2"></span>
            <v-chip density="compact" size="small" v-if="dfiqTree.object.type === 'query'">{{
              dfiqTree.object.query_type
            }}</v-chip>
          </span>

          <span class="item-controls">
            <v-tooltip location="top" :open-delay="300">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" class="mr-1 text-disabled" size="small">mdi-information</v-icon>
              </template>
              <span
                ><v-chip size="x-small">{{ dfiqTree.object.type }}</v-chip> {{ dfiqTree.object.description }}</span
              >
            </v-tooltip>
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
      <li
        class="ml-2 border-s"
        v-show="dfiqTree.children && (expanded || (dfiqTreeFilter !== '' && shouldDisplay(dfiqTree)))"
        v-for="child in dfiqTree.children"
      >
        <DFIQ-tree
          v-if="dfiqTree.object?.root_type === 'dfiq' && dfiqTree.object?.type !== 'question'"
          :treeRoot="child"
          :expanded-control="topLevel ? expandAll : expandedControl"
          :dfiq-tree-filter="topLevel ? dfiqTreeFilterControl : dfiqTreeFilter"
        />
      </li>
      <!-- Stop recursion if we're doing a question -->
      <li v-show="expanded" class="ml-2" v-if="dfiqTree.object?.type === 'question'">
        <ul class="ml-2 dfiq-tree">
          <li
            class="my-2"
            v-for="(approach, index) in dfiqTree.object.approaches.filter(a => shouldDisplayApproach(a))"
          >
            <span @click="approach.expanded = !approach.expanded">
              <v-icon color="grey-darken-2" class="me-1">{{
                approach.expanded ? "mdi-chevron-down" : "mdi-chevron-right"
              }}</v-icon>
              <span class="inline">
                <v-icon color="grey-darken-2" size="x-small" class="me-2">mdi-monitor </v-icon>
                {{ approach.name }}
                <v-chip
                  v-for="tag in approach.tags"
                  class="ml-2"
                  density="comfortable"
                  variant="tonal"
                  color="primary"
                  size="small"
                  rounded
                  >{{ tag }}</v-chip
                >
              </span>

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
            <ul
              class="ml-4 dfiq-tree"
              v-show="approach.expanded || (dfiqTreeFilter !== '' && shouldDisplayApproach(approach))"
            >
              <li class="mt-2 ml-6" v-for="step in approach.steps.filter(s => shouldDisplayStep(s))">
                <v-icon color="grey-darken-2" size="x-small" class="me-2">{{ getDFIQStepIcon(step) }}</v-icon>
                <span v-if="step.type?.match(/artifact/gi)">
                  <code class="me-2">{{ step.value }}</code>
                  <v-chip density="compact" size="small">{{ step.type }}</v-chip>
                </span>
                <span v-else>
                  <span class="me-2">{{ step.name }}</span>
                  <v-chip v-if="step.type" density="compact" size="small">{{ step.type }}</v-chip>
                  <div v-if="step.value" class="indicator-preview clipboard-copy" @click="copyText(step.value)">
                    <v-btn
                      variant="text"
                      size="small"
                      color="grey"
                      icon="mdi-content-copy"
                      density="compact"
                      class="me-2 clipboard-copy-button"
                      title="Copy to clipboard"
                      ripple
                    /><code>{{ step.value }}</code>
                  </div>
                </span>
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
    dfiqTreeFilter: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      dfiqGraph: {},
      expanded: true,
      expandAll: true,
      editWidth: "75%",
      fullScreenEdit: false,
      DFIQHierarchy: {
        scenario: ["facet", "question"],
        facet: ["question"]
      },
      dfiqTreeFilterControl: ""
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
      if (step.type === null) {
        return "mdi-cog";
      }
      if (step.type.match(/forensicartifact/gi)) {
        return "mdi-script-text-outline";
      }
      if (step.type.match(/query/gi)) {
        return "mdi-database-search";
      }
      return "mdi-cog";
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
      if (this.dfiqTreeFilter === "") {
        return true;
      }
      if (treeItem.object.name.includes(this.dfiqTreeFilter)) {
        return true;
      }
      if (treeItem.object.type === "question") {
        return treeItem.object.approaches?.some(approach => this.shouldDisplayApproach(approach));
      }
      if (treeItem.children?.length > 0) {
        return treeItem.children?.some(child => this.shouldDisplay(child));
      }

      return false;
    },
    shouldDisplayApproach(approach) {
      if (approach?.steps?.some(step => this.shouldDisplayStep(step))) {
        return true;
      }
      if (approach?.name.includes(this.dfiqTreeFilter)) {
        return true;
      }
    },
    shouldDisplayStep(step) {
      const fields = ["name", "value", "type", "stage"];
      return fields.some(f => step[f]?.includes(this.dfiqTreeFilter));
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
    },
    expandCheck(expansion) {
      this.expanded = expansion;
      if (this.dfiqTree.object.type === "question") {
        this.dfiqTree.object.approaches.forEach(approach => {
          approach.expanded = expansion;
        });
      }
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
      this.expandCheck(this.expandedControl);
    },
    expandAll() {
      this.expandCheck(this.expandAll);
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

.clipboard-copy > .clipboard-copy-button {
  opacity: 0;
}

.clipboard-copy:hover > .clipboard-copy-button {
  opacity: 1;
}

.dfiq-tree .item-controls {
  display: none;
}

.dfiq-tree li:hover > span > .item-controls {
  display: inline;
}
</style>
