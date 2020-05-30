<template>
  <div>
    <div class="scheduled">
      <p class="title">Scheduled</p>
      <b-table :data="scheduled" default-sort="name" narrowed :row-class="getRowClass">
        <template v-slot:default="analytics">
          <b-table-column field="name" label="Name" sortable>
            <strong>{{ analytics.row.name }}</strong>
          </b-table-column>
          <b-table-column field="frequency" label="Runs every">{{ analytics.row.frequency }}</b-table-column>
          <b-table-column field="last_run" label="Last run">{{ analytics.row.last_run || "Never" }}</b-table-column>
          <b-table-column field="description" label="Description">{{ analytics.row.description }}</b-table-column>
          <b-table-column field="status" label="Status">{{ analytics.row.status || "N/A" }}</b-table-column>
          <b-table-column field="toggle" label="Toggle">
            <div @click="toggle(analytics.row, 'scheduled')" class="toggle">
              <b-switch v-model="analytics.row.enabled" :disabled="analytics.row.status === 'Running...'"></b-switch>
            </div>
          </b-table-column>
          <b-table-column field="refresh" label>
            <b-button
              :disabled="analytics.row.status === 'Running...' || !analytics.row.enabled"
              @click="refresh(analytics.row)"
              size="is-small"
            >
              <b-icon
                pack="fas"
                icon="sync"
                size="is-small"
                :custom-class="analytics.row.status === 'Running...' ? 'fa-spin' : ''"
              ></b-icon>
            </b-button>
          </b-table-column>
        </template>
      </b-table>
    </div>
    <br />
    <br />
    <div class="oneshot">
      <p class="title">One-shot</p>
      <b-table :data="oneshot" default-sort="group" narrowed>
        <template v-slot:default="analytics">
          <b-table-column field="group" label="Grouping" sortable>
            {{ analytics.row.group }}
          </b-table-column>
          <b-table-column field="name" label="Name" sortable>
            <strong>{{ analytics.row.name }}</strong>
          </b-table-column>
          <b-table-column field="acts_on" label="Acts on">
            <b-taglist>
              <b-tag v-for="type in analytics.row.acts_on" v-bind:key="type">
                {{ type }}
              </b-tag>
            </b-taglist>
          </b-table-column>
          <b-table-column field="description" label="Description">
            {{ analytics.row.description }}
            <span class="setting-warning" v-if="analytics.row.available">
              This plugin requires settings that are not yet defined.
            </span>
          </b-table-column>
          <b-table-column field="toggle" label="Toggle">
            <div @click="toggle(analytics.row, 'oneshot')" class="toggle">
              <b-switch v-model="analytics.row.enabled"></b-switch>
            </div>
          </b-table-column>
        </template>
      </b-table>
    </div>
    <br />
    <br />
    <div class="scheduled">
      <p class="title">Inline</p>
      <b-table :data="inline" narrowed default-sort="name">
        <template v-slot:default="analytics">
          <b-table-column field="name" label="Name">
            <strong>{{ analytics.row.name }}</strong>
          </b-table-column>
          <b-table-column field="acts_on" label="Acts on">
            <b-taglist>
              <b-tag v-for="type in analytics.row.acts_on" v-bind:key="type">
                {{ type }}
              </b-tag>
            </b-taglist>
          </b-table-column>
          <b-table-column field="description" label="Description">{{ analytics.row.description }}</b-table-column>
          <b-table-column field="toggle" label="Toggle">
            <div @click="toggle(analytics.row, 'inline')" class="toggle">
              <b-switch v-model="analytics.row.enabled"></b-switch>
            </div>
          </b-table-column>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
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
      if (row.status === "ERROR") {
        return "is-danger";
      }
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
  color: $danger;
}

.scheduled ::v-deep .disabled {
  opacity: 0.5;
}

.scheduled ::v-deep .is-success {
  background: $success;
}

.scheduled ::v-deep .is-danger {
  background: rgb(255, 211, 211);
  color: rgb(243, 96, 96);
}
</style>
