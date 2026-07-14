import http from "@/services/http";
import type {
  AddContextRequest,
  DeleteContextRequest,
  Entity,
  EntityMultipleGetRequest,
  EntitySearchRequest,
  EntitySearchResponse,
  EntityTagRequest,
  EntityTagResponse,
  NewEntityRequest,
  PatchEntityRequest,
  ReplaceContextRequest
} from "@/services/types";

export async function search(request: EntitySearchRequest): Promise<EntitySearchResponse> {
  const { data } = await http.post<EntitySearchResponse>("/entities/search", request);
  return data;
}

export async function getMultiple(request: EntityMultipleGetRequest): Promise<EntitySearchResponse> {
  const { data } = await http.post<EntitySearchResponse>("/entities/get/multiple", request);
  return data;
}

export async function details(id: string): Promise<Entity> {
  const { data } = await http.get<Entity>(`/entities/${id}`);
  return data;
}

export async function create(request: NewEntityRequest): Promise<Entity> {
  const { data } = await http.post<Entity>("/entities/", request);
  return data;
}

export async function patch(id: string, request: PatchEntityRequest): Promise<Entity> {
  const { data } = await http.patch<Entity>(`/entities/${id}`, request);
  return data;
}

export async function remove(id: string): Promise<void> {
  await http.delete(`/entities/${id}`);
}

export async function tag(request: EntityTagRequest): Promise<EntityTagResponse> {
  const { data } = await http.post<EntityTagResponse>("/entities/tag", request);
  return data;
}

export async function addContext(id: string, request: AddContextRequest): Promise<Entity> {
  const { data } = await http.post<Entity>(`/entities/${id}/context`, request);
  return data;
}

export async function replaceContext(id: string, request: ReplaceContextRequest): Promise<Entity> {
  const { data } = await http.put<Entity>(`/entities/${id}/context`, request);
  return data;
}

export async function deleteContext(id: string, request: DeleteContextRequest): Promise<Entity> {
  const { data } = await http.post<Entity>(`/entities/${id}/context/delete`, request);
  return data;
}
