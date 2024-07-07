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
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import ObjectFields from "@/components/ObjectFields.vue";
</script>

<script lang="ts">
export default {
  components: { ObjectFields },
  props: {
    objectType: {
      type: String,
      default: () => ""
    },
    redirect: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      newObject: {},
      errors: [],
      fullScreen: false,
      typeToEndpointMapping: {
        entity: "entities/",
        observable: "observables/extended",
        indicator: "indicators/"
      },
      typeToSavedObjectPath: {
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
          if (this.redirect) {
            this.$router.push({ path: `/${this.typeToSavedObjectPath[this.newObject.root_type]}/${response.data.id}` });
          } else {
            this.$emit("close");
          }
          this.$emit("success", response.data);
        })
        .catch(error => {
          if (error.response.status === 422) {
            this.errors = error.response.data.detail.map(detail => {
              return { field: detail.loc[3], message: detail.msg };
            });
          } else {
            this.errors = [{ field: "details", message: error.response.data.detail }];
            return;
          }
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
        ENTITY_TYPES.find(t => t.type === this.objectType) ||
        INDICATOR_TYPES.find(t => t.type === this.objectType) ||
        OBSERVABLE_TYPES.find(t => t.type === this.objectType)
      );
    },
    editableFields() {
      return this.typeDefinition.fields.filter(field => field.editable);
    },
    objectRootType() {
      if (ENTITY_TYPES.find(t => t.type === this.objectType)) {
        return "entity";
      } else if (INDICATOR_TYPES.find(t => t.type === this.objectType)) {
        return "indicator";
      } else if (OBSERVABLE_TYPES.find(t => t.type === this.objectType)) {
        return "observable";
      } else {
        return "unknown";
      }
    }
  }
};
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
