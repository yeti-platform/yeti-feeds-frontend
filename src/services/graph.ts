import http from "@/services/http";
import type {
  GraphAddRequest,
  GraphMatchRequest,
  GraphMatchResponse,
  GraphPatchRequest,
  GraphSearchRequest,
  GraphSearchResponse,
  Relationship
} from "@/services/types";

export async function search(request: GraphSearchRequest): Promise<GraphSearchResponse> {
  const { data } = await http.post<GraphSearchResponse>("/graph/search", request);
  return data;
}

export async function add(request: GraphAddRequest): Promise<unknown> {
  const { data } = await http.post("/graph/add", request);
  return data;
}

export async function patch(relationshipId: string, request: GraphPatchRequest): Promise<Relationship> {
  const { data } = await http.patch<Relationship>(`/graph/${relationshipId}`, request);
  return data;
}

export async function remove(relationshipId: string): Promise<void> {
  await http.delete(`/graph/${relationshipId}`);
}

/** Swaps the source and target of a relationship. (POST, not PATCH.) */
export async function swap(relationshipId: string): Promise<Relationship> {
  const { data } = await http.post<Relationship>(`/graph/${relationshipId}/swap`);
  return data;
}

/** Matches raw observable strings against known objects and indicators. */
export async function match(request: GraphMatchRequest): Promise<GraphMatchResponse> {
  const { data } = await http.post<GraphMatchResponse>("/graph/match", request);
  return data;
}
