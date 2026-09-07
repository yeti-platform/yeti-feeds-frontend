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

    // The view lists personas to populate its selector. Unmocked, this 401s
    // through the dev proxy and the http interceptor sends the app to /login,
    // which fails every assertion on this page. One persona, so the selector
    // stays hidden unless a test says otherwise.
    await page.route("**/api/v2/agentpersonas/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          personas: [
            {
              id: "p1",
              name: "Default",
              instruction: "x".repeat(30),
              tools: [],
              model: null,
              enabled: true,
              default: true,
              acls: {}
            }
          ],
          total: 1
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
  test("the model selector offers what the service lists, defaulting to its default", async ({ page }) => {
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

    // Opened by its field rather than by the input: a v-select's input is a
    // 1px non-editable element behind the field overlay, so it never becomes
    // actionable and clicking it times out.
    await page.locator(".model-select .v-field").click();
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

  test("delete is unavailable for a draft and deletes a real session after confirmation", async ({ page }) => {
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
  test("the persona selector offers the enabled personas and sends the choice", async ({ page }) => {
    await page.route("**/api/v2/agentpersonas/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          personas: [
            {
              id: "p1",
              name: "Default",
              instruction: "x".repeat(30),
              tools: [],
              model: null,
              enabled: true,
              default: true,
              acls: {}
            },
            {
              id: "p2",
              name: "SOC analyst",
              instruction: "x".repeat(30),
              tools: [],
              model: null,
              enabled: true,
              default: false,
              acls: {}
            }
          ],
          total: 2
        })
      });
    });

    const payloads: Array<Record<string, unknown>> = [];
    await page.route("**/api/v2/agents/stream", async route => {
      payloads.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: "text/event-stream", body: "" });
    });

    await page.goto("/chat");

    const selector = page.getByLabel("Persona");
    await expect(selector).toBeVisible();
    // Preselected to the persona flagged default, so the picker shows what an
    // unattended message would actually have been answered with.
    await expect(selector).toHaveValue("Default");

    // Opened by its field, for the same reason as the model selector: a
    // v-select's input sits behind the field overlay and never becomes
    // actionable.
    await page.locator(".persona-select .v-field").click();
    await page.locator(".v-list-item", { hasText: "SOC analyst" }).click();

    await page.getByLabel("Chat with the agent...").fill("hello");
    await page.getByLabel("Chat with the agent...").press("Enter");

    await expect.poll(() => payloads.length).toBeGreaterThan(0);
    expect(payloads[0]).toMatchObject({ text: "hello", persona: "SOC analyst" });
  });

  test("the persona selector falls back to no selection when none is flagged default", async ({ page }) => {
    // Nothing forces a default to exist -- every persona can be un-flagged.
    // The picker then names none and the agent service resolves its own.
    await page.route("**/api/v2/agentpersonas/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          personas: [
            {
              id: "p1",
              name: "One",
              instruction: "x".repeat(30),
              tools: [],
              model: null,
              enabled: true,
              default: false,
              acls: {}
            },
            {
              id: "p2",
              name: "Two",
              instruction: "x".repeat(30),
              tools: [],
              model: null,
              enabled: true,
              default: false,
              acls: {}
            }
          ],
          total: 2
        })
      });
    });

    await page.goto("/chat");

    await expect(page.getByLabel("Persona")).toHaveValue("");
  });

  test("the persona selector is hidden when only one persona exists", async ({ page }) => {
    // The common case: a deployment that never customised anything has just the
    // seeded default, so a picker would offer no choice.
    await page.route("**/api/v2/agentpersonas/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          personas: [
            {
              id: "p1",
              name: "Default",
              instruction: "x".repeat(30),
              tools: [],
              model: null,
              enabled: true,
              default: true,
              acls: {}
            }
          ],
          total: 1
        })
      });
    });

    await page.goto("/chat");

    await expect(page.getByLabel("Session ID")).toBeVisible();
    await expect(page.getByLabel("Persona")).toHaveCount(0);
  });

  test("the chat still works when personas cannot be fetched", async ({ page }) => {
    // Yeti falls back to its built-in instructions in that case, so an
    // unreachable personas endpoint must not take the chat down.
    await page.route("**/api/v2/agentpersonas/search", route => route.fulfill({ status: 503 }));

    await page.goto("/chat");

    await expect(page.getByLabel("Persona")).toHaveCount(0);
    await expect(page.getByLabel("Chat with the agent...")).toBeVisible();
  });
});
