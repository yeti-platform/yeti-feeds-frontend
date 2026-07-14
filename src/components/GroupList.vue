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
          <v-dialog max-width="420px" v-if="hasOwnerPerms(item)">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" class="ms-2" size="small" variant="outlined" color="error">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
            <template v-slot:default="{ isActive }">
              <v-card>
                <v-card-title class="text-h6">Delete group {{ item.name }}?</v-card-title>
                <v-card-text>This action is irreversible</v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="light" variant="text" @click="isActive.value = false">Cancel</v-btn>
                  <v-btn color="error" variant="flat" @click="deleteGroup(item, isActive)">Delete</v-btn>
                  <v-spacer></v-spacer>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
          <!-- edit -->
          <v-dialog max-width="420px" v-if="hasEditPerms(item)">
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
                  <v-btn @click="patchGroup(item.id, isActive)">Save changes</v-btn>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>

          <v-dialog width="75%" v-if="hasOwnerPerms(item)">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" class="ms-2" size="small" variant="outlined" color="primary">
                <v-icon>mdi-account-multiple-plus-outline</v-icon>
              </v-btn>
            </template>
            <template v-slot:default="{ isActive }">
              <ACL-edit :object="item" :is-active="isActive" @members-updated="getGroupData" />
            </template>
          </v-dialog>
        </template>
        <template v-slot:item.acls="{ value }">
          <v-chip
            class="mr-2"
            v-for="membership in topMemberships(value)"
            :key="membership.name"
            :color="getPermColor(membership.role)"
            label
            density="compact"
          >
            <v-icon v-if="membership.source.startsWith('users')" icon="mdi-account-outline" start></v-icon>
            <v-icon v-if="membership.source.startsWith('groups')" icon="mdi-account-multiple-outline" start></v-icon>
            {{ membership.name }}
          </v-chip>
          <v-chip
            v-if="Object.keys(value).length > MAX_MEMBER_DISPLAY"
            class="mr-2"
            label
            color="grey"
            density="compact"
          >
            +{{ Object.keys(value).length - MAX_MEMBER_DISPLAY }} more
          </v-chip>
        </template>
      </v-data-table>
    </v-card-text>

    <v-card-actions>
      <v-dialog width="50%">
        <template v-slot:activator="{ props }">
          <v-btn color="primary" variant="tonal" v-bind="props" @click="editGroup = { name: '', description: '' }">
            <v-icon>mdi-plus</v-icon>Create group
          </v-btn>
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

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

import ACLEdit from "@/components/ACLEdit.vue";
import { eventBus } from "@/plugins/eventbus";
import * as groupsApi from "@/services/groups";
import * as usersApi from "@/services/users";
import type { Group, GroupInput, RoleRelationship } from "@/services/types";
import { useUserStore } from "@/store/user";

const props = withDefaults(
  defineProps<{
    userId?: string;
    /** Whose groups to show: this user's memberships, or every group in the system. */
    membershipsOnly?: boolean;
  }>(),
  { userId: undefined, membershipsOnly: true }
);

const userStore = useUserStore();

const MAX_MEMBER_DISPLAY = 5;

const groups = ref<Group[]>([]);
const groupSearch = ref("");
const editGroup = ref<GroupInput>({ name: "", description: "" });

const groupTableHeaders = [
  { title: "Name", value: "name" },
  { title: "Description", value: "description" },
  { title: props.membershipsOnly ? "Membership type" : "Members", value: "acls" },
  { title: "Actions", value: "actions" }
];

async function getGroupData() {
  if (props.membershipsOnly) {
    if (!props.userId) {
      return;
    }
    const response = await usersApi.details(props.userId);
    groups.value = response.groups;
  } else {
    const response = await groupsApi.search();
    groups.value = response.groups;
  }
}

async function addGroup(isActive: { value: boolean }) {
  const group = await groupsApi.create({ name: editGroup.value.name, description: editGroup.value.description });
  isActive.value = false;
  editGroup.value = { name: "", description: "" };
  await getGroupData();
  eventBus.emit("displayMessage", { status: "success", message: `Group ${group.name} created succesfully` });
}

async function patchGroup(groupId: string, isActive: { value: boolean }) {
  await groupsApi.patch(groupId, editGroup.value);
  isActive.value = false;
  editGroup.value = { name: "", description: "" };
  await getGroupData();
}

async function deleteGroup(group: Group, isActive: { value: boolean }) {
  await groupsApi.remove(group.id);
  isActive.value = false;
  await getGroupData();
}

/** The highest-privileged memberships, as chips; the rest collapse into "+N more". */
function topMemberships(acls: Record<string, RoleRelationship>): Array<RoleRelationship & { name: string }> {
  return Object.entries(acls)
    .map(([name, edge]) => ({ ...edge, name }))
    .sort((a, b) => b.role - a.role)
    .slice(0, MAX_MEMBER_DISPLAY);
}

function getPermColor(role: number): string {
  switch (role) {
    case 7:
      return "orange";
    case 3:
      return "blue";
    case 1:
      return "green";
    default:
      return "grey";
  }
}

function hasEditPerms(group: Group): boolean {
  return userStore.hasEditPerms(group);
}

function hasOwnerPerms(group: Group): boolean {
  return userStore.hasOwnerPerms(group);
}

// The profile page reuses this component across users, and the watcher used to
// be keyed on `id` — a prop that does not exist — so the list never refreshed.
watch(() => props.userId, getGroupData);

onMounted(getGroupData);
</script>
