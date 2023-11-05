<template>
  <div class="tasklist">
    <b-table
      :data="tasks"
      :hoverable="true"
      :narrowed="true"
      :row-class="getRowClass"
      @click="task => $emit('taskSelected', task)"
      default-sort="name"
      sort-icon-size="is-small"
    >
      <template v-slot:default="task">
        <!-- hide  if not in column -->
        <b-table-column sortable field="name" label="Name" v-if="displayColumns.includes('name')">
          <strong>{{ task.row.name }}</strong>
        </b-table-column>
        <b-table-column
          v-if="task.row.acts_on && displayColumns.includes('acts_on')"
          field="acts_on"
          label="Acts on"
          width="130"
        >
          <b-taglist>
            <b-tag v-for="observableType in task.row.acts_on" v-bind:key="observableType">
              {{ observableType }}
            </b-tag>
          </b-taglist>
        </b-table-column>
        <b-table-column field="frequency" label="Runs every" v-if="displayColumns.includes('frequency')" width="130">{{
          task.row.frequency
        }}</b-table-column>
        <b-table-column
          sortable
          field="last_run"
          label="Last run (UTC)"
          v-if="displayColumns.includes('last_run')"
          width="180"
          ><span :title="'Localtime: ' + formatTimestamp(task.row.last_run, true)">{{
            formatTimestamp(task.row.last_run)
          }}</span>
        </b-table-column>
        <b-table-column field="description" label="Description" v-if="displayColumns.includes('description')">{{
          task.row.description
        }}</b-table-column>
        <b-table-column sortable field="status" label="Status" v-if="displayColumns.includes('status')">{{
          getHumanStatus(task.row)
        }}</b-table-column>
        <b-table-column sortable field="toggle" label="Toggle" v-if="displayColumns.includes('toggle')">
          <div @click="toggle(task.row)" class="toggle">
            <b-switch v-model="task.row.enabled" :disabled="task.row.status === 'running'"></b-switch>
          </div>
        </b-table-column>
        <b-table-column field="run" v-if="displayColumns.includes('run')" label>
          <b-button
            :disabled="task.row.status === 'running' || !task.row.enabled"
            @click="run(task.row)"
            size="is-small"
          >
            <b-icon
              pack="fas"
              icon="sync"
              size="is-small"
              :custom-class="task.row.status === 'running' ? 'fa-spin' : ''"
            ></b-icon>
          </b-button>
        </b-table-column>
      </template>
      <template #empty>
        <div class="has-text-centered">No tasks</div>
      </template>
    </b-table>
  </div>
</template>

<script>
import axios from "axios";
import utils from "@/utils";

export default {
  name: "tasklist",
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
      default: () => ["name", "acts_on", "frequency", "last_run", "description", "status", "toggle", "run"]
    }
  },
  data() {
    return {
      tasks: [],
      timer: null,
      selected: null
    };
  },
  mounted() {
    this.listTasks();
  },
  created() {
    this.timer = setInterval(this.listTasks, 5000);
  },
  beforeDestroy() {
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
        type: this.taskType
      };
      axios
        .post("/api/v2/tasks/search", params)
        .then(response => {
          this.tasks = response.data.tasks.filter(task => {
            if (this.actsOnFilter.length > 0) {
              return task.acts_on.some(actsOn => this.actsOnFilter.includes(actsOn));
            }
            return true;
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    run(task) {
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
        return "is-success";
      }
      if (row.status === "running") {
        return "is-warning";
      }
      if (row.status === "failed") {
        return "is-danger";
      }
    },
    getHumanStatus(row) {
      if (row.status === "completed") {
        return "Completed";
      }
      if (row.status === "running") {
        return "Running";
      }
      if (row.status === "failed") {
        return `Failed: ${row.status_message}`;
      }
      return "N/A";
    },
    formatTimestamp(timestamp, local) {
      return utils.formatTimestamp(timestamp, local);
    },
    displayColumn(name) {
      return this.displayColumns.includes(name);
    }
  }
};
</script>

<style scoped lang="scss">
@import "@/style.scss";

.tasklist {
  width: 100%;
}

.tasklist ::v-deep tbody .disabled {
  opacity: 0.5;
}

.tasklist .is-success strong {
  color: $success-fontcolor;
}

.tasklist .is-danger strong {
  color: $danger-fontcolor;
}

.tasklist .is-warning strong {
  color: $warning-fontcolor;
}

.tasklist ::v-deep .is-success {
  background: $success;
  color: $success-fontcolor;
}

.tasklist ::v-deep tbody tr.is-success:hover {
  background-color: $success-hover;
}

.tasklist ::v-deep .is-danger {
  background: $danger;
  color: $danger-fontcolor;
}

.tasklist ::v-deep tbody tr.is-danger:hover {
  background: $danger-hover;
}

.tasklist ::v-deep .is-warning {
  background: $warning;
  color: $warning-fontcolor;
}

.tasklist ::v-deep tbody tr.is-warning:hover {
  background: $warning-hover;
}
</style>
