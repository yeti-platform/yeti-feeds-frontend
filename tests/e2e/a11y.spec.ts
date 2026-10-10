import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

/**
 * Scans every route with axe-core against WCAG 2.1 A and AA. Only auth/me and
 * system/config are mocked; the shared fixture aborts every other API call, so
 * lists render empty. That covers the page chrome, forms and controls on each
 * page, not data rows (those are the per-view specs' job).
 *
 * Rules listed in knownViolations are skipped until the finding behind each
 * is fixed; remove the rule from the list in the same PR as the fix.
 */
const routes = [
  "/login",
  "/observables",
  "/entities",
  "/indicators",
  "/dfiq",
  "/feeds",
  "/analytics",
  "/exports",
  "/match",
  "/search",
  "/profile",
  "/system/users",
  "/system/groups",
  "/system/tags",
  "/system/personas",
  "/system/status",
  "/chat"
];

const knownViolations = [
  // "label": the template select on Exports and the IOC textarea and type
  // select on Observable matching point aria-labelledby at an empty label.
  "label",
  // "aria-progressbar-name": the v-card loading bars on Status have no name.
  "aria-progressbar-name",
  // "aria-command-name": the chat's send button has an icon glyph for a name,
  // which WebKit reports as empty. Fixed with the other icon buttons in #318.
  "aria-command-name"
];

test.describe("Accessibility (axe)", () => {
  // An axe pass is CPU-bound and three browsers run them side by side.
  test.describe.configure({ timeout: 90_000 });

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
        body: JSON.stringify({
          rbac_enabled: true,
          agents_enabled: false,
          auth: { module: "local", enabled: true },
          system: { templates_dir: "/t" }
        })
      });
    });
  });

  for (const route of routes) {
    test(`${route} has no WCAG 2.1 A/AA violations`, async ({ page, browserName }) => {
      // WebKit drops the page while axe runs its partial scans on this view
      // (reproducible on Windows); the other two browsers cover it.
      test.skip(browserName === "webkit" && route === "/match", "WebKit closes the page during the axe scan of /match");

      await page.goto(route);
      // Wait for the app shell, not for network idle: some views poll.
      await expect(page.locator("main")).toBeVisible();
      await page.waitForTimeout(500);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .disableRules(knownViolations)
        .analyze();

      // The message lists each violation with the offending markup, so a
      // failure in CI is readable without re-running locally.
      const report = results.violations.map(violation => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.map(node => node.html)
      }));
      expect(report, JSON.stringify(report, null, 2)).toEqual([]);
    });
  }
});
