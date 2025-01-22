<template>
  <v-card>
    <v-card-title>Groups</v-card-title>
    <v-card-text>
      <v-text-field
        v-model="groupSearch"
        placeholder="Search groups"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        hide-details
        single-line
        density="compact"
      ></v-text-field>
      <v-data-table :items="groups" :headers="groupTableHeaders" density="compact" :search="groupSearch">
        <template v-slot:item.actions="{ item }">
          <!-- delete -->
          <v-dialog max-width="420px" v-if="item.perms & 4 || user.admin">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" class="ms-2" size="small" variant="outlined" color="error"
                ><v-icon>mdi-delete</v-icon></v-btn
              >
            </template>
            <template v-slot:default="{ isActive }">
              <v-card>
                <v-card-title class="text-h6">Delete group {{ item.name }}?</v-card-title>
                <v-card-text>This action is irreversible</v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="light" variant="text" @click="isActive.value = false">Cancel</v-btn>
                  <v-btn color="error" variant="flat" @click="deleteGroup(item)">Delete</v-btn>
                  <v-spacer></v-spacer>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
          <!-- edit -->
          <v-dialog max-width="420px" v-if="item.perms & 2 || user.admin">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                class="ms-2"
                size="small"
                variant="outlined"
                color="primary"
                @click="editGroup = { ...item }"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
            <template v-slot:default="{ isActive }">
              <v-card>
                <v-card-title>Edit group</v-card-title>
                <v-card-text>
                  <v-text-field v-model="editGroup.name" label="Name"></v-text-field>
                  <v-textarea v-model="editGroup.description" label="Description"></v-textarea>
                </v-card-text>
                <v-card-actions>
                  <v-btn color="cancel" @click="isActive.value = false">Cancel</v-btn>
                  <v-btn @click="patchGroup(editGroup.id, isActive)">Save changes</v-btn>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
          <!-- user list -->
          <v-dialog width="75%" v-if="user.admin">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" class="ms-2" size="small" variant="outlined" color="primary"
                ><v-icon>mdi-account-multiple-plus-outline</v-icon></v-btn
              >
            </template>
            <template v-slot:default="{ isActive }"
              ><ACL-edit :group="item" @members-updated="getGroupData" :is-active="isActive" />
            </template>
          </v-dialog>
        </template>
        <template v-slot:item.acls="{ value }">
          <v-chip
            class="mr-2"
            v-for="membership in Object.keys(value)
              .map(key => ({ name: key, ...value[key] }))
              .sort((a, b) => b.role - a.role)
              .slice(0, maxMemberDisplay)"
            :key="membership.name"
            :color="getPermColor(membership)"
            label
            density="compact"
          >
            <v-icon v-if="membership.source.startsWith('users')" icon="mdi-account-outline" start></v-icon>
            <v-icon v-if="membership.source.startsWith('groups')" icon="mdi-account-multiple-outline" start></v-icon>
            {{ membership.name }}
          </v-chip>
          <v-chip v-if="Object.keys(value).length > maxMemberDisplay" class="mr-2" label color="grey" density="compact"
            >+{{ Object.keys(value).length - maxMemberDisplay }} more</v-chip
          >
        </template>
      </v-data-table>
    </v-card-text>
    <!-- add buttons ad the end to add a new group -->
    <v-card-actions>
      <v-dialog width="50%" v-if="user.admin">
        <template v-slot:activator="{ props }">
          <v-btn color="primary" variant="tonal" v-bind="props" @click="editGroup = { name: null, description: null }"
            ><v-icon>mdi-plus</v-icon>Create group</v-btn
          >
        </template>
        <template v-slot:default="{ isActive }">
          <v-card>
            <v-card-title>New group</v-card-title>
            <v-card-text>
              <v-text-field v-model="editGroup.name" label="Name"></v-text-field>
              <v-textarea v-model="editGroup.description" label="Description"></v-textarea>
            </v-card-text>
            <v-card-actions>
              <v-btn color="cancel" @click="isActive.value = false">Cancel</v-btn>
              <v-btn @click="addGroup(isActive)">Create group</v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import axios from "axios";
import { useUserStore } from "@/store/user";
import ACLEdit from "@/components/ACLEdit.vue";
</script>

<script lang="ts">
export default {
  name: "GroupList",
  components: {
    ACLEdit
  },
  props: {
    userId: {
      type: String,
      default: null
    },
    membershipsOnly: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      groups: [],
      groupTableHeaders: [
        { title: "Name", value: "name" },
        { title: "Description", value: "description" },
        { title: this.membershipsOnly ? "Membership type" : "Members", value: "acls" },
        { title: "Actions", value: "actions" }
      ],
      editGroup: {
        name: null,
        description: null
      },
      maxMemberDisplay: 5,
      groupSearch: "",
      userStore: useUserStore()
    };
  },
  methods: {
    getGroupData() {
      if (this.membershipsOnly) {
        axios
          .get(`/api/v2/users/${this.userId}`)
          .then(response => {
            this.groups = response.data.groups;
          })
          .catch(error => {
            console.log(error);
          })
          .finally(() => {});
      } else {
        axios
          .post("/api/v2/groups/search", { name: this.groupSearch })
          .then(response => {
            this.groups = response.data.groups;
          })
          .catch(error => {
            console.log(error);
          })
          .finally(() => {});
      }
    },
    addGroup(isActive) {
      axios
        .post("/api/v2/groups", this.editGroup)
        .then(response => {
          this.getGroupData();
          isActive.value = false;
          this.editGroup = {
            name: null,
            description: null
          };
          this.$eventBus.emit("displayMessage", {
            status: "success",
            message: `Group ${response.data.name} created succesfully`
          });
        })
        .catch(error => {
          this.$eventBus.emit("displayMessage", {
            status: "error",
            message: error.response.data.detail
          });
        })
        .finally(() => {});
    },
    patchGroup(groupId: number, isActive) {
      axios
        .patch(`/api/v2/groups/${groupId}`, { rbacgroup: this.editGroup })
        .then(response => {
          this.getGroupData();
          isActive.value = false;
          this.editGroup = {
            name: null,
            description: null
          };
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    deleteGroup(group) {
      // add confirmation popup

      axios
        .delete(`/api/v2/groups/${group.id}`)
        .then(() => {
          this.getGroupData();
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    getHumanReadablePerms(membership) {
      if (membership.role == 7) {
        return ":owner";
      }
      if (membership.role == 3) {
        return ":writer";
      }
      if (membership.role == 1) {
        return ":read-only";
      }
      if (membership.role == 0) {
        return ":no-access";
      }
    },
    getPermColor(membership) {
      // return "orange";
      if (membership.role == 7) {
        return "orange";
      }
      if (membership.role == 3) {
        return "blue";
      }
      if (membership.role == 1) {
        return "green";
      }
      if (membership.role == 0) {
        return "grey";
      }
    }
  },
  computed: {
    user() {
      return this.userStore.user;
    }
  },
  mounted() {
    this.getGroupData();
  },
  watch: {
    id: function () {
      this.getGroupData();
    }
  }
};
</script>

<style scoped>
/* Add custom styles here */
</style>
