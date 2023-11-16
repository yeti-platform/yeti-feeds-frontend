<template>
  <div v-if="group">
    <h1 class="is-size-4">
      Editing group: <b class="has-text-weight-medium">{{ group.groupname }}</b>
    </h1>
    <br />
    <b-field label>
      <b-autocomplete
        v-model="username"
        :data="users"
        placeholder="Search for users to add"
        icon="search"
        clearable
        @select="user => addMember(user)"
        @keyup.native="listUsers"
        @keyup.native.enter="() => addMember(findUser(username))"
        field="username"
      >
        <template slot="empty">No results found</template>
      </b-autocomplete>
    </b-field>
    <b-table :data="group.members" class="group-members">
      <template v-slot:default="member">
        <b-table-column field="name" label="Username">{{ member.row.username }}</b-table-column>
        <b-table-column field="admin" label="Is admin?">
          <b-checkbox :value="isGroupAdmin(member.row)" @click.native="toggleAdmin(member.row)"></b-checkbox>
        </b-table-column>
        <b-table-column field="remove" label="" width="60">
          <b-icon pack="fas" icon="minus-circle" type="is-danger" @click.native="removeMember(member.row)"></b-icon>
        </b-table-column>
      </template>
    </b-table>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "EditGroup",
  props: ["groupId"],
  data() {
    return {
      group: null,
      users: [],
      username: null,
      selected: null
    };
  },
  mounted() {
    this.listUsers();
  },
  methods: {
    getGroupDetails() {
      axios
        .get(`/api/groupadmin/${this.groupId}`)
        .then(response => {
          this.group = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    isGroupAdmin(member) {
      return this.group.admins.map(admin => admin.id).indexOf(member.id) >= 0;
    },
    findUser(username) {
      return this.users.find(u => u.username === username);
    },
    addMember(user) {
      console.log(user);
      if (user === null) {
        return; // avoid calling the rest with an empty user when the form is cleared.
      }
      var params = {
        uid: user.id,
        gid: this.group.id
      };
      axios
        .post("/api/groupadmin/add-member", params)
        .then(response => {
          this.group = response.data;
          this.$buefy.notification.open({
            message: `Member <strong>${user.username}</strong> succesfully added to <strong>${this.group.groupname}</strong>.`,
            type: "is-success"
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    removeMember(user) {
      var params = {
        uid: user.id,
        gid: this.group.id
      };
      axios
        .post("/api/groupadmin/remove-member", params)
        .then(response => {
          this.group = response.data;
          this.$buefy.notification.open({
            message: `Member <strong>${user.username}</strong> succesfully removed from <strong>${this.group.groupname}</strong>.`,
            type: "is-success"
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    listUsers() {
      axios
        .post("/api/useradminsearch/", this.searchParams)
        .then(response => {
          this.users = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    toggleAdmin(user) {
      var params = {
        uid: user.id,
        gid: this.group.id
      };
      axios
        .post(`/api/groupadmin/toggle-admin`, params)
        .then(response => {
          console.log(response);
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    }
  },
  computed: {
    searchParams() {
      var params = {
        params: {
          page: 1,
          regex: true,
          ignorecase: true
        }
      };
      if (this.username) {
        params.filter = { username: this.username };
      }
      return params;
    }
  },
  watch: {
    groupId: "getGroupDetails"
  }
};
</script>

<style scoped>
.group-members span.icon {
  cursor: pointer;
}
</style>
