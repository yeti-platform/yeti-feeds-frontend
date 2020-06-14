<template>
  <b-navbar class="is-dark navbar">
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
      <b-navbar-dropdown label="Admin" v-if="isAuthenticated">
        <b-navbar-item tag="router-link" :to="{ path: '/admin/users' }">Users</b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/admin/groups' }">Groups</b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/admin/tags' }">Tags</b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/admin/system' }">System</b-navbar-item>
      </b-navbar-dropdown>
      <b-navbar-item tag="div">
        <div class="buttons">
          <b-button tag="router-link" typ="is-light" to="/profile" v-if="isAuthenticated">
            <span>{{ tokenSubject }}</span>
            <b-icon pack="fas" icon="user-cog" size="is-small"></b-icon>
          </b-button>
          <a class="button is-primary" href="/login" v-if="!isAuthenticated">Log in</a>
        </div>
      </b-navbar-item>
    </template>
  </b-navbar>
</template>

<script>
export default {
  name: "Navbar",
  computed: {
    isAuthenticated() {
      return this.$store.getters.isAuthenticated;
    },
    tokenSubject() {
      return this.$store.getters.tokenSubject;
    }
  }
};
</script>

<style>
.router-link-exact-active {
  background-color: #292929;
  color: whitesmoke;
}

.navbar {
  margin-bottom: 1em;
}
</style>
