import http from "@/services/http";
import type { User } from "@/services/types";

/**
 * Failures from these endpoints are deliberately *not* turned into snackbars or
 * login redirects by the http interceptor: a 401 from /auth/me is the normal
 * answer for a logged-out visitor, and a 401 from /auth/token just means the
 * password was wrong. Callers here report their own errors.
 */

/** Full path (not via the axios baseURL): the browser navigates to it. */
export const OIDC_LOGIN_URL = "/api/v2/auth/oidc-login";

export async function me(): Promise<User> {
  const { data } = await http.get<User>("/auth/me");
  return data;
}

/** /auth/token is an OAuth2 password flow, so it takes a form, not JSON. */
export async function login(username: string, password: string): Promise<void> {
  const form = new FormData();
  form.append("username", username);
  form.append("password", password);
  await http.post("/auth/token", form);
}

export async function logout(): Promise<void> {
  await http.post("/auth/logout");
}
