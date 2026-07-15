import { expect, test } from "./fixtures";

import type { RegisteredApiKey } from "@/services/types";

/**
 * Covers views/UserAdmin.vue and the ApiKeyManagement component it embeds in a
 * per-row dialog.
 */

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: "1",
    username: "alice",
    enabled: true,
    admin: false,
    global_role: 3,
    api_keys: {},
    root_type: "user",
    ...overrides
  };
}

const apiKey: RegisteredApiKey = {
  name: "ci",
  sub: "alice",
  scopes: ["all"],
  created: "2026-03-23T10:00:00Z",
  last_used: null,
  exp: null,
  enabled: true,
  expired: false
};

test.describe("User admin", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v2/auth/me", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(user({ id: "99", username: "testadmin", admin: true }))
      });
    });

    await page.route("**/api/v2/system/config", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rbac_enabled: true, agents_enabled: false, auth: { module: "local" } })
      });
    });

    await page.route("**/api/v2/users/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          users: [user(), user({ id: "2", username: "bob", admin: true, api_keys: { ci: apiKey } })],
          total: 2
        })
      });
    });
  });

  test("lists users and links each one to its profile", async ({ page }) => {
    await page.goto("/system/users");

    await expect(page.getByRole("link", { name: "alice" })).toBeVisible();
    await expect(page.getByRole("link", { name: "bob" })).toHaveAttribute("href", "/profile/2");
    // bob's API keys are listed as chips.
    await expect(page.getByText("ci").first()).toBeVisible();
  });

  test("creates a user", async ({ page }) => {
    const created: Array<Record<string, unknown>> = [];

    await page.route("**/api/v2/users/", async route => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      created.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(user({ id: "3", username: "carol" }))
      });
    });

    await page.goto("/system/users");

    await page.getByLabel("Username").first().fill("carol");
    await page.getByLabel("Password").first().fill("hunter2");
    await page.getByLabel("Admin").check();
    await page.getByRole("button", { name: "Add user" }).click();

    await expect.poll(() => created.length).toBe(1);
    expect(created[0]).toEqual({ username: "carol", password: "hunter2", admin: true });
    await expect(page.getByText("User carol successfully added")).toBeVisible();
  });

  test("toggles a user's admin flag", async ({ page }) => {
    const toggles: Array<Record<string, unknown>> = [];

    await page.route("**/api/v2/users/toggle", async route => {
      toggles.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(user({ admin: true }))
      });
    });

    await page.goto("/system/users");
    await expect(page.getByRole("link", { name: "alice" })).toBeVisible();

    // alice's row: the Admin switch is the first of the two in that row.
    const aliceRow = page.getByRole("row").filter({ hasText: "alice" });
    await aliceRow.locator(".v-switch input").first().click();

    await expect.poll(() => toggles.length).toBe(1);
    expect(toggles[0]).toEqual({ user_id: "1", field: "admin" });
  });

  test("deletes a user through the confirmation dialog", async ({ page }) => {
    const deleted: string[] = [];

    await page.route("**/api/v2/users/1", async route => {
      if (route.request().method() !== "DELETE") {
        await route.fallback();
        return;
      }
      deleted.push(route.request().url());
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/system/users");

    const aliceRow = page.getByRole("row").filter({ hasText: "alice" });
    await aliceRow
      .getByRole("button")
      .filter({ has: page.locator(".mdi-delete") })
      .click();

    const dialog = page.locator(".v-overlay--active");
    // The dialog names the user it is about — it used to be rendered once per
    // row with every copy sharing one v-model.
    await expect(dialog.getByText('delete user "alice"')).toBeVisible();
    await dialog.getByRole("button", { name: "OK" }).click();

    await expect.poll(() => deleted.length).toBe(1);
  });

  test("creates an API key and shows the token exactly once", async ({ page }) => {
    await page.route("**/api/v2/users/new-api-key", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ name: "ci", token: "secret-token-value", api_keys: { ci: apiKey } })
      });
    });

    await page.goto("/system/users");

    const aliceRow = page.getByRole("row").filter({ hasText: "alice" });
    await aliceRow.getByRole("button", { name: "Manage API keys" }).click();

    const dialog = page.locator(".v-overlay--active");
    await expect(dialog.getByText("API key management for alice")).toBeVisible();

    await dialog.getByRole("button", { name: "New API key" }).click();

    const newKeyDialog = page.locator(".v-overlay--active").last();
    await newKeyDialog.getByLabel("Key name").fill("ci");
    await newKeyDialog.getByRole("button", { name: "Create" }).click();

    // The token is displayed, and the creation form is replaced by the warning.
    await expect(newKeyDialog.getByText("This is the only time your API key will be accessible")).toBeVisible();
    await expect(newKeyDialog.locator('input[value="secret-token-value"]')).toBeVisible();
  });

  test("deletes an API key", async ({ page }) => {
    const deletes: Array<Record<string, unknown>> = [];

    await page.route("**/api/v2/users/delete-api-key", async route => {
      deletes.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ api_keys: {} })
      });
    });

    await page.goto("/system/users");

    const bobRow = page.getByRole("row").filter({ hasText: "bob" });
    await bobRow.getByRole("button", { name: "Manage API keys" }).click();

    const keysDialog = page.locator(".v-overlay--active");
    await keysDialog
      .getByRole("button")
      .filter({ has: page.locator(".mdi-delete") })
      .first()
      .click();

    const confirm = page.locator(".v-overlay--active").last();
    await expect(confirm.getByText("Delete API key 'ci'?")).toBeVisible();
    await confirm.getByRole("button", { name: "Delete" }).click();

    await expect.poll(() => deletes.length).toBe(1);
    expect(deletes[0]).toEqual({ user_id: "2", name: "ci" });
    await expect(page.getByText("API key 'ci' succesfully deleted.")).toBeVisible();
  });
});
