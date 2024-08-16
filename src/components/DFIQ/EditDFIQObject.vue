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

          <v-autocomplete
            v-if="localObject.type === 'approach'"
            label="Parent question"
            v-model="parsedYaml.parent_id"
            :items="possibleParents"
            item-text="name"
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
          <v-textarea
            v-if="localObject.type !== 'approach'"
            label="Description"
            v-model="parsedYaml.description"
            density="compact"
          ></v-textarea>

          <v-expansion-panels v-else-if="parsedYaml.description" class="mb-4 pa-1">
            <v-expansion-panel title="Details & references">
              <v-expansion-panel-text>
                <v-textarea label="Details" v-model="parsedYaml.description.details" density="compact"></v-textarea>
                <v-divider class="my-4"></v-divider>
                <v-btn
                  @click="newReference(true)"
                  prepend-icon="mdi-plus"
                  density="compact"
                  variant="outlined"
                  class="mr-2"
                >
                  internal ref.</v-btn
                >
                <v-btn @click="newReference(false)" prepend-icon="mdi-plus" density="compact" variant="outlined">
                  external ref.</v-btn
                >
                <div class="mt-4">
                  <v-text-field
                    v-for="(ref, index) in parsedYaml.description.references"
                    v-model="parsedYaml.description.references[index]"
                    label="Reference"
                    density="compact"
                    :append-icon="'mdi-close-circle-outline'"
                    @click:append="parsedYaml.description.references.splice(index, 1)"
                  ></v-text-field>
                  <v-text-field
                    v-for="(ref, index) in parsedYaml.description.references_internal"
                    v-model="parsedYaml.description.references_internal[index]"
                    label="Internal reference"
                    density="compact"
                    :append-icon="'mdi-close-circle-outline'"
                    @click:append="parsedYaml.description.references_internal.splice(index, 1)"
                  ></v-text-field>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel title="View data">
              <v-expansion-panel-text>
                <v-row dense>
                  <v-col>Type</v-col>
                  <v-col>Value</v-col>
                  <v-col cols="1">
                    <v-btn variant="text" @click="parsedYaml.view.data.push({ type: '', value: '' })">
                      <v-icon>mdi-plus-circle-outline</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row dense v-for="(ref, index) in parsedYaml.view.data">
                  <v-col>
                    <v-combobox
                      v-model="parsedYaml.view.data[index].type"
                      density="compact"
                      hide-details
                      :items="valueTypes"
                    ></v-combobox>
                  </v-col>
                  <v-col>
                    <v-text-field
                      v-model="parsedYaml.view.data[index].value"
                      density="compact"
                      hide-details
                    ></v-text-field>
                  </v-col>
                  <v-col cols="1">
                    <v-btn variant="text" @click="parsedYaml.view.data.splice(index, 1)">
                      <v-icon>mdi-close-circle-outline</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>
                <div class="text-subtitle-1 font-weight-medium">View notes</div>
                <div class="mb-2 mt-2">
                  <v-icon color="green" class="mr-2">mdi-check-circle-outline</v-icon>Covered
                  <v-btn
                    @click="parsedYaml.view.notes.covered.push('')"
                    prepend-icon="mdi-plus"
                    density="compact"
                    variant="outlined"
                    class="ml-2"
                    >Add</v-btn
                  >
                </div>
                <v-textarea
                  v-for="(ref, index) in parsedYaml.view.notes.covered"
                  rows="1"
                  class="mb-2"
                  density="compact"
                  auto-grow
                  hide-details
                  v-model="parsedYaml.view.notes.covered[index]"
                  :append-icon="'mdi-close-circle-outline'"
                  @click:append="parsedYaml.view.notes.covered.splice(index, 1)"
                ></v-textarea>
                <v-divider class="my-4"></v-divider>
                <div class="mb-2 mt-2">
                  <v-icon color="red" class="mr-2">mdi-cancel</v-icon>Not covered
                  <v-btn
                    @click="parsedYaml.view.notes.not_covered.push('')"
                    prepend-icon="mdi-plus"
                    density="compact"
                    variant="outlined"
                    class="ml-2"
                    >Add</v-btn
                  >
                </div>
                <v-textarea
                  rows="1"
                  class="mb-2"
                  auto-grow
                  density="compact"
                  hide-details
                  v-for="(ref, index) in parsedYaml.view.notes.not_covered"
                  v-model="parsedYaml.view.notes.not_covered[index]"
                  :append-icon="'mdi-close-circle-outline'"
                  @click:append="parsedYaml.view.notes.not_covered.splice(index, 1)"
                ></v-textarea>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel title="View processors">
              <v-expansion-panel-text>
                <v-btn
                  @click="
                    parsedYaml.view.processors.push({
                      name: '',
                      options: [{ type: '', value: '' }],
                      analysis: [{ name: '', steps: [{ type: '', description: '', value: '' }] }]
                    })
                  "
                  prepend-icon="mdi-plus"
                  density="compact"
                  variant="outlined"
                  >Add processor</v-btn
                >

                <span v-for="(processor, index) in parsedYaml.view.processors">
                  <div class="text-subtitle-1 font-weight-bold mt-4 mb-4">
                    Processor #{{ index + 1 }}
                    <v-btn
                      variant="text"
                      density="compact"
                      @click="parsedYaml.view.processors.splice(index, 1)"
                      class="ml-2"
                      size="x-small"
                    >
                      remove
                    </v-btn>
                  </div>
                  <v-text-field
                    label="Processor name"
                    v-model="processor.name"
                    density="compact"
                    hide-details
                  ></v-text-field>
                  <v-divider class="my-4"></v-divider>
                  <div class="mb-4">
                    <span class="text-subtitle-1 font-italic">Processor options</span>
                    <v-btn
                      @click="parsedYaml.view.processors[index].options.push({ type: '', value: '' })"
                      prepend-icon="mdi-plus"
                      density="compact"
                      variant="outlined"
                      class="ml-4"
                      >Add option</v-btn
                    >
                  </div>

                  <v-row dense v-for="(option, optionIndex) in processor.options" class="ml-2">
                    <v-col>
                      <v-text-field
                        v-model="parsedYaml.view.processors[index].options[optionIndex].type"
                        density="compact"
                        hide-details
                        placeholder="Option"
                      ></v-text-field>
                    </v-col>
                    <v-col>
                      <v-text-field
                        v-model="parsedYaml.view.processors[index].options[optionIndex].value"
                        density="compact"
                        hide-details
                        placeholder="Value"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="1">
                      <v-btn variant="text" @click="parsedYaml.view.processors[index].options.splice(optionIndex, 1)">
                        <v-icon>mdi-close-circle-outline</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>

                  <v-divider class="my-4"></v-divider>
                  <div class="mb-4">
                    <span class="text-subtitle-1 font-italic">Analysis methods</span>
                    <v-btn
                      @click="
                        parsedYaml.view.processors[index].analysis.push({
                          name: '',
                          steps: []
                        })
                      "
                      prepend-icon="mdi-plus"
                      density="compact"
                      variant="outlined"
                      class="ml-4"
                      >Add analysis method</v-btn
                    >
                  </div>

                  <div v-for="(analysis, analysisIndex) in processor.analysis" class="pl-4 border-s-sm mb-10">
                    <v-text-field
                      label="Analysis method name"
                      v-model="parsedYaml.view.processors[index].analysis[analysisIndex].name"
                      density="compact"
                      hide-details
                      :append-icon="'mdi-close-circle-outline'"
                      @click:append="parsedYaml.view.processors[index].analysis.splice(analysisIndex, 1)"
                      max-width="300px"
                    ></v-text-field>
                    <v-divider class="my-4"></v-divider>
                    <div class="mb-6">
                      <span class="text-subtitle-1 font-italic">Steps</span>
                      <v-btn
                        @click="
                          parsedYaml.view.processors[index].analysis[analysisIndex].steps.push({
                            type: '',
                            description: '',
                            value: ''
                          })
                        "
                        prepend-icon="mdi-plus"
                        density="compact"
                        variant="outlined"
                        class="ml-4"
                        >Add step</v-btn
                      >
                    </div>

                    <div v-for="(step, stepIndex) in analysis.steps" class="mb-4 ml-4">
                      <div class="font-weight-bold mt-4 mb-2">
                        Step #{{ stepIndex + 1 }}
                        <v-btn
                          variant="text"
                          @click="parsedYaml.view.processors[index].analysis[analysisIndex].steps.splice(stepIndex, 1)"
                          size="x-small"
                        >
                          remove
                        </v-btn>
                      </div>
                      <v-row dense>
                        <v-col cols="4">
                          <v-combobox
                            v-model="parsedYaml.view.processors[index].analysis[analysisIndex].steps[stepIndex].type"
                            density="compact"
                            hide-details
                            placeholder="Type, e.g. opensearch-query"
                            :items="stepTypes"
                          ></v-combobox>
                        </v-col>
                        <v-col>
                          <v-text-field
                            v-model="
                              parsedYaml.view.processors[index].analysis[analysisIndex].steps[stepIndex].description
                            "
                            density="compact"
                            hide-details
                            placeholder="Description"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                      <v-row dense>
                        <v-col>
                          <v-text-field
                            v-model="parsedYaml.view.processors[index].analysis[analysisIndex].steps[stepIndex].value"
                            density="compact"
                            hide-details
                            placeholder='Query, e.g. data_type:"fs:stat" AND filename:"*crontab*"'
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </div>
                    <!-- </div> -->
                  </div>
                </span>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!-- <pre v-if="parsedYaml">{{ renderedYaml }}</pre> -->
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
import { DFIQ_APPROACH_VIEW_TYPES, DFIQ_APPROACH_VIEW_PROCESSOR_STEP_TYPES } from "@/definitions/dfiqDefinitions.js";
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
      valueTypes: DFIQ_APPROACH_VIEW_TYPES,
      stepTypes: DFIQ_APPROACH_VIEW_PROCESSOR_STEP_TYPES,
      possibleParents: [],
      DFIQParentHierarchy: {
        facet: ["scenario"],
        question: ["facet", "scenario"],
        approach: ["question"]
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
    parentSearchFilter(itemTitle, queryText, item) {
      const inId = item.raw.dfiq_id.toLowerCase().includes(queryText.toLowerCase());
      const inTitle = itemTitle.toLowerCase().includes(queryText.toLowerCase());
      return inId || inTitle;
    },
    fetchDFIQConfig() {
      axios.get("/api/v2/dfiq/config").then(response => {
        this.valueTypes = response.data.approach_data_sources;
        this.stepTypes = response.data.approach_analysis_step_types;
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

      if (this.localObject.type === "approach") {
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

      if (this.localObject.type === "approach") {
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
    newReference(internal: boolean) {
      if (internal) {
        if (!this.parsedYaml.description.references_internal) {
          this.parsedYaml.description.references_internal = [];
        }
        this.parsedYaml.description.references_internal.push("");
      } else {
        if (!this.parsedYaml.description.references) {
          this.parsedYaml.description.references = [];
        }
        this.parsedYaml.description.references.push("");
      }
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
.yeti-code textarea {
  font-family: monospace;
}
</style>
