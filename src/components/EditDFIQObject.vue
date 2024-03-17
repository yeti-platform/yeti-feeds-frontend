<template>
  <v-card>
    <v-card-title>{{ localObject.name }}</v-card-title>
    <v-card-subtitle>Editing DFIQ {{ localObject.type }}</v-card-subtitle>
    <v-card-text>
      <v-textarea class="yeti-code" label="DFIQ Yaml" auto-grow v-model="localObject.dfiq_yaml"></v-textarea>
      <div v-if="yamlValidationError === 'valid'">
        <v-alert type="success">YAML is valid!</v-alert>
      </div>
      <div v-else-if="yamlValidationError.length > 0 && localObject.dfiq_yaml.length > 0">
        <v-alert type="error"
          ><strong>Invalid YAML</strong> {{ yamlValidationError }}
          <br />
          Please revise the
          <a :href="'https://dfiq.org/contributing/specification/#' + localObject.type" target="_blank">
            DFIQ spec for {{ localObject.type }}
          </a>
        </v-alert>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn text="Toggle full screen" color="primary" @click="toggleFullScreen"></v-btn>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" color="cancel" @click="isActive.value = false"></v-btn>
      <v-btn
        :disabled="yamlValidationError !== 'valid'"
        text="Save"
        color="primary"
        @click="saveObject"
        variant="tonal"
      ></v-btn>
    </v-card-actions>
    <v-alert v-if="errors.length > 0" type="error">
      Error saving DFIQ {{ localObject.type }}:
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
import _ from "lodash";
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
      validatingYaml: false,
      yamlValidationError: ""
    };
  },
  mounted() {},
  methods: {
    validateDFIQYaml() {
      this.validatingYaml = "primary";
      axios
        .post(`/api/v2/dfiq/validate`, {
          dfiq_type: this.localObject.type,
          dfiq_yaml: this.localObject.dfiq_yaml,
          check_id: false
        })
        .then(response => {
          if (!response.data.valid) {
            this.yamlValidationError = response.data.error;
          } else {
            this.yamlValidationError = "valid";
          }
          this.validatingYaml = false;
        });
    },
    saveObject() {
      let patchRequest = {
        dfiq_type: this.localObject.type,
        dfiq_yaml: this.localObject.dfiq_yaml
      };

      axios
        .patch(`/api/v2/dfiq/${this.localObject.id}`, patchRequest)
        .then(response => {
          this.$eventBus.emit("displayMessage", {
            message: "DFIQ object succesfully updated",
            status: "success"
          });
          this.$emit("success", response.data);
          this.isActive.value = false;
        })
        .catch(error => {
          if (error.response.status === 422) {
            this.errors = error.response.data.detail
              .filter(detail => detail.loc[2] === this.typeDefinition.modelName)
              .map(detail => {
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
  watch: {
    "localObject.dfiq_yaml": _.debounce(function () {
      this.validateDFIQYaml();
    }, 500)
  }
};
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
