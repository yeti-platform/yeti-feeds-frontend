import { expect, test } from "@playwright/test";

/**
 * Covers views/TagsAdmin.vue: the tags data table (v-data-table-server via
 * /tags/search), editing a tag (PUT /tags/{id}), and merging tags
 * (POST /tags/merge).
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

function tag(overrides: Record<string, unknown> = {}) {
  return {
    id: "t1",
    name: "malware",
    description: "Malicious software",
    count: 3,
    created: "2026-03-23T10:00:00Z",
    default_expiration: "P90D",
    produces: [],
    replaces: [],
    root_type: "tag",
    ...overrides
  };
}

test.describe("Tags admin", () => {
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

    await page.route("**/api/v2/tags/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tags: [tag(), tag({ id: "t2", name: "phishing" })], total: 2 })
      });
    });
  });

  test("lists tags with their expiration in days", async ({ page }) => {
    await page.goto("/system/tags");
    await expect(page.getByRole("cell", { name: "malware" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "phishing" })).toBeVisible();
    // default_expiration "P90D" -> 90 days.
    await expect(page.getByRole("row").filter({ hasText: "malware" }).getByText("90")).toBeVisible();
  });

  test("edits a tag and sends the expiration as an ISO duration", async ({ page }) => {
    const updates: Array<Record<string, unknown>> = [];

    await page.route("**/api/v2/tags/t1", async route => {
      if (route.request().method() !== "PUT") {
        await route.fallback();
        return;
      }
      updates.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tag({ description: "Updated description", default_expiration: "P30D" }))
      });
    });

    await page.goto("/system/tags");
    await page.getByRole("cell", { name: "malware" }).getByText("malware").click();

    const description = page.getByLabel("Description");
    await description.fill("Updated description");
    const expiration = page.getByLabel("Default expiration (days)");
    await expiration.fill("30");

    await page.getByRole("button", { name: "Update" }).click();

    await expect.poll(() => updates.length).toBe(1);
    expect(updates[0]).toMatchObject({
      name: "malware",
      description: "Updated description",
      produces: [],
      replaces: [],
      default_expiration: "P30D"
    });
    await expect(page.getByText("Tag malware successfully updated")).toBeVisible();
  });

  test("merges tags and reports the merge count", async ({ page }) => {
    const merges: Array<Record<string, unknown>> = [];

    await page.route("**/api/v2/tags/merge", async route => {
      merges.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ merged: 1, into: tag({ id: "t2", name: "phishing" }) })
      });
    });

    await page.goto("/system/tags");

    const sourceBox = page.getByRole("combobox", { name: "Sources" });
    await sourceBox.click();
    await sourceBox.fill("malware");
    await page.getByRole("listbox", { name: "Sources" }).getByRole("option", { name: "malware" }).click();
    await page.keyboard.press("Escape");

    const targetBox = page.getByRole("combobox", { name: "Merge target" });
    await targetBox.click();
    await targetBox.fill("phishing");
    await page.getByRole("listbox", { name: "Merge target" }).getByRole("option", { name: "phishing" }).click();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Merge" }).click();

    await expect.poll(() => merges.length).toBe(1);
    expect(merges[0]).toEqual({ merge: ["malware"], merge_into: "phishing", permanent: false });
    await expect(page.getByText("1 tag(s) merged into phishing")).toBeVisible();
  });
});
