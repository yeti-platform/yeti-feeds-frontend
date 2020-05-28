<template>
  <div class="columns">
    <div class="column is-7">
      <div class="card">
        <header class="card-header is-info">
          <p class="card-header-title">
            Profile info
          </p>
        </header>
        <div class="card-content">
          <table class="table is-fullwidth" v-if="profile">
            <tbody>
              <tr>
                <th>Username</th>
                <td>{{ profile.username }}</td>
                <td></td>
              </tr>
              <tr>
                <th>API key</th>
                <td>
                  <code>{{ profile.api_key }}</code>
                </td>
                <td>
                  <b-button class="button is-outline reset-button" size="is-small" @click="resetApiKey(profile)">
                    <span>Reset key</span>
                  </b-button>
                </td>
              </tr>
              <tr>
                <th>Groups</th>
                <td>{{ profile.groups }}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="column is-5">
      <div class="card">
        <header class="card-header is-warning">
          <p class="card-header-title">
            Change password
          </p>
        </header>
        <div class="card-content">
          <b-field>
            <b-input v-model="currentPassword" type="password" placeholder="Current password"></b-input>
          </b-field>
          <b-field
            ><b-input v-model="newPassword" type="password" placeholder="New password" password-reveal></b-input
          ></b-field>
          <p class="control"><b-button type="is-primary" @click="changeUserPassword()">Save</b-button></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "UserProfile",
  data() {
    return {
      profile: null,
      currentPassword: null,
      newPassword: null
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
    },
    resetApiKey(user) {
      axios
        .post(`/api/users/reset-api`)
        .then(response => {
          user.api_key = response.data.api_key;
          this.$buefy.notification.open({
            message: `API key for user <strong>${user.username}</strong> succesfully reset.`,
            type: "is-success"
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    changeUserPassword() {
      var params = {
        current: this.currentPassword,
        new: this.newPassword
      };
      axios
        .post(`/api/change-password`, params)
        .then(() => {
          this.$buefy.notification.open({
            message: `Password succesfully changed.`,
            type: "is-success"
          });
        })
        .catch(error => {
          console.log(error.response.data.error);
          this.$buefy.notification.open({
            message: "Error: " + error.response.data.error,
            type: "is-danger"
          });
        })
        .finally(() => {
          this.currentPassword = null;
          this.newPassword = null;
        });
    }
  },
  mounted() {
    this.getUserProfile();
  }
};
</script>

<style scoped lang="scss">
@import "@/style.scss";

.card-header.is-warning {
  background: $warning;
}

.card-header.is-danger {
  background: $danger;
}

.card-header.is-info {
  background: $info;
}

.card-header.is-light {
  background: $light;
}
</style>
