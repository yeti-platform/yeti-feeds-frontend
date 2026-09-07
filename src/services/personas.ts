import http from "@/services/http";
import type { AgentPersona, AgentPersonaDraft, PersonaSearchRequest, PersonaSearchResponse } from "@/services/types";

export async function search(request: PersonaSearchRequest): Promise<PersonaSearchResponse> {
  const { data } = await http.post<PersonaSearchResponse>("/agentpersonas/search", request);
  return data;
}

export async function create(persona: AgentPersonaDraft): Promise<AgentPersona> {
  const { data } = await http.post<AgentPersona>("/agentpersonas/", { persona });
  return data;
}

/** PATCH replaces the whole persona — send every field, not just the changed ones. */
export async function update(id: string, persona: AgentPersonaDraft): Promise<AgentPersona> {
  const { data } = await http.patch<AgentPersona>(`/agentpersonas/${id}`, { persona });
  return data;
}

export async function remove(id: string): Promise<void> {
  await http.delete(`/agentpersonas/${id}`);
}
