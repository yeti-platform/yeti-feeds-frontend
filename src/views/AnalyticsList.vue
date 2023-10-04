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
// import TaskList
import TaskList from "@/views/TaskList.vue";

export default {
  components: {
    TaskList
  },
  name: "AnalyticsList"
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
