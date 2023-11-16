<template>
  <v-data-table-server
    :itemsLength="total"
    :items-per-page="perPage"
    :headers="headers"
    density="compact"
    :items="items"
    @update:options="loadOjects"
    :search="search"
    :show-select="showSelect"
    :item-value="item => item.id"
    v-model="selectedObservables"
  >
    <template v-slot:item.tags="{ item }">
      <v-chip
        v-for="name in Object.keys(item.tags)"
        :color="item.tags[name].fresh ? 'blue ' : 'red'"
        :text="name"
        class="mx-1"
        label
        size="small"
      ></v-chip>
    </template>
  </v-data-table-server>
  <v-navigation-drawer permament location="right" width="400" ref="drawer">
    <v-list-item class="mt-4">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search observables"
        variant="outlined"
        density="compact"
        class="mt-2"
      />
    </v-list-item>
    <v-divider></v-divider>
    <v-expansion-panels>
      <v-expansion-panel title="Bulk actions" @group:selected="showSelect = $event.value">
        <v-expansion-panel-text>
          <v-card title="Bulk tag" class="pb-4" rounded="0" variant="flat">
            <v-combobox v-model="bulkTags" chips clearable multiple variant="outlined" density="compact">
              <template v-slot:chip="tag"> <v-chip :text="tag.item.value" label/></template>
            </v-combobox>
            <v-btn density="compact" variant="tonal" color="primary" class="me-2">Apply</v-btn>
            <small>Will apply {{ bulkTags.length }} tags to {{ selectedObservables.length }} observables</small>
          </v-card>
          <v-card title="Export observables" class="pb-4" rounded="0" variant="flat">
            <v-autocomplete
              label="Select template"
              variant="outlined"
              density="compact"
              :items="exportTemplates"
              item-title="name"
              v-model="selectedExportTemplate"
            ></v-autocomplete>
            <!-- <v-btn density="compact" variant="tonal" class="me-2" @click="selectedExportTemplate = null">Clear</v-btn> -->
            <v-btn density="compact" variant="tonal" color="primary" class="me-2">Export</v-btn>
            <small>Will export {{ selectedObservables.length || total }} observables</small>
          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import axios from "axios";
</script>

<script lang="ts">
export default {
  data() {
    return {
      items: [],
      headers: [
        { title: "Value", key: "value" },
        { title: "Tags", key: "tags" },
        { title: "Type", key: "type" }
      ],
      page: 0,
      perPage: 20,
      total: 0,
      search: "",
      showSelect: false,
      selectedObservables: [],
      bulkTags: [],
      exportTemplates: [],
      selectedExportTemplate: null
    };
  },
  methods: {
    loadOjects({ page, itemsPerPage, sortBy }) {
      axios
        .post("http://localhost:3000/api/v2/observables/search", {
          query: { value: this.search },
          count: itemsPerPage,
          page: page - 1
        })
        .then(response => {
          console.log(response);
          this.items = response.data.observables;
          this.total = response.data.total;
        });
    },
    loadExportTemplates() {
      axios
        .post("/api/v2/templates/search", { query: { name: "" } })
        .then(response => {
          console.log(response.data.templates);
          this.exportTemplates = response.data.templates;
        })
        .catch(error => {
          console.log(error);
        });
    }
  },
  mounted() {
    this.loadExportTemplates();
  }
};
</script>
