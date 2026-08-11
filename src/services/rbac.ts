import http from "@/services/http";
import type { AclRootType, LooseYetiObject, UpdateMembersRequest, UpdateMembersResponse } from "@/services/types";

/**
 * The object with its ACLs resolved. The endpoint returns the object itself
 * (an entity, a group, a user, ...) rather than a dedicated response model, so
 * there is no generated type for it — only the `acls` map is of interest here.
 */
export async function acls(rootType: AclRootType, id: string): Promise<LooseYetiObject> {
  const { data } = await http.get<LooseYetiObject>(`/rbac/${rootType}/${id}`);
  return data;
}

export async function updateMembers(
  rootType: AclRootType,
  id: string,
  request: UpdateMembersRequest
): Promise<UpdateMembersResponse> {
  const { data } = await http.post<UpdateMembersResponse>(`/rbac/${rootType}/${id}/update-members`, request);
  return data;
}

/** Takes the id of the ACL *edge* (RoleRelationship.id), not of the member. */
export async function removeMember(relationshipId: string): Promise<void> {
  await http.delete(`/rbac/${relationshipId}`);
}
