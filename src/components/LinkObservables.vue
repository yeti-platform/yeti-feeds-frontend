<template>
  <v-card>
    <v-card-title
      >Link observables to <span class="text-primary">{{ linkTarget.name || linkTarget.value }}</span>
    </v-card-title>
    <v-card-text>
      <v-textarea label="Add one observable per line" v-model="observables" hide-details></v-textarea>
      <div class="text-subtitle-2 mt-2">Observable data</div>

      <v-row no-gutters class="mt-2">
        <v-col cols="4">
          <v-select
            class="me-3"
            v-model="addType"
            :items="observableTypes"
            density="compact"
            placeholder="Force type"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col>
          <v-combobox
            density="compact"
            chips
            multiple
            v-model="optionalTags"
            hide-details
            placeholder="Optional tags"
            :delimiters="[',', ' ', ';']"
          ></v-combobox>
        </v-col>
      </v-row>

      <div class="text-subtitle-2 mt-2">Link metadata</div>

      <v-row no-gutters class="mt-2">
        <v-col cols="4">
          <v-text-field
            class="me-3"
            v-model="linkType"
            density="compact"
            placeholder="Link type"
            variant="outlined"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col>
          <v-text-field
            density="compact"
            v-model="linkDescription"
            hide-details
            placeholder="Link description"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row no-gutters class="mt-5">
        <v-col>
          <v-btn size="small" text @click="linkDirectionOutgoing = !linkDirectionOutgoing"> Swap direction </v-btn>
        </v-col>
        <v-col
          >Observables {{ linkDirectionOutgoing ? "→" : "←" }}
          <v-chip
            v-if="linkTarget"
            :text="linkTarget.name || linkTarget.value"
            :prepend-icon="getIconForType(linkTarget.type)"
        /></v-col>
      </v-row>

      <v-divider v-if="addedObservables.length > 0" class="my-5"></v-divider>
      <div v-if="addedObservables.length > 0">
        <p class="mt-3 mb-1 text-h6">Succesfully linked:</p>
        <v-data-table :items="addedObservables" :headers="observableTableHeaders" density="compact">
          <template v-slot:item.tags="{ item }">
            <v-chip
              v-for="tag in item.tags"
              :color="tag.fresh ? 'blue ' : 'grey'"
              :text="tag.name"
              class="mr-1"
              size="small"
            ></v-chip>
          </template>
        </v-data-table>
      </div>
      <div v-if="failedObservables.length > 0">
        <p class="mt-3 mb-1 text-h6">Failed to add:</p>
        {{ failedObservables }}
      </div>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" color="cancel" @click="isActive.value = false"></v-btn>
      <v-btn text="Link observables" @click="linkObservables"></v-btn>
    </v-card-actions>
    <v-alert v-if="errors.length > 0" type="error">
      Error saving observables:
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

import EntitySelector from "@/components/EntitySelector.vue";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions.js";

import _ from "lodash";
</script>

<script lang="ts">
export default {
  props: {
    linkTarget: {
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
      addType: "guess",
      errors: [],
      observables: "",
      optionalTags: [],
      addedObservables: [],
      failedObservables: [],
      observableTableHeaders: [
        { title: "Value", key: "value" },
        { title: "Detected type", key: "type" },
        { title: "Tags", key: "tags" }
      ],
      linkType: "manual",
      linkDescription: "Linked manually from the Web UI",
      linkDirectionOutgoing: true
    };
  },
  methods: {
    linkObservables() {
      const observables = this.observables
        .split("\n")
        .map(o => o.trim())
        .map(obs => {
          return {
            value: obs,
            type: this.addType,
            tags: this.optionalTags
          };
        });
      axios
        .post("/api/v2/observables/bulk", { observables })
        .then(response => {
          console.log(response.data);
          let message = `${response.data.added.length} observables added`;
          if (response.data.failed.length > 0) {
            message += `, ${response.data.failed.length} failed`;
          }
          this.$eventBus.emit("displayMessage", {
            status: "success",
            message: message
          });
          this.addedObservables = response.data.added;
          this.failedObservables = response.data.failed;
          this.addType = "guess";
          this.optionalTags = [];
          this.addedObservables.forEach(observable => {
            this.linkKnownObservable(observable, this.linkTarget);
          });
        })
        .catch(error => {
          this.$eventBus.emit("displayMessage", {
            status: "error",
            message: error.response.data.detail
          });
        })
        .finally(() => {});
    },
    linkKnownObservable(observable, linkTarget) {
      let params = {
        link_type: this.linkType,
        description: this.linkDescription
      };

      if (this.linkDirectionOutgoing) {
        params.source = `${observable.root_type}/${observable.id}`;
        params.target = `${linkTarget.root_type}/${linkTarget.id}`;
      } else {
        params.source = `${linkTarget.root_type}/${linkTarget.id}`;
        params.target = `${observable.root_type}/${observable.id}`;
      }

      axios.post("/api/v2/graph/add", params);
    },
    getIconForType(type) {
      return (
        ENTITY_TYPES.find(t => t.type === type) ||
        INDICATOR_TYPES.find(t => t.type === type) ||
        OBSERVABLE_TYPES.find(t => t.type === type) ||
        DFIQ_TYPES.find(t => t.type === type)
      ).icon;
    }
  },
  computed: {
    observableTypes() {
      let guess = {
        value: "guess",
        title: "Guess observable type"
      };
      return [guess, ...OBSERVABLE_TYPES.map(t => ({ value: t.type, title: t.name }))];
    }
  }
};
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
