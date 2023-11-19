<template>
  <v-container fluid>
    <v-row align="start" no-gutters>
      <v-col>
        <v-card class="ma-2" variant="flat">
          <template v-slot:title>
            <code>{{ observable?.value }}</code>
          </template>
          <template v-slot:subtitle>
            <v-chip color="primary" :text="observable?.type" label></v-chip>
          </template>
          {{ observable?.context }}
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card title="Info" class="ma-2" variant="outlined">
          <v-table density="compact">
            <tbody>
              <tr v-for="field in getObservableInfoFields">
                <th>{{ field.label }}</th>
                <td>{{ observable[field.field] }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
        <v-card title="Tags" class="ma-2" variant="outlined">
          <v-combobox
            v-model="observableTags"
            chips
            clearable
            multiple
            variant="outlined"
            density="compact"
            :delimiters="[',', ' ', ';']"
            prepend-inner-icon="mdi-tag"
          >
            <template v-slot:chip="tag"> <v-chip :text="tag.item.value" label/></template>
            <template v-slot:append>
              <v-btn variant="tonal" color="primary" class="me-2" @click="saveTags">Save</v-btn>
            </template>
          </v-combobox>
        </v-card>
        <v-card title="Available analytics" class="ma-2" variant="outlined">
          more details
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-container fluid>
        <v-card variant="flat">
          <v-tabs v-model="activeTab" color="primary">
            <v-tab value="one"><v-icon size="x-large">mdi-graph</v-icon>Related observables</v-tab>
            <v-tab value="two"><v-icon size="x-large">mdi-brain</v-icon>Related entities</v-tab>
            <v-tab value="three"><v-icon size="x-large">mdi-tag</v-icon>Tag relationships</v-tab>
          </v-tabs>

          <v-card-text>
            <v-window v-model="activeTab">
              <v-window-item value="one">
                One
              </v-window-item>

              <v-window-item value="two">
                Two
              </v-window-item>

              <v-window-item value="three">
                Three
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-container>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
</script>

<script lang="ts">
export default {
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      observable: null,
      observableTags: [],
      activeTab: 0,
      observableTypes: OBSERVABLE_TYPES
    };
  },
  methods: {
    getObservableDetails() {
      axios
        .get(`/api/v2/observables/${this.id}`)
        .then(response => {
          let tagNames: string[] = [];
          this.observable = response.data;
          this.observableTags = Object.keys(this.observable.tags);
          // Switch back to Context view when reloading the page.
          this.activeTab = 0;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    saveTags() {
      var params = {
        ids: [this.id],
        strict: true,
        tags: this.observableTags
      };
      axios
        .post(`/api/v2/observables/tag`, params)
        .then(() => {
          this.getObservableDetails();
          this.$buefy.toast.open({
            message: "Tags saved!",
            type: "is-success"
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    }
  },
  computed: {
    getObservableTypeDefinition() {
      return this.observableTypes.find(typeDef => typeDef.type === this.observable?.type);
    },
    getObservableInfoFields() {
      const hideFields = ["value", "tags", "description"];
      return this.getObservableTypeDefinition?.fields.filter(field => !hideFields.includes(field.field));
    }
  },
  mounted() {
    this.getObservableDetails();
  }
};
</script>
