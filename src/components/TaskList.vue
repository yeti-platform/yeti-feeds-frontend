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
            <v-chip
              size="small"
              class="mx-1"
              label
              v-for="actType in item.acts_on"
              v-bind:key="actType"
              :text="actType"
              >{{ actType }}</v-chip
            >
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

<script lang="ts" setup>
import axios from "axios";

import moment from "moment";
</script>

<script lang="ts">
export default {
  name: "TaskList",
  props: {
    taskType: {
      type: String
    },
    actsOnFilter: {
      type: Array,
      default: () => []
    },
    actOnValue: {
      type: String
    },
    displayColumns: {
      type: Array,
      default: () => ["name", "acts_on", "frequency", "last_run", "description", "status", "toggle", "refresh"]
    },
    onlyEnabled: {
      type: Boolean,
      default: false
    },
    selectableTasks: {
      type: Boolean,
      default: false
    },
    downloadableTasks: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      tasks: [],
      timer: null,
      selected: null,
      defaultHeaders: [
        { key: "name", title: "Name", sortable: true },
        { key: "acts_on", title: "Acts On" },
        { key: "template_name", title: "Template name" },
        { key: "frequency", title: "Runs every", sortable: true },
        { key: "last_run", title: "Last run", width: "180px", sortable: true },
        { key: "description", title: "Description" },
        { key: "status", title: "Status", width: "120px", sortable: true },
        { key: "toggle", title: "Toggle", width: "80px" },
        { key: "refresh", title: "", width: "110px" }
      ],
      sortBy: [{ key: "name", order: "asc" }],
      selectedTask: null,
      taskDisplayFilter: "",
      taskHideDisabled: false
    };
  },
  mounted() {
    this.listTasks();
  },
  created() {
    this.timer = setInterval(this.listTasks, 5000);
    this.$eventBus.on("taskUpdated", this.listTasks);
  },
  unmounted() {
    clearInterval(this.timer);
  },
  methods: {
    toggle(task) {
      axios
        .post(`/api/v2/tasks/${task.name}/toggle`)
        .then(() => {})
        .catch(error => {
          console.log(error);
        });
    },
    listTasks() {
      var params = {
        type: this.taskType,
        page: 0,
        count: 200
      };
      axios
        .post("/api/v2/tasks/search", params)
        .then(response => {
          let tasks = response.data.tasks.filter(task => {
            if (this.actsOnFilter.length > 0) {
              return task.acts_on.some(actsOn => this.actsOnFilter.includes(actsOn));
            }
            return true;
          });
          if (this.onlyEnabled) {
            tasks = tasks.filter(task => task.enabled);
          }
          this.tasks = tasks;
          this.selectedTask = null;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    refresh(task) {
      let taskParams = { params: {} };
      if (this.actOnValue) {
        taskParams.params["value"] = this.actOnValue;
      }
      axios
        .post(`/api/v2/tasks/${task.name}/run`, taskParams)
        .then(() => {})
        .catch(error => {
          console.log(error);
        });
    },
    isRefreshing(task) {
      return task.status === "running";
    },
    getRowClass(row) {
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
    },
    getHumanStatus(task) {
      if (task.status === "completed") {
        return "Completed";
      }
      if (task.status === "running") {
        return "Running";
      }
      return "N/A";
    },
    displayColumn(name) {
      return this.displayColumns.includes(name);
    },
    selectTask(task) {
      this.$emit("task-selected", task);
    }
  },
  computed: {
    displayedHeaders() {
      return this.defaultHeaders.filter(header => this.displayColumns.includes(header.key));
    },
    filteredTasks() {
      return this.tasks.filter(task => {
        if (this.taskHideDisabled && !task.enabled) {
          return false;
        }
        if (this.taskDisplayFilter) {
          return task.name.toLowerCase().includes(this.taskDisplayFilter.toLowerCase());
        }
        return true;
      });
    }
  }
};
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
