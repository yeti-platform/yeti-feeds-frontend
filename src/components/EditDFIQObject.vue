<template>
  <v-card>
    <v-card-title>{{ object.name || object.value }}</v-card-title>
    <v-card-subtitle>Editing DFIQ {{ object.type }}</v-card-subtitle>
    <v-card-text>
      <v-textarea class="yeti-code" label="DFIQ Yaml" auto-grow v-model="object.dfiq_yaml"></v-textarea>
    </v-card-text>

    <v-card-actions>
      <v-btn text="Toggle full screen" color="primary" @click="toggleFullScreen"></v-btn>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" color="cancel" @click="isActive.value = false"></v-btn>
      <v-btn text="Save" color="primary" @click="saveDFIQObject" variant="tonal"></v-btn>
    </v-card-actions>
    <v-alert v-if="errors.length > 0" type="error">
      Error saving DFIQ {{ object.type }}:
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
      }
    };
  },
  mounted() {},
  methods: {
    saveDFIQObject() {
      let patchRequest = {
        dfiq_type: this.object.type,
        dfiq_yaml: this.object.dfiq_yaml
      };

      axios
        .patch(`/api/v2/dfiq/${this.object.id}`, patchRequest)
        .then(response => {
          this.$eventBus.emit("displayMessage", {
            message: "DFIQ object succesfully updated",
            status: "success"
          });
          this.$emit("success", response.data);
          this.isActive.value = false;
        })
        .catch(error => {
          console.log(error);
          this.errors = error.response.data.detail
            .filter(detail => detail.loc[1] !== "type")
            .map(detail => {
              return { field: detail.loc[1], message: detail.msg };
            });
        })
        .finally();
    },
    toggleFullScreen() {
      this.fullScreen = !this.fullScreen;
      this.$emit("toggle-fullscreen", this.fullScreen);
    }
  }
};
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
