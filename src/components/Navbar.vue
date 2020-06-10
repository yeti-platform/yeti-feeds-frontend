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
      <b-navbar-item tag="router-link" :to="{ path: '/analytics' }">
        Analytics
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
        <b-navbar-item tag="router-link" :to="{ path: '/admin/system' }">
          System
        </b-navbar-item>
      </b-navbar-dropdown>
      <b-navbar-item tag="div">
        <div class="buttons">
          <b-button tag="router-link" typ="is-light" to="/profile" v-if="profile">
            <span> {{ profile.username }} </span> <b-icon pack="fas" icon="user-cog" size="is-small"></b-icon>
          </b-button>
          <a class="button is-primary" href="/login" v-if="!profile">
            Log in
          </a>
        </div>
      </b-navbar-item>
    </template>
  </b-navbar>
</template>

<script>
import axios from "axios";

export default {
  name: "Navbar",
  data() {
    return {
      profile: null
    };
  },
  methods: {
    getUserProfile() {
      axios
        .get(`/api/users`)
        .then(response => {
          this.profile = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    }
  },
  mounted() {
    this.getUserProfile();
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
