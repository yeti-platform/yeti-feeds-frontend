<template>
  <div class="columns">
    <div class="column is-8">
      <b-table :data="users" paginated backend-pagination @page-change="onPageChange" :total="totalUsers">
        <template v-slot:default="user">
          <b-table-column field="username" label="Username">{{ user.row.username }}</b-table-column>
          <b-table-column field="api_key" label="API key">
            <code>{{ user.row.api_key }}</code>
          </b-table-column>
          <b-table-column field="admin" label="Admin">
            <b-checkbox v-model="user.row.permissions.admin"></b-checkbox>
          </b-table-column>
          <b-table-column field="enabled" label="Enabled">
            <b-checkbox v-model="user.row.enabled"></b-checkbox>
          </b-table-column>
          <b-table-column custom-key="remove" label="Remove">
            <b-button size="is-small">Remove</b-button>
          </b-table-column>
        </template>
      </b-table>
    </div>
    <div class="column is-3">
      <b-tabs v-model="activeTab" position="is-centered" :animated="false">
        <!-- Search tab item -->
        <b-tab-item label="Search users">
          <div class="search">
            <div class="field">
              <b-input
                v-model="userFilter"
                type="text"
                placeholder="Filter user list"
                icon="search"
                v-on:keyup.native.enter="listUsers"
              />
            </div>
          </div>
          <br />
          <article class="message tip">
            <div class="message-body content">
              <p>
                You can reset a user's API key by clicking on the
                <code>reset</code> button.
              </p>
              <p>
                To temporarily prevent a user from logging in, you can disable their account by clicking on the checkbox
              </p>
              <p><strong>Warning</strong>: Removing users cannot be undone</p>
            </div>
          </article>
        </b-tab-item>

        <b-tab-item label="Add user">
          <form>
            <b-field label="Username">
              <b-input v-model="newUsername"></b-input>
            </b-field>
            <b-field label="Password">
              <b-input v-model="newPassword"></b-input>
            </b-field>
            <b-field grouped>
              <b-checkbox v-model="newAdmin" class="control">Admin</b-checkbox>
              <p class="control">
                <button class="button is-primary" @click="addUser">Add user</button>
              </p>
            </b-field>
          </form>
          <br />

          <article class="message tip">
            <div class="message-body content">
              <p>
                The
                <code>yeti</code> user exists to enable anonymous access to Yeti. Disable it after logging in as a new
                user if you only want to allow authenticated access.
              </p>
            </div>
          </article>
        </b-tab-item>
      </b-tabs>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "UserAdmin",
  data() {
    return {
      users: [],
      userFilter: "",
      page: 1,
      totalUsers: 100,
      activeTab: 1,
      newUsername: null,
      newPassword: null,
      newAdmin: false
    };
  },
  mounted() {
    this.listUsers();
    this.getTotalUsers();
  },
  methods: {
    listUsers() {
      var params = this.searchParams;
      axios
        .post("/api/useradminsearch/", params)
        .then(response => {
          this.users = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    onPageChange(page) {
      this.page = page;
      this.listUsers();
    },
    getTotalUsers() {
      var params = this.searchParams;
      axios
        .post("/api/useradminsearch/total", params)
        .then(response => {
          this.totalUsers = response.data.total;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    addUser(e) {
      e.preventDefault();
      axios
        .post("/api/createuser", { username: this.newUsername, password: this.newPassword, admin: this.newAdmin })
        .then(response => {
          this.listUsers();
          this.$buefy.notification.open({
            message: `Success! User ${response.data.username} succesfully added.`,
            type: "is-success"
          });
        })
        .catch(error => {
          this.$buefy.notification.open({
            message: "Error: " + error.response.data.error,
            type: "is-danger"
          });
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
      if (this.userFilter) {
        params.filter = { username: this.userFilter };
      }
      return params;
    }
  }
};
</script>

<style>
span.icon {
  vertical-align: middle;
}
</style>
