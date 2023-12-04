<template>
  <v-app-bar :elevation="2" title="Yeti">
    <template v-slot:append>
      <v-btn :to="{ path: '/observables' }">Observables</v-btn>
      <v-btn :to="{ path: '/entities' }">Entities</v-btn>
      <v-btn :to="{ path: '/indicators' }">Indicators</v-btn>
      <v-btn :to="{ path: '/feeds' }">Feeds</v-btn>
      <v-divider vertical></v-divider>
      <v-btn prepend-icon="mdi-check-circle">
        {{ user?.username }}
      </v-btn>
    </template>
  </v-app-bar>
</template>

<script lang="ts" setup>
import { useUserStore } from "@/store/user";
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
