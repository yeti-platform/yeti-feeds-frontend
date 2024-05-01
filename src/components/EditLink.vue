<template>
  <v-card>
    <template v-slot:title>
      Edit: {{ vertices[edge.source].value || vertices[edge.source].name }}
      <v-icon>mdi-arrow-right</v-icon>
      {{ vertices[edge.target].value || vertices[edge.target].name }}</template
    >
    <v-card-text>
      <!-- <v-text-field label="Type" v-model="localEdge.type"></v-text-field> -->
      <v-combobox label="Type" v-model="localEdge.type" :items="getLinkTypeSuggestions"></v-combobox>
      <v-textarea label="Description" v-model="localEdge.description"></v-textarea>
      <div class="d-flex justify-center">
        <table>
          <tr>
            <td>
              <v-chip
                :text="vertices[edge.source].name || vertices[edge.source].value"
                :prepend-icon="getIconForType(vertices[edge.source].type)"
              />
            </td>
            <td>→</td>
            <td>
              <code>{{ localEdge.type || "?" }}</code>
            </td>
            <td>→</td>
            <td>
              <v-chip :text="vertices[edge.target].name" :prepend-icon="getIconForType(vertices[edge.target].type)" />
            </td>
          </tr>
        </table>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn append-icon="mdi-swap-horizontal" text="Swap link direction" color="primary" @click="swapLink"></v-btn>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" color="cancel" @click="isActive.value = false"></v-btn>
      <v-btn text="Save" color="primary" @click="saveLink" variant="tonal"></v-btn>
    </v-card-actions>
    <v-alert v-if="error" type="error">Error updating link: {{ error }}</v-alert>
  </v-card>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";

import { LINK_SUGGESTIONS } from "@/definitions/linkSuggestions.js";
</script>

<script lang="ts">
export default {
  components: {},
  props: {
    vertices: {
      type: Object,
      default: () => {}
    },
    edge: {
      type: Object,
      default: () => {}
    },
    isActive: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      localEdge: { ...this.edge },
      error: null
    };
  },
  mounted() {},
  methods: {
    saveLink() {
      axios
        .patch(`/api/v2/graph/${this.edge.id}`, {
          description: this.localEdge.description,
          link_type: this.localEdge.type
        })
        .then(response => {
          this.$eventBus.emit("displayMessage", { message: "Link updated succesfully!", status: "success" });
          this.isActive.value = false;
          this.$emit("success", response.data);
        })
        .catch(error => {
          this.error = error;
          console.log(error);
        })
        .finally();
    },
    swapLink() {
      axios
        .post(`/api/v2/graph/${this.edge.id}/swap`)
        .then(response => {
          this.edge["source"] = response.data["source"];
          this.edge["target"] = response.data["target"];
          this.localEdge = { ...this.edge };
          this.$eventBus.emit("displayMessage", { message: "Link direction swapped succesfully!", status: "success" });
          this.$emit("success", response.data);
        })
        .catch(error => {
          this.error = error;
          console.log(error);
        });
    },
    getIconForType(type) {
      return (
        ENTITY_TYPES.find(t => t.type === type) ||
        INDICATOR_TYPES.find(t => t.type === type) ||
        OBSERVABLE_TYPES.find(t => t.type === type)
      ).icon;
    }
  },
  computed: {
    objectType() {
      return this.objectTypes.find(type => type.type === this.objectTypeName);
    },
    getOutgoingLinkTypeSuggestions() {
      let source = this.vertices[this.edge.source];
      let target = this.vertices[this.edge.target];
      return (LINK_SUGGESTIONS[source.type] || LINK_SUGGESTIONS[source.root_type])
        .filter(suggestion => suggestion.targets.includes(target.type) || suggestion.targets.includes(target.type))
        .map(suggestion => suggestion.verb);
    },
    getIncomingLinkTypeSuggestions() {
      let source = this.vertices[this.edge.source];
      let target = this.vertices[this.edge.target];
      return (LINK_SUGGESTIONS[target.type] || LINK_SUGGESTIONS[target.root_type])
        .filter(suggestion => suggestion.targets.includes(source.type) || suggestion.targets.includes(source.type))
        .map(suggestion => suggestion.verb);
    },
    getLinkTypeSuggestions() {
      return [...new Set(this.getOutgoingLinkTypeSuggestions.concat(this.getIncomingLinkTypeSuggestions))];
    }
  }
};
</script>
