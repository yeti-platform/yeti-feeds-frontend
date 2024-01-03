<template>
  <v-card>
    <v-card-title
      >New link for <span class="text-primary">{{ object.name }}</span>
    </v-card-title>
    <v-card-text>
      <entity-selector @selected-object="selection => (linkTarget = selection)" />
      <v-text-field label="Link type" v-model="linkType"></v-text-field>
      <v-textarea label="Link description (supports markdown)" v-model="linkDescription"></v-textarea>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" color="cancel" @click="isActive.value = false"></v-btn>
      <v-btn text="Save" :disabled="linkTarget === null" @click="createLink"></v-btn>
    </v-card-actions>
    <v-alert v-if="errors.length > 0" type="error">
      Error saving {{ typeDefinition.name }}:
      <ul>
        <li v-for="error in errors">
          <strong>{{ error.field }}</strong
          >: {{ error.message }}
        </li>
      </ul>
    </v-alert>
  </v-card>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import EntitySelector from "@/components/EntitySelector.vue";

import _ from "lodash";
</script>

<script lang="ts">
export default {
  props: {
    object: {
      type: Object,
      default: () => {}
    },
    isActive: {
      type: Object,
      default: () => {}
    }
  },
  components: {
    EntitySelector
  },
  data() {
    return {
      errors: [],
      items: [],
      linkTarget: null,
      linkType: "",
      linkDescription: "",
      autocompleteLoading: false
    };
  },
  methods: {
    createLink() {
      axios
        .post("/api/v2/graph/add", {
          source: `${this.object.root_type}/${this.object.id}`,
          target: `${this.linkTarget.root_type}/${this.linkTarget.id}`,
          link_type: this.linkType,
          description: this.linkDescription
        })
        .then(response => {
          this.isActive.value = false;
          this.$eventBus.emit("displayMessage", {
            message: `Link succesfully created`,
            status: "success"
          });
          const linkData = {
            source: {
              id: this.object.id,
              root_type: this.object.root_type,
              type: this.object.type,
              name: this.object.name
            },
            target: {
              id: this.linkTarget.id,
              root_type: this.linkTarget.root_type,
              type: this.linkTarget.type,
              name: this.linkTarget.name
            },
            link_type: this.linkType,
            description: this.linkDescription,
            id: response.data.id
          };
          this.$eventBus.emit("linkCreated", linkData);
        })
        .catch(error => {
          this.errors = error.response.data.errors;
        });
    }
  }
};
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
