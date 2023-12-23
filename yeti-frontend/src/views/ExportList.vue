<template>
  <div class="columns">
    <task-list
      selectable-tasks
      task-type="export"
      ref="exportList"
      @taskSelected="task => (this.selectedExport = task)"
    >
    </task-list>

    <v-navigation-drawer permament location="right" width="400" ref="drawer">
      <v-sheet class="ma-4">
        <v-text-field
          density="compact"
          label="Name"
          v-model="selectedExport.name"
          required
          ref="exportName"
        ></v-text-field>
        <v-text-field density="compact" label="Description" v-model="selectedExport.description"></v-text-field>
        <v-combobox
          chips
          clearable
          multiple
          density="compact"
          :delimiters="[',', ' ', ';']"
          label="Include tags"
          v-model="selectedExport.include_tags"
        ></v-combobox>
        <v-combobox
          chips
          clearable
          multiple
          density="compact"
          :delimiters="[',', ' ', ';']"
          label="Ignore tags"
          v-model="selectedExport.ignore_tags"
        ></v-combobox>
        <v-combobox
          chips
          clearable
          multiple
          density="compact"
          :delimiters="[',', ' ', ';']"
          label="Exclude tags"
          v-model="selectedExport.exclude_tags"
        ></v-combobox>
        <v-autocomplete
          label="Acts on"
          density="compact"
          multiple
          chips
          v-model="selectedExport.acts_on"
          :items="defaultTypes"
          placeholder="Add observable types"
        ></v-autocomplete>
        <v-autocomplete
          density="compact"
          variant="outlined"
          v-model="selectedExport.template_name"
          :items="exportTemplates"
          placeholder="Select template to use"
          required
          ref="exportTemplate"
        ></v-autocomplete>
        <v-btn-group rounded="1" density="compact">
          <v-btn color="primary" density="compact" v-if="selectedExport.id" @click="updateExport">Save changes</v-btn>
          <v-btn color="error" density="compact" v-if="selectedExport.id" @click="confirmDeleteExport">Delete</v-btn>
          <v-btn color="primary" density="compact" v-if="!selectedExport.id" @click="newExport">Add new export</v-btn>
          <v-btn color="light" density="compact" @click="selectedExport = {}">Clear</v-btn>
        </v-btn-group>
        <v-btn
          color="blue-darken-1"
          density="compact"
          variant="text"
          to="/exports/templates"
          target="_blank"
          class="pa-0 mt-5"
        >
          Open new template page
        </v-btn>
      </v-sheet>
    </v-navigation-drawer>
  </div>
</template>

<script lang="ts" setup>
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import axios from "axios";
import TaskList from "@/components/TaskList.vue";
</script>

<script lang="ts">
export default {
  name: "ExportList",
  components: {
    TaskList
  },
  data() {
    return {
      defaultTypes: OBSERVABLE_TYPES.map(type => {
        return { value: type.type, title: type.name };
      }),
      exports: [],
      exportTemplates: [],
      selectedExport: {},
      timerListTemplates: null
    };
  },
  mounted() {
    this.listTemplates();
  },
  created() {
    this.timerListTemplates = setInterval(this.listTemplates, 2000);
  },
  beforeDestroy() {
    clearInterval(this.timerListTemplates);
  },
  methods: {
    listTemplates() {
      axios
        .post("/api/v2/templates/search", { query: { name: "" } })
        .then(response => (this.exportTemplates = response.data.templates.map(template => template.name)))
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    updateExport() {
      let exportTask = {
        id: this.selectedExport.id,
        name: this.selectedExport.name,
        description: this.selectedExport.description,
        include_tags: this.selectedExport.include_tags,
        ignore_tags: this.selectedExport.ignore_tags,
        exclude_tags: this.selectedExport.exclude_tags,
        acts_on: this.selectedExport.acts_on,
        template_name: this.selectedExport.template_name
      };

      axios
        .patch(`/api/v2/tasks/export/${this.selectedExport.name}`, { export: exportTask })
        .then(() => {
          this.$eventBus.emit("displayMessage", {
            status: "success",
            message: `Export ${this.selectedExport.name} succesfully updated`
          });
          this.$eventBus.emit("taskUpdated", this.selectedExport);
          this.selectedExport = {};
        })
        .catch(error => console.log(error))
        .finally(() => {});
    },
    newExport() {
      let exportTask = {
        name: this.selectedExport.name,
        acts_on: this.selectedExport.acts_on,
        description: this.selectedExport.description,
        template_name: this.selectedExport.template_name,
        exclude_tags: this.selectedExport.exclude_tags,
        ignore_tags: this.selectedExport.ignore_tags,
        include_tags: this.selectedExport.include_tags
      };
      axios
        .post(`/api/v2/tasks/export/new`, { export: exportTask })
        .then(() => {
          this.$eventBus.emit("displayMessage", {
            status: "success",
            message: `Export ${this.selectedExport.name} succesfully created`
          });
          this.$eventBus.emit("taskUpdated", this.selectedExport);
          this.selectedExport = {};
        })
        .catch(error => console.log(error))
        .finally(() => {});
    },
    confirmDeleteExport() {
      if (confirm("Are you sure you want to delete this export?")) {
        this.deleteExport();
      }
    },
    deleteExport() {
      axios
        .delete(`/api/v2/tasks/export/${this.selectedExport.name}`)
        .then(() => {
          this.$eventBus.emit("displayMessage", {
            status: "success",
            message: `Export ${this.selectedExport.name} succesfully deleted`
          });
          this.$eventBus.emit("taskUpdated", this.selectedExport);
          this.selectedExport = {};
        })
        .catch(error => console.log(error))
        .finally(() => {});
    },
    downloadExport(singleExport) {
      axios
        .get(`/api/v2/tasks/export/${singleExport.id}/content`)
        .then(response => {
          var fileURL = window.URL.createObjectURL(new Blob([response.data]));
          var fileLink = document.createElement("a");
          var fileName = response.headers["content-disposition"].split("filename=")[1];
          fileLink.href = fileURL;
          fileLink.setAttribute("download", fileName);
          document.body.appendChild(fileLink);
          fileLink.click();
        })
        .catch(error => {
          console.log(error);
        });
    },
    formatTimestamp(timestamp, local) {
      return utils.formatTimestamp(timestamp, local);
    }
  }
};
</script>
