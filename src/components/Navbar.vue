<template>
  <b-navbar :shadow="true" type="is-dark" class="yeti-navbar">
    <template slot="brand">
      <b-navbar-item tag="router-link" :to="{ path: '/' }"></b-navbar-item>
    </template>
    <template slot="start" v-if="isAuthenticated">
      <b-navbar-item tag="router-link" :to="{ path: '/' }">Search</b-navbar-item>
      <b-navbar-item tag="router-link" :to="{ path: '/browse' }">Browse observables</b-navbar-item>
      <b-navbar-item tag="router-link" :to="{ path: '/feeds' }">Feeds</b-navbar-item>
      <b-navbar-item tag="router-link" :to="{ path: '/analytics' }">Analytics</b-navbar-item>
      <b-navbar-item tag="router-link" :to="{ path: '/exports' }">Exports</b-navbar-item>
      <b-navbar-item tag="router-link" :to="{ path: '/templates' }">Templates</b-navbar-item>
    </template>

    <template slot="end">
      <b-navbar-dropdown label="Admin" v-if="isAdmin">
        <b-navbar-item tag="router-link" :to="{ path: '/admin/users' }">Users</b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/admin/groups' }">Groups</b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/admin/tags' }">Tags</b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/admin/system' }">System</b-navbar-item>
      </b-navbar-dropdown>
      <b-navbar-dropdown :label="tokenSubject" v-if="isAuthenticated">
        <b-navbar-item tag="router-link" :to="{ path: '/profile' }">
          Profile
        </b-navbar-item>
        <b-navbar-item tag="a" @click="logout()" v-if="localAuth">
          Logout
        </b-navbar-item>
      </b-navbar-dropdown>
      <b-navbar-item tag="div">
        <div class="buttons">
          <a class="button is-primary" href="/auth/login" v-if="!isAuthenticated">Log in</a>
        </div>
      </b-navbar-item>
    </template>
  </b-navbar>
</template>

<script>
export default {
  name: "Navbar",
  methods: {
    logout() {
      this.$store.dispatch("logout").then(() => {
        window.location.href = "/login";
      });
      console.log("logout");
    }
  },
  computed: {
    isAuthenticated() {
      return this.$store.getters.isAuthenticated;
    },
    isAdmin() {
      return this.$store.getters.isAdmin;
    },
    tokenSubject() {
      return this.$store.getters.tokenSubject;
    },
    localAuth() {
      var appConfig = this.$store.getters.appConfig;
      return appConfig !== null ? appConfig.auth.module === "local" : null;
    }
  }
};
</script>

<style>
.navbar {
  margin-bottom: 1em;
}

.yeti-navbar .navbar-dropdown {
  padding-top: 0rem;
  margin-top: 0rem;
  border-top: 0;
}
</style>
