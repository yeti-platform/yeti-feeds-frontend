import http from "@/services/http";
import type {
  MergeTagRequest,
  MergeTagResult,
  Tag,
  TagMultipleGetRequest,
  TagSearchRequest,
  TagSearchResponse,
  TagUpdateRequest
} from "@/services/types";

export async function search(request: TagSearchRequest): Promise<TagSearchResponse> {
  const { data } = await http.post<TagSearchResponse>("/tags/search", request);
  return data;
}

export async function getMultiple(request: TagMultipleGetRequest): Promise<TagSearchResponse> {
  const { data } = await http.post<TagSearchResponse>("/tags/get/multiple", request);
  return data;
}

/** PUT replaces the whole tag — every field in UpdateRequest is sent. */
export async function update(id: string, request: TagUpdateRequest): Promise<Tag> {
  const { data } = await http.put<Tag>(`/tags/${id}`, request);
  return data;
}

export async function remove(id: string): Promise<void> {
  await http.delete(`/tags/${id}`);
}

export async function merge(request: MergeTagRequest): Promise<MergeTagResult> {
  const { data } = await http.post<MergeTagResult>("/tags/merge", request);
  return data;
}
