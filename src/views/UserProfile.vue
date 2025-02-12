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
                    <th>Global role</th>
                    <td>
                      <v-combobox
                        v-model="profile.global_role"
                        :items="roleMapping"
                        label="Global role"
                        item-title="name"
                        item-value="value"
                        density="compact"
                        :return-object="false"
                        @update:modelValue="updateUserRole"
                        :disabled="!user.admin"
                        :hide-details="true"
                      ></v-combobox>
                    </td>
                    <!-- combobox to update role -->
                  </tr>
                </tbody>
              </template>
            </v-table>
          </v-card-text>
        </v-card>
        <api-key-management
          v-if="profile"
          :profile-id="profile.id"
          :apiKeys="profile.api_keys"
          @api-key-update="data => (profile.api_keys = data)"
        >
        </api-key-management>
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
    <v-row>
      <v-col>
        <group-list :user-id="id || user.id" :memberships-only="true"></group-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import axios from "axios";
import { useUserStore } from "@/store/user";
import { useAppStore } from "@/store/app";
import GroupList from "@/components/GroupList.vue";
import ApiKeyManagement from "@/components/ApiKeyManagement.vue";
</script>

<script lang="ts">
export default {
  name: "UserProfile",
  components: {
    GroupList,
    ApiKeyManagement
  },
  data() {
    return {
      profile: null,
      currentPassword: null,
      newPassword: null,
      availableSettings: [],
      activeTab: 0,
      userStore: useUserStore(),
      appStore: useAppStore(),
      showPassword: false,
      roleMapping: [
        { name: "No access", value: 0 },
        { name: "Read only", value: 1 },
        { name: "Read/write", value: 3 },
        { name: "Admin", value: 7 }
      ]
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
          this.profile = response.data.user;
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
    updateUserRole() {
      axios
        .patch(`/api/v2/users/role`, {
          role: this.profile.global_role,
          user_id: this.profile.id
        })
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
