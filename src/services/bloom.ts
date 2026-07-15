import http from "@/services/http";
import type { BloomHit, BloomSearchRequest } from "@/services/types";

export async function search(request: BloomSearchRequest): Promise<BloomHit[]> {
  const { data } = await http.post<BloomHit[]>("/bloom/search", request);
  return data;
}
