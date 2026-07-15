import { expect, test } from "./fixtures";

/**
 * Covers components/NewObject.vue via the EntitySearch view (/entities): opening
 * the "New Entity" menu, filling the type's editable fields, and saving through
 * services/objects.create (POST /entities/). NewObject is also reused by the
 * observable/indicator/dfiq search views and LinkObject.
 */

const admin = { username: "testadmin", admin: true, email: "test@example.com" };

test.describe("New object", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v2/auth/me", async route => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(admin) });
    });

    await page.route("**/api/v2/system/config", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rbac_enabled: true, agents_enabled: false, auth: { module: "local" } })
      });
    });

    // ObjectList's per-type search on the entity tabs — return an empty list.
    await page.route("**/api/v2/entities/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ entities: [], total: 0 })
      });
    });
  });

  test("creates a malware entity and sends the wrapped body", async ({ page }) => {
    const creates: Array<Record<string, unknown>> = [];
    await page.route("**/api/v2/entities/", async route => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      creates.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "e42", name: "Emotet", type: "malware", root_type: "entity" })
      });
    });

    // The details route the form redirects to on success.
    await page.route("**/api/v2/entities/e42", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "e42",
          name: "Emotet",
          type: "malware",
          root_type: "entity",
          tags: [],
          context: [],
          acls: {},
          created: "2026-03-23T10:00:00Z",
          modified: "2026-03-23T10:00:00Z"
        })
      });
    });

    await page.goto("/entities");

    await page.getByRole("button", { name: "New Entity" }).click();
    // The type menu lists every entity type; pick Malware.
    await page.getByRole("listitem").filter({ hasText: "Malware" }).first().click();

    const dialog = page.locator(".v-overlay--active");
    await expect(dialog.getByText("New Malware")).toBeVisible();
    await dialog.getByLabel("Name").fill("Emotet");
    await dialog.getByLabel("Family").fill("banker");
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect.poll(() => creates.length).toBe(1);
    // The backend wraps the object under its root_type key.
    expect(creates[0]).toEqual({
      entity: { type: "malware", name: "Emotet", family: "banker", aliases: undefined, description: undefined }
    });

    // On success it redirects to the new entity's details page.
    await expect(page).toHaveURL(/\/entities\/e42/);
  });

  test("shows inline validation errors from a 422", async ({ page }) => {
    await page.route("**/api/v2/entities/", async route => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          detail: [{ loc: ["body", "entity", "malware", "name"], msg: "field required", type: "value_error" }]
        })
      });
    });

    await page.goto("/entities");
    await page.getByRole("button", { name: "New Entity" }).click();
    await page.getByRole("listitem").filter({ hasText: "Malware" }).first().click();

    const dialog = page.locator(".v-overlay--active");
    await dialog.getByLabel("Family").fill("orphan");
    await dialog.getByRole("button", { name: "Save" }).click();

    // The per-field validation error is surfaced inline in the card, prefixed
    // with the offending field name (the global snackbar also shows it).
    await expect(dialog.getByText("Error saving Malware:")).toBeVisible();
    await expect(dialog.locator("li").filter({ hasText: "field required" })).toContainText("name");
  });
});
