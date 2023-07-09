<template>
  <div>
    <div class="columns">
      <div class="column is-7">
        <div class="card">
          <header class="card-header is-info">
            <p class="card-header-title">Profile info</p>
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="column is-5">
        <div class="card">
          <header class="card-header is-warning">
            <p class="card-header-title">Change password</p>
          </header>
          <div class="card-content" v-if="systemAuth === 'local'">
            <b-field>
              <b-input v-model="newPassword" type="password" placeholder="New password" password-reveal></b-input>
            </b-field>
            <p class="control">
              <b-button type="is-primary" @click="changeUserPassword">Save</b-button>
            </p>
          </div>
          <div class="card-content" v-if="systemAuth === 'oidc'">
            Authentication is handled by Open ID Connect. There is no password to change.
          </div>
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
      newPassword: null,
      availableSettings: [],
      activeTab: 0
    };
  },
  props: {
    id: {
      type: String,
      default: null
    }
  },
  methods: {
    getUserProfile() {
      let id = this.id;
      if (id === null) {
        id = this.userId;
      }
      axios
        .get(`/api/v2/users/${id}`)
        .then(response => {
          this.profile = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    resetApiKey() {
      axios
        .post(`/api/v2/users/reset-api-key`, { user_id: this.userId })
        .then(response => {
          this.profile.api_key = response.data.api_key;
          this.$buefy.notification.open({
            message: `API key succesfully reset.`,
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
        user_id: this.userId,
        new_password: this.newPassword
      };
      axios
        .post("/api/v2/users/reset-password", params)
        .then(() => {
          this.$buefy.notification.open({
            message: `Password succesfully changed.`,
            type: "is-success"
          });
        })
        .catch(error => {
          this.$buefy.notification.open({
            message: "Error: " + error.response.data.error,
            type: "is-danger"
          });
        })
        .finally(() => {
          this.newPassword = null;
        });
    },
    saveUserSettings() {
      axios
        .post("/api/v2/users", this.profile)
        .then(() => {
          this.$buefy.notification.open({
            message: `Settings successfully updated.`,
            type: "is-success"
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    }
  },
  computed: {
    isAdmin() {
      return this.$store.getters.isAdmin;
    },
    userId() {
      return this.$store.getters.userId;
    },
    systemAuth() {
      // we only support local for now
      return "local";
    }
  },
  mounted() {
    this.getUserProfile();
  },
  watch: {
    id: function() {
      this.getUserProfile();
    }
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
