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

<script>
import axios from "axios";
import moment from "moment";

export default {
  name: "Timeline",
  props: {
    object: {
      type: Object,
      default: () => {}
    },
    isActive: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      timelineData: [],
      timelineCount: 0,
      headers: [
        {
          title: "Timestamp (UTC)",
          key: "timestamp",
          value: item => moment(item.timestamp).format("YYYY-MM-DD HH:mm:ss"),
          width: "190px",
          sortable: true
        },
        { title: "Actor", value: "actor" },
        { title: "Action", value: "action" },
        { title: "Details", key: "details", value: item => JSON.stringify(item.details) }
      ],
      typeToEndpointMapping: {
        entity: "entities",
        observable: "observables",
        indicator: "indicators",
        dfiq: "dfiq"
      },
      search: ""
    };
  },
  methods: {
    getTimeline() {
      axios
        .get(`/api/v2/audit/timeline/${this.typeToEndpointMapping[this.object.root_type]}/${this.object.id}`)
        .then(response => {
          this.timelineData = response.data[0];
          this.timelineCount = response.data[1];
        })
        .catch(error => {
          console.log(error);
        });
    }
  },
  mounted() {
    this.getTimeline();
  }
};
</script>
