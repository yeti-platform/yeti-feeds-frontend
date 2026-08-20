import { expect, test } from "./fixtures";

/**
 * Regression test for a bug where non-admin users never saw the Edit button
 * on DFIQ objects (and, by the same shared `hasRole` check, on any object
 * type) whenever the deployment had RBAC disabled. The backend's
 * permission_on_target()/global_permission() decorators bypass ACL checks
 * entirely when RBAC is off (see core/schemas/rbac.py) -- any authenticated
 * user can write anything -- but the frontend's hasRole() only special-cased
 * `user.admin`, so a non-admin/non-owner still failed the ACL lookup and the
 * button stayed hidden even though the write would have succeeded.
 */

const scenario = {
  id: "555",
  dfiq_id: "S1001",
  name: "Suspicious DNS Query",
  description: "A scenario.",
  type: "scenario",
  root_type: "dfiq",
  dfiq_tags: [],
  tags: [],
  acls: {},
  created: "2026-03-23T10:00:00Z",
  modified: "2026-03-23T10:00:00Z"
};

test.describe("DFIQ Edit button vs. RBAC-enabled flag", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v2/auth/me", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ username: "nonadmin", admin: false, email: "test@example.com" })
      });
    });

    await page.route("**/api/v2/dfiq/555", async route => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scenario) });
    });

    await page.route("**/api/v2/graph/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ vertices: {}, paths: [], total: 0 })
      });
    });
  });

  test("shows Edit for a non-admin, non-owner user when RBAC is disabled", async ({ page }) => {
    await page.route("**/api/v2/system/config", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rbac_enabled: false, agents_enabled: false, system: { templates_dir: "/t" } })
      });
    });

    await page.goto("/dfiq/555");

    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  });

  test("hides Edit for a non-admin, non-owner user when RBAC is enabled", async ({ page }) => {
    await page.route("**/api/v2/system/config", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rbac_enabled: true, agents_enabled: false, system: { templates_dir: "/t" } })
      });
    });

    await page.goto("/dfiq/555");
    // Let the page settle so this isn't just "hasn't rendered yet".
    await expect(page.getByText("Suspicious DNS Query").first()).toBeVisible();

    await expect(page.getByRole("button", { name: "Edit" })).not.toBeVisible();
  });
});
