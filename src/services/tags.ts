import http from "@/services/http";
import type { Tag, TagMultipleGetRequest, TagSearchRequest, TagSearchResponse } from "@/services/types";

export async function search(request: TagSearchRequest): Promise<TagSearchResponse> {
  const { data } = await http.post<TagSearchResponse>("/tags/search", request);
  return data;
}

export async function getMultiple(request: TagMultipleGetRequest): Promise<TagSearchResponse> {
  const { data } = await http.post<TagSearchResponse>("/tags/get/multiple", request);
  return data;
}

export async function update(id: string, request: Partial<Tag>): Promise<Tag> {
  const { data } = await http.patch<Tag>(`/tags/${id}`, request);
  return data;
}

export async function remove(id: string): Promise<void> {
  await http.delete(`/tags/${id}`);
}

export async function merge(merge: string[], marker: string, permanent = false): Promise<unknown> {
  const { data } = await http.post("/tags/merge", { merge, merge_into: marker, permanent });
  return data;
}
