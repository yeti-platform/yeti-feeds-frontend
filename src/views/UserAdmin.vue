<template>
  <v-sheet class="ma-5" width="100%">
    <v-data-table :items="users" :headers="headers" :search="userFilter" class="yeti-table" density="compact">
      <template v-slot:item.username="{ item }">
        <router-link :to="{ name: 'UserProfileAdmin', params: { id: item.id } }">{{ item.username }}</router-link>
      </template>
      <template v-slot:item.admin="{ item }">
        <v-switch
          density="compact"
          color="green"
          v-model="item.admin"
          hide-details
          @change="toggleUser(item, 'admin')"
        ></v-switch>
      </template>
      <template v-slot:item.enabled="{ item }">
        <v-switch
          density="compact"
          color="green"
          v-model="item.enabled"
          hide-details
          @change="toggleUser(item, 'enabled')"
        ></v-switch>
      </template>
      <template v-slot:item.api_keys="{ item }">
        <code>
          <v-chip v-for="apiKey in item.api_keys" :key="apiKey.name" class="me-2" density="compact" color="green">
            {{ apiKey.name }}
          </v-chip>
        </code>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-dialog>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" size="small" variant="outlined" prepend-icon="mdi-key">Manage API keys</v-btn>
          </template>
          <template v-slot:default="{ isActive }">
            <v-card>
              <v-card-title class="text-h6">API key management for {{ item.username }}</v-card-title>
              <v-card-text>
                <api-key-management
                  :profile-id="item.id"
                  :api-keys="item.api_keys ?? {}"
                  @api-key-update="apiKeys => (item.api_keys = apiKeys)"
                />
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="light" variant="text" @click="isActive.value = false">Cancel</v-btn>
                <v-spacer></v-spacer>
              </v-card-actions>
            </v-card>
          </template>
        </v-dialog>

        <v-btn class="ms-2" size="small" variant="outlined" color="error" @click="showDeleteDialog(item)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>
  </v-sheet>

  <!-- One dialog for the whole table: it used to live inside the row slot, so it
       was rendered once per user while all copies shared a single v-model. -->
  <v-dialog v-model="dialogDelete" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">
        Are you sure you want to delete user "{{ deletionCandidate?.username }}"?
      </v-card-title>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="dialogDelete = false">Cancel</v-btn>
        <v-btn variant="text" @click="deleteUser">OK</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-navigation-drawer permanent location="right" width="400">
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

<script setup lang="ts">
import { onMounted, ref } from "vue";

import ApiKeyManagement from "@/components/ApiKeyManagement.vue";
import { eventBus } from "@/plugins/eventbus";
import type { ToggleableField, User } from "@/services/types";
import * as usersApi from "@/services/users";

const headers = [
  { key: "username", sortable: true, title: "Username" },
  { key: "api_keys", sortable: false, title: "API keys" },
  { key: "admin", sortable: false, title: "Admin" },
  { key: "enabled", sortable: false, title: "Enabled" },
  { key: "actions", sortable: false, title: "Actions" }
];

const users = ref<User[]>([]);
const userFilter = ref("");
const newUsername = ref("");
const newPassword = ref("");
const newAdmin = ref(false);
const showPassword = ref(false);
const dialogDelete = ref(false);
const deletionCandidate = ref<User | null>(null);

async function listUsers() {
  const response = await usersApi.search({ page: 0, count: 1000, username: userFilter.value });
  users.value = response.users;
}

function clearForm() {
  newUsername.value = "";
  newPassword.value = "";
  newAdmin.value = false;
}

async function addUser() {
  const user = await usersApi.create({
    username: newUsername.value,
    password: newPassword.value,
    admin: newAdmin.value
  });
  await listUsers();
  clearForm();
  eventBus.emit("displayMessage", { message: `User ${user.username} successfully added`, status: "success" });
}

async function toggleUser(user: User, field: ToggleableField) {
  await usersApi.toggle({ user_id: user.id, field });
  eventBus.emit("displayMessage", { message: "Changes saved", status: "success" });
}

function showDeleteDialog(user: User) {
  deletionCandidate.value = user;
  dialogDelete.value = true;
}

async function deleteUser() {
  if (!deletionCandidate.value) {
    return;
  }
  await usersApi.remove(deletionCandidate.value.id);
  dialogDelete.value = false;
  deletionCandidate.value = null;
  await listUsers();
}

onMounted(listUsers);
</script>

<style>
.yeti-table table {
  table-layout: auto !important;
}
</style>
