<template>
  <v-card>
    <v-card-title>Members of {{ group.name }}</v-card-title>
    <v-card-text>
      <v-container fluid>
        <v-row>
          <v-col>
            <!-- input filter -->
            <v-text-field
              v-model="memberFilter"
              prepend-inner-icon="mdi-magnify"
              label="Filter users"
              variant="outlined"
              hide-details
              single-line
              density="compact"
            />
            <v-data-table
              :items="ACLTableData"
              :search="memberFilter"
              density="compact"
              :headers="headers"
              show-select
              @update:model-value="addToSelectedUsers"
              return-object
            >
              <template v-slot:item.name="{ item }">
                <router-link :to="{ name: 'UserProfileAdmin', params: { id: item.source.replace('users/', '') } }">{{
                  item.name
                }}</router-link>
              </template>
              <template v-slot:item.role="{ item }">
                {{ roleToHumanReadable(item.role) }}
              </template>
              <template v-slot:item.remove="{ item }">
                <v-btn
                  icon="mdi-link-off"
                  @click="removeMember(item)"
                  density="compact"
                  variant="tonal"
                  color="error"
                  class="me-2"
                ></v-btn>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-combobox
              v-model="selectedUsers"
              :items="systemUsersFiltered"
              label="Select users (existing or new)"
              item-title="username"
              item-value="id"
              density="compact"
              multiple
              chips
              @update:search="listUsersDebounced"
              :loading="userListLoading"
              @update:modelValue="validateUsers"
            >
            </v-combobox>
            <v-btn :disabled="selectedUsers.length < 1" @click="updateMembers" color="primary"
              >Update memberships</v-btn
            >
          </v-col>
          <v-col>
            <v-select
              :disabled="selectedUsers.length < 1"
              v-model="selectedRole"
              :items="roleItems"
              label="Role"
              density="compact"
            ></v-select>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-btn color="cancel" @click="isActive.value = false">Close</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import axios from "axios";
import _ from "lodash";
</script>

<script lang="ts">
export default {
  name: "GroupMemberEdit",
  props: {
    group: {
      type: Object,
      default: null
    },
    isActive: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      ACLTableData: [],
      memberFilter: "",
      userFilter: "",
      headers: [
        { title: "Name", value: "name", sortable: true },
        { title: "Role", value: "role", sortable: true },
        { title: "", value: "remove", sortable: false }
      ],
      systemUsers: [],
      selectedUsers: [],
      userListLoading: false,
      selectedRole: 1,
      roleItems: [
        { title: "Owner", value: 7 },
        { title: "Writer", value: 3 },
        { title: "Reader", value: 1 },
        { title: "Remove", value: 0 }
      ]
    };
  },
  methods: {
    getMembershipData() {
      axios
        .get(`/api/v2/groups/${this.group.id}`)
        .then(response => {
          this.ACLTableData = this.generateAclTable(response.data);
        })
        .catch(error => {
          console.log(error);
        });
    },
    roleToHumanReadable(role: number) {
      switch (role) {
        case 7:
          return "Owner";
        case 3:
          return "Writer";
        case 1:
          return "Reader";
        case 0:
          return "No access";
      }
    },
    listUsers(searchQuery: string = "") {
      this.userFilter = searchQuery;
      this.userListLoading = true;
      axios
        .post("/api/v2/users/search", {
          page: 0,
          count: 1000,
          username: searchQuery
        })
        .then(response => {
          this.systemUsers = response.data.users.map((user: any) => {
            return { id: user.id, username: user.username };
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {
          this.userListLoading = false;
        });
    },
    validateUsers(model: any) {
      let validUsernames = this.systemUsers.map((user: any) => user.username);
      this.selectedUsers = model.filter((user: any) => {
        return user.username && validUsernames.includes(user.username);
      });
    },
    addToSelectedUsers(selectedItems: Array<Object>) {
      console.log(selectedItems);
      const existingIds = this.selectedUsers.map(user => user.id);
      selectedItems.forEach(item => {
        if (!existingIds.includes(item.id)) {
          this.selectedUsers.push({ id: item.id, username: item.name });
        }
      });

      this.selectedUsers = this.selectedUsers.filter(user => {
        return selectedItems.map(item => item.id).includes(user.id);
      });
    },
    removeMember(membership) {
      console.log(membership);
      const request = {
        ids: [membership.id],
        role: 0
      };
      axios
        .post(`/api/v2/groups/${this.group.id}/update-members`, request)
        .then(response => {
          this.$eventBus.emit("displayMessage", {
            status: "success",
            message: `User ${membership.name} removed from group.`
          });
          this.$emit("members-updated");
        })
        .catch(error => {
          this.$eventBus.emit("displayMessage", {
            status: "error",
            message: error.response.data.detail
          });
        });
    },
    updateMembers() {
      let request = {
        ids: this.selectedUsers.map((user: any) => user.id),
        role: this.selectedRole
      };
      axios
        .post(`/api/v2/groups/${this.group.id}/update-members`, request)
        .then(response => {
          let msg = "";
          let status = "success";
          if (response.data.updated > 0) {
            msg += `Members updated: ${response.data.updated}`;
          }
          if (response.data.failed > 0) {
            status = "warning";
            msg += ` Failed: ${response.data.failed}`;
          }
          this.$eventBus.emit("displayMessage", {
            status: status,
            message: msg
          });
          this.$emit("members-updated");
        })
        .catch(error => {
          this.$eventBus.emit("displayMessage", {
            status: "error",
            message: error.response.data.detail
          });
        });
    },
    generateAclTable(group) {
      let memberList = [];
      for (let key in group.acls) {
        if (group.acls[key].role != 0) {
          let id = group.acls[key].source.replace("users/", "");
          memberList.push({ name: key, id, ...group.acls[key] });
        }
      }
      return memberList;
    },
    listUsersDebounced: _.debounce(function (searchQuery) {
      this.listUsers(searchQuery);
    }, 200)
  },
  computed: {
    systemUsersFiltered() {
      return this.systemUsers;
      return this.systemUsers.filter(user => !this.ACLTable.map(user => user.name).includes(user.username));
    }
  },
  mounted() {
    this.listUsers();
    this.getMembershipData();
    // this.ACLTableData = this.generateAclTable(this.group);
  },
  watch: {
    group: {
      handler: function (val) {
        this.getMembershipData();
        // this.ACLTableData = this.generateAclTable(val);
      },
      deep: true
    }
  }
};
</script>

<style scoped>
/* Add custom styles here */
</style>
