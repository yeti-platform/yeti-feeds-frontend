<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <v-card v-if="profile" variant="flat">
          <v-card-title>Profile information</v-card-title>
          <v-card-text>
            <v-table>
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
                      :disabled="!user?.admin"
                      :hide-details="true"
                    ></v-combobox>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
        <api-key-management
          v-if="profile"
          :profile-id="profile.id"
          :api-keys="profile.api_keys ?? {}"
          @api-key-update="apiKeys => profile && (profile.api_keys = apiKeys)"
        />
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
            <v-btn type="is-primary" @click="changeUserPassword" :disabled="!newPassword">Change password</v-btn>
          </v-card-text>
        </v-card>
        <div v-if="authModule === 'oidc'">
          Authentication is handled by Open ID Connect. There is no password to change.
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <group-list v-if="profileId" :user-id="profileId" :memberships-only="true"></group-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import ApiKeyManagement from "@/components/ApiKeyManagement.vue";
import GroupList from "@/components/GroupList.vue";
import { eventBus } from "@/plugins/eventbus";
import type { User } from "@/services/types";
import * as usersApi from "@/services/users";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";

/** Set by the UserProfileAdmin route; absent when a user views their own profile. */
const props = defineProps<{ id?: string }>();

const userStore = useUserStore();
const appStore = useAppStore();

const profile = ref<User | null>(null);
const newPassword = ref("");
const showPassword = ref(false);

const roleMapping = [
  { name: "No access", value: 0 },
  { name: "Read only", value: 1 },
  { name: "Read/write", value: 3 },
  { name: "Admin", value: 7 }
];

const user = computed(() => userStore.user);
const authModule = computed(() => appStore.systemConfig?.auth.module);
/** The profile being viewed: the route's user for admins, otherwise your own. */
const profileId = computed(() => props.id || user.value?.id);

async function getUserProfile() {
  if (!profileId.value) {
    return;
  }
  const response = await usersApi.details(profileId.value);
  profile.value = response.user;
}

/**
 * Resets the password of the profile being viewed, not of the logged-in user —
 * the backend lets an admin reset anyone's password, and this used to send the
 * logged-in user's id, so an admin on someone else's profile page silently
 * changed their own password.
 */
async function changeUserPassword() {
  if (!profile.value) {
    return;
  }
  try {
    await usersApi.resetPassword({ user_id: profile.value.id, new_password: newPassword.value });
    eventBus.emit("displayMessage", { message: "Password succesfully changed.", status: "success" });
  } finally {
    newPassword.value = "";
  }
}

async function updateUserRole() {
  if (!profile.value) {
    return;
  }
  await usersApi.setRole({ user_id: profile.value.id, role: profile.value.global_role });
  eventBus.emit("displayMessage", { message: "Settings successfully updated.", status: "success" });
}

watch(() => props.id, getUserProfile);

onMounted(() => {
  getUserProfile();
  appStore.fetchSystemConfig();
});
</script>
