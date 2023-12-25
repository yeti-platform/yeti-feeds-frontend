<template>
  <v-card>
    <v-card-title>New {{ typeDefinition.name }}</v-card-title>
    <v-card-text>
      <object-fields :fields="editableFields" :object="newObject" />
    </v-card-text>

    <v-card-actions>
      <v-btn text="Toggle full screen" color="primary" @click="toggleFullScreen"></v-btn>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" color="cancel" @click="$emit('close')"></v-btn>
      <v-btn text="Save" @click="saveObject" variant="tonal"></v-btn>
    </v-card-actions>
    <v-alert v-if="error" type="error">Error saving {{ typeDefinition.name }}: {{ error }}</v-alert>
  </v-card>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import ObjectFields from "@/components/ObjectFields.vue";
import { objectTypeAnnotation } from "@babel/types";
</script>

<script lang="ts">
export default {
  components: { ObjectFields },
  props: {
    objectType: {
      type: String,
      default: () => ""
    }
  },
  data() {
    return {
      newObject: {},
      error: null,
      fullScreen: false,
      typeToEndpointMapping: {
        entity: "entities",
        observable: "observables",
        indicator: "indicators"
      }
    };
  },
  mounted() {
    this.newObject = {
      type: this.objectType,
      root_type: this.objectRootType
    };
  },
  methods: {
    saveObject() {
      let request = {
        type: this.objectType
      };
      this.editableFields.forEach(field => {
        request[field.field] = this.newObject[field.field];
      });

      axios
        .post(`/api/v2/${this.typeToEndpointMapping[this.newObject.root_type]}`, {
          [this.newObject.root_type]: request
        })
        .then(response => {
          this.$eventBus.emit("displayMessage", { message: `New ${this.objectType} created`, status: "success" });
          this.$router.push({
            name: response.data.root_type == "entity" ? "EntityDetails" : "IndicatorDetials",
            params: { id: response.data.id, type: response.data.type }
          });
        })
        .catch(error => {
          this.error = error.response.data.detail;
          console.log(error);
        })
        .finally();
    },
    toggleFullScreen() {
      this.fullScreen = !this.fullScreen;
      this.$emit("toggle-fullscreen", this.fullScreen);
    }
  },
  computed: {
    typeDefinition() {
      return (
        ENTITY_TYPES.find(t => t.type === this.objectType) || INDICATOR_TYPES.find(t => t.type === this.objectType)
      );
    },
    editableFields() {
      return this.typeDefinition.fields.filter(field => field.editable);
    },
    objectRootType() {
      return ENTITY_TYPES.find(t => t.type === this.objectType) ? "entity" : "indicator";
    }
  }
};
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
