<template>
  <div class="feedlist">
    <b-table :data="feeds" :hoverable="true" :narrowed="true" :row-class="getRowClass">
      <template v-slot:default="feed">
        <b-table-column field="name" label="Name">
          <strong>{{ feed.row.name }}</strong>
        </b-table-column>
        <b-table-column field="frequency" label="Runs every" width="130">{{ feed.row.frequency }}</b-table-column>
        <b-table-column field="last_run" label="Last run (UTC)" width="180"
          ><span :title="'Localtime: ' + formatTimestamp(feed.row.last_run, true)">{{
            formatTimestamp(feed.row.last_run)
          }}</span>
        </b-table-column>
        <b-table-column field="description" label="Description">{{ feed.row.description }}</b-table-column>
        <b-table-column field="status" label="Status">{{ feed.row.status || "N/A" }}</b-table-column>
        <b-table-column field="toggle" label="Toggle">
          <div @click="toggle(feed.row)" class="toggle">
            <b-switch v-model="feed.row.enabled" :disabled="feed.row.status === 'Updating...'"></b-switch>
          </div>
        </b-table-column>
        <b-table-column field="refresh" label>
          <b-button
            :disabled="feed.row.status === 'Updating...' || !feed.row.enabled"
            @click="refresh(feed.row)"
            size="is-small"
          >
            <b-icon
              pack="fas"
              icon="sync"
              size="is-small"
              :custom-class="feed.row.status === 'Updating...' ? 'fa-spin' : ''"
            ></b-icon>
          </b-button>
        </b-table-column>
      </template>
    </b-table>
  </div>
</template>

<script>
import axios from "axios";
import utils from "@/utils";

export default {
  name: "FeedList",
  data() {
    return {
      feeds: [],
      timer: null
    };
  },
  mounted() {
    this.listFeeds();
  },
  created() {
    this.timer = setInterval(this.listFeeds, 5000);
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  methods: {
    toggle(feed) {
      console.log(feed);
      var url = "/api/feed/" + feed.id + "/toggle";
      axios
        .post(url)
        .then(() => {
          // feed.enabled = !feed.enabled;
        })
        .catch(error => {
          console.log(error);
        });
    },
    listFeeds() {
      axios
        .get("/api/feed/")
        .then(response => (this.feeds = response.data))
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    refresh(feed) {
      var url = "/api/feed/" + feed.id + "/refresh";
      axios
        .post(url)
        .then(() => {})
        .catch(error => {
          console.log(error);
        });
    },
    isRefreshing(feed) {
      return feed.status === "Updating...";
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
  }
};
</script>

<style scoped lang="scss">
@import "@/style.scss";

.feedlist ::v-deep tbody .disabled {
  opacity: 0.5;
}

.feedlist .is-success strong {
  color: $success-fontcolor;
}

.feedlist .is-danger strong {
  color: $danger-fontcolor;
}

.feedlist .is-warning strong {
  color: $warning-fontcolor;
}

.feedlist ::v-deep .is-success {
  background: $success;
  color: $success-fontcolor;
}

.feedlist ::v-deep tbody tr.is-success:hover {
  background-color: $success-hover;
}

.feedlist ::v-deep .is-danger {
  background: $danger;
  color: $danger-fontcolor;
}

.feedlist ::v-deep tbody tr.is-danger:hover {
  background: $danger-hover;
}

.feedlist ::v-deep .is-warning {
  background: $warning;
  color: $warning-fontcolor;
}

.feedlist ::v-deep tbody tr.is-warning:hover {
  background: $warning-hover;
}
</style>
