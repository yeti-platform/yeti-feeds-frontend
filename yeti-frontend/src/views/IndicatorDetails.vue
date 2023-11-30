<template>
  <div>
    {{ id }}
  </div>
</template>

<script lang="ts">
export default {
  name: "IndicatorDetails",
  props: {
    id: {
      type: String,
      required: true
    }
  }
};
</script>

<style scoped></style>
