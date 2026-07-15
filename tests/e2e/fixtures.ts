import { test as base } from "@playwright/test";

/**
 * Shared e2e test object. Use this instead of importing `test`/`expect`
 * straight from "@playwright/test".
 *
 * It aborts any `/api/v2/**` request a spec hasn't explicitly mocked, which
 * mirrors CI (where the Vite proxy target is unreachable and such requests
 * fail to connect). Without it, running e2e in the dev container — where the
 * backend *is* reachable — lets an unmocked request (e.g. the entities/
 * indicators/dfiq searches EntitySelector fires on mount) return a real 401,
 * which the http interceptor turns into a redirect to /login, so the view
 * under test navigates away and its assertions flake.
 *
 * Playwright evaluates routes most-recently-registered first, so the specific
 * routes a spec adds in its own beforeEach still take precedence over this
 * catch-all.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("**/api/v2/**", route => route.abort());
    await use(page);
  }
});

export { expect } from "@playwright/test";
