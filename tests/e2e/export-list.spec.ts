import { test, expect } from "@playwright/test";

/**
 * Covers views/ExportList.vue, which drives export CRUD through the services/
 * layer (templates.search, tasks.newExport/updateExport/deleteExport).
 * The task table itself is rendered by the (still un-migrated) TaskList.
 */
test.describe("Export List", () => {
  let newExportRequests: Array<Record<string, unknown>>;
  let patchExportRequests: Array<Record<string, unknown>>;
  let deletedExports: string[];

  test.beforeEach(async ({ page }) => {
    newExportRequests = [];
    patchExportRequests = [];
    deletedExports = [];

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
        body: JSON.stringify({
          rbac_enabled: true,
          agents_enabled: false,
          system: { templates_dir: "/opt/yeti/templates" }
        })
      });
    });

    // Templates for the "template to use" dropdown (polled every 5s).
    await page.route("**/api/v2/templates/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          templates: [{ id: "t1", name: "hostnames" }, { id: "t2", name: "ipv4s" }],
          total: 2
        })
      });
    });

    // The task table (TaskList).
    await page.route("**/api/v2/tasks/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tasks: [
            {
              id: "e1",
              name: "hostname-export",
              type: "export",
              enabled: true,
              description: "All hostnames",
              status: "idle",
              status_message: "",
              frequency: "PT1H",
              last_run: "2026-03-23T10:00:00Z",
              template_name: "hostnames",
              acts_on: ["hostname"],
              include_tags: ["malware"],
              exclude_tags: [],
              ignore_tags: []
            }
          ],
          total: 1
        })
      });
    });

    // NOTE: playwright matches routes in reverse registration order, so the
    // broad /export/* pattern must be registered BEFORE the specific
    // /export/new one, otherwise it would swallow the create request.
    await page.route("**/api/v2/tasks/export/*", async route => {
      const method = route.request().method();
      if (method === "PATCH") {
        patchExportRequests.push(route.request().postDataJSON());
      } else if (method === "DELETE") {
        deletedExports.push(route.request().url());
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });

    await page.route("**/api/v2/tasks/export/new", async route => {
      newExportRequests.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
    });
  });

  test("lists export tasks", async ({ page }) => {
    await page.goto("/exports");
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr").first()).toContainText("hostname-export");
  });

  test("creates a new export from the drawer", async ({ page }) => {
    await page.goto("/exports");
    await expect(page.locator("tbody tr")).toHaveCount(1);

    await page.getByLabel("Name").fill("my-new-export");
    await page.getByLabel("Description").fill("a description");

    await page.getByRole("button", { name: "Add new export" }).click();

    await expect.poll(() => newExportRequests.length).toBe(1);
    const payload = newExportRequests[0].export as Record<string, unknown>;
    expect(payload.name).toBe("my-new-export");
    expect(payload.description).toBe("a description");
  });

  test("updates an existing export when one is selected", async ({ page }) => {
    await page.goto("/exports");
    await expect(page.locator("tbody tr")).toHaveCount(1);

    // TaskList selects via the per-row checkbox (not a row click). Take the
    // first one: the row also has an "enabled" toggle, and a v-switch renders
    // an input[type=checkbox] too. Selecting populates the drawer for editing.
    await page.locator("tbody tr").first().locator("input[type=checkbox]").first().check();
    await expect(page.getByLabel("Name")).toHaveValue("hostname-export");

    await page.getByLabel("Description").fill("updated description");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect.poll(() => patchExportRequests.length).toBe(1);
    const payload = patchExportRequests[0].export as Record<string, unknown>;
    expect(payload.name).toBe("hostname-export");
    expect(payload.description).toBe("updated description");
  });
});
