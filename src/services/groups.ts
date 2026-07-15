import http from "@/services/http";
import type { Group, GroupInput, GroupSearchRequest, GroupSearchResponse, NewGroupRequest } from "@/services/types";

export async function search(request: Partial<GroupSearchRequest> = {}): Promise<GroupSearchResponse> {
  const { data } = await http.post<GroupSearchResponse>("/groups/search", request);
  return data;
}

export async function details(id: string): Promise<Group> {
  const { data } = await http.get<Group>(`/groups/${id}`);
  return data;
}

export async function create(request: NewGroupRequest): Promise<Group> {
  // No trailing slash: the route is @router.post("") under the /groups prefix.
  const { data } = await http.post<Group>("/groups", request);
  return data;
}

export async function patch(id: string, group: GroupInput): Promise<Group> {
  const { data } = await http.patch<Group>(`/groups/${id}`, { rbacgroup: group });
  return data;
}

export async function remove(id: string): Promise<void> {
  await http.delete(`/groups/${id}`);
}
