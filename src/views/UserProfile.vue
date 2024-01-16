<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <v-card v-if="profile" variant="flat">
          <v-card-title>Profile information</v-card-title>
          <v-card-text>
            <v-table>
              <template v-slot:default>
                <tbody>
                  <tr>
                    <th>Username</th>
                    <td>{{ profile.username }}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>API key</td>
                    <td>
                      <code>{{ profile.api_key }}</code>
                    </td>
                    <td>
                      <v-btn size="small" variant="outlined" @click="resetApiKey(profile)"> Reset key </v-btn>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card v-if="authModule === 'local'" variant="flat">
          <v-card-title>Change password</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="newPassword"
              placeholder="New password"
              :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :type="showPassword ? 'text' : 'password'"
              @click:append="showPassword = !showPassword"
            ></v-text-field>
            <v-btn type="is-primary" @click="changeUserPassword">Save</v-btn>
          </v-card-text>
        </v-card>
        <div v-if="authModule === 'oidc'">
          Authentication is handled by Open ID Connect. There is no password to change.
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import axios from "axios";
import { useUserStore } from "@/store/user";
import { useAppStore } from "@/store/app";
</script>

<script lang="ts">
export default {
  name: "UserProfile",
  data() {
    return {
      profile: null,
      currentPassword: null,
      newPassword: null,
      availableSettings: [],
      activeTab: 0,
      userStore: useUserStore(),
      appStore: useAppStore(),
      showPassword: false
    };
  },
  props: {
    id: {
      type: String,
      default: null
    }
  },
  methods: {
    getUserProfile() {
      const id = this.id || this.user.id;
      axios
        .get(`/api/v2/users/${id}`)
        .then(response => {
          this.profile = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    resetApiKey() {
      axios
        .post(`/api/v2/users/reset-api-key`, { user_id: this.profile.id })
        .then(response => {
          this.profile.api_key = response.data.api_key;
          this.$eventBus.emit("displayMessage", {
            message: "API key succesfully reset.",
            status: "success"
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    changeUserPassword() {
      var params = {
        user_id: this.user.id,
        new_password: this.newPassword
      };
      axios
        .post("/api/v2/users/reset-password", params)
        .then(() => {
          this.$eventBus.emit("displayMessage", {
            message: "Password succesfully changed.",
            status: "success"
          });
        })
        .catch(error => {
          this.$eventBus.emit("displayMessage", {
            message: "Error: " + error.response.data.error,
            status: "error"
          });
        })
        .finally(() => {
          this.newPassword = null;
        });
    },
    saveUserSettings() {
      axios
        .post("/api/v2/users/", this.profile)
        .then(() => {
          this.$eventBus.emit("displayMessage", {
            message: "Settings successfully updated.",
            status: "success"
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    }
  },
  computed: {
    user() {
      return this.userStore.user;
    },
    authModule() {
      return this.appStore.systemConfig?.auth.module;
    }
  },
  mounted() {
    this.getUserProfile();
    this.appStore.fetchSystemConfig();
  },
  watch: {
    id: function () {
      this.getUserProfile();
    }
  }
};
</script>

<style scoped>
/* Add custom styles here */
</style>
