import http from "@/services/http";
import type { SearchRequest, SearchResponse } from "@/services/types";

/** Cross-object-family free-text search backing the GlobalSearch view. */
export async function search(request: SearchRequest): Promise<SearchResponse> {
  const { data } = await http.post<SearchResponse>("/search/", request);
  return data;
}
