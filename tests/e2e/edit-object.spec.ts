import { expect, test } from "./fixtures";

/**
 * Covers components/EditObject.vue via the ObservableDetails view: opening the
 * Edit dialog, patching a field through services/objects.patch (PATCH
 * /observables/{id}), and deleting through services/objects.remove. EditObject
 * is also reused by ObjectDetails and DFIQTree. The mocked user is an admin, so
 * hasEditPerms / hasOwnerPerms are true and both the Edit and Delete actions show.
 */

const observable = {
  id: "789",
  value: "evil.example.com",
  type: "hostname",
  root_type: "observable",
  tags: [],
  context: [],
  acls: {},
  created: "2026-03-23T10:00:00Z",
  modified: "2026-03-23T10:00:00Z"
};

test.describe("Edit object", () => {
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

    await page.route("**/api/v2/observables/789", async route => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(observable) });
    });

    await page.route("**/api/v2/tasks/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tasks: [], total: 0 })
      });
    });

    await page.route("**/api/v2/graph/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ vertices: {}, paths: [], total: 0 })
      });
    });
  });

  test("patches an editable field and wraps the body under root_type", async ({ page }) => {
    const patches: Array<Record<string, unknown>> = [];
    await page.route("**/api/v2/observables/789", async route => {
      if (route.request().method() !== "PATCH") {
        await route.fallback();
        return;
      }
      patches.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...observable, value: "evil2.example.com" })
      });
    });

    await page.goto("/observables/789");
    await page.getByRole("button", { name: "Edit" }).click();

    const dialog = page.locator(".v-overlay--active");
    await expect(dialog.getByText("Editing Hostname")).toBeVisible();
    // "Value" is the (only) editable field on a hostname; it is pre-filled.
    await dialog.getByLabel("Value").fill("evil2.example.com");
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect.poll(() => patches.length).toBe(1);
    expect(patches[0]).toMatchObject({
      observable: { type: "hostname", id: "789", value: "evil2.example.com" }
    });
  });

  test("deletes the object after confirmation", async ({ page }) => {
    const deletes: string[] = [];
    await page.route("**/api/v2/observables/789", async route => {
      if (route.request().method() !== "DELETE") {
        await route.fallback();
        return;
      }
      deletes.push(route.request().url());
      await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
    });

    await page.goto("/observables/789");
    await page.getByRole("button", { name: "Edit" }).click();

    const dialog = page.locator(".v-overlay--active");
    await dialog.getByRole("button", { name: "Delete object" }).click();

    // A confirmation dialog opens on top.
    const confirm = page.locator(".v-overlay--active").last();
    await expect(confirm.getByText("Are you sure you want to delete this item?")).toBeVisible();
    await confirm.getByRole("button", { name: "Delete", exact: true }).click();

    await expect.poll(() => deletes.length).toBe(1);
    expect(deletes[0]).toContain("/observables/789");
  });
});
