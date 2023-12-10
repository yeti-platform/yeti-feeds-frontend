<template>
  <v-app-bar :elevation="2" color="app-bar-color">
    <v-app-bar-title>
      <span class="mx-4 text-uppercase font-weight-black">Yeti</span>
    </v-app-bar-title>
    <template v-slot:append>
      <v-btn :to="{ path: '/observables' }">Observables</v-btn>
      <v-btn :to="{ path: '/entities' }">Entities</v-btn>
      <v-btn :to="{ path: '/indicators' }">Indicators</v-btn>
      <v-btn :to="{ path: '/feeds' }">Feeds</v-btn>
      <v-divider vertical class="mx-2"></v-divider>
      <v-btn prepend-icon="mdi-account-circle">
        {{ user?.username }}

        <v-menu activator="parent">
          <v-list>
            <v-list-item prepend-icon="mdi-cog">
              Profile and settings
            </v-list-item>
            <v-list-item @click="toggleTheme" prepend-icon="mdi-brightness-4">
              Dark mode
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
    </template>
  </v-app-bar>
</template>

<script lang="ts" setup>
import { useUserStore } from "@/store/user";
import { useTheme } from "vuetify";

const theme = useTheme();

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? "yetiLightTheme" : "yetiDarkTheme";
}
</script>

<script lang="ts">
export default {
  computed: {
    user() {
      return useUserStore().user;
    }
  }
};
</script>
