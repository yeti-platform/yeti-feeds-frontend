import { test, expect } from "./fixtures";

/**
 * Covers views/ObservableSearch.vue, which drives its data through the
 * services/ layer (observables.search, templates.search, observables.tag).
 */
test.describe("Observable Search", () => {
  /** Search request bodies the page sent, so we can assert on what it asked for. */
  let searchRequests: Array<Record<string, unknown>>;
  let tagRequests: Array<Record<string, unknown>>;

  test.beforeEach(async ({ page }) => {
    searchRequests = [];
    tagRequests = [];

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

    // Export templates, loaded on mount.
    await page.route("**/api/v2/templates/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          templates: [{ id: "t1", name: "Simple template", template: "{{ obs.value }}" }],
          total: 1
        })
      });
    });

    await page.route("**/api/v2/observables/search", async route => {
      searchRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          observables: [
            {
              id: "1",
              value: "evil.com",
              type: "hostname",
              root_type: "observable",
              created: "2026-03-23T10:00:00Z",
              tags: [{ name: "malware", fresh: true }],
              context: [{ source: "VirusTotal" }, { source: "VirusTotal" }, { source: "Shodan" }]
            },
            {
              id: "2",
              value: "10.0.0.1",
              type: "ipv4",
              root_type: "observable",
              created: "2026-03-23T11:00:00Z",
              tags: [],
              context: []
            }
          ],
          total: 2
        })
      });
    });

    await page.route("**/api/v2/observables/tag", async route => {
      tagRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tagged: 1, tags: {} })
      });
    });
  });

  test("renders observables, their tags and de-duplicated context sources", async ({ page }) => {
    await page.goto("/observables");

    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(2);

    await expect(rows.nth(0)).toContainText("evil.com");
    await expect(rows.nth(0)).toContainText("malware");
    // context has VirusTotal twice — the chips are de-duplicated.
    await expect(rows.nth(0).getByText("VirusTotal")).toHaveCount(1);
    await expect(rows.nth(0)).toContainText("Shodan");

    await expect(rows.nth(1)).toContainText("10.0.0.1");
  });

  test("sends the typed search term as a query to the API", async ({ page }) => {
    await page.goto("/observables");
    await expect(page.locator("tbody tr")).toHaveCount(2);

    // getByLabel would also match the prepended magnifier icon button.
    const searchInput = page.getByRole("textbox", { name: /Search observables/ });
    await searchInput.fill("evil.com");
    await searchInput.press("Enter");

    await expect.poll(() => searchRequests.length).toBeGreaterThan(1);
    const lastRequest = searchRequests[searchRequests.length - 1];
    // A bare term searches the default key ("value").
    expect(lastRequest.query).toEqual({ value: "evil.com" });
  });

  test("bulk-tags the selected observables", async ({ page }) => {
    await page.goto("/observables");
    await expect(page.locator("tbody tr")).toHaveCount(2);

    // Open "Bulk actions", which turns on the selection checkboxes.
    await page.getByRole("button", { name: "Bulk actions" }).click();
    await page.locator("tbody tr").first().locator("input[type=checkbox]").check();

    const tagBox = page.locator(".v-combobox input").first();
    await tagBox.fill("phishing");
    await tagBox.press("Enter");

    await page.getByRole("button", { name: "Apply" }).click();

    await expect.poll(() => tagRequests.length).toBe(1);
    expect(tagRequests[0]).toMatchObject({ tags: ["phishing"], ids: ["1"], strict: false });
  });
});
