<template>
  <v-sheet class="ma-5" width="100%">
    <v-data-table :items="users" :headers="headers" :search="userFilter" class="yeti-table" density="compact">
      <!-- insert link to profile page on username field -->
      <template v-slot:item.username="{ item }">
        <router-link :to="{ name: 'UserProfileAdmin', params: { id: item.id } }">{{ item.username }}</router-link>
      </template>
      <template v-slot:item.admin="{ item }">
        <v-switch density="compact" color="green" v-model="item.admin" @change="toggleUser(item, 'admin')"></v-switch>
      </template>
      <template v-slot:item.enabled="{ item }">
        <v-switch
          density="compact"
          color="green"
          v-model="item.enabled"
          @change="toggleUser(item, 'enabled')"
        ></v-switch>
      </template>
      <template v-slot:item.api_key="{ item }">
        <code>{{ item.api_key }}</code>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn size="small" variant="outlined" @click="resetApiKey(item)">
          <v-icon class="me-2">mdi-key</v-icon>
          Reset API key
        </v-btn>
        <v-btn class="ms-2" size="small" variant="outlined" color="error" @click="showDeleteDialog(item)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
        <v-dialog v-model="dialogDelete" max-width="500px">
          <v-card>
            <v-card-title class="text-h5"
              >Are you sure you want to delete user "{{ deletionCandidate?.username }}"?</v-card-title
            >
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="dialogDelete = false">Cancel</v-btn>
              <v-btn variant="text" @click="deleteUser">OK</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </template>
    </v-data-table>
  </v-sheet>
  <v-navigation-drawer permament location="right" width="400" ref="drawer">
    <v-list-item class="mt-4">
      <v-text-field
        v-model="userFilter"
        prepend-inner-icon="mdi-magnify"
        label="Search users"
        density="compact"
        class="mt-2"
      />
    </v-list-item>
    <v-divider></v-divider>
    <v-list-item class="mt-4">
      <v-list-item-title class="text-h5 mb-5">Add new user</v-list-item-title>
      <v-text-field v-model="newUsername" prepend-inner-icon="mdi-account" label="Username" density="compact" />
      <v-text-field
        v-model="newPassword"
        prepend-inner-icon="mdi-lock"
        label="Password"
        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        :type="showPassword ? 'text' : 'password'"
        @click:append="showPassword = !showPassword"
        density="compact"
      />
      <div class="d-flex">
        <v-checkbox-btn v-model="newAdmin" label="Admin"></v-checkbox-btn>
        <v-btn color="primary" @click="addUser">Add user</v-btn>
      </div>
    </v-list-item>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import axios from "axios";
</script>

<script lang="ts">
export default {
  name: "UserAdmin",
  data() {
    return {
      users: [],
      headers: [
        { key: "username", sortable: true, title: "Username" },
        { key: "api_key", sortable: false, title: "API key" },
        { key: "admin", sortable: false, title: "Admin" },
        { key: "enabled", sortable: false, title: "Enabled" },
        { key: "actions", sortable: false, title: "Actions" }
      ],
      userFilter: "",
      newUsername: null,
      newPassword: null,
      newAdmin: false,
      dialogDelete: false,
      deletionCandidate: {},
      showPassword: false
    };
  },
  mounted() {
    this.listUsers();
  },
  methods: {
    listUsers() {
      axios
        .post("/api/v2/users/search", {
          page: 0,
          count: 1000,
          username: this.userFilter
        })
        .then(response => {
          this.users = response.data.users;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    clearForm() {
      this.newUsername = this.newPassword = null;
      this.newAdmin = false;
    },
    addUser() {
      axios
        .post("/api/v2/users/", { username: this.newUsername, password: this.newPassword, admin: this.newAdmin })
        .then(response => {
          this.listUsers();
          this.clearForm();
          this.$eventBus.emit("displayMessage", {
            message: `User ${response.data.username} successfully added`,
            status: "success"
          });
        })
        .catch(error => {
          this.$eventBus.emit("displayMessage", {
            message: "Error: " + error.response.data.error,
            status: "error"
          });
        })
        .finally(() => {});
    },
    toggleUser(user, field) {
      axios
        .post(`/api/v2/users/toggle`, { user_id: user.id, field: field })
        .then(() => {
          this.$eventBus.emit("displayMessage", {
            message: `Changes saved`,
            status: "success"
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    showDeleteDialog(user) {
      this.deletionCandidate = user;
      this.dialogDelete = true;
    },
    deleteUser() {
      axios
        .delete(`/api/v2/users/${this.deletionCandidate.id}`)
        .then(() => {
          this.dialogDelete = false;
          this.deletionCandidate = null;
          this.listUsers();
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    resetApiKey(user) {
      axios
        .post(`/api/v2/users/reset-api-key`, { user_id: user.id })
        .then(response => {
          user.api_key = response.data.api_key;
          this.$eventBus.emit("displayMessage", {
            status: "success",
            message: `API key for user ${user.username} succesfully reset`
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    }
  }
};
</script>

<style>
.yeti-table table {
  table-layout: auto !important;
}
</style>
