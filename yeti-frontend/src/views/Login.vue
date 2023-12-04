<template>
  <v-app>
    <v-main>
      <v-container>
        <v-card class="mx-auto pa-6" max-width="600">
          <v-card-title>Log in to Yeti</v-card-title>
          <v-card-text v-if="authModule === 'local'">
            <v-form @submit="logIn">
              <v-text-field v-model="username" variant="outlined" label="Username"></v-text-field>
              <v-text-field v-model="password" variant="outlined" label="Password" type="password"></v-text-field>
              <v-btn block rounded="xs" size="large" variant="tonal" color="primary" class="mt-2" type="submit"
                >Log in</v-btn
              >
            </v-form>
          </v-card-text>
          <v-card-text v-if="authModule === 'oidc'">
            <v-btn @click="OIDCRefresh" block rounded="xs" size="large" variant="tonal" color="primary" class="mt-2"
              >OIDC login</v-btn
            >
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { useUserStore } from "@/store/user";
import { useAppStore } from "@/store/app";
</script>

<script lang="ts">
export default {
  name: "Login",
  data() {
    return {
      username: null,
      password: null,
      userStore: useUserStore(),
      appStore: useAppStore()
    };
  },
  methods: {
    OIDCRefresh() {
      this.userStore
        .OIDCRefresh()
        .then(() => {
          this.$router.push("/observables");
        })
        .catch(error => {
          console.log("Could not refresh OIDC token: " + error);
        });
    },
    logIn(e) {
      e.preventDefault();
      let form = new FormData();
      form.append("username", this.username);
      form.append("password", this.password);
      this.userStore
        .userLocalLogin(form)
        .then(() => {
          console.log("Successfully logged in!");
          this.$router.push("/observables");
        })
        .catch(error => {
          this.$eventBus.emit("displayMessage", { message: error.response.data.detail, status: "error" });
        });
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
    this.appStore.fetchSystemConfig();
  }
};
</script>

<style></style>
