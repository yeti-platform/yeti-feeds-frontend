<template>
  <v-sheet width="100%">
    <div class="d-flex">
      <v-text-field
        class="ma-4"
        hide-details
        density="compact"
        placeholder="Search tasks"
        v-model="taskDisplayFilter"
      ></v-text-field>
      <v-checkbox-btn label="Hide disabled" v-model="taskHideDisabled"></v-checkbox-btn>
    </div>
    <v-data-table
      :items="filteredTasks"
      :headers="displayedHeaders"
      :items-per-page="100"
      density="compact"
      :sort-by="sortBy"
      :show-select="selectableTasks"
      select-strategy="single"
      class="auto-layout"
    >
      <template v-slot:item="{ item }">
        <tr :class="getRowClass(item)">
          <td v-if="selectableTasks">
            <v-checkbox
              @update:modelValue="selectTask"
              v-model="selectedTask"
              :multiple="false"
              :value="item"
              density="compact"
              hide-details
            />
          </td>
          <td v-if="displayColumn('name')">
            <strong> {{ item.name }} </strong>
          </td>
          <td v-if="displayColumn('acts_on')">
            <v-chip v-if="typeof item.acts_on === 'object'"
              size="small"
              class="mx-1"
              label
              v-for="actType in item.acts_on"
              v-bind:key="actType"
              :text="actType"
              >{{ actType }}</v-chip
            >
            <v-chip v-else size="small" class="mx-1" label :text="item.acts_on">{{ item.acts_on }}</v-chip>
          </td>

          <td v-if="displayColumn('template_name')">
            {{ item.template_name }}
          </td>

          <td v-if="displayColumn('frequency')">
            {{ moment.duration(item.frequency).humanize() }}
          </td>
          <td v-if="displayColumn('last_run')">
            {{ moment(item.last_run).format("YYYY-MM-DD HH:mm:ss") }}
          </td>
          <td v-if="displayColumn('description')">{{ item.description }}</td>

          <td v-if="displayColumn('status')">
            <v-chip v-if="!item.enabled"> Disabled </v-chip>
            <v-menu v-else-if="item.status === 'failed'">
              <template v-slot:activator="{ props }">
                <v-chip v-bind="props" append-icon="mdi-information"> Failed </v-chip>
              </template>
              <v-sheet class="px-5 py-2" color="background" width="auto" elevation="10" style="font-size: 0.8rem">
                {{ item.status_message }}
              </v-sheet>
            </v-menu>
            <v-chip v-else label> {{ getHumanStatus(item) }}</v-chip>
          </td>
          <td v-if="displayColumn('toggle')">
            <v-switch
              density="compact"
              v-model="item.enabled"
              color="green"
              hide-details
              inset
              :disabled="item.status == 'running'"
              @click="toggle(item)"
            ></v-switch>
          </td>

          <td v-if="displayColumn('refresh')">
            <v-btn @click="refresh(item)" icon="mdi-refresh" size="x-small" variant="tonal" :disabled="!item.enabled">
            </v-btn>
            <v-btn
              v-if="downloadableTasks"
              class="ml-2"
              @click="$emit('taskDownload', item)"
              icon="mdi-download"
              size="x-small"
              variant="tonal"
              :disabled="!item.enabled"
            >
            </v-btn>
          </td>
        </tr>
      </template>
      <template v-slot:no-data>
        No <span v-if="onlyEnabled">enabled</span> tasks found
        <span v-if="actsOnFilter.length > 0">
          for <code>{{ actsOnFilter.join(", ") }}</code></span
        >
      </template>
    </v-data-table>
  </v-sheet>
</template>

<script setup lang="ts">
import moment from "moment";
import { computed, onMounted, onUnmounted, ref } from "vue";

import { eventBus } from "@/plugins/eventbus";
import * as tasksApi from "@/services/tasks";
import type { LooseYetiObject, TaskType } from "@/services/types";

const props = withDefaults(
  defineProps<{
    taskType?: TaskType;
    actsOnFilter?: string[];
    actOnValue?: string;
    displayColumns?: string[];
    onlyEnabled?: boolean;
    selectableTasks?: boolean;
    downloadableTasks?: boolean;
  }>(),
  {
    actsOnFilter: () => [],
    displayColumns: () => [
      "name",
      "acts_on",
      "frequency",
      "last_run",
      "description",
      "status",
      "toggle",
      "refresh"
    ],
    onlyEnabled: false,
    selectableTasks: false,
    downloadableTasks: false
  }
);

const emit = defineEmits<{
  "task-selected": [task: LooseYetiObject];
  taskDownload: [task: LooseYetiObject];
}>();

/** Tasks are a heterogeneous family (feed / analytics / export / event). */
type Task = LooseYetiObject;

const DEFAULT_HEADERS = [
  { key: "name", title: "Name", sortable: true },
  { key: "acts_on", title: "Acts On" },
  { key: "template_name", title: "Template name" },
  { key: "frequency", title: "Runs every", sortable: true },
  { key: "last_run", title: "Last run", width: "180px", sortable: true },
  { key: "description", title: "Description" },
  { key: "status", title: "Status", width: "120px", sortable: true },
  { key: "toggle", title: "Toggle", width: "80px" },
  { key: "refresh", title: "", width: "110px" }
];

const tasks = ref<Task[]>([]);
const selectedTask = ref<Task | null>(null);
const sortBy = ref([{ key: "name", order: "asc" as const }]);
const taskDisplayFilter = ref("");
const taskHideDisabled = ref(false);

let timer: ReturnType<typeof setInterval> | undefined;

const displayedHeaders = computed(() =>
  DEFAULT_HEADERS.filter(header => props.displayColumns.includes(header.key))
);

const filteredTasks = computed(() =>
  tasks.value.filter(task => {
    if (taskHideDisabled.value && !task.enabled) {
      return false;
    }
    if (taskDisplayFilter.value) {
      return task.name.toLowerCase().includes(taskDisplayFilter.value.toLowerCase());
    }
    return true;
  })
);

function displayColumn(name: string): boolean {
  return props.displayColumns.includes(name);
}

function isRefreshing(task: Task): boolean {
  return task.status === "running";
}

function getRowClass(row: Task): string | undefined {
  if (!row.enabled) {
    return "disabled";
  }
  if (row.status === "completed") {
    return "success";
  }
  if (row.status === "running") {
    return "warning";
  }
  if (row.status === "failed") {
    return "error";
  }
  return undefined;
}

function getHumanStatus(task: Task): string {
  if (task.status === "completed") {
    return "Completed";
  }
  if (task.status === "running") {
    return "Running";
  }
  return "N/A";
}

/** v-checkbox emits null when it is unchecked. */
function selectTask(task: Task | null) {
  if (task) {
    emit("task-selected", task);
  }
}

async function listTasks() {
  const response = await tasksApi.search({ type: props.taskType, page: 0, count: 200 });
  let found = (response.tasks ?? []) as Task[];
  if (props.actsOnFilter.length > 0) {
    found = found.filter(task => task.acts_on?.some((actsOn: string) => props.actsOnFilter.includes(actsOn)));
  }
  if (props.onlyEnabled) {
    found = found.filter(task => task.enabled);
  }
  tasks.value = found;
  selectedTask.value = null;
}

async function toggle(task: Task) {
  await tasksApi.toggle(task.name);
}

async function refresh(task: Task) {
  // The endpoint takes a TaskParams envelope; tasksApi.run wraps it.
  await tasksApi.run(task.name, props.actOnValue ? { value: props.actOnValue } : {});
}

onMounted(() => {
  listTasks();
  timer = setInterval(listTasks, 5000);
  eventBus.on("taskUpdated", listTasks);
});

onUnmounted(() => {
  clearInterval(timer);
  // The old version cleared the interval but never removed this listener.
  eventBus.off("taskUpdated", listTasks);
});
</script>


<style>
/* Your component styles go here */
.disabled {
  opacity: 0.5;
}

.success {
  background-color: #d7ffe8;
  color: #1d5b37;
}

.success:hover {
  background-color: #caf4dc;
}

.warning {
  background-color: #ffe0b2;
  color: #8c3100;
}

.warning:hover {
  background-color: #f0cf9c;
}

.error {
  background-color: #ffcdd2;
  color: #b71c1c;
}

.error:hover {
  background-color: #f5bfc4;
}

.v-data-table.auto-layout table {
  table-layout: auto !important;
}
</style>
