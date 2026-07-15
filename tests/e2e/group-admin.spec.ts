import { expect, test } from "./fixtures";

/**
 * Covers views/GroupAdmin.vue -> GroupList (memberships-only: false) and the
 * ACLEdit dialog it opens. The logged-in user is an admin, so hasEditPerms /
 * hasOwnerPerms are always true and every row action is available.
 */

const admin = {
  id: "99",
  username: "testadmin",
  enabled: true,
  admin: true,
  global_role: 7,
  api_keys: {},
  root_type: "user"
};

function group(overrides: Record<string, unknown> = {}) {
  return {
    id: "g1",
    name: "analysts",
    description: "The analyst team",
    root_type: "rbacgroup",
    acls: {},
    ...overrides
  };
}

test.describe("Group admin", () => {
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

    await page.route("**/api/v2/groups/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          groups: [
            group({
              acls: {
                testadmin: {
                  source: "users/99",
                  target: "groups/g1",
                  role: 7,
                  id: "edge1",
                  root_type: "acl",
                  created: "2026-03-23T10:00:00Z",
                  modified: "2026-03-23T10:00:00Z"
                }
              }
            })
          ],
          total: 1
        })
      });
    });
  });

  test("lists groups with their members", async ({ page }) => {
    await page.goto("/system/groups");
    await expect(page.getByRole("cell", { name: "analysts" })).toBeVisible();
    // The ACL chip shows the owning admin.
    await expect(page.getByText("testadmin").last()).toBeVisible();
  });

  test("creates a group", async ({ page }) => {
    const created: Array<Record<string, unknown>> = [];

    await page.route("**/api/v2/groups", async route => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      created.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(group({ id: "g2", name: "hunters", description: "new" }))
      });
    });

    await page.goto("/system/groups");
    await page.getByRole("button", { name: "Create group" }).click();

    const dialog = page.locator(".v-overlay--active");
    await dialog.getByLabel("Name").fill("hunters");
    await dialog.getByLabel("Description").fill("new");
    await dialog.getByRole("button", { name: "Create group" }).click();

    await expect.poll(() => created.length).toBe(1);
    expect(created[0]).toEqual({ name: "hunters", description: "new" });
    await expect(page.getByText("Group hunters created succesfully")).toBeVisible();
  });

  test("edits a group", async ({ page }) => {
    const patches: Array<Record<string, unknown>> = [];

    await page.route("**/api/v2/groups/g1", async route => {
      if (route.request().method() !== "PATCH") {
        await route.fallback();
        return;
      }
      patches.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(group({ description: "renamed" }))
      });
    });

    await page.goto("/system/groups");

    const row = page.getByRole("row").filter({ hasText: "analysts" });
    await row
      .getByRole("button")
      .filter({ has: page.locator(".mdi-pencil") })
      .click();

    const dialog = page.locator(".v-overlay--active");
    await dialog.getByLabel("Description").fill("renamed");
    await dialog.getByRole("button", { name: "Save changes" }).click();

    await expect.poll(() => patches.length).toBe(1);
    // The PATCH body wraps the group under `rbacgroup`.
    expect(patches[0]).toMatchObject({ rbacgroup: { name: "analysts", description: "renamed" } });
  });

  test("deletes a group", async ({ page }) => {
    const deleted: string[] = [];

    await page.route("**/api/v2/groups/g1", async route => {
      if (route.request().method() !== "DELETE") {
        await route.fallback();
        return;
      }
      deleted.push(route.request().url());
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/system/groups");

    const row = page.getByRole("row").filter({ hasText: "analysts" });
    await row
      .getByRole("button")
      .filter({ has: page.locator(".mdi-delete") })
      .click();

    const dialog = page.locator(".v-overlay--active");
    await expect(dialog.getByText("Delete group analysts?")).toBeVisible();
    await dialog.getByRole("button", { name: "Delete" }).click();

    await expect.poll(() => deleted.length).toBe(1);
  });

  test("manages ACL members through the ACLEdit dialog", async ({ page }) => {
    const memberUpdates: Array<Record<string, unknown>> = [];

    // ACLEdit loads users (and, since allowGroups is false here, no groups).
    await page.route("**/api/v2/users/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          users: [
            admin,
            { id: "1", username: "alice", enabled: true, admin: false, global_role: 3, api_keys: {}, root_type: "user" }
          ],
          total: 2
        })
      });
    });

    // ACLEdit reads the object's resolved ACLs from /rbac/{type}/{id}.
    await page.route("**/api/v2/rbac/rbacgroup/g1", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "g1",
          name: "analysts",
          root_type: "rbacgroup",
          acls: {
            testadmin: {
              source: "users/99",
              target: "groups/g1",
              role: 7,
              id: "edge1",
              root_type: "acl",
              created: "2026-03-23T10:00:00Z",
              modified: "2026-03-23T10:00:00Z"
            }
          }
        })
      });
    });

    await page.route("**/api/v2/rbac/rbacgroup/g1/update-members", async route => {
      memberUpdates.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ updated: 1, failed: 0 })
      });
    });

    await page.goto("/system/groups");

    const row = page.getByRole("row").filter({ hasText: "analysts" });
    await row
      .getByRole("button")
      .filter({ has: page.locator(".mdi-account-multiple-plus-outline") })
      .click();

    const dialog = page.locator(".v-overlay--active");
    await expect(dialog.getByText("ACL for")).toBeVisible();
    // testadmin already owns the group, so the existing ACL row is shown.
    await expect(dialog.getByRole("cell", { name: "testadmin" })).toBeVisible();

    // Add alice as a member. Scope to the combobox role: once it is open, its
    // label also matches the listbox popup.
    const identityBox = dialog.getByRole("combobox", { name: "Select identities" });
    await identityBox.click();
    await identityBox.fill("alice");
    await page.getByRole("option", { name: "alice" }).click();
    // The autocomplete menu stays open over the dialog and would swallow the
    // click on the button behind it.
    await page.keyboard.press("Escape");

    await dialog.getByRole("button", { name: "Update memberships" }).click();

    await expect.poll(() => memberUpdates.length).toBe(1);
    expect(memberUpdates[0]).toEqual({ ids: [{ id: "1", type: "user" }], role: 1 });
    await expect(page.getByText("Members updated: 1")).toBeVisible();
  });

  test("removes an ACL member by edge id", async ({ page }) => {
    const removed: string[] = [];

    await page.route("**/api/v2/users/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ users: [admin], total: 1 })
      });
    });

    await page.route("**/api/v2/rbac/rbacgroup/g1", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "g1",
          name: "analysts",
          root_type: "rbacgroup",
          acls: {
            alice: {
              source: "users/1",
              target: "groups/g1",
              role: 3,
              id: "edge-alice",
              root_type: "acl",
              created: "2026-03-23T10:00:00Z",
              modified: "2026-03-23T10:00:00Z"
            }
          }
        })
      });
    });

    await page.route("**/api/v2/rbac/edge-alice", async route => {
      if (route.request().method() !== "DELETE") {
        await route.fallback();
        return;
      }
      removed.push(route.request().url());
      await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
    });

    await page.goto("/system/groups");

    const row = page.getByRole("row").filter({ hasText: "analysts" });
    await row
      .getByRole("button")
      .filter({ has: page.locator(".mdi-account-multiple-plus-outline") })
      .click();

    const dialog = page.locator(".v-overlay--active");
    await expect(dialog.getByRole("cell", { name: "alice" })).toBeVisible();

    // The remove button deletes the ACL *edge* (edge-alice), not the user.
    await dialog
      .getByRole("button")
      .filter({ has: page.locator(".mdi-link-off") })
      .click();

    await expect.poll(() => removed.length).toBe(1);
    expect(removed[0]).toContain("/rbac/edge-alice");
    await expect(page.getByText("Members removed.")).toBeVisible();
  });
});
