<template>
  <v-container>
    <v-alert type="warning" variant="tonal" class="mt-4">
      <h1 class="text-h6">Page not found</h1>
      <p class="mt-2">
        There is nothing at <code>{{ $route.fullPath }}</code>. The link may be stale, or the address mistyped.
      </p>
      <v-btn class="mt-4" variant="tonal" :to="{ name: 'ObservableSearch' }">Go to observables</v-btn>
    </v-alert>
  </v-container>
</template>
