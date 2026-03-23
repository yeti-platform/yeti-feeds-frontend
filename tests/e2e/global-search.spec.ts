import { test, expect } from "@playwright/test";

test.describe("Global Search", () => {
  test.beforeEach(async ({ page }) => {
    // Mock user authentication
    await page.route("**/api/v2/auth/me", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          username: "testadmin",
          admin: true,
          email: "test@example.com"
        })
      });
    });

    // Mock system config
    await page.route("**/api/v2/system/config", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          rbac_enabled: true,
          agents_enabled: false
        })
      });
    });

    // Mock global search endpoint
    await page.route("**/api/v2/search/", async route => {
      const request = route.request();
      if (request.method() === "POST") {
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
      } else {
        await route.continue();
      }
    });
  });

  test("should display search results from mocked API", async ({ page }) => {
    // Navigate to the main page, should auto-redirect to /search
    await page.goto("/");

    // Wait for the URL to change to the search page
    await expect(page).toHaveURL(/\/search/);

    // Enter a search query
    const searchInput = page.getByLabel("Search for anything...");
    await searchInput.fill("evil");
    await searchInput.press("Enter");

    // Wait for the mock results to render
    const rows = page.locator("tbody tr");

    // Check that we have 2 results (the ones we mocked)
    await expect(rows).toHaveCount(2);

    // Verify first row contains 'EvilCorp' and 'intrusion-set'
    await expect(rows.nth(0)).toContainText("EvilCorp");
    await expect(rows.nth(0)).toContainText("intrusion-set");
    await expect(rows.nth(0)).toContainText("apt");

    // Verify second row contains '10.0.0.1' and 'ipv4-addr'
    await expect(rows.nth(1)).toContainText("10.0.0.1");
    await expect(rows.nth(1)).toContainText("ipv4-addr");
  });
});
