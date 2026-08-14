import { test, expect } from "@playwright/test";

test.describe("Agent Chat", () => {
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
          agents_enabled: true
        })
      });
    });

    // Mock the sessions list: two previously-created sessions, oldest first.
    await page.route("**/api/v2/agents/sessions", async route => {
      if (route.request().method() !== "GET") {
        return route.continue();
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "session-older",
            appName: "yeti_agents",
            userId: "testadmin",
            state: {},
            events: [],
            lastUpdateTime: 1782921619,
            createTime: 1782921619
          },
          {
            id: "session-newer",
            appName: "yeti_agents",
            userId: "testadmin",
            state: {},
            events: [],
            lastUpdateTime: 1782922000,
            createTime: 1782922000
          }
        ])
      });
    });
  });

  test("auto-created draft session is tagged New and shown in monospace, alongside previous sessions sorted oldest first", async ({
    page
  }) => {
    await page.goto("/chat");

    const combobox = page.getByLabel("Session ID");
    await expect(combobox).toBeVisible();

    // The auto-created draft session is selected by default and tagged "New".
    const fieldWrapper = page.locator(".v-field");
    await expect(fieldWrapper.getByText("New", { exact: true })).toBeVisible();

    const selectedLabel = fieldWrapper.locator(".session-label");
    await expect(selectedLabel).toHaveText(/^session-/);
    await expect(selectedLabel).toHaveCSS("font-family", /monospace/);

    // Open the dropdown: previous sessions should be listed, oldest first,
    // with the date formatted before the session id.
    await combobox.click();
    const listItems = page.locator(".v-list-item");
    await expect(listItems).toHaveCount(3); // 2 fetched sessions + 1 draft
    await expect(listItems.nth(0).locator(".v-list-item-title")).toHaveText("2026-07-01 16:00:19 — session-older");
    await expect(listItems.nth(1).locator(".v-list-item-title")).toHaveText("2026-07-01 16:06:40 — session-newer");

    // Only the draft (3rd) item carries the "New" chip in the dropdown.
    await expect(listItems.nth(0).getByText("New", { exact: true })).toHaveCount(0);
    await expect(listItems.nth(1).getByText("New", { exact: true })).toHaveCount(0);
    await expect(listItems.nth(2).getByText("New", { exact: true })).toBeVisible();
  });

  test("selecting a previous session loads it by plain id, not by object reference", async ({ page }) => {
    // Mock the session history fetch that fires once a session is selected.
    await page.route("**/api/v2/agents/sessions/session-older", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "session-older",
          appName: "yeti_agents",
          userId: "testadmin",
          state: {},
          events: [],
          lastUpdateTime: 1782921619,
          createTime: 1782921619
        })
      });
    });

    let historyRequestPath = "";
    page.on("request", request => {
      if (request.url().includes("/api/v2/agents/sessions/") && request.method() === "GET") {
        historyRequestPath = new URL(request.url()).pathname;
      }
    });

    await page.goto("/chat");

    const combobox = page.getByLabel("Session ID");
    await combobox.click();
    await page.locator(".v-list-item", { hasText: "session-older" }).click();

    // Regression check: previously this bound the whole raw item object to
    // v-model, which serialized to "[object Object]" in the request URL.
    await expect.poll(() => historyRequestPath).toBe("/api/v2/agents/sessions/session-older");

    const fieldWrapper = page.locator(".v-field");
    await expect(fieldWrapper.locator(".session-label")).toHaveText("2026-07-01 16:00:19 — session-older");
  });

  test("a session with a title shows it instead of the timestamp — raw id label", async ({ page }) => {
    await page.route("**/api/v2/agents/sessions", async route => {
      if (route.request().method() !== "GET") {
        return route.continue();
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "session-titled",
            appName: "yeti_agents",
            userId: "testadmin",
            state: {},
            events: [],
            lastUpdateTime: 1782921619,
            createTime: 1782921619,
            title: "What can you tell me about Sandworm Team?"
          }
        ])
      });
    });

    await page.goto("/chat");

    const combobox = page.getByLabel("Session ID");
    await combobox.click();
    await expect(page.locator(".v-list-item", { hasText: "What can you tell me about Sandworm Team?" })).toBeVisible();
    await expect(page.locator(".v-list-item", { hasText: "session-titled" })).toHaveCount(0);
  });
});
