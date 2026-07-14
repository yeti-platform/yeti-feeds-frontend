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
