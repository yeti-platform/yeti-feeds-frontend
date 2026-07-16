<template>
  <v-app-bar :elevation="2" color="app-bar-color">
    <v-app-bar-title>
      <router-link style="color: white" class="mx-4 text-uppercase font-weight-black" :to="{ name: 'Home' }"
        >Yeti</router-link
      >
    </v-app-bar-title>
    <template v-slot:append>
      <v-btn v-if="agentsEnabled" :to="{ path: '/chat' }">Agent chat</v-btn>
      <v-btn :to="{ path: '/search' }">Global search</v-btn>
      <v-btn :to="{ path: '/match' }">Observable matching</v-btn>
      <v-btn
        >Objects
        <v-menu activator="parent">
          <v-list>
            <v-list-item :to="{ path: '/observables' }">Observables </v-list-item>
            <v-list-item :to="{ path: '/indicators' }">Indicators </v-list-item>
            <v-list-item :to="{ path: '/entities' }">Entities </v-list-item>
            <v-list-item :to="{ path: '/dfiq' }">DFIQ </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>

      <v-btn>
        Automation
        <v-menu activator="parent">
          <v-list>
            <v-list-item :to="{ path: '/feeds' }">Feeds </v-list-item>
            <v-list-item :to="{ path: '/analytics' }">Analytics </v-list-item>
            <v-list-item :to="{ path: '/exports' }">Exports </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
      <v-divider vertical class="mx-2"></v-divider>
      <v-btn prepend-icon="mdi-application-cog">
        System

        <v-menu activator="parent">
          <v-list>
            <v-list-item :to="{ name: 'UserAdmin' }" prepend-icon="mdi-account-circle" v-if="user?.admin">
              Users
            </v-list-item>
            <v-list-item v-if="RBACEnabled" :to="{ name: 'GroupAdmin' }" prepend-icon="mdi-account-multiple-outline">
              Groups
            </v-list-item>
            <v-list-item :to="{ name: 'TagsAdmin' }" prepend-icon="mdi-tag"> Tags </v-list-item>
            <v-list-item :to="{ name: 'Status' }" prepend-icon="mdi-cog"> Status </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
      <v-btn prepend-icon="mdi-account-circle">
        {{ user?.username }}

        <v-menu activator="parent">
          <v-list>
            <v-list-item :to="{ path: '/profile' }" prepend-icon="mdi-cog"> Account settings </v-list-item>
            <v-list-item @click="toggleTheme" prepend-icon="mdi-brightness-4"> Toggle dark mode </v-list-item>
            <v-list-item @click="logout" prepend-icon="mdi-logout"> Logout </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
    </template>
  </v-app-bar>
</template>

<script lang="ts" setup>
import { useUserStore } from "@/store/user";
import { useAppStore } from "@/store/app";
import { useTheme } from "vuetify";

const theme = useTheme();

function toggleTheme() {
  const next = theme.current.value.dark ? "yetiLightTheme" : "yetiDarkTheme";
  theme.change(next);
  localStorage.setItem("yetiTheme", next);
}
</script>

<script lang="ts">
export default {
  computed: {
    user() {
      return useUserStore().user;
    },
    RBACEnabled() {
      return useAppStore().RBACEnabled;
    },
    agentsEnabled() {
      return useAppStore().agentsEnabled;
    }
  },
  methods: {
    logout() {
      useUserStore()
        .userLocalLogout()
        .then(() => {
          this.$router.push({ name: "Login" });
        });
    }
  }
};
</script>
