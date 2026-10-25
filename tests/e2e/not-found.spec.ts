import { test, expect } from "./fixtures";

/**
 * Covers the catch-all route: an unknown path renders views/NotFound.vue inside
 * the default layout, with a title, instead of an empty page.
 */
test.describe("Not found", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v2/auth/me", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ username: "testadmin", admin: true, email: "test@example.com" })
      });
    });

    await page.route("**/api/v2/system/config", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rbac_enabled: true, agents_enabled: false, system: { templates_dir: "/t" } })
      });
    });
  });

  test("renders the Not Found view with a title for an unknown path", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");

    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByText("/this-route-does-not-exist")).toBeVisible();
    await expect(page).toHaveTitle("Not found - Yeti");

    // The layout is still there, so the user is not stranded.
    await expect(page.getByRole("link", { name: "Global search" })).toBeVisible();
    await page.getByRole("link", { name: "Go to observables" }).click();
    await expect(page).toHaveURL(/\/observables$/);
  });
});
