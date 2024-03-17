<template>
  <div>
    <v-card class="ma-5" title="Feeds" subtitle="Feeds that ingest data into Yeti.">
      <task-list task-type="feed"> </task-list>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import TaskList from "@/components/TaskList.vue";
</script>

<script lang="ts">
export default {
  name: "FeedList",
  components: {
    TaskList
  }
};
</script>

<style scoped></style>
