<template>
  <v-app>
    <v-main>
      <v-container>
        <v-card class="mx-auto pa-6" max-width="600">
          <v-card-title>Log in to Yeti</v-card-title>
          <v-card-text>
            <v-form @submit.prevent>
              <v-text-field v-model="username" variant="outlined" label="Username"></v-text-field>
              <v-text-field v-model="password" variant="outlined" label="Password" type="password"></v-text-field>
            </v-form>
            <v-btn block rounded="xs" size="large" variant="tonal" color="primary" class="mt-2" type="submit"
              >Log in</v-btn
            >
            <v-btn @click="OIDCRefresh" block rounded="xs" size="large" variant="tonal" color="primary" class="mt-2"
              >OIDC login</v-btn
            >
            {{ user?.username }}
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { useUserStore } from "@/store/user";
</script>

<script lang="ts">
export default {
  name: "Login",
  data() {
    return {
      username: null,
      password: null,
      userStore: useUserStore()
    };
  },
  methods: {
    OIDCRefresh() {
      this.userStore.OIDCRefresh();
      // var popup = window.open("/api/v2/auth/oidc-login", "OIDC Login", "width=800,height=600");
      // var timer = setInterval(function() {
      //   userStore.refresh();
      //   console.log(this.user);
      //   // if (popup.document.title.includes("Yeti")) {
      //   if (popup.closed) {
      //     clearInterval(timer);
      //   }
      // }, 1000);
    }
    // logIn(e) {
    //   console.log("submitted");
    //   e.preventDefault();
    //   this.loading = true;
    //   let form = new FormData();
    //   form.append("username", this.username);
    //   form.append("password", this.password);
    //   this.$store
    //     .dispatch("login", form)
    //     .then(() => {
    //       console.log("Successfully logged in!");
    //       this.$router.push("/");
    //     })
    //     .catch(error => {
    //       this.$buefy.notification.open({
    //         message: error.response.data.detail,
    //         type: "is-danger"
    //       });
    //     })
    //     .finally(() => {
    //       this.loading = false;
    //     });
    // }
  },
  computed: {
    user() {
      // userStore.refresh();
      return this.userStore.user;
    }
  }
};
</script>

<style>
.loginform {
  margin-top: 30px;
}
</style>
