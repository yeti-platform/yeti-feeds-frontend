<template>
  <b-navbar class="is-dark navbar">
    <template slot="brand">
      <b-navbar-item tag="router-link" :to="{ path: '/' }"> </b-navbar-item>
    </template>
    <template slot="start">
      <b-navbar-item tag="router-link" :to="{ path: '/' }">
        Search
      </b-navbar-item>
      <b-navbar-item tag="router-link" :to="{ path: '/browse' }">
        Browse observables
      </b-navbar-item>
      <b-navbar-item tag="router-link" :to="{ path: '/feeds' }">
        Feeds
      </b-navbar-item>
      <b-navbar-item tag="router-link" :to="{ path: '/exports' }">
        Exports
      </b-navbar-item>
      <b-navbar-item tag="router-link" :to="{ path: '/templates' }">
        Templates
      </b-navbar-item>
    </template>

    <template slot="end">
      <b-navbar-dropdown label="Admin">
        <b-navbar-item tag="router-link" :to="{ path: '/admin/users' }">
          Users
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/admin/groups' }">
          Groups
        </b-navbar-item>
        <b-navbar-item tag="router-link" :to="{ path: '/admin/tags' }">
          Tags
        </b-navbar-item>
      </b-navbar-dropdown>
      <b-navbar-item tag="div">
        <div class="buttons">
          <b-button tag="router-link" to="/profile" type="is-primary">
            Profile
          </b-button>
          <a class="button is-light">
            Log in
          </a>
        </div>
      </b-navbar-item>
    </template>
  </b-navbar>
</template>

<style>
.router-link-exact-active {
  background-color: #292929;
  color: whitesmoke;
}

.navbar {
  margin-bottom: 1em;
}
</style>
