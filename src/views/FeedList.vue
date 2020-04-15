<template>
  <div class="home">
    <b-table :data="feeds" :hoverable="true" :narrowed="true" :row-class="(row, index) => !row.enabled && 'disabled'">
      <template v-slot:default="feed">
        <b-table-column field="name" label="Name">
          {{ feed.row.name }}
        </b-table-column>
        <b-table-column field="frequency" label="Runs every">
          {{ feed.row.frequency }}
        </b-table-column>
        <b-table-column field="last_run" label="Last run">
          {{ feed.row.last_run }}
        </b-table-column>
        <b-table-column field="description" label="Description">
          {{ feed.row.description }}
        </b-table-column>
        <b-table-column field="status" label="Status">
          {{ feed.row.status }}
        </b-table-column>
        <b-table-column field="toggle" label="Toggle">
          <div @click="toggle(feed.row)" class="toggle">
            <b-switch v-model="feed.row.enabled"> </b-switch>
          </div>
        </b-table-column>
        <b-table-column field="refresh" label="">
          <b-button :disabled="feed.row.status === 'Updating...'" @click="refresh(feed.row)" size="is-small">
            <b-icon
              v-if="feed.row.enabled"
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

export default {
  name: "FeedList",
  data() {
    return {
      feeds: []
    };
  },
  mounted() {
    this.listFeeds();
    this.timer = setInterval(this.listFeeds, 5000);
  },
  methods: {
    toggle(feed) {
      console.log(feed);
      var url = "http://localhost:5000/api/feed/" + feed.id + "/toggle";
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
        .get("http://localhost:5000/api/feed/")
        .then(response => (this.feeds = response.data))
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    refresh(feed) {
      var url = "http://localhost:5000/api/feed/" + feed.id + "/refresh";
      axios
        .post(url)
        .then(() => {})
        .catch(error => {
          console.log(error);
        });
    },
    isRefreshing(feed) {
      return feed.status === "Updating...";
    }
  }
};
</script>

<style>
.disabled {
  opacity: 0.5;
}

div.toggle {
  cursor: pointer;
}
</style>
