<template>
  <div>
    <v-card class="ma-5" title="Scheduled" subtitle="Recurring analytics, triggered automatically on a fixed schedule.">
      <task-list task-type="analytics"> </task-list>
    </v-card>
    <v-card
      class="ma-5"
      title="One-shot"
      subtitle="Analytics that are triggered manually on specific observable types."
    >
      <task-list task-type="oneshot"> </task-list>
    </v-card>
    <v-card
      class="ma-5"
      title="Inline"
      subtitle="Analytics that trigger when an observable is added to the Yeti database."
    >
      <task-list task-type="inline"> </task-list>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import TaskList from "@/components/TaskList.vue";
</script>

<script lang="ts">
export default {
  name: "AnalyticsList",
  components: {
    TaskList
  }
};
</script>

<style scoped></style>
