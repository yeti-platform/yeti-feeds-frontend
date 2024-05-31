<template>
  <v-card>
    <v-card-title>New {{ typeDefinition.name }}</v-card-title>
    <v-card-subtitle v-if="parent !== null"
      >Parent ID {{ parent.dfiq_id }} pre-populated from {{ parent.type }} "{{ parent.name }}""</v-card-subtitle
    >
    <v-card-text>
      <v-textarea
        class="yeti-code"
        label="DFIQ Yaml"
        auto-grow
        v-model="newDFIQYaml"
        :loading="validatingYaml"
      ></v-textarea>
      <div v-if="yamlValidationError === 'valid'">
        <v-alert type="success">YAML is valid!</v-alert>
      </div>
      <div v-else-if="yamlValidationError.length > 0 && newDFIQYaml.length > 0">
        <v-alert type="error"
          ><strong>Invalid YAML</strong> {{ yamlValidationError }}
          <br />
          Please revise the
          <a :href="'https://dfiq.org/contributing/specification/#' + typeDefinition.type" target="_blank">
            DFIQ spec for {{ typeDefinition.name }}
          </a>
        </v-alert>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn text="Toggle full screen" color="primary" @click="toggleFullScreen"></v-btn>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" color="cancel" @click="$emit('close')"></v-btn>

      <v-btn
        :disabled="yamlValidationError !== 'valid'"
        text="Save"
        color="primary"
        @click="saveObject"
        variant="tonal"
      ></v-btn>
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

import { DFIQ_TYPES, DFIQ_TEMPLATES } from "@/definitions/dfiqDefinitions.js";
import ObjectFields from "@/components/ObjectFields.vue";
import _ from "lodash";
</script>

<script lang="ts">
export default {
  components: { ObjectFields },
  props: {
    objectType: {
      type: String,
      default: () => ""
    },
    parent: {
      type: Object,
      default: null
    },
    isActive: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      newObject: {},
      newDFIQYaml: this.getTemplateForType(this.objectType),
      yamlValidationError: "",
      errors: [],
      fullScreen: false,
      validatingYaml: false
    };
  },
  methods: {
    validateDFIQYaml() {
      this.validatingYaml = "primary";
      axios
        .post(`/api/v2/dfiq/validate`, {
          dfiq_type: this.objectType,
          dfiq_yaml: this.newDFIQYaml,
          check_id: true
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
      let request = {
        type: this.objectType
      };
      axios
        .post(`/api/v2/dfiq/from_yaml`, {
          dfiq_type: this.objectType,
          dfiq_yaml: this.newDFIQYaml
        })
        .then(response => {
          this.$eventBus.emit("displayMessage", { message: `New ${this.objectType} created`, status: "success" });
          this.$emit("success", response.data);
          this.isActive.value = false;
          if (this.parent === null) {
            this.$router.push({ path: `/dfiq/${response.data.id}` });
          }
        })
        .catch(error => {
          console.log(error);
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
    },
    getTemplateForType(type) {
      let template = DFIQ_TEMPLATES[type];
      // replace all instances of placeholder IDs (e.g. S1999) with "<parentId>"
      if (this.parent !== null) {
        template = template.replace(/[SFQ]1999/g, this.parent.dfiq_id);
      }
      return template;
    }
  },
  computed: {
    typeDefinition() {
      return DFIQ_TYPES.find(t => t.type === this.objectType);
    },
    editableFields() {
      return this.typeDefinition.fields.filter(field => field.editable);
    },
    objectRootType() {
      if (DFIQ_TYPES.find(t => t.type === this.objectType)) {
        return "dfiq";
      } else {
        return "unknown";
      }
    }
  },
  watch: {
    newDFIQYaml: _.debounce(function () {
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
