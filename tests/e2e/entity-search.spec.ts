import { test, expect } from "@playwright/test";

/**
 * Covers views/EntitySearch.vue and the generic ObjectList it renders (one per
 * entity type, as a tab). IndicatorSearch and DFIQSearch are the same view over
 * a different type list — they share the useTypeTabs composable and ObjectList.
 */
test.describe("Entity Search", () => {
  /** The search bodies ObjectList sent, so we can assert what it asked for. */
  let searchRequests: Array<Record<string, unknown>>;

  test.beforeEach(async ({ page }) => {
    searchRequests = [];

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
        body: JSON.stringify({ rbac_enabled: true, agents_enabled: false })
      });
    });

    // One ObjectList per entity type hits this; only malware has results.
    await page.route("**/api/v2/entities/search", async route => {
      const body = route.request().postDataJSON();
      searchRequests.push(body);

      if (body?.type !== "malware") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ entities: [], total: 0 })
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          entities: [
            {
              id: "42",
              name: "Emotet",
              type: "malware",
              root_type: "entity",
              tags: [{ name: "banker", fresh: true }],
              aliases: ["Geodo"],
              created: "2026-03-23T10:00:00Z"
            }
          ],
          total: 1
        })
      });
    });
  });

  test("shows the first populated type tab and its results", async ({ page }) => {
    await page.goto("/entities");

    // Only the malware ObjectList returned anything, so its tab is auto-selected
    // and its row is rendered.
    await expect(page.locator("tbody tr").filter({ hasText: "Emotet" }).first()).toBeVisible();
    await expect(page.locator("tbody tr").filter({ hasText: "banker" }).first()).toBeVisible();
  });

  test("passes the type and the type's filter aliases to the API", async ({ page }) => {
    await page.goto("/entities");
    await expect(page.locator("tbody tr").filter({ hasText: "Emotet" }).first()).toBeVisible();

    const malwareRequest = searchRequests.find(request => request.type === "malware");
    expect(malwareRequest).toBeTruthy();
    // useTypeTabs turns the type's filterAliases into [alias, fieldType] pairs.
    expect(malwareRequest!.filter_aliases).toEqual(
      expect.arrayContaining([expect.arrayContaining(["aliases"])])
    );
  });
});
