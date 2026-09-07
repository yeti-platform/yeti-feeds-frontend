import http from "@/services/http";
import type { ToolsResponse } from "@/services/types";

export async function listTools(): Promise<ToolsResponse> {
  const { data } = await http.get<ToolsResponse>("/agents/tools");
  return data;
}
