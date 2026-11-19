import { expect, test } from "./fixtures";

/**
 * Covers components/NewObject.vue via the EntitySearch view (/entities): opening
 * the "New Entity" menu, filling the type's editable fields, and saving through
 * services/objects.create (POST /entities/). NewObject is also reused by the
 * observable/indicator/dfiq search views and LinkObject.
 *
 * The "query type" cases use the same form for a Query indicator
 * (/indicators): its Query type box is a combobox, so it offers the
 * suggestions in QUERY_TYPES and also takes a typed value.
 */

const admin = { username: "testadmin", admin: true, email: "test@example.com" };

test.describe("New object", () => {
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

    // ObjectList's per-type search on the entity tabs — return an empty list.
    await page.route("**/api/v2/entities/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ entities: [], total: 0 })
      });
    });
  });

  test("creates a malware entity and sends the wrapped body", async ({ page }) => {
    const creates: Array<Record<string, unknown>> = [];
    await page.route("**/api/v2/entities/", async route => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      creates.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "e42", name: "Emotet", type: "malware", root_type: "entity" })
      });
    });

    // The details route the form redirects to on success.
    await page.route("**/api/v2/entities/e42", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "e42",
          name: "Emotet",
          type: "malware",
          root_type: "entity",
          tags: [],
          context: [],
          acls: {},
          created: "2026-03-23T10:00:00Z",
          modified: "2026-03-23T10:00:00Z"
        })
      });
    });

    await page.goto("/entities");

    await page.getByRole("button", { name: "New Entity" }).click();
    // The type menu lists every entity type; pick Malware.
    await page.getByRole("listitem").filter({ hasText: "Malware" }).first().click();

    const dialog = page.locator(".v-overlay--active");
    await expect(dialog.getByText("New Malware")).toBeVisible();
    await dialog.getByLabel("Name").fill("Emotet");
    await dialog.getByLabel("Family").fill("banker");
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect.poll(() => creates.length).toBe(1);
    // The backend wraps the object under its root_type key.
    expect(creates[0]).toEqual({
      entity: { type: "malware", name: "Emotet", family: "banker", aliases: undefined, description: undefined }
    });

    // On success it redirects to the new entity's details page.
    await expect(page).toHaveURL(/\/entities\/e42/);
  });

  test("shows inline validation errors from a 422", async ({ page }) => {
    await page.route("**/api/v2/entities/", async route => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          detail: [{ loc: ["body", "entity", "malware", "name"], msg: "field required", type: "value_error" }]
        })
      });
    });

    await page.goto("/entities");
    await page.getByRole("button", { name: "New Entity" }).click();
    await page.getByRole("listitem").filter({ hasText: "Malware" }).first().click();

    const dialog = page.locator(".v-overlay--active");
    await dialog.getByLabel("Family").fill("orphan");
    await dialog.getByRole("button", { name: "Save" }).click();

    // The per-field validation error is surfaced inline in the card, prefixed
    // with the offending field name (the global snackbar also shows it).
    await expect(dialog.getByText("Error saving Malware:")).toBeVisible();
    await expect(dialog.locator("li").filter({ hasText: "field required" })).toContainText("name");
  });

  test.describe("query type", () => {
    let creates: Array<Record<string, unknown>>;

    test.beforeEach(async ({ page }) => {
      creates = [];

      // ObjectList's per-type search on the indicator tabs — return an empty list.
      await page.route("**/api/v2/indicators/search", async route => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ indicators: [], total: 0 })
        });
      });

      await page.route("**/api/v2/indicators/", async route => {
        if (route.request().method() !== "POST") {
          await route.fallback();
          return;
        }
        creates.push(route.request().postDataJSON());
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "i42", name: "Hunt", type: "query", root_type: "indicator" })
        });
      });

      // The details route the form redirects to on success.
      await page.route("**/api/v2/indicators/i42", async route => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "i42",
            name: "Hunt",
            type: "query",
            root_type: "indicator",
            pattern: "",
            query_type: "",
            target_systems: [],
            relevant_tags: [],
            tags: [],
            context: [],
            acls: {},
            created: "2026-03-23T10:00:00Z",
            modified: "2026-03-23T10:00:00Z"
          })
        });
      });

      await page.goto("/indicators");
      await page.getByRole("button", { name: "New Indicator" }).click();
      await page.getByRole("listitem").filter({ hasText: "Query" }).first().click();
      await expect(page.getByRole("dialog").getByText("New Query")).toBeVisible();
    });

    test("saves a type picked from the suggestions", async ({ page }) => {
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Name", { exact: true }).fill("Hunt");
      await dialog.getByRole("combobox", { name: "Query type" }).click();
      await page.getByRole("option", { name: "velociraptor", exact: true }).click();
      await dialog.getByRole("button", { name: "Save" }).click();

      await expect.poll(() => creates.length).toBe(1);
      expect(creates[0]).toMatchObject({ indicator: { type: "query", name: "Hunt", query_type: "velociraptor" } });
    });

    test("saves a typed type that is not among the suggestions", async ({ page }) => {
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Name", { exact: true }).fill("Hunt");
      // The suggestions are a convenience, not a closed list.
      await dialog.getByRole("combobox", { name: "Query type" }).fill("qradar");
      await dialog.getByRole("button", { name: "Save" }).click();

      await expect.poll(() => creates.length).toBe(1);
      expect(creates[0]).toMatchObject({ indicator: { type: "query", name: "Hunt", query_type: "qradar" } });
    });
  });
});
