<template>
  <v-card>
    <v-card-title>
      ACL for <code>{{ object.name || object.value }}</code>
    </v-card-title>
    <v-card-text>
      <v-container fluid>
        <v-row>
          <v-col>
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
              :items="aclTableData"
              :search="memberFilter"
              density="compact"
              :headers="headers"
              show-select
              @update:model-value="selectMembers"
              return-object
            >
              <template v-slot:item.name="{ item }">
                <router-link
                  v-if="item.source.startsWith('users/')"
                  :to="{ name: 'UserProfileAdmin', params: { id: identityId(item) } }"
                >
                  {{ item.name }}
                </router-link>
                <router-link v-else-if="item.source.startsWith('groups/')" :to="{ name: 'GroupAdmin' }">
                  {{ item.name }}
                </router-link>
                <span v-else>{{ item.name }}</span>
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
              v-model="selectedIdentities"
              :items="allIdentities"
              label="Select identities"
              item-title="name"
              item-value="id"
              density="compact"
              multiple
              chips
              @update:search="listIdentitiesDebounced"
              :loading="identityListLoading"
              @update:modelValue="dropUnknownIdentities"
            >
            </v-combobox>
            <v-btn :disabled="selectedIdentities.length < 1" @click="updateMembers" color="primary">
              Update memberships
            </v-btn>
          </v-col>
          <v-col>
            <v-select
              :disabled="selectedIdentities.length < 1"
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

<script setup lang="ts">
import _ from "lodash";
import { computed, onMounted, ref, watch } from "vue";

import { eventBus } from "@/plugins/eventbus";
import * as groupsApi from "@/services/groups";
import * as rbacApi from "@/services/rbac";
import type { AclRootType, LooseYetiObject, RoleRelationship } from "@/services/types";
import * as usersApi from "@/services/users";

const props = withDefaults(
  defineProps<{
    object: LooseYetiObject;
    isActive: { value: boolean };
    allowGroups?: boolean;
  }>(),
  { allowGroups: false }
);

const emit = defineEmits<{ "members-updated": [] }>();

/** An ACL row: the edge, plus the display name it is keyed by in `acls`. */
type AclRow = RoleRelationship & { name: string };

/** A user or group that can be granted a role. */
interface Identity {
  id: string;
  name: string;
  type: "user" | "group";
}

const headers = [
  { title: "Name", value: "name", sortable: true },
  { title: "Role", value: "role", sortable: true },
  { title: "", value: "remove", sortable: false }
];

const roleItems = [
  { title: "Owner", value: 7 },
  { title: "Writer", value: 3 },
  { title: "Reader", value: 1 }
];

const aclTableData = ref<AclRow[]>([]);
const memberFilter = ref("");
const systemUsers = ref<Identity[]>([]);
const systemGroups = ref<Identity[]>([]);
const selectedIdentities = ref<Identity[]>([]);
const identityListLoading = ref(false);
const selectedRole = ref(1);

const allIdentities = computed(() => [...systemUsers.value, ...systemGroups.value]);

/** The ACL's own root_type is what /rbac/{type}/{id} keys on. */
const rootType = computed(() => props.object.root_type as AclRootType);

/** `source` is an extended id — "users/123" or "groups/456". */
function identityId(row: AclRow): string {
  return row.source.split("/")[1];
}

function roleToHumanReadable(role: number): string {
  switch (role) {
    case 7:
      return "Owner";
    case 3:
      return "Writer";
    case 1:
      return "Reader";
    case 0:
      return "No access";
    default:
      return `Unknown (${role})`;
  }
}

async function getMembershipData() {
  const object = await rbacApi.acls(rootType.value, props.object.id);
  const acls: Record<string, RoleRelationship> = object.acls ?? {};
  aclTableData.value = Object.entries(acls)
    // role is a Permission IntFlag; 0 ("no access") is a real value the
    // generated `1 | 2 | 4` type can't express, so compare as a number.
    .filter(([, edge]) => (edge.role as number) !== 0)
    .map(([name, edge]) => ({ ...edge, name }));
}

async function listIdentities(searchQuery: string = "") {
  identityListLoading.value = true;
  try {
    const [users, groups] = await Promise.all([
      usersApi.search({ page: 0, count: 1000, username: searchQuery }),
      props.allowGroups ? groupsApi.search({ page: 0, count: 1000, name: searchQuery }) : Promise.resolve(null)
    ]);
    systemUsers.value = users.users.map(user => ({ id: user.id, name: user.username, type: "user" as const }));
    systemGroups.value = (groups?.groups ?? []).map(group => ({
      id: group.id,
      name: group.name,
      type: "group" as const
    }));
  } finally {
    // Both lookups clear this together: they used to each clear it in their own
    // `finally`, so the groups call could switch the spinner off while the users
    // call was still in flight.
    identityListLoading.value = false;
  }
}

const listIdentitiesDebounced = _.debounce(listIdentities, 200);

/**
 * The combobox is free-text, so it hands back whatever was typed. Keep only the
 * entries that correspond to a real user or group.
 */
function dropUnknownIdentities(model: (Identity | string)[]) {
  const known = new Map(allIdentities.value.map(identity => [identity.name, identity]));
  selectedIdentities.value = model
    .map(entry => (typeof entry === "string" ? known.get(entry) : known.get(entry?.name)))
    .filter((identity): identity is Identity => identity !== undefined);
}

/** Mirrors the data-table's checkbox selection into the combobox. */
function selectMembers(selectedRows: unknown) {
  selectedIdentities.value = (selectedRows as AclRow[]).map(row => ({
    id: identityId(row),
    name: row.name,
    type: row.source.startsWith("users/") ? "user" : "group"
  }));
}

async function removeMember(membership: AclRow) {
  // The endpoint takes the ACL *edge* id, which is what `acls` is keyed on.
  await rbacApi.removeMember(membership.id);
  eventBus.emit("displayMessage", { status: "success", message: "Members removed." });
  await getMembershipData();
  emit("members-updated");
}

async function updateMembers() {
  const response = await rbacApi.updateMembers(rootType.value, props.object.id, {
    ids: selectedIdentities.value.map(identity => ({ id: identity.id, type: identity.type })),
    role: selectedRole.value
  });

  const messages: string[] = [];
  if (response.updated > 0) {
    messages.push(`Members updated: ${response.updated}`);
  }
  if (response.failed > 0) {
    messages.push(`Failed: ${response.failed}`);
  }
  eventBus.emit("displayMessage", {
    status: response.failed > 0 ? "warning" : "success",
    message: messages.join(" ")
  });

  await getMembershipData();
  emit("members-updated");
}

// The dialog keeps this component alive across objects, so refresh when it changes.
watch(() => props.object.id, getMembershipData);

onMounted(() => {
  listIdentities();
  getMembershipData();
});
</script>
