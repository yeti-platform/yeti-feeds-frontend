<template>
  <v-app>
    <v-main>
      <v-container>
        <v-card class="mx-auto pa-6" max-width="600">
          <v-card-title>Log in to Yeti</v-card-title>
          <v-card-text v-if="authModule === 'local'">
            <v-form @submit.prevent="logIn">
              <v-text-field v-model="username" label="Username"></v-text-field>
              <v-text-field v-model="password" label="Password" type="password"></v-text-field>
              <v-btn block rounded="xs" size="large" variant="tonal" color="primary" class="mt-2" type="submit">
                Log in
              </v-btn>
            </v-form>
          </v-card-text>
          <v-card-text v-if="authModule === 'oidc'">
            <v-btn
              @click="OIDCBrowserRedirect"
              block
              rounded="xs"
              size="large"
              variant="tonal"
              color="primary"
              class="mt-2"
            >
              OIDC login
            </v-btn>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { AxiosError } from "axios";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { eventBus } from "@/plugins/eventbus";
import { useAppStore } from "@/store/app";
import { useUserStore } from "@/store/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const appStore = useAppStore();

const LANDING = "/observables";

const username = ref("");
const password = ref("");

const user = computed(() => userStore.user);
const authModule = computed(() => appStore.systemConfig?.auth.module);

/** Where to go once logged in — the route that bounced us here, if any. */
const next = computed(() => (typeof route.query.next === "string" ? route.query.next : null));

function OIDCBrowserRedirect() {
  // The OIDC callback route reads this back: we leave the app entirely, so the
  // query param can't survive the round trip. Only store a real destination —
  // this used to write the string "undefined" when there was none.
  if (next.value) {
    localStorage.setItem("next", next.value);
  }
  userStore.OIDCBrowserRedirect();
}

async function logIn() {
  try {
    await userStore.userLocalLogin(username.value, password.value);
  } catch (error) {
    const detail = (error as AxiosError<{ detail?: string }>).response?.data?.detail;
    eventBus.emit("displayMessage", { message: detail || "Could not log in", status: "error" });
    return;
  }
  router.replace(next.value ?? LANDING);
}

// Covers logging in from elsewhere (another tab, the OIDC popup): the store
// fills in without this component doing anything.
watch(user, newUser => {
  if (newUser !== null) {
    router.replace(next.value ?? LANDING);
  }
});

onMounted(async () => {
  appStore.fetchSystemConfig();
  try {
    // Already have a session? Skip the form.
    await userStore.userCheck();
    router.replace(next.value ?? LANDING);
  } catch {
    // Not logged in — which is the whole point of this page.
  }
});
</script>
