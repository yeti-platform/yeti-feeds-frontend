import { expect, test } from "./fixtures";

/**
 * Covers views/ObservableMatch.vue, which drives its data through
 * services/graph.match, services/bloom.search and services/observables
 * (tag, bulkAdd).
 */

const admin = { username: "testadmin", admin: true, email: "test@example.com" };

test.describe("Observable Match", () => {
  let matchRequests: Array<Record<string, unknown>>;
  let bloomRequests: Array<Record<string, unknown>>;

  test.beforeEach(async ({ page }) => {
    matchRequests = [];
    bloomRequests = [];

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

    await page.route("**/api/v2/bloom/search", async route => {
      bloomRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ value: "hunter2.exe", hits: ["filter-a"] }])
      });
    });

    await page.route("**/api/v2/graph/match", async route => {
      matchRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          entities: [
            [
              {
                source: "observables/1",
                target: "entities/e1",
                type: "targets",
                id: "rel1",
                root_type: "relationship"
              },
              { id: "e1", name: "Fancy Bear", type: "intrusion-set", root_type: "entity" }
            ]
          ],
          observables: [],
          known: [
            {
              id: "1",
              value: "evil.com",
              type: "hostname",
              root_type: "observable",
              tags: [],
              context: [],
              created: "2026-03-23T10:00:00Z"
            }
          ],
          matches: [
            ["evil.com", { id: "i1", name: "Known bad domain", diamond: "infrastructure", relevant_tags: ["c2"] }]
          ],
          unknown: ["mystery.value"]
        })
      });
    });
  });

  test("launches a search and renders entity, indicator, known and unknown results", async ({ page }) => {
    await page.goto("/match");
    await page.getByRole("textbox").first().fill("evil.com\nmystery.value");
    await page.getByRole("button", { name: "Launch search" }).click();

    await expect.poll(() => matchRequests.length).toBe(1);
    expect(matchRequests[0]).toMatchObject({
      observables: ["evil.com", "mystery.value"],
      add_unknown: false,
      regex_match: false,
      add_type: "guess",
      fetch_neighbors: true
    });
    await expect.poll(() => bloomRequests.length).toBe(1);
    expect(bloomRequests[0]).toEqual({ values: ["evil.com", "mystery.value"] });

    const knownCard = page.locator(".v-card").filter({ hasText: "Known observables" });
    const unknownCard = page.locator(".v-card").filter({ hasText: "Unknown observables" });

    await expect(page.getByText("Fancy Bear")).toBeVisible();
    await expect(page.getByText("Known bad domain")).toBeVisible();
    await expect(knownCard.getByRole("cell", { name: "evil.com" })).toBeVisible();
    await expect(unknownCard.getByRole("cell", { name: "mystery.value" })).toBeVisible();
    await expect(page.getByText("hunter2.exe")).toBeVisible();
  });

  test("tags the selected known observables", async ({ page }) => {
    const tagRequests: Array<Record<string, unknown>> = [];
    await page.route("**/api/v2/observables/tag", async route => {
      tagRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tagged: 1, tags: {} })
      });
    });

    await page.goto("/match");
    await page.getByRole("textbox").first().fill("evil.com");
    await page.getByRole("button", { name: "Launch search" }).click();

    const knownCard = page.locator(".v-card").filter({ hasText: "Known observables" });
    await expect(knownCard.getByRole("cell", { name: "evil.com" })).toBeVisible();

    const knownRow = knownCard.getByRole("row").filter({ hasText: "evil.com" });
    await knownRow.getByRole("checkbox").click();

    const tagsBox = knownCard.getByPlaceholder("Tags", { exact: true });
    await tagsBox.click();
    await tagsBox.fill("apt28");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");

    await knownCard.getByRole("button", { name: /^Tag/ }).click();

    await expect.poll(() => tagRequests.length).toBe(1);
    expect(tagRequests[0]).toEqual({ ids: ["1"], tags: ["apt28"], strict: false });
  });

  test("adds the unknown observables", async ({ page }) => {
    const bulkRequests: Array<Record<string, unknown>> = [];
    await page.route("**/api/v2/observables/bulk", async route => {
      bulkRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ added: [{ id: "2", value: "mystery.value" }], failed: [] })
      });
    });

    await page.goto("/match");
    await page.getByRole("textbox").first().fill("mystery.value");
    await page.getByRole("button", { name: "Launch search" }).click();

    const unknownCard = page.locator(".v-card").filter({ hasText: "Unknown observables" });
    await expect(unknownCard.getByRole("cell", { name: "mystery.value" })).toBeVisible();

    const unknownRow = unknownCard.getByRole("row").filter({ hasText: "mystery.value" });
    await unknownRow.getByRole("checkbox").click();

    await unknownCard.getByRole("button", { name: /^Add/ }).click();

    await expect.poll(() => bulkRequests.length).toBe(1);
    expect(bulkRequests[0]).toEqual({
      observables: [{ value: "mystery.value", tags: [], type: "guess" }]
    });
    await expect(page.getByText("1 observables added")).toBeVisible();
  });
});
