<template>
  <v-card>
    <v-card-title
      >ACL for <code>{{ object.name || object.value }}</code></v-card-title
    >
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
              label="Select identities"
              item-title="name"
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
  name: "ACLEdit",
  props: {
    object: {
      type: Object,
      default: null
    },
    isActive: {
      type: Object,
      default: null
    },
    allowGroups: {
      type: Boolean,
      default: false
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
      systemGroups: [],
      selectedUsers: [],
      userListLoading: false,
      selectedRole: 1,
      roleItems: [
        { title: "Owner", value: 7 },
        { title: "Writer", value: 3 },
        { title: "Reader", value: 1 }
      ]
    };
  },
  methods: {
    getMembershipData() {
      axios
        .get(`/api/v2/${this.endpointForType}/${this.object.id}`)
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
            return { id: user.id, name: user.username, type: "user" };
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {
          this.userListLoading = false;
        });

      if (this.allowGroups) {
        axios
          .post("/api/v2/groups/search", {
            page: 0,
            count: 1000,
            name: searchQuery
          })
          .then(response => {
            this.systemGroups = response.data.groups.map((group: any) => {
              return { id: group.id, name: group.name, type: "group" };
            });
          })
          .catch(error => {
            console.log(error);
          })
          .finally(() => {
            this.userListLoading = false;
          });
      }
    },
    validateUsers(model: any) {
      let validUsernames = this.systemUsers.concat(this.systemGroups).map((user: any) => user.name);
      this.selectedUsers = model.filter((user: any) => {
        return user.name && validUsernames.includes(user.name);
      });
    },
    addToSelectedUsers(selectedItems: Array<Object>) {
      console.log(selectedItems);
      const existingIds = this.selectedUsers.map(user => user.id);
      selectedItems.forEach(item => {
        let id = item.source.split("/")[1];
        if (!existingIds.includes(id)) {
          let type = item.source.includes("user") ? "user" : "group";
          this.selectedUsers.push({ id: id, name: item.name, type: type });
        }
      });

      this.selectedUsers = this.selectedUsers.filter(user => {
        return selectedItems.map(item => item.source.split("/")[1]).includes(user.id);
      });
    },
    removeMember(membership) {
      let sourceType = membership.source.includes("users") ? "user" : "group";
      const request = {
        ids: [{ id: membership.id, type: sourceType }],
        role: 0
      };
      axios
        .delete(`/api/v2/rbac/${membership.id}`)
        .then(response => {
          this.$eventBus.emit("displayMessage", {
            status: "success",
            message: "Members removed."
          });
          this.getMembershipData();
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
        ids: this.selectedUsers.map((user: any) => ({ id: user.id, type: user.type })),
        role: this.selectedRole
      };
      axios
        .post(`/api/v2/rbac/${this.object.root_type}/${this.object.id}/update-members`, request)
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
          this.getMembershipData();
          this.$emit("members-updated");
        })
        .catch(error => {
          this.$eventBus.emit("displayMessage", {
            status: "error",
            message: error.response.data.detail
          });
        });
    },
    generateAclTable(obj) {
      let memberList = [];
      console.log(obj);
      for (let key in obj.acls) {
        if (obj.acls[key].role != 0) {
          let id = obj.acls[key].source.replace("users/", "");
          memberList.push({ name: key, id, ...obj.acls[key] });
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
      return this.systemUsers.concat(this.systemGroups);
    },
    endpointForType() {
      const endpointMap = {
        rbacgroup: "groups",
        entity: "entities",
        indicator: "indicators",
        observable: "observables",
        dfiq: "dfiq",
        user: "users"
      };
      return endpointMap[this.object.root_type];
    },
    allIdentities() {
      return this.systemUsers.concat(this.systemGroups);
    }
  },
  mounted() {
    this.listUsers();
    this.ACLTableData = this.generateAclTable(this.object);
  },
  watch: {
    group: {
      handler: function (val) {
        this.getMembershipData();
      },
      deep: true
    }
  }
};
</script>

<style scoped>
/* Add custom styles here */
</style>
