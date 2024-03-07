<template>
  <v-card>
    <v-card-title
      >Link observables to <span class="text-primary">{{ linkTarget.name }}</span>
    </v-card-title>
    <v-card-text>
      <v-textarea label="Add one observable per line" v-model="observables" hide-details></v-textarea>
      <div class="d-flex pl-0 mt-3">
        <v-select
          class="me-3"
          v-model="addType"
          :items="observableTypes"
          density="compact"
          placeholder="Force type"
          variant="outlined"
          hide-details
        ></v-select>
        <v-combobox
          density="compact"
          chips
          multiple
          v-model="optionalTags"
          hide-details
          placeholder="Optional tags"
          :delimiters="[',', ' ', ';']"
        ></v-combobox>
      </div>
      <v-divider v-if="addedObservables.length > 0" class="my-5"></v-divider>
      <div v-if="addedObservables.length > 0">
        <p class="mt-3 mb-1 text-h6">Succesfully linked:</p>
        <v-data-table :items="addedObservables" :headers="observableTableHeaders" density="compact">
          <template v-slot:item.tags="{ item }">
            <v-chip
              v-for="name in Object.keys(item.tags)"
              :color="item.tags[name].fresh ? 'blue ' : 'red'"
              :text="name"
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
      ]
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
        source: `${observable.root_type}/${observable.id}`,
        target: `${linkTarget.root_type}/${linkTarget.id}`,
        link_type: "manual link",
        description: "Linked manually from the Web UI"
      };
      axios.post("/api/v2/graph/add", params);
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
