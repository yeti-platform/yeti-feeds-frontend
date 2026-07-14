import { test, expect } from "@playwright/test";

/**
 * Covers views/ObservableDetails.vue — and, importantly, the RelatedObjects
 * component, which renders only here (in the "Tagged" card). RelatedObjects
 * turns each graph path into an alternating node/edge chain, so this asserts
 * that chain actually renders.
 */
test.describe("Observable Details", () => {
  test.beforeEach(async ({ page }) => {
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
        body: JSON.stringify({ rbac_enabled: true, agents_enabled: false, system: { templates_dir: "/t" } })
      });
    });

    await page.route("**/api/v2/observables/789", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "789",
          value: "evil.example.com",
          type: "hostname",
          root_type: "observable",
          tags: [{ name: "malware", fresh: true }],
          context: [],
          acls: {},
          created: "2026-03-23T10:00:00Z",
          modified: "2026-03-23T10:00:00Z"
        })
      });
    });

    // TaskList (analytics) renders on this page too.
    await page.route("**/api/v2/tasks/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tasks: [], total: 0 })
      });
    });

    // The "Tagged" card asks for a 2-hop path over the `tagged` graph. Return a
    // chain observable -> entity so RelatedObjects has something to render.
    await page.route("**/api/v2/graph/search", async route => {
      const body = route.request().postDataJSON();
      if (body?.graph !== "tagged") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ vertices: {}, paths: [], total: 0 })
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          vertices: {
            "observables/789": {
              id: "789",
              value: "evil.example.com",
              type: "hostname",
              root_type: "observable"
            },
            "entities/999": {
              id: "999",
              name: "EvilCorp",
              type: "intrusion-set",
              root_type: "entity"
            }
          },
          paths: [
            [
              {
                id: "edge9",
                source: "observables/789",
                target: "entities/999",
                type: "tagged",
                description: "",
                created: "2026-03-23T10:00:00Z",
                modified: "2026-03-23T10:00:00Z"
              }
            ]
          ],
          total: 1
        })
      });
    });
  });

  test("shows the audit timeline in its dialog", async ({ page }) => {
    await page.route("**/api/v2/audit/timeline/**", async route => {
      // The route is /audit/timeline/{id:path}, so the id is the extended id.
      expect(route.request().url()).toContain("/audit/timeline/observables/789");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          [{ timestamp: "2026-03-23T10:00:00Z", actor: "alice", action: "create", details: {} }],
          1
        ])
      });
    });

    await page.goto("/observables/789");
    await expect(page.getByText("evil.example.com").first()).toBeVisible();

    await page.getByRole("button", { name: "timeline" }).click();
    await expect(page.getByText("alice").first()).toBeVisible();
  });

  test("renders and updates the object context", async ({ page }) => {
    const contextPuts: Array<Record<string, unknown>> = [];

    // Give this observable some context so ObjectContext has a tree to render.
    await page.route("**/api/v2/observables/789", async route => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "789",
          value: "evil.example.com",
          type: "hostname",
          root_type: "observable",
          tags: [],
          context: [{ source: "VirusTotal", malicious: 7 }],
          acls: {},
          created: "2026-03-23T10:00:00Z",
          modified: "2026-03-23T10:00:00Z"
        })
      });
    });

    await page.route("**/api/v2/observables/789/context", async route => {
      contextPuts.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "789", context: [{ source: "VirusTotal", malicious: 9 }] })
      });
    });

    await page.goto("/observables/789");

    // The source of each context entry is shown as a chip.
    await expect(page.getByText("VirusTotal").first()).toBeVisible();

    // The context edit button is display:none until its title is hovered, and
    // the page has another "Edit" button (for the object itself) — so scope to
    // the class, and force the click so the actionability wait doesn't race the
    // hover state.
    await page.locator(".edit-ctx-title").first().hover();
    await page.locator(".edit-ctx-btn").first().click({ force: true });

    const dialog = page.locator(".v-overlay--active");
    const editor = dialog.locator(".yeti-code textarea").first();
    await editor.fill(JSON.stringify([{ source: "VirusTotal", malicious: 9 }]));
    // Scope to the dialog: the Tags card has its own "Save", and it sits behind
    // the modal overlay while this is open.
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect.poll(() => contextPuts.length).toBe(1);
    expect(contextPuts[0].context).toEqual([{ source: "VirusTotal", malicious: 9 }]);
  });

  test("links the observable to an entity via the new-link dialog", async ({ page }) => {
    const graphAdds: Array<Record<string, unknown>> = [];

    // EntitySelector searches all three families.
    for (const family of ["entities", "indicators", "dfiq"]) {
      await page.route(`**/api/v2/${family}/search`, async route => {
        // LinkObject filters the selector to types it suggests for a hostname.
        // "malware" is one (it communicates-with hostnames); "intrusion-set" is not.
        const results =
          family === "entities"
            ? [{ id: "999", name: "EvilCorp", type: "malware", root_type: "entity" }]
            : [];
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ [family]: results, total: results.length })
        });
      });
    }

    await page.route("**/api/v2/graph/add", async route => {
      graphAdds.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "newedge" })
      });
    });

    await page.goto("/observables/789");
    await expect(page.getByText("evil.example.com").first()).toBeVisible();

    await page.getByRole("button", { name: "new link..." }).click();
    // Vuetify renders the menu content twice; only one copy is visible.
    await page.locator("button:visible", { hasText: "entities / indicators" }).click();

    // Pick the entity in the EntitySelector autocomplete.
    const dialog = page.locator(".v-overlay--active").last();
    // The dialog's first input is the "filter on suggested types" checkbox, so
    // target the text inputs; the EntitySelector autocomplete is the first.
    await dialog.locator('input[type="text"]').first().click();
    await page.getByRole("button", { name: "EvilCorp" }).first().click();

    await dialog.getByRole("button", { name: "Save" }).click();

    await expect.poll(() => graphAdds.length).toBe(1);
    // The direction follows the suggested link type: malware
    // --communicates-with--> hostname, so the entity is the source.
    expect(graphAdds[0]).toMatchObject({
      source: "entity/999",
      target: "observable/789",
      link_type: "communicates-with"
    });
  });

  test("saves tags on the observable", async ({ page }) => {
    const tagRequests: Array<Record<string, unknown>> = [];

    await page.route("**/api/v2/observables/tag", async route => {
      tagRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tagged: 1, tags: {} })
      });
    });

    await page.goto("/observables/789");
    await expect(page.getByText("evil.example.com").first()).toBeVisible();

    const tagBox = page.locator(".v-combobox input").first();
    await tagBox.fill("phishing");
    await tagBox.press("Enter");
    await page.getByRole("button", { name: "Save" }).click();

    await expect.poll(() => tagRequests.length).toBe(1);
    expect(tagRequests[0]).toMatchObject({ ids: ["789"], strict: true });
    expect(tagRequests[0].tags).toContain("phishing");
    // The existing tag is preserved (strict: true replaces the whole set).
    expect(tagRequests[0].tags).toContain("malware");
  });

  test("renders the observable and its tagged relationship chain", async ({ page }) => {
    await page.goto("/observables/789");

    // The observable itself.
    await expect(page.getByText("evil.example.com").first()).toBeVisible();

    // The "Tagged" card (RelatedObjects) lives in the "Related entities" tab.
    await page.locator(".v-tab", { hasText: "Related entities" }).click();

    // RelatedObjects renders the path as a node chain, so the entity at the far
    // end of the tagged relationship is linked from it.
    await expect(page.getByRole("link", { name: "EvilCorp" }).first()).toBeVisible();
  });
});
