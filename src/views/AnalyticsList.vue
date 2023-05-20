<template>
  <div>
    <div class="scheduled">
      <p class="title">Scheduled</p>
      <p class="subtitle">Recurring analytics, triggered automatically on a fixed schedule.</p>
      <task-list task-type="analytics"> </task-list>
    </div>
    <br />
    <br />
    <div class="oneshot">
      <p class="title">One-shot</p>
      <p class="subtitle">Analytics that are triggered manually on specific observable types.</p>
      <task-list task-type="oneshot"> </task-list>
    </div>
    <br />
    <br />
    <div class="inline">
      <p class="title">Inline</p>
      <p class="subtitle">Analytics that trigger when an observable is added to the Yeti database.</p>
      <task-list task-type="inline"> </task-list>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import utils from "@/utils";
// import TaskList
import TaskList from "@/views/TaskList.vue";

export default {
  components: {
    TaskList
  },
  name: "AnalyticsList",
  data() {
    return {
      scheduled: [],
      oneshot: [],
      inline: []
    };
  },
  methods: {
    getAnalytics(type) {
      axios
        .get(`/api/analytics/${type}/`)
        .then(response => {
          this[type] = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    toggle(analytics, type) {
      axios
        .post(`/api/analytics/${type}/${analytics.id}/toggle`)
        .then(response => {
          analytics.enabled = response.data.status;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    refresh(analytics) {
      axios
        .post(`/api/analytics/scheduled/${analytics.id}/refresh`)
        .then(() => {})
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
      console.log(analytics);
    },
    isRunning(feed) {
      return feed.status === "Running...";
    },
    getRowClass(row) {
      if (!row.enabled) {
        return "disabled";
      }
      if (row.status === "OK") {
        return "is-success";
      }
      if (row.status === "Updating...") {
        return "is-warning";
      }
      if (row.status === "ERROR") {
        return "is-danger";
      }
    },
    formatTimestamp(timestamp, local) {
      return utils.formatTimestamp(timestamp, local);
    }
  },
  mounted() {
    this.getAnalytics("scheduled");
    this.getAnalytics("oneshot");
    this.getAnalytics("inline");
  }
};
</script>

<style scoped lang="scss">
@import "@/style.scss";

.setting-warning {
  color: $danger-fontcolor;
}

.scheduled ::v-deep .disabled {
  opacity: 0.5;
}

.scheduled .is-success strong {
  color: $success-fontcolor;
}

.scheduled .is-danger strong {
  color: $danger-fontcolor;
}

.scheduled .is-warning strong {
  color: $warning-fontcolor;
}

.scheduled ::v-deep .is-success {
  background: $success;
  color: $success-fontcolor;
}

.scheduled ::v-deep tbody tr.is-success:hover {
  background-color: $success-hover;
}

.scheduled ::v-deep .is-danger {
  background: $danger;
  color: $danger-fontcolor;
}

.scheduled ::v-deep tbody tr.is-danger:hover {
  background: $danger-hover;
}

.scheduled ::v-deep .is-warning {
  background: $warning;
  color: $warning-fontcolor;
}

.scheduled ::v-deep tbody tr.is-warning:hover {
  background: $warning-hover;
}
</style>
