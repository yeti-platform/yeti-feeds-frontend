<template>
  <v-container>
    <v-row>
      <v-col>
        <div class="text-h4 mb-4">Search & add observables</div>
        <v-textarea v-model="textSearch" auto-grow></v-textarea>
        <div class="d-flex pl-0">
          <v-btn @click="searchObservables" class="me-3">Launch search</v-btn>

          <v-checkbox-btn v-model="addAndTag" label="Tag and add missing observables"></v-checkbox-btn>
          <v-select
            v-if="addAndTag"
            class="me-3"
            v-model="addTypeSearch"
            :items="observableTypes"
            density="compact"
            placeholder="Force type"
            variant="outlined"
            hide-details
          ></v-select>
          <v-combobox
            v-if="addAndTag"
            density="compact"
            chips
            multiple
            v-model="addTagsSearch"
            hide-details
            placeholder="Optional tags"
            :delimiters="[',', ' ', ';']"
          ></v-combobox>
        </div>
      </v-col>
    </v-row>
    <v-row v-if="searchResults">
      <v-col>
        <v-row>
          <v-col cols="3">
            <v-card class="mb-4">
              <v-card-title
                >Related entities
                <v-chip density="comfortable" class="ml-3">{{ entityMatches.length }}</v-chip></v-card-title
              >
              <v-card-text v-if="entityMatches.length > 0">
                <v-data-table
                  density="compact"
                  :items="entityMatches"
                  :headers="[
                    { title: 'Entity', key: 'name' },
                    { title: 'Link type', key: 'link' }
                  ]"
                >
                  <template v-slot:item.name="{ item }">
                    <router-link :to="{ name: 'EntityDetails', params: { id: item.id } }">
                      <v-icon start>{{ getIconForEntityType(item.type) }}</v-icon>
                      {{ item.name }}
                    </router-link>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col>
            <v-card class="mb-4">
              <v-card-title
                >Indicator matches
                <v-chip density="comfortable" class="ml-3">{{ indicatorMatches.length }}</v-chip>
              </v-card-title>
              <v-card-text v-if="indicatorMatches.length > 0">
                <v-data-table
                  density="compact"
                  :items="indicatorMatches"
                  :headers="[
                    { title: 'Name', key: 'name' },
                    { title: 'Observable value', key: 'observableValue' },
                    { title: 'Diamond edge', key: 'diamond' },
                    { title: 'Suggested tags', key: 'relevantTags' }
                  ]"
                >
                  <template v-slot:item.name="{ item }">
                    <router-link :to="{ name: 'IndicatorDetails', params: { id: item.id } }">
                      {{ item.name }}
                    </router-link>
                  </template>
                  <template v-slot:item.observableValue="{ item }">
                    <code>{{ item.observableValue }}</code>
                  </template>
                  <template v-slot:item.tags="{ item }">
                    <v-chip
                      v-for="name in Object.keys(item.tags)"
                      :color="item.tags[name].fresh ? 'blue' : 'grey'"
                      :text="name"
                      class="me-1"
                      size="small"
                    ></v-chip>
                  </template>
                  <template v-slot:item.relevantTags="{ item }">
                    <v-chip v-for="tag in item.relevantTags" color="grey" class="me-1" size="small">{{ tag }}</v-chip>
                  </template>
                  <template v-slot:item.created="{ item }">
                    {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss") }}
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-card class="mb-4">
          <v-card-title
            >Known observables
            <v-chip density="comfortable" class="ml-3">{{ searchResults.known.length }}</v-chip></v-card-title
          >
          <v-card-text v-if="searchResults.known.length > 0">
            <div class="d-flex v-col-4 pl-0">
              <v-btn
                prepend-icon="mdi-tag"
                class="me-3"
                variant="tonal"
                @click="tagKnown"
                :disabled="addTagsKnown.length === 0"
                >Tag
                {{
                  selectedKnown.length === 0 || selectedKnown.length == searchResults.unknown.length
                    ? "all"
                    : selectedKnown.length
                }}</v-btn
              >
              <v-combobox
                density="compact"
                chips
                multiple
                v-model="addTagsKnown"
                hide-details
                placeholder="Tags"
                :delimiters="[',', ' ', ';']"
              ></v-combobox>
            </div>
            <v-data-table
              density="compact"
              :items="searchResults.known"
              :headers="[
                { title: 'Value', key: 'value' },
                { title: 'Type', key: 'type' },
                { title: 'Tags', key: 'tags' },
                { title: 'Context', key: 'context' },
                { title: 'Created (UTC)', key: 'created' }
              ]"
              show-select
              v-model="selectedKnown"
              return-object
              :item-value="item => item.value"
            >
              <template v-slot:item.value="{ item }">
                <router-link :to="{ name: 'ObservableDetails', params: { id: item.id } }">
                  {{ item.value }}
                </router-link>
              </template>
              <template v-slot:item.tags="{ item }">
                <v-chip
                  v-for="name in Object.keys(item.tags)"
                  :color="item.tags[name].fresh ? 'blue' : 'grey'"
                  :text="name"
                  class="me-1"
                  size="small"
                ></v-chip>
              </template>
              <template v-slot:item.context="{ item }">
                <v-chip v-for="ctx in item.context" color="green" :text="ctx.source" class="me-1" size="small"></v-chip>
              </template>
              <template v-slot:item.created="{ item }">
                {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss") }}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title
            >Unknown observables
            <v-chip density="comfortable" class="ml-3">{{ searchResults.unknown.length }}</v-chip>
          </v-card-title>
          <v-card-subtitle v-if="searchResults.unknown.length > 0">
            Add unknown observables, with optional tags. Type will be guessed unless specified.
          </v-card-subtitle>
          <v-card-text v-if="searchResults.unknown.length > 0">
            <div class="d-flex v-col-4 pl-0">
              <v-btn
                prepend-icon="mdi-plus"
                class="me-3"
                variant="tonal"
                @click="addUknown"
                :disabled="selectedUnknown.length === 0"
                >Add
                {{
                  selectedUnknown.length === 0 || selectedUnknown.length == searchResults.unknown.length
                    ? "all"
                    : selectedUnknown.length
                }}</v-btn
              >
              <v-select
                class="me-3"
                v-model="addTypeUnknown"
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
                v-model="addTagsUnknown"
                hide-details
                placeholder="Optional tags"
                :delimiters="[',', ' ', ';']"
              ></v-combobox>
            </div>
            <v-data-table
              show-select
              v-model="selectedUnknown"
              :item-value="item => item.value"
              density="compact"
              :items="searchResults.unknown.map(obs => ({ value: obs }))"
            ></v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import axios from "axios";
import moment from "moment";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
</script>

<script lang="ts">
export default {
  name: "ObservableMatch",
  components: {},
  data() {
    return {
      // search field
      textSearch: "",
      searchResults: null,
      addAndTag: false,
      addTypeSearch: "guess",
      addTagsSearch: [],
      // add / tag known / unknown observables
      addTagsKnown: [],
      addTagsUnknown: [],
      addTypeUnknown: "guess",
      selectedUnknown: [],
      selectedKnown: []
    };
  },
  methods: {
    searchObservables() {
      var params = {
        // split newlines, trim whitespace, remove empty lines
        observables: this.textSearch
          .split("\n")
          .filter(line => line.length > 0)
          .map(line => line.trim()),
        add_unknown: this.addAndTag,
        add_tags: this.addTagsSearch,
        add_type: this.addTypeSearch
      };
      axios
        .post("/api/v2/graph/match", params)
        .then(response => {
          this.searchResults = response.data;
        })
        .catch(error => {
          return console.log(error);
        })
        .finally(() => {});
    },
    tagKnown() {
      const params = {
        ids: this.selectedKnown.map(obs => obs.id),
        tags: this.addTagsKnown
      };

      axios
        .post("/api/v2/observables/tag", params)
        .then(response => {
          let message = `${response.data.tagged} observables tagged`;
          this.$eventBus.emit("displayMessage", {
            status: "success",
            message: message
          });
          this.selectedKnown = [];
          this.addTagsKnown = [];
          this.searchObservables();
        })
        .catch(error => {
          this.$eventBus.emit("displayMessage", {
            status: "error",
            message: error.response.data.detail
          });
        })
        .finally(() => {});
    },
    addUknown() {
      const observables = this.selectedUnknown.map(obs => {
        return {
          value: obs,
          tags: this.addTagsUnknown,
          type: this.addTypeUnknown
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
          this.selectedUnknown = [];
          this.addTypeUnknown = "guess";
          this.addTagsUnknown = [];
          this.searchObservables();
        })
        .catch(error => {
          this.$eventBus.emit("displayMessage", {
            status: "error",
            message: error.response.data.detail
          });
        })
        .finally(() => {});
    },
    getIconForEntityType(type) {
      return ENTITY_TYPES.find(t => t.type === type).icon;
    }
  },
  computed: {
    entityMatches() {
      return this.searchResults?.entities.map(entity => {
        return {
          name: entity[1].name,
          type: entity[1].type,
          id: entity[1].id,
          link: entity[0].type
        };
      });
    },
    indicatorMatches() {
      return this.searchResults?.matches.map(match => {
        return {
          observableValue: match[0],
          name: match[1].name,
          id: match[1].id,
          diamond: match[1].diamond,
          relevantTags: match[1].relevant_tags
        };
      });
    },
    observableTypes() {
      let guess = {
        value: "guess",
        title: "Guess type"
      };
      return [guess, ...OBSERVABLE_TYPES.map(t => ({ value: t.type, title: t.name }))];
    }
  }
};
</script>

<style lang="scss">
.add-tags label {
  vertical-align: middle;
}

.hidden {
  opacity: 0;
}

.searching.column {
  margin-top: 5em;
}
</style>
