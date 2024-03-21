<template>
  <v-card>
    <v-card-title>{{ object.name || object.value }}</v-card-title>
    <v-card-subtitle>Editing {{ typeDefinition.name }}</v-card-subtitle>
    <v-card-text>
      <object-fields :fields="editableFields" :object="localObject" />
    </v-card-text>

    <v-card-actions>
      <v-btn text="Toggle full screen" color="primary" @click="toggleFullScreen"></v-btn>
      <v-spacer></v-spacer>
      <v-btn text="Delete object" color="cancel" variant="tonal" @click="dialogDelete = true"></v-btn>
      <v-btn text="Cancel" color="cancel" @click="isActive.value = false"></v-btn>
      <v-btn text="Save" color="primary" @click="saveObject" variant="tonal"></v-btn>
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
    <v-dialog v-model="dialogDelete" max-width="420px">
      <v-card>
        <v-card-title class="text-h6">Are you sure you want to delete this item?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="light" variant="text" @click="dialogDelete = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="deleteObject">Delete</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions.js";
import ObjectFields from "@/components/ObjectFields.vue";
</script>

<script lang="ts">
export default {
  components: { ObjectFields },
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
      errors: [],
      fullScreen: false,
      typeToEndpointMapping: {
        entity: "entities",
        observable: "observables",
        indicator: "indicators",
        dfiq: "dfiq"
      },
      dialogDelete: false
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
          this.$eventBus.emit("displayMessage", {
            message: `${this.object.name || "Observable"} succesfully updated`,
            status: "success"
          });
          this.$emit("success", response.data);
          this.isActive.value = false;
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
    deleteObject() {
      axios
        .delete(`/api/v2/${this.typeToEndpointMapping[this.object.root_type]}/${this.object.id}`)
        .then(response => {
          this.$eventBus.emit("displayMessage", {
            message: `${this.object.name || "Observable"} succesfully deleted`,
            status: "success"
          });
          this.$emit("success", response.data);
          this.isActive.value = false;
          this.$router.replace({ path: `/${this.typeToEndpointMapping[this.object.root_type]}` });
        })
        .catch(error => {
          this.errors = [{ field: "details", message: error.response.data.detail }];
          return;
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
        ENTITY_TYPES.find(t => t.type === this.object.type) ||
        INDICATOR_TYPES.find(t => t.type === this.object.type) ||
        OBSERVABLE_TYPES.find(t => t.type === this.object.type) ||
        DFIQ_TYPES.find(t => t.type === this.object.type)
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
