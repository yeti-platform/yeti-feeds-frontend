<template>
  <div class="columns">
    <div class="column is-7">
      <div class="is-child card">
        <header class="card-header is-danger">
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
    <div class="column is-5">Authentication info</div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "UserProfile",
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
    },
    resetApiKey(user) {
      axios
        .post(`/api/useradmin/reset-api/${user.id}`)
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
