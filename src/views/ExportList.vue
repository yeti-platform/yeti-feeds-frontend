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

<script setup lang="ts">
import moment from "moment";
import { onMounted, onUnmounted, ref } from "vue";

import TaskList from "@/components/TaskList.vue";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions";
import { eventBus } from "@/plugins/eventbus";
import * as tasksApi from "@/services/tasks";
import * as templatesApi from "@/services/templates";
import type { ExportTask } from "@/services/types";
import { useAppStore } from "@/store/app";

/** The drawer form: an export task, plus the frequency in `frequencyUnit`s. */
type ExportForm = Partial<ExportTask> & { human_frequency?: number | string };

const appStore = useAppStore();

const defaultTypes = OBSERVABLE_TYPES.map(type => ({ value: type.type, title: type.name }));
const exportTemplates = ref<string[]>([]);
const selectedExport = ref<ExportForm>({});
const frequencyUnit = ref<"hours" | "days" | "minutes" | "seconds">("hours");

let templatesTimer: ReturnType<typeof setInterval> | undefined;

async function listTemplates() {
  const response = await templatesApi.search({ name: "" });
  exportTemplates.value = response.templates.map(template => template.name);
}

/** The payload the API expects, built from the drawer form. */
function exportPayload() {
  const form = selectedExport.value;
  return {
    name: form.name,
    description: form.description,
    include_tags: form.include_tags,
    ignore_tags: form.ignore_tags,
    exclude_tags: form.exclude_tags,
    acts_on: form.acts_on,
    template_name: form.template_name,
    frequency: moment.duration(Number(form.human_frequency), frequencyUnit.value)
  } as Record<string, unknown>;
}

function announceAndReset(message: string) {
  eventBus.emit("displayMessage", { status: "success", message });
  eventBus.emit("taskUpdated", selectedExport.value);
  selectedExport.value = {};
}

function selectExport(task: ExportTask) {
  selectedExport.value = { ...task, human_frequency: moment.duration(task.frequency ?? 0).asHours() };
  frequencyUnit.value = "hours";
}

async function updateExport() {
  const name = selectedExport.value.name;
  if (!name) {
    return;
  }
  // The export is identified by `name` in the URL; `id` isn't part of the
  // request schema (the old code sent it and the backend ignored it).
  await tasksApi.updateExport(name, exportPayload());
  announceAndReset(`Export ${name} succesfully updated`);
}

async function newExport() {
  const name = selectedExport.value.name;
  if (!name) {
    return;
  }
  await tasksApi.newExport(exportPayload());
  announceAndReset(`Export ${name} succesfully created`);
}

function confirmDeleteExport() {
  if (confirm("Are you sure you want to delete this export?")) {
    deleteExport();
  }
}

async function deleteExport() {
  const name = selectedExport.value.name;
  if (!name) {
    return;
  }
  await tasksApi.deleteExport(name);
  announceAndReset(`Export ${name} succesfully deleted`);
}

async function downloadExport(singleExport: ExportTask) {
  const response = await tasksApi.exportContent(String(singleExport.id));
  const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
  const fileLink = document.createElement("a");
  fileLink.href = fileUrl;
  fileLink.download = `${singleExport.name}_${singleExport.last_run}.txt`;
  document.body.appendChild(fileLink);
  fileLink.click();
}

onMounted(() => {
  listTemplates();
  appStore.fetchSystemConfig();
  templatesTimer = setInterval(listTemplates, 5000);
});

onUnmounted(() => clearInterval(templatesTimer));
</script>
