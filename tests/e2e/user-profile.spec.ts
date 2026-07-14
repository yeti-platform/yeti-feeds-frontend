import { expect, test } from "@playwright/test";

/** Covers views/UserProfile.vue, both for your own profile and as an admin. */

const admin = {
  id: "99",
  username: "testadmin",
  enabled: true,
  admin: true,
  global_role: 7,
  api_keys: {},
  root_type: "user"
};

const alice = {
  id: "1",
  username: "alice",
  enabled: true,
  admin: false,
  global_role: 3,
  api_keys: {},
  root_type: "user"
};

test.describe("User profile", () => {
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

    // Serves both UserProfile and the GroupList it embeds (memberships-only mode
    // reads the groups off this same response).
    for (const [id, profile] of [
      ["1", alice],
      ["99", admin]
    ] as const) {
      await page.route(`**/api/v2/users/${id}`, async route => {
        if (route.request().method() !== "GET") {
          await route.fallback();
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ user: profile, groups: [] })
        });
      });
    }
  });

  test("shows your own profile", async ({ page }) => {
    await page.goto("/profile");
    // Scoped to the table: the AppBar shows the logged-in username too.
    await expect(page.getByRole("cell", { name: "testadmin" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Change password" })).toBeVisible();
  });

  test("resets the password of the profile being viewed, not your own", async ({ page }) => {
    const resets: Array<Record<string, unknown>> = [];

    await page.route("**/api/v2/users/reset-password", async route => {
      resets.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(alice) });
    });

    // An admin looking at alice's profile.
    await page.goto("/profile/1");
    await expect(page.getByText("alice")).toBeVisible();

    await page.getByPlaceholder("New password").fill("newpassword");
    await page.getByRole("button", { name: "Change password" }).click();

    await expect.poll(() => resets.length).toBe(1);
    // Regression: this used to send the *logged-in* user's id, so an admin
    // resetting someone else's password silently changed their own.
    expect(resets[0]).toEqual({ user_id: "1", new_password: "newpassword" });
    await expect(page.getByText("Password succesfully changed.")).toBeVisible();
  });

  test("updates a user's global role", async ({ page }) => {
    const roles: Array<Record<string, unknown>> = [];

    await page.route("**/api/v2/users/role", async route => {
      roles.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(alice) });
    });

    await page.goto("/profile/1");
    await expect(page.getByText("alice")).toBeVisible();

    await page.getByLabel("Global role").first().click();
    await page.getByRole("option", { name: "Read only" }).click();

    await expect.poll(() => roles.length).toBe(1);
    expect(roles[0]).toEqual({ user_id: "1", role: 1 });
  });
});
