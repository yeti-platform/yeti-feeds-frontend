<template>
  <v-app>
    <default-bar />

    <default-view />
  </v-app>
</template>

<script lang="ts" setup>
import DefaultBar from "./AppBar.vue";
import DefaultView from "./View.vue";
import { useTheme } from "vuetify";

useTheme().change(localStorage.getItem("yetiTheme") || "yetiDarkTheme");
</script>
