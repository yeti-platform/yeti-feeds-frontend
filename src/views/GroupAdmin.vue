<template>
  <div class="columns">
    <div class="column is-8">
      <b-table :data="groups" paginated backend-pagination @page-change="onPageChange" :total="totalGroups">
        <template v-slot:default="group">
          <b-table-column field="groupname" label="Group name">
            <router-link :to="{ name: 'GroupDetails', params: { id: group.row.id } }">
              {{ group.row.groupname }}
            </router-link>
          </b-table-column>
          <b-table-column field="enabled" label="Enabled">
            <b-checkbox v-model="group.row.enabled" @click.native="toggleGroup(group.row)"></b-checkbox>
          </b-table-column>
          <b-table-column custom-key="remove" label="Remove">
            <b-button class="button is-warning" size="is-small" @click="confirmDeleteGroup(group.row)">
              <b-icon pack="fas" icon="trash-alt" size="is-small"></b-icon>
              <span>Remove</span>
            </b-button>
          </b-table-column>
        </template>
      </b-table>
    </div>
    <div class="column is-3">
      <b-tabs v-model="activeTab" position="is-centered" :animated="false">
        <!-- Search tab item -->
        <b-tab-item label="Search groups">
          <div class="search">
            <div class="field">
              <b-input
                v-model="groupFilter"
                type="text"
                placeholder="Filter group list"
                icon="search"
                v-on:keyup.native.enter="listGroups"
              />
            </div>
          </div>
          <br />
        </b-tab-item>
        <!-- Add group tab item -->
        <b-tab-item label="Add group">
          <form>
            <b-field label="Group name">
              <b-input v-model="newGroupName"></b-input>
            </b-field>
          </form>
          <br />
        </b-tab-item>
      </b-tabs>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "GroupAdmin",
  data() {
    return {
      groups: [],
      totalGroups: 500,
      page: 1,
      activeTab: 0,
      newGroupName: null,
      groupFilter: null
    };
  },
  mounted() {
    this.listGroups();
    this.getTotalGroups();
  },
  methods: {
    listGroups() {
      var params = this.searchParams;
      axios
        .post(`/api/groupadminsearch/`, params)
        .then(response => {
          this.groups = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    onPageChange(page) {
      this.page = page;
      this.listGroups();
    },
    toggleGroup(group) {
      axios
        .post(`/api/groupadmin/toggle/${group.id}`)
        .then(() => {
          this.$buefy.notification.open({
            message: `Changes saved.`,
            type: "is-success"
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    confirmDeleteGroup(group) {
      this.$buefy.dialog.confirm({
        title: "Delete group",
        message: `You're about to <strong>delete</strong> group <code>${group.groupname}</code>. Proceed?`,
        confirmText: "Delete group",
        type: "is-danger",
        hasIcon: true,
        onConfirm: () => {
          this.deleteGroup(group);
        }
      });
    },
    deleteGroup(group) {
      axios
        .delete(`/api/groupadmin/${group.id}`)
        .then(() => {
          this.getTotalGroups();
          this.listGroups();
          this.$buefy.notification.open({
            message: `Group <strong>${group.groupname}</strong> succesfully deleted.`,
            type: "is-success"
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    getTotalGroups() {
      axios
        .post("/api/groupadminsearch/total", this.searchParams)
        .then(response => {
          this.totalGroups = response.data.total;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    }
  },
  computed: {
    searchParams() {
      var params = {
        params: {
          page: this.page,
          regex: true,
          ignorecase: true
        }
      };
      if (this.groupFilter) {
        params.filter = { groupname: this.groupFilter };
      }
      return params;
    }
  }
};
</script>

<style></style>
