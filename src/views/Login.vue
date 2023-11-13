<template>
  <div class="columns">
    <div class="column is-4 is-offset-4">
      <div class="card is-wide has-text-centered loginform">
        <div class="card-content">
          <p class="title">Log in to Yeti</p>
          <form @submit="logIn">
            <b-field label="Username">
              <b-input v-model="username"></b-input>
            </b-field>
            <b-field label="Password">
              <b-input type="password" v-model="password"></b-input>
            </b-field>
            <b-button type="is-primary" native-type="submit">Login</b-button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Login",
  data() {
    return {
      username: null,
      password: null,
      loading: false
    };
  },
  methods: {
    logIn(e) {
      console.log("submitted");
      e.preventDefault();
      this.loading = true;
      let form = new FormData();
      form.append("username", this.username);
      form.append("password", this.password);
      this.$store
        .dispatch("login", form)
        .then(() => {
          console.log("Successfully logged in!");
          this.$router.push("/");
        })
        .catch(error => {
          this.$buefy.notification.open({
            message: error.response.data.detail,
            type: "is-danger"
          });
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }
};
</script>

<style>
.loginform {
  margin-top: 30px;
}
</style>
