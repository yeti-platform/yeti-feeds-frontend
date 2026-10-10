import { test, expect } from "./fixtures";

/**
 * Covers views/System.vue: the worker status cards and what they show when
 * /system/workers cannot answer (no Celery worker, for example).
 */
test.describe("System status", () => {
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

  test("lists registered and active tasks", async ({ page }) => {
    await page.route("**/api/v2/system/workers", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          registered: { "worker1@host": ["core.taskscheduler.run_task"] },
          active: [["FeedX", "{}"]]
        })
      });
    });

    await page.goto("/system/status");

    await expect(page.getByText("worker1@host")).toBeVisible();
    await expect(page.getByText("FeedX")).toBeVisible();
    await expect(page.getByText("Loading...")).toHaveCount(0);
  });

  test("says so when worker information cannot be loaded", async ({ page }) => {
    await page.route("**/api/v2/system/workers", async route => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal Server Error" })
      });
    });

    await page.goto("/system/status");

    const alert = page.getByRole("alert").filter({ hasText: "Could not load worker information" });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Is a Celery worker running?");
    await expect(page.getByText("Loading...")).toHaveCount(0);
  });
});
