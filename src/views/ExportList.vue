<template>
  <task-list
    selectable-tasks
    downloadable-tasks
    task-type="export"
    ref="exportList"
    @taskSelected="task => selectExport(task)"
    @taskDownload="task => downloadExport(task)"
    :display-columns="[
      'name',
      'template_name',
      'acts_on',
      'frequency',
      'last_run',
      'description',
      'status',
      'toggle',
      'refresh'
    ]"
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
      <div class="d-flex">
        <v-text-field
          class="w-50"
          density="compact"
          label="Run every"
          v-model="selectedExport.human_frequency"
        ></v-text-field>
        <!-- select hours, days, minutes, etc -->
        <v-select density="compact" v-model="frequencyUnit" :items="['hours', 'days', 'minutes', 'seconds']"></v-select>
      </div>

      <v-btn-group rounded="1" density="compact">
        <v-btn color="primary" density="compact" v-if="selectedExport.id" @click="updateExport">Save changes</v-btn>
        <v-btn color="error" density="compact" v-if="selectedExport.id" @click="confirmDeleteExport">Delete</v-btn>
        <v-btn color="primary" density="compact" v-if="!selectedExport.id" @click="newExport">Add new export</v-btn>
        <v-btn color="light" density="compact" @click="selectedExport = {}">Clear</v-btn>
      </v-btn-group>
      <p class="mt-4">
        Available templates are loaded from
        <code>{{ appStore.systemConfig?.system.templates_dir }}/*.jinja2</code>. If you're using Docker mounts, check
        your Docker config file.
      </p>
    </v-sheet>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import axios from "axios";
import TaskList from "@/components/TaskList.vue";
import moment from "moment";
import { useAppStore } from "@/store/app";
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
      timerListTemplates: null,
      frequencyUnit: "hours",
      appStore: useAppStore()
    };
  },
  mounted() {
    this.listTemplates();
    this.appStore.fetchSystemConfig();
  },
  created() {
    this.timerListTemplates = setInterval(this.listTemplates, 5000);
  },
  unmounted() {
    clearInterval(this.timerListTemplates);
  },
  methods: {
    listTemplates() {
      axios
        .post("/api/v2/templates/search", { name: "" })
        .then(response => (this.exportTemplates = response.data.templates.map(template => template.name)))
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    selectExport(task) {
      this.selectedExport = task;
      this.selectedExport.human_frequency = moment.duration(task.frequency).asHours();
      this.frequencyUnit = "hours";
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
        template_name: this.selectedExport.template_name,
        frequency: moment.duration(this.selectedExport.human_frequency, this.frequencyUnit)
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
        include_tags: this.selectedExport.include_tags,
        frequency: moment.duration(this.selectedExport.human_frequency, this.frequencyUnit)
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
          let fileName = `${singleExport.name}_${singleExport.last_run}.txt`;
          fileLink.href = fileURL;
          fileLink.download = fileName;
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
