import { expect, test } from "./fixtures";

/**
 * Covers views/GlobalSearch.vue, which drives its data through
 * services/search.search (POST /search/) and renders results grouped into
 * one section per object type, each linking to its per-family details route.
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
          sections: [
            {
              type: "entity",
              total: 1,
              results: [
                {
                  id: "123",
                  name: "EvilCorp",
                  type: "intrusion-set",
                  root_type: "entity",
                  tags: [{ name: "apt" }, { name: "russian" }],
                  created: "2026-03-23T10:00:00Z"
                }
              ]
            },
            { type: "indicator", total: 0, results: [] },
            { type: "dfiq", total: 0, results: [] },
            {
              // 8 matching hashes, but the section is bounded to 5 -- proves
              // a high-volume observable match can't crowd out other
              // sections, since each section is rendered independently.
              type: "observable",
              total: 8,
              results: Array.from({ length: 5 }, (_, i) => ({
                id: `${456 + i}`,
                value: `10.0.0.${i + 1}`,
                type: "ipv4-addr",
                root_type: "observable",
                tags: [],
                created: "2026-03-23T11:00:00Z"
              }))
            }
          ]
        })
      });
    });
  });

  test("should display grouped search results from mocked API", async ({ page }) => {
    // Navigate to the main page, should auto-redirect to /search
    await page.goto("/");
    await expect(page).toHaveURL(/\/search/);

    // Typing triggers a debounced live search -- no need to press Enter.
    const searchInput = page.getByLabel("Search for anything...");
    await searchInput.fill("evil");

    // Only sections with results render a card -- empty Indicator/DFIQ
    // sections are skipped entirely, not shown as empty cards. The count is
    // a chip alongside the title, not appended text.
    const entityTitle = page.locator(".v-card-title", { hasText: "Entities" });
    await expect(entityTitle).toBeVisible();
    await expect(entityTitle.getByText("1", { exact: true })).toBeVisible();

    const observableTitle = page.locator(".v-card-title", { hasText: "Observables" });
    await expect(observableTitle).toBeVisible();
    await expect(observableTitle.getByText("8", { exact: true })).toBeVisible();

    await expect(page.locator(".v-card-title")).toHaveCount(2);

    await expect(page.getByRole("link", { name: "EvilCorp" })).toBeVisible();
    await expect(page.getByText("apt")).toBeVisible();

    // The entity result is unaffected by the 8 observable matches -- each
    // section is independently bounded, not sharing a single page of results.
    const observableRows = page.locator("tbody tr", { hasText: "10.0.0." });
    await expect(observableRows).toHaveCount(5);
    await expect(page.getByText("See all 8 in Observables")).toBeVisible();

    // The typed term is sent as the query and reflected into the URL.
    expect(searchRequests.at(-1)).toMatchObject({ query: "evil" });
    await expect(page).toHaveURL(/q=evil/);
  });

  test("links each result to its per-family details route", async ({ page }) => {
    await page.goto("/search?q=evil");
    await expect.poll(() => searchRequests.length).toBeGreaterThan(0);
    // A query in the URL drives the initial search on mount.
    expect(searchRequests[0]).toMatchObject({ query: "evil" });

    // Entities render their name; observables fall back to their value. Each
    // links through ENDPOINTS[root_type] to the right details route.
    const entityLink = page.getByRole("link", { name: "EvilCorp" });
    await expect(entityLink).toHaveAttribute("href", "/entities/123");

    const observableLink = page.getByRole("link", { name: "10.0.0.1" });
    await expect(observableLink).toHaveAttribute("href", "/observables/456");
  });

  test("'See all' link points at the per-family search page, prefilled with the query", async ({ page }) => {
    await page.goto("/search?q=evil");
    await expect.poll(() => searchRequests.length).toBeGreaterThan(0);

    const seeAll = page.getByRole("link", { name: /See all 8 in Observables/ });
    await expect(seeAll).toHaveAttribute("href", "/observables?q=evil");
  });

  test("debounces live search instead of firing on every keystroke", async ({ page }) => {
    await page.goto("/search");
    const searchInput = page.getByLabel("Search for anything...");

    // Typing character-by-character should coalesce into a single request
    // for the final term, not one request per keystroke.
    await searchInput.pressSequentially("evil", { delay: 30 });
    await expect.poll(() => searchRequests.length).toBeGreaterThan(0);

    // Give any (incorrect) per-keystroke requests a chance to have fired too.
    await page.waitForTimeout(500);
    expect(searchRequests).toHaveLength(1);
    expect(searchRequests[0]).toMatchObject({ query: "evil" });
  });
});
