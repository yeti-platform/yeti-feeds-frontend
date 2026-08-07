import { expect, test } from "./fixtures";

test.describe("Graph investigation workspace", () => {
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
        body: JSON.stringify({ rbac_enabled: true, agents_enabled: false })
      });
    });
  });

  test("opens the authenticated lazy route with an empty scope", async ({ page }) => {
    await page.goto("/graph");

    await expect(page).toHaveTitle("Graph investigation - Yeti");
    await expect(page.getByRole("heading", { name: "Graph investigation" })).toBeVisible();
    await expect(page.getByText("Choose one or more objects or define a broader scope to begin.")).toBeVisible();
  });

  test("renders and disposes the Sigma 4 validation fixture", async ({ page, context }, testInfo) => {
    await context.tracing.start({ screenshots: true, snapshots: true });
    await page.addInitScript(() => {
      const durations: number[] = [];
      new PerformanceObserver(list => durations.push(...list.getEntries().map(entry => entry.duration))).observe({
        type: "longtask",
        buffered: true
      });
      Object.defineProperty(window, "__graphLongTasks", { value: durations });
    });
    const loadStartedAt = performance.now();
    await page.goto("/graph?renderer=spike");

    const canvas = page.getByTestId("graph-canvas");
    await expect(canvas.locator("canvas")).toHaveCount(1);
    const loadMs = performance.now() - loadStartedAt;
    await expect(page.getByText("2,000 nodes · 10,000 directed edges")).toBeVisible();

    await page.getByRole("button", { name: "Select parallel relationship spike-edge-1" }).click();
    await expect(page.getByText("Selected relationship: spike-edge-1")).toBeVisible();
    await page.getByRole("button", { name: "Select parallel relationship spike-edge-2" }).click();
    await expect(page.getByText("Selected relationship: spike-edge-2")).toBeVisible();
    const interactionStatus = page.getByText(/Last renderer interaction: \d+(?:\.\d+)? ms/);
    const selectionMs = Number((await interactionStatus.textContent())?.match(/([\d.]+) ms/)?.[1]);
    expect(selectionMs).toBeLessThanOrEqual(200);

    await page.getByRole("button", { name: "Focus sample node" }).click();
    await expect(interactionStatus).toBeVisible();
    const focusMs = Number((await interactionStatus.textContent())?.match(/([\d.]+) ms/)?.[1]);
    expect(focusMs).toBeLessThanOrEqual(200);

    await page.getByRole("button", { name: "Toggle relationship visibility" }).click();
    const filterMs = Number((await interactionStatus.textContent())?.match(/([\d.]+) ms/)?.[1]);
    expect(filterMs).toBeLessThanOrEqual(200);

    const fixtureBytes = Number(await page.getByTestId("renderer-fixture-bytes").textContent());
    const longTasks = await page.evaluate(
      () => (window as typeof window & { __graphLongTasks: number[] }).__graphLongTasks
    );
    await testInfo.attach("renderer-measurements.json", {
      body: JSON.stringify({ loadMs, selectionMs, focusMs, filterMs, fixtureBytes, longTasks }, null, 2),
      contentType: "application/json"
    });

    await page.goto("/graph");
    await expect(canvas).toHaveCount(0);
    await page.goto("/graph?renderer=spike");
    await expect(page.getByTestId("graph-canvas").locator("canvas")).toHaveCount(1);
    await context.tracing.stop({ path: testInfo.outputPath("sigma-v4-trace.zip") });
  });
});
