<template>
  <v-app-bar :elevation="2" title="Yeti">
    <template v-slot:append>
      <v-btn :to="{ path: '/' }">Observables</v-btn>
      <v-btn :to="{ path: '/entities' }">Entities</v-btn>
      <v-btn :to="{ path: '/indicators' }">Indicators</v-btn>
      <v-btn :to="{ path: '/feeds' }">Feeds</v-btn>
      <v-divider vertical></v-divider>
      <v-btn icon>
        <v-icon>mdi-tag-outline</v-icon>
      </v-btn>
    </template>
  </v-app-bar>
</template>

<script lang="ts" setup>
//
</script>
