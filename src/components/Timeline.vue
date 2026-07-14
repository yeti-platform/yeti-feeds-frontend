<template>
  <v-card-title>
    <p>Timeline for {{ object.name }}</p>
  </v-card-title>
  <v-card-text class="audit-trail">
    <v-text-field
      v-model="search"
      label="Filter timeline items"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      hide-details
      single-line
      density="compact"
    ></v-text-field>
    <v-data-table
      :search="search"
      :headers="headers"
      :items="timelineData"
      density="compact"
      :sort-by="[{ key: 'timestamp', order: 'desc' }]"
    ></v-data-table>
  </v-card-text>
  <v-card-actions>
    <v-spacer></v-spacer>
    <v-btn text="Close" @click="isActive.value = false"></v-btn>
  </v-card-actions>
</template>

<script setup lang="ts">
import moment from "moment";
import { onMounted, ref } from "vue";

import * as auditApi from "@/services/audit";
import { ENDPOINTS } from "@/services/objects";
import type { LooseYetiObject, RootType } from "@/services/types";

const props = defineProps<{
  object: LooseYetiObject;
  /** Provided by the v-dialog slot that renders this. */
  isActive: { value: boolean };
}>();

interface TimelineEntry {
  timestamp: string;
  actor: string;
  action: string;
  details: unknown;
}

const timelineData = ref<TimelineEntry[]>([]);
const timelineCount = ref(0);
const search = ref("");

const headers = [
  {
    title: "Timestamp (UTC)",
    key: "timestamp",
    value: (item: TimelineEntry) => moment(item.timestamp).format("YYYY-MM-DD HH:mm:ss"),
    width: "190px",
    sortable: true
  },
  { title: "Actor", value: "actor" },
  { title: "Action", value: "action" },
  { title: "Details", key: "details", value: (item: TimelineEntry) => JSON.stringify(item.details) }
];

async function getTimeline() {
  // The audit route takes the extended id ("observables/123").
  const extendedId = `${ENDPOINTS[props.object.root_type as RootType]}/${props.object.id}`;
  const [entries, total] = await auditApi.timeline(extendedId);
  timelineData.value = entries as unknown as TimelineEntry[];
  timelineCount.value = total;
}

onMounted(getTimeline);
</script>
