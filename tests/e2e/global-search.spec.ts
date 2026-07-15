import { expect, test } from "@playwright/test";

/**
 * Covers views/GlobalSearch.vue, which drives its data through
 * services/search.search (POST /search/) and links each result to its
 * per-family details route.
 */
test.describe("Global Search", () => {
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

    await page.route("**/api/v2/search/", async route => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      searchRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              id: "123",
              name: "EvilCorp",
              type: "intrusion-set",
              root_type: "entity",
              tags: [{ name: "apt" }, { name: "russian" }],
              created: "2026-03-23T10:00:00Z"
            },
            {
              id: "456",
              value: "10.0.0.1",
              type: "ipv4-addr",
              root_type: "observable",
              tags: [],
              created: "2026-03-23T11:00:00Z"
            }
          ],
          total: 2
        })
      });
    });
  });

  test("should display search results from mocked API", async ({ page }) => {
    // Navigate to the main page, should auto-redirect to /search
    await page.goto("/");
    await expect(page).toHaveURL(/\/search/);

    // Enter a search query
    const searchInput = page.getByLabel("Search for anything...");
    await searchInput.fill("evil");
    await searchInput.press("Enter");

    // Wait for the mock results to render
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(2);

    await expect(rows.nth(0)).toContainText("EvilCorp");
    await expect(rows.nth(0)).toContainText("intrusion-set");
    await expect(rows.nth(0)).toContainText("apt");

    await expect(rows.nth(1)).toContainText("10.0.0.1");
    await expect(rows.nth(1)).toContainText("ipv4-addr");

    // The typed term is sent as the query and reflected into the URL.
    expect(searchRequests.at(-1)).toMatchObject({ query: { name: "evil" } });
    await expect(page).toHaveURL(/q=evil/);
  });

  test("links each result to its per-family details route", async ({ page }) => {
    await page.goto("/search?q=evil");
    await expect.poll(() => searchRequests.length).toBeGreaterThan(0);
    // A query in the URL drives the initial search on mount.
    expect(searchRequests[0]).toMatchObject({ query: { name: "evil" }, page: 0 });

    // Entities render their name; observables fall back to their value. Each
    // links through ENDPOINTS[root_type] to the right details route.
    const entityLink = page.getByRole("link", { name: "EvilCorp" });
    await expect(entityLink).toHaveAttribute("href", "/entities/123");

    const observableLink = page.getByRole("link", { name: "10.0.0.1" });
    await expect(observableLink).toHaveAttribute("href", "/observables/456");
  });
});
