<template>
  <v-card>
    <v-card-title>{{ object.name }}</v-card-title>
    <v-card-subtitle>Editing {{ typeDefinition.name }}</v-card-subtitle>
    <v-card-text>
      <div v-for="field in editableFields">
        <v-text-field
          v-if="field.type === 'text'"
          :label="field.label"
          v-model="localObject[field.field]"
        ></v-text-field>
        <v-textarea
          v-if="field.type === 'longtext'"
          :label="field.label"
          v-model="localObject[field.field]"
        ></v-textarea>
        <v-combobox
          v-if="field.type === 'list' && field.field !== 'tags'"
          v-model="localObject[field.field]"
          :label="field.label"
          chips
          clearable
          multiple
          density="compact"
          :delimiters="[',', ' ', ';']"
          prepend-inner-icon="mdi-tag"
        >
          <template v-slot:chip="tag"> <v-chip :text="tag.item.value" label size="large" color="primary"/></template>
        </v-combobox>

        <v-text-field
          v-if="field.type === 'date'"
          v-model="localObject[field.field]"
          :label="field.label"
        ></v-text-field>

        <v-textarea
          v-if="field.type === 'code'"
          :label="field.label"
          v-model="localObject[field.field]"
          class="yeti-code"
        ></v-textarea>

        <v-select
          v-if="field.type === 'option'"
          v-model="localObject[field.field]"
          :items="field.choices"
          :label="field.label"
          variant="outlined"
        ></v-select>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn text="Toggle full screen" color="primary" @click="toggleFullScreen"></v-btn>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" color="cancel" @click="isActive.value = false"></v-btn>
      <v-btn text="Save" color="primary" @click="saveObject" variant="tonal"></v-btn>
    </v-card-actions>
    <v-alert v-if="error" type="error">Error updating object: {{ error }}</v-alert>
  </v-card>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { objectTypeAnnotation } from "@babel/types";
</script>

<script lang="ts">
export default {
  components: {},
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
  data() {
    return {
      localObject: { ...this.object },
      error: null,
      fullScreen: false,
      typeToEndpointMapping: {
        entity: "entities",
        observable: "observables",
        indicator: "indicators"
      }
    };
  },
  mounted() {},
  methods: {
    saveObject() {
      let patchRequest = {
        type: this.object.type
      };
      this.editableFields.forEach(field => {
        patchRequest[field.field] = this.localObject[field.field];
      });

      axios
        .patch(`/api/v2/${this.typeToEndpointMapping[this.object.root_type]}/${this.object.id}`, {
          [this.object.root_type]: patchRequest
        })
        .then(response => {
          this.$eventBus.emit("displayMessage", { message: "Object updated succesfully!", status: "success" });
          this.$emit("success", response.data);
          this.isActive.value = false;
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
        ENTITY_TYPES.find(t => t.type === this.object.type) || INDICATOR_TYPES.find(t => t.type === this.object.type)
      );
    },
    editableFields() {
      return this.typeDefinition.fields.filter(field => field.editable);
    }
  }
};
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
