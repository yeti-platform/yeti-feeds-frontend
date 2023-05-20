<template>
  <div class="tasklist">
    <b-table :data="tasks" :hoverable="true" :narrowed="true" :row-class="getRowClass">
      <template v-slot:default="task">
        <b-table-column field="name" label="Name">
          <strong>{{ task.row.name }}</strong>
        </b-table-column>
        <b-table-column v-if="task.row.acts_on" field="acts_on" label="Acts on" width="130">
          <b-taglist>
            <b-tag v-for="observableType in task.row.acts_on" v-bind:key="observableType">
              {{ observableType }}
            </b-tag>
          </b-taglist>
        </b-table-column>
        <b-table-column field="frequency" label="Runs every" width="130">{{ task.row.frequency }}</b-table-column>
        <b-table-column field="last_run" label="Last run (UTC)" width="180"
          ><span :title="'Localtime: ' + formatTimestamp(task.row.last_run, true)">{{
            formatTimestamp(task.row.last_run)
          }}</span>
        </b-table-column>
        <b-table-column field="description" label="Description">{{ task.row.description }}</b-table-column>
        <b-table-column field="status" label="Status">{{ getHumanStatus(task.row) }}</b-table-column>
        <b-table-column field="toggle" label="Toggle">
          <div @click="toggle(task.row)" class="toggle">
            <b-switch v-model="task.row.enabled" :disabled="task.row.status === 'running'"></b-switch>
          </div>
        </b-table-column>
        <b-table-column field="run" label>
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
        <div class="has-text-centered">No records</div>
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
    }
  },
  data() {
    return {
      tasks: [],
      timer: null
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
      var params = { type: this.taskType };
      axios
        .post("/api/v2/tasks/search", params)
        .then(response => (this.tasks = response.data.tasks))
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    run(task) {
      axios
        .post(`/api/v2/tasks/${task.name}/run`)
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
    }
  }
};
</script>

<style scoped lang="scss">
@import "@/style.scss";

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
