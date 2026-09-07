import { expect, test } from "./fixtures";

/**
 * Covers views/PersonaAdmin.vue: the personas data table
 * (POST /agentpersonas/search), creating one (POST /agentpersonas/) and
 * editing one (PATCH /agentpersonas/{id}).
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

function persona(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    name: "Default",
    description: "Built-in default",
    instruction: "You are a helpful and concise AI assistant.",
    tools: [],
    model: null,
    enabled: true,
    default: true,
    created: "2026-09-01T10:00:00Z",
    modified: "2026-09-01T10:00:00Z",
    root_type: "agent_persona",
    acls: {},
    ...overrides
  };
}

test.describe("Persona admin", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v2/auth/me", async route => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(admin) });
    });

    await page.route("**/api/v2/system/config", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rbac_enabled: true, agents_enabled: true, auth: { module: "local" } })
      });
    });

    await page.route("**/api/v2/agents/models", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          provider: "gemini",
          models: ["gemini-3.7-flash", "gemini-3.1-pro"],
          default: "gemini-3.7-flash"
        })
      });
    });

    await page.route("**/api/v2/agents/tools", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tools: [
            { name: "semantic_search", description: "Searches Yeti by meaning, not exact text." },
            { name: "ioc_analyzer", description: "Extracts IOCs from web resources." }
          ]
        })
      });
    });

    await page.route("**/api/v2/agentpersonas/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          personas: [
            persona(),
            persona({
              id: "p2",
              name: "SOC analyst",
              default: false,
              tools: ["semantic_search"],
              model: "gemini-3.1-pro"
            })
          ],
          total: 2
        })
      });
    });
  });

  test("lists personas, showing an empty tool list as every tool", async ({ page }) => {
    await page.goto("/system/personas");
    await expect(page.getByRole("cell", { name: "Default", exact: true })).toBeVisible();
    await expect(page.getByRole("cell", { name: "SOC analyst" })).toBeVisible();

    // No tools named means the persona gets all of them, which is the opposite
    // of what an empty cell would suggest.
    await expect(page.getByRole("row").filter({ hasText: "Default" }).getByText("all")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "SOC analyst" }).getByText("semantic_search")).toBeVisible();
    // A persona naming no model follows the service default. Exact, because the
    // same row also holds the name "Default" and the description "Built-in
    // default".
    await expect(
      page.getByRole("row").filter({ hasText: "Default" }).getByText("default", { exact: true })
    ).toBeVisible();
  });

  test("edits a persona and sends the whole object", async ({ page }) => {
    const patches: Array<Record<string, unknown>> = [];

    await page.route("**/api/v2/agentpersonas/p2", async route => {
      if (route.request().method() !== "PATCH") {
        await route.fallback();
        return;
      }
      patches.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(persona({ id: "p2", name: "SOC analyst" }))
      });
    });

    await page.goto("/system/personas");
    await page.getByRole("cell", { name: "SOC analyst" }).getByText("SOC analyst").click();

    await page.getByLabel("Instruction").fill("You are a terse SOC analyst. Answer in at most three sentences.");
    await page.getByRole("button", { name: "Update" }).click();

    await expect.poll(() => patches.length).toBe(1);
    expect(patches[0]).toMatchObject({
      persona: {
        name: "SOC analyst",
        instruction: "You are a terse SOC analyst. Answer in at most three sentences.",
        tools: ["semantic_search"]
      }
    });
    await expect(page.getByText("Persona SOC analyst successfully saved")).toBeVisible();
  });

  test("refuses to save an instruction shorter than the backend accepts", async ({ page }) => {
    await page.goto("/system/personas");
    await page.getByRole("button", { name: "New persona" }).click();

    await page.getByLabel("Name").fill("Too terse");
    await page.getByLabel("Instruction").fill("Be brief.");

    // The backend rejects anything under 20 characters; the button stays
    // disabled rather than letting the save fail.
    await expect(page.getByRole("button", { name: "Create" })).toBeDisabled();

    await page.getByLabel("Instruction").fill("Be brief, but not so brief as to be useless.");
    await expect(page.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  test("cannot delete the default persona", async ({ page }) => {
    await page.goto("/system/personas");
    await page.getByRole("cell", { name: "Default", exact: true }).getByText("Default").click();

    // Yeti refuses to delete the default; disabling the button says so before
    // the request is made.
    await expect(page.getByRole("button", { name: "Delete" })).toBeDisabled();

    await page.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("cell", { name: "SOC analyst" }).getByText("SOC analyst").click();
    await expect(page.getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  test("offers the tools the agent service implements, with what each one does", async ({ page }) => {
    await page.goto("/system/personas");
    await page.getByRole("cell", { name: "Default", exact: true }).getByText("Default").click();

    await page.getByLabel("Tools").click();

    // The name is what gets saved; the description is why someone would pick it.
    await expect(page.getByRole("option", { name: /semantic_search/ })).toBeVisible();
    await expect(page.getByText("Searches Yeti by meaning, not exact text.")).toBeVisible();
    await expect(page.getByRole("option", { name: /ioc_analyzer/ })).toBeVisible();
  });

  test("still takes a hand-typed tool when the agent service is unreachable", async ({ page }) => {
    // The names come from the agent service, but a persona has to stay
    // editable without it -- the field is a combobox for exactly this.
    await page.route("**/api/v2/agents/tools", route => route.fulfill({ status: 503 }));

    await page.goto("/system/personas");
    await page.getByRole("cell", { name: "Default", exact: true }).getByText("Default").click();

    await page.getByLabel("Tools").fill("a_tool_typed_by_hand");
    await page.getByLabel("Tools").press("Enter");

    await expect(page.locator(".v-field").filter({ hasText: "a_tool_typed_by_hand" })).toBeVisible();
  });
});
