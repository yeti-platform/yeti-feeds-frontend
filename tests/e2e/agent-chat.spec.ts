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

  test("auto-created draft session reads as New session, alongside previous sessions sorted oldest first", async ({
    page
  }) => {
    await page.goto("/chat");

    const combobox = page.getByLabel("Session ID");
    await expect(combobox).toBeVisible();

    // The auto-created draft session is selected by default and tagged "New".
    const fieldWrapper = page.locator(".v-field");
    await expect(fieldWrapper.getByText("New", { exact: true })).toBeVisible();

    // The id is a key, not a name: it exists before there is anything to name
    // the session after, and is replaced by a title from the first message.
    const selectedLabel = fieldWrapper.locator(".session-label");
    await expect(selectedLabel).toHaveText("New session");
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
  test("the model selector offers what the service lists, defaulting to its default", async ({
    page
  }) => {
    await page.route("**/api/v2/agents/models", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          provider: "gemini",
          models: ["model-a", "model-b", "model-c"],
          default: "model-a"
        })
      });
    });

    await page.goto("/chat");

    const selector = page.getByLabel("Model");
    await expect(selector).toBeVisible();
    // The service's default is preselected, so sending without touching the
    // selector uses what the deployment configured. Asserted on the value: the
    // label resolves to the input, whose text content is empty.
    await expect(selector).toHaveValue("model-a");

    await selector.click();
    await expect(page.locator(".v-list-item", { hasText: "model-b" })).toBeVisible();
    await expect(page.locator(".v-list-item", { hasText: "model-c" })).toBeVisible();
  });

  test("the model selector is hidden when the service offers one model", async ({ page }) => {
    // Nothing to choose, so a picker would be a control that cannot do
    // anything.
    await page.route("**/api/v2/agents/models", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ provider: "gemini", models: ["only-model"], default: "only-model" })
      });
    });

    await page.goto("/chat");

    await expect(page.getByLabel("Session ID")).toBeVisible();
    await expect(page.getByLabel("Model")).toHaveCount(0);
  });

  test("the chat still works when the model list cannot be fetched", async ({ page }) => {
    // The service applies its own default in that case, so failing to reach
    // /models must not take the chat down with it.
    await page.route("**/api/v2/agents/models", route => route.fulfill({ status: 503 }));

    await page.goto("/chat");

    await expect(page.getByLabel("Session ID")).toBeVisible();
    await expect(page.getByLabel("Model")).toHaveCount(0);
    await expect(page.getByLabel("Chat with the agent...")).toBeVisible();
  });

  test("delete is unavailable for a draft and deletes a real session after confirmation", async ({
    page
  }) => {
    let deletedPath: string | null = null;
    await page.route("**/api/v2/agents/sessions/*", async route => {
      if (route.request().method() !== "DELETE") {
        return route.continue();
      }
      deletedPath = new URL(route.request().url()).pathname;
      await route.fulfill({ status: 204, body: "" });
    });

    await page.goto("/chat");

    // A draft exists only in the browser, so there is nothing to delete.
    const deleteButton = page.getByRole("button", { name: "Delete" });
    await expect(deleteButton).toBeDisabled();

    await page.getByLabel("Session ID").click();
    await page.locator(".v-list-item", { hasText: "session-older" }).click();
    await expect(deleteButton).toBeEnabled();

    await deleteButton.click();
    // Deleting a conversation cannot be undone, so it asks first.
    await expect(page.getByText("Delete session?")).toBeVisible();
    await page.getByRole("button", { name: "Delete", exact: true }).last().click();

    await expect.poll(() => deletedPath).toBe("/api/v2/agents/sessions/session-older");
    await page.getByLabel("Session ID").click();
    await expect(page.locator(".v-list-item", { hasText: "session-older" })).toHaveCount(0);
  });
});
