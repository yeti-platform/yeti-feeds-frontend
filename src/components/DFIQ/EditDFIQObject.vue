<template>
  <v-card>
    <v-card-title>{{ localObject.name }}</v-card-title>
    <v-card-subtitle>{{ newType !== "" ? "Creating" : "Editing" }} DFIQ {{ localObject.type }}</v-card-subtitle>
    <v-card-subtitle v-if="parent !== null"
      >Parent ID {{ parent.dfiq_id }} pre-populated from {{ parent.type }} "{{ parent.name }}""</v-card-subtitle
    >
    <v-card-text>
      <v-tabs v-model="activeTab" color="primary">
        <v-tab value="user-form">Form</v-tab>
        <v-tab v-if="parsedYaml.type === 'question'" value="approaches">Approaches</v-tab>
        <v-tab value="yaml">YAML</v-tab>
      </v-tabs>
      <v-window v-model="activeTab">
        <v-window-item value="user-form" class="mt-4">
          <v-text-field
            label="UUID"
            v-model="parsedYaml.uuid"
            density="compact"
            readonly
            :disabled="!!parsedYaml.uuid"
            append-inner-icon="mdi-refresh"
            @click:appendInner="newUUID"
          ></v-text-field>

          <v-text-field
            label="DFIQ ID (e.g. S0001, F0001, Q0001, Q0001.10)"
            v-model="parsedYaml.id"
            density="compact"
          ></v-text-field>
          <v-text-field label="Display name" v-model="parsedYaml.display_name" density="compact"></v-text-field>
          <v-autocomplete
            v-if="['question', 'facet'].includes(localObject.type)"
            label="Parents"
            v-model="parsedYaml.parent_ids"
            :items="possibleParents"
            item-text="name"
            multiple
            item-value="uuid"
            item-title="name"
            density="compact"
            dense
            chips
            :custom-filter="parentSearchFilter"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" title="">{{ item.raw.name }}</v-list-item>
            </template>
          </v-autocomplete>
          <v-text-field
            label="DFIQ Version"
            v-model="parsedYaml.dfiq_version"
            disabled
            density="compact"
          ></v-text-field>
          <v-combobox
            label="Tags"
            v-model="parsedYaml.tags"
            chips
            multiple
            density="compact"
            :delimiters="[',', ' ', ';']"
          ></v-combobox>
          <v-textarea label="Description" v-model="parsedYaml.description" density="compact"></v-textarea>
        </v-window-item>

        <v-window-item value="approaches" class="mt-4">
          <v-expansion-panels>
            <v-expansion-panel :title="approach.name" v-for="approach in parsedYaml.approaches">
              <v-expansion-panel-text>
                <div class="text-h6 mb-4">Main info</div>
                <v-text-field
                  class="mb-4"
                  label="Approach name"
                  v-model="approach.name"
                  density="compact"
                  hide-details
                ></v-text-field>
                <v-textarea
                  class="mb-4"
                  label="Description"
                  v-model="approach.description"
                  density="compact"
                  hide-details
                ></v-textarea>
                <v-combobox
                  label="Tags"
                  v-model="approach.tags"
                  chips
                  multiple
                  hint="Use tag 'internal' to mark internal approaches"
                  density="compact"
                  :delimiters="[',', ' ', ';']"
                ></v-combobox>

                <v-divider class="my-6"></v-divider>

                <div>
                  <span class="text-h6 mr-4">
                    References
                    <span class="text-medium-emphasis font-weight-light">({{ approach.references.length }})</span>
                  </span>
                  <v-btn
                    class="my-2"
                    @click="approach.references.push('')"
                    prepend-icon="mdi-plus"
                    density="compact"
                    variant="outlined"
                  >
                    add reference</v-btn
                  >
                </div>
                <v-text-field
                  class="mb-2"
                  v-for="(ref, index) in approach.references"
                  v-model="approach.references[index]"
                  label="Reference"
                  density="compact"
                  hide-details
                  :append-icon="'mdi-close-circle-outline'"
                  @click:append="approach.references.splice(index, 1)"
                ></v-text-field>

                <v-divider class="my-6"></v-divider>

                <strong class="text-h6"
                  >Coverage notes
                  <span class="text-medium-emphasis font-weight-light"
                    >({{ approach.notes.covered.length }} / {{ approach.notes.not_covered.length }})</span
                  ></strong
                >
                <div class="my-2">
                  <v-icon color="green" class="mr-2">mdi-check-circle-outline</v-icon>Covered
                  <v-btn
                    @click="approach.notes.covered.push('')"
                    prepend-icon="mdi-plus"
                    density="compact"
                    variant="outlined"
                    class="mx-2"
                  >
                    add</v-btn
                  >
                </div>
                <v-textarea
                  v-for="(ref, index) in approach.notes.covered"
                  v-model="approach.notes.covered[index]"
                  rows="1"
                  class="mb-2"
                  density="compact"
                  auto-grow
                  hide-details
                  :append-icon="'mdi-close-circle-outline'"
                  @click:append="approach.notes.covered.splice(index, 1)"
                ></v-textarea>
                <v-divider class="my-3"></v-divider>

                <div class="my-2">
                  <v-icon color="red" class="mr-2">mdi-cancel</v-icon>Not covered

                  <v-btn
                    @click="approach.notes.not_covered.push('')"
                    prepend-icon="mdi-plus"
                    density="compact"
                    variant="outlined"
                    class="mx-2"
                  >
                    add</v-btn
                  >
                </div>
                <v-textarea
                  v-for="(ref, index) in approach.notes.not_covered"
                  v-model="approach.notes.not_covered[index]"
                  rows="1"
                  class="mb-2"
                  density="compact"
                  auto-grow
                  hide-details
                  :append-icon="'mdi-close-circle-outline'"
                  @click:append="approach.notes.not_covered.splice(index, 1)"
                ></v-textarea>

                <v-divider class="my-8"></v-divider>

                <div class="mb-4">
                  <span class="text-h6 mr-4"
                    >Steps
                    <span class="text-medium-emphasis font-weight-light">({{ approach.steps.length }})</span>
                  </span>
                  <v-btn
                    @click="approach.steps.push(newApproachStep())"
                    prepend-icon="mdi-plus"
                    density="compact"
                    variant="outlined"
                  >
                    Add step</v-btn
                  >
                </div>
                <div v-for="(step, index) in approach.steps" class="my-2 ml-4">
                  <v-row dense align="center">
                    <v-col cols="1"
                      ><span class="font-weight-bold">Step {{ index + 1 }}</span></v-col
                    >
                    <v-col>
                      <v-text-field
                        v-model="approach.steps[index].name"
                        label="Step name"
                        density="compact"
                        hide-details
                        :append-icon="'mdi-close-circle-outline'"
                        @click:append="approach.steps.splice(index, 1)"
                      >
                      </v-text-field>
                    </v-col>
                  </v-row>
                  <v-row dense>
                    <v-col>
                      <v-combobox
                        v-model="approach.steps[index].type"
                        label="Type"
                        density="compact"
                        hide-details
                        :items="stepTypes"
                      ></v-combobox>
                    </v-col>
                    <v-col>
                      <v-combobox
                        v-model="approach.steps[index].stage"
                        label="Stage"
                        density="compact"
                        hide-details
                        :items="stageTypes"
                      ></v-combobox>
                    </v-col>
                  </v-row>
                  <v-row dense>
                    <v-col>
                      <v-text-field
                        v-model="approach.steps[index].value"
                        class="yeti-code"
                        label="Value"
                        density="compact"
                        hide-details
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <v-row dense>
                    <v-col>
                      <v-text-field
                        v-model="approach.steps[index].description"
                        label="Description"
                        density="compact"
                        hide-details
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <v-divider class="my-8"></v-divider>
                </div>

                <v-btn
                  @click="parsedYaml.approaches.splice(parsedYaml.approaches.indexOf(approach), 1)"
                  prepend-icon="mdi-delete"
                  density="compact"
                  variant="outlined"
                  color="cancel"
                  class="mr-2"
                  >Remove approach</v-btn
                >
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          <v-btn
            prepend-icon="mdi-plus"
            @click="parsedYaml.approaches.push(newApproach())"
            density="compact"
            variant="outlined"
            class="my-4"
            >Add approach</v-btn
          >
        </v-window-item>

        <v-window-item value="yaml" class="mt-4">
          <v-textarea class="yeti-code" label="DFIQ Yaml" auto-grow v-model="localObject.dfiq_yaml"></v-textarea>
        </v-window-item>
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
      </v-window>
    </v-card-text>

    <v-card-actions>
      <v-btn text="Toggle full screen" color="primary" @click="toggleFullScreen"></v-btn>
      <v-spacer></v-spacer>
      <v-btn
        v-if="newType === ''"
        text="Delete object"
        color="cancel"
        variant="tonal"
        @click="dialogDelete = true"
      ></v-btn>
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

import ObjectFields from "@/components/ObjectFields.vue";
import { DFIQ_TYPES, DFIQ_TEMPLATES } from "@/definitions/dfiqDefinitions.js";

import _ from "lodash";
import { parse, stringify } from "yaml";
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
    },
    newType: {
      type: String,
      default: ""
    },
    parent: {
      type: Object,
      default: null
    },
    redirect: {
      type: Boolean,
      default: true
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
      yamlValidationError: "",
      updateApproachIndicators: true,
      dialogDelete: false,
      activeTab: "user-form",
      parsedYaml: {},
      dfiqYaml: "",
      stageTypes: [],
      stepTypes: [],
      possibleParents: [],
      DFIQParentHierarchy: {
        facet: ["scenario"],
        question: ["facet", "scenario"]
      }
    };
  },
  mounted() {
    if (this.newType !== "") {
      let template = DFIQ_TEMPLATES[this.newType];
      if (this.parent !== null) {
        template = template.replace("PARENT_UUID_PLACEHOLDER", this.parent.uuid);
      }
      // replace UUID_PLACEHOLDER with a new UUID
      template = template.replace("UUID_PLACEHOLDER", crypto.randomUUID());
      this.localObject.type = this.newType;
      this.localObject.dfiq_yaml = template;
      this.dfiqYaml = template;
    } else {
      this.dfiqYaml = this.localObject.dfiq_yaml;
    }
    this.loadPossibleParents();
    this.fetchDFIQConfig();
  },
  methods: {
    newApproach() {
      return {
        name: "New approach",
        description: "",
        tags: [],
        references: [],
        notes: { covered: [], not_covered: [] },
        steps: []
      };
    },
    newApproachStep() {
      return {
        name: "",
        description: "",
        type: "",
        stage: "",
        value: ""
      };
    },
    parentSearchFilter(itemTitle, queryText, item) {
      const inId = item.raw.dfiq_id.toLowerCase().includes(queryText.toLowerCase());
      const inTitle = itemTitle.toLowerCase().includes(queryText.toLowerCase());
      return inId || inTitle;
    },
    fetchDFIQConfig() {
      axios.get("/api/v2/dfiq/config").then(response => {
        this.stageTypes = response.data.stage_types;
        this.stepTypes = response.data.step_types;
      });
    },
    loadPossibleParents() {
      // Scenarios don't have parents
      if (this.localObject.type === "scenario") {
        return;
      }
      axios
        .post("/api/v2/dfiq/search", {
          query: { name: "" },
          count: 0
        })
        .then(response => {
          this.possibleParents = response.data.dfiq.filter(dfiq => {
            return this.DFIQParentHierarchy[this.localObject.type].includes(dfiq.type);
          });
        });
    },
    validateDFIQYaml() {
      this.validatingYaml = "primary";
      axios
        .post(`/api/v2/dfiq/validate`, {
          dfiq_type: this.localObject.type,
          dfiq_yaml: this.localObject.dfiq_yaml,
          check_id: this.newType !== ""
        })
        .then(response => {
          if (!response.data.valid) {
            this.yamlValidationError = response.data.error;
          } else {
            this.yamlValidationError = "valid";
            this.dfiqYaml = this.localObject.dfiq_yaml;
          }
          this.validatingYaml = false;
        });
    },
    createObject() {
      let createRequest = {
        dfiq_type: this.localObject.type,
        dfiq_yaml: this.localObject.dfiq_yaml,
        update_indicators: false
      };

      if (this.localObject.type === "question") {
        createRequest.update_indicators = this.updateApproachIndicators;
      }

      axios
        .post(`/api/v2/dfiq/from_yaml`, createRequest)
        .then(response => {
          this.$eventBus.emit("displayMessage", {
            message: "DFIQ object succesfully created",
            status: "success"
          });
          this.$emit("success", response.data);
          this.isActive.value = false;
          // parent is set in dfiqtree view
          if (this.redirect) {
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
    saveObject() {
      if (this.newType !== "") {
        this.createObject();
        return;
      }

      let patchRequest = {
        dfiq_type: this.localObject.type,
        dfiq_yaml: this.localObject.dfiq_yaml,
        update_indicators: false
      };

      if (this.localObject.type === "question") {
        patchRequest.update_indicators = this.updateApproachIndicators;
      }

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
        .delete(`/api/v2/dfiq/${this.object.id}`)
        .then(response => {
          this.$eventBus.emit("displayMessage", {
            message: `DFIQ ${this.object.id} succesfully deleted`,
            status: "success"
          });
          this.$emit("deleteSuccess", response.data);
          this.isActive.value = false;
          if (this.redirect) {
            this.$router.replace({ path: "/dfiq" });
          }
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
    },
    newUUID() {
      this.parsedYaml.uuid = crypto.randomUUID();
    }
  },
  computed: {
    renderedYaml() {
      return stringify(this.parsedYaml);
    }
  },
  watch: {
    "localObject.dfiq_yaml": _.debounce(function () {
      this.validateDFIQYaml();
    }, 500),
    dfiqYaml() {
      this.parsedYaml = parse(this.dfiqYaml);
    },
    renderedYaml() {
      this.localObject.dfiq_yaml = stringify(this.parsedYaml);
    }
  }
};
</script>

<style>
.yeti-code textarea,
.yeti-code input {
  font-family: monospace;
}
</style>
