<template>
  <v-sheet class="ma-5" width="100%">
    <group-list :memberships-only="false"> </group-list>
  </v-sheet>
</template>

<script lang="ts" setup>
import GroupList from "@/components/GroupList.vue";
</script>

<script lang="ts">
export default {
  components: {
    GroupList
  }
};
</script>
