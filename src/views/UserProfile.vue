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
                <tr>
                  <th>Groups</th>
                  <td>
                    <b-taglist>
                      <b-tag type="is-info" v-bind:key="group.groupname" v-for="group in profile.groups">
                        {{ group.groupname }}
                      </b-tag>
                    </b-taglist>
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
          <div class="card-content">
            <b-field>
              <b-input v-model="currentPassword" type="password" placeholder="Current password"></b-input>
            </b-field>
            <b-field>
              <b-input v-model="newPassword" type="password" placeholder="New password" password-reveal></b-input>
            </b-field>
            <p class="control">
              <b-button type="is-primary" @click="changeUserPassword()">Save</b-button>
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="columns">
      <div class="column" v-if="profile">
        <b-tabs v-model="activeTab">
          <b-tab-item label="Permissions">
            <table class="table is-fullwidth">
              <tbody>
                <tr>
                  <th>Permission type</th>
                  <th>Read</th>
                  <th>Write</th>
                  <th>Refresh</th>
                  <th>Toggle</th>
                </tr>
                <tr v-for="type in Object.keys(profile.permissions)" v-bind:key="type">
                  <td>{{ type }}</td>
                  <td>
                    <b-checkbox
                      :disabled="profile.permissions[type].read == null || !isAdmin"
                      v-model="profile.permissions[type].read"
                    ></b-checkbox>
                  </td>
                  <td>
                    <b-checkbox
                      :disabled="profile.permissions[type].write == null || !isAdmin"
                      v-model="profile.permissions[type].write"
                    ></b-checkbox>
                  </td>
                  <td>
                    <b-checkbox
                      :disabled="profile.permissions[type].refresh == null || !isAdmin"
                      v-model="profile.permissions[type].refresh"
                    ></b-checkbox>
                  </td>
                  <td>
                    <b-checkbox
                      :disabled="profile.permissions[type].toggle == null || !isAdmin"
                      v-model="profile.permissions[type].toggle"
                    ></b-checkbox>
                  </td>
                </tr>
              </tbody>
            </table>
            <p class="control">
              <b-button type="is-primary" @click="saveUserPermissions()" v-if="isAdmin">Save permissions</b-button>
            </p>
          </b-tab-item>
          <b-tab-item label="Misc settings">
            <p class="title is-4">Miscellaneous settings</p>
            <p class="subtitle is-6">
              Any Yeti object can register per-user settings for specific tweaking. This is especially useful for API
              keys or individual credentials.
            </p>
            <b-field
              v-for="setting_name in Object.keys(profile.available_settings)"
              v-bind:key="profile.available_settings[setting_name].name"
              :label="profile.available_settings[setting_name].name"
            >
              <b-input
                :placeholder="profile.available_settings[setting_name].description"
                v-model="profile.settings[setting_name]"
              ></b-input>
            </b-field>
            <p class="control">
              <b-button type="is-primary" @click="saveUserSettings()">Save settings</b-button>
            </p>
          </b-tab-item>
        </b-tabs>
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
      console.log("userprofile");
      axios
        .get(this.getEndpoint(""))
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
        .post(this.getEndpoint("reset-api"))
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
        .post(this.getEndpoint("change-password"), params)
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
          this.currentPassword = null;
          this.newPassword = null;
        });
    },
    saveUserSettings() {
      axios
        .post(this.getEndpoint("settings"), this.profile.settings)
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
    },
    saveUserPermissions() {
      var uri = `/api/useradmin/permissions`;
      if (this.id !== null) {
        uri += `/${this.id}`;
      }
      axios
        .post(uri, this.profile.permissions)
        .then(response => {
          this.profile.permissions = response.data.permissions;
          this.$buefy.notification.open({
            message: `Permissions successfully updated.`,
            type: "is-success"
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    getEndpoint(endpoint) {
      if (this.id !== null) {
        return `/api/useradmin/${endpoint}/${this.id}`.replace("//", "/");
      } else {
        return `/api/users/${endpoint}`;
      }
    }
  },
  computed: {
    isAdmin() {
      return this.$store.getters.isAdmin;
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
