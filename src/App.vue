<template>
  <div>
    <navbar></navbar>
    <div id="app" class="container is-fluid">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import Navbar from "@/components/Navbar";

export default {
  components: {
    Navbar
  }
};
</script>
<style lang="scss">
@import "style.scss";
</style>
