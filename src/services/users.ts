import http from "@/services/http";
import type {
  DeleteApiKeyRequest,
  DeleteApiKeyResponse,
  NewApiKeyRequest,
  NewApiKeyResponse,
  NewUserRequest,
  PatchRoleRequest,
  RegisteredApiKey,
  ResetPasswordRequest,
  SearchUserRequest,
  SearchUserResponse,
  ToggleApiKeyRequest,
  ToggleUserRequest,
  User,
  UserDetailsResponse
} from "@/services/types";

/** `username` is a substring filter and is required; count/page default server-side. */
export async function search(
  request: Pick<SearchUserRequest, "username"> & Partial<SearchUserRequest>
): Promise<SearchUserResponse> {
  const { data } = await http.post<SearchUserResponse>("/users/search", request);
  return data;
}

export async function details(id: string): Promise<UserDetailsResponse> {
  const { data } = await http.get<UserDetailsResponse>(`/users/${id}`);
  return data;
}

export async function create(request: NewUserRequest): Promise<User> {
  const { data } = await http.post<User>("/users/", request);
  return data;
}

export async function remove(id: string): Promise<void> {
  await http.delete(`/users/${id}`);
}

/** Flips a boolean field (enabled / admin) on a user. */
export async function toggle(request: ToggleUserRequest): Promise<User> {
  const { data } = await http.post<User>("/users/toggle", request);
  return data;
}

/**
 * `role` is a `Permission` IntFlag on the backend. OpenAPI can only describe the
 * individual flags, so the generated type comes out as `1 | 2 | 4` — which
 * rejects the composite values the UI actually sends (0 = no access,
 * 3 = read/write, 7 = admin). Widen it back to the number it really is.
 */
export type SetRoleRequest = Omit<PatchRoleRequest, "role"> & { role: number };

export async function setRole(request: SetRoleRequest): Promise<unknown> {
  const { data } = await http.patch("/users/role", request);
  return data;
}

export async function resetPassword(request: ResetPasswordRequest): Promise<unknown> {
  const { data } = await http.post("/users/reset-password", request);
  return data;
}

export async function newApiKey(request: NewApiKeyRequest): Promise<NewApiKeyResponse> {
  const { data } = await http.post<NewApiKeyResponse>("/users/new-api-key", request);
  return data;
}

/** Flips a single key's `enabled` flag and returns that key (not the user). */
export async function toggleApiKey(request: ToggleApiKeyRequest): Promise<RegisteredApiKey> {
  const { data } = await http.post<RegisteredApiKey>("/users/toggle-api-key", request);
  return data;
}

export async function deleteApiKey(request: DeleteApiKeyRequest): Promise<DeleteApiKeyResponse> {
  const { data } = await http.post<DeleteApiKeyResponse>("/users/delete-api-key", request);
  return data;
}
