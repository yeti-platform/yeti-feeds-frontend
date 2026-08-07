import { expect, test } from "./fixtures";

const graphResponse = {
  schema_version: 1,
  scope: { kind: "items", anchor_ids: ["entities/1"], accessible_match_count: 1, ranking: null },
  nodes: [
    {
      id: "entities/1",
      label: "APT Example",
      root_type: "entity",
      object_type: "threat-actor",
      role: "anchor",
      origin_ids: ["entities/1"]
    },
    {
      id: "observables/2",
      label: "example.test",
      root_type: "observable",
      object_type: "hostname",
      role: "neighbor",
      origin_ids: ["entities/1"]
    }
  ],
  edges: [
    {
      id: "links/7",
      source: "entities/1",
      target: "observables/2",
      type: "uses",
      description: "Synthetic evidence",
      count: 1
    }
  ],
  budget: {
    node_limit: 2000,
    edge_limit: 10000,
    returned_nodes: 2,
    returned_edges: 1,
    is_truncated: false,
    reasons: []
  }
};

function graphUrl(scope: object) {
  const parameters = new URLSearchParams();
  parameters.set(
    "state",
    JSON.stringify({ version: 1, scope, direction: "any", link_types: [], target_types: [] })
  );
  return `/graph#${parameters.toString()}`;
}

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

  test("loads a typed single-item deep link", async ({ page }) => {
    let requestBody: Record<string, unknown> | null = null;
    await page.route("**/api/v2/graph/explore", async route => {
      requestBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(graphResponse) });
    });

    await page.goto(graphUrl({ kind: "items", items: ["entities/1"] }));

    await expect(page.getByText("2 objects")).toBeVisible();
    await expect(page.getByText("1 relationships")).toBeVisible();
    await expect(page.getByTestId("graph-canvas").locator("canvas")).toHaveCount(1);
    expect(requestBody).toMatchObject({
      schema_version: 1,
      scope: { kind: "items", items: ["entities/1"] },
      requested_limits: { nodes: 2000, edges: 10000 }
    });
  });

  test("deduplicates multiple explicit anchors", async ({ page }) => {
    let requestBody: { scope?: { items?: string[] } } = {};
    await page.route("**/api/v2/graph/explore", async route => {
      requestBody = route.request().postDataJSON() as typeof requestBody;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(graphResponse) });
    });
    await page.goto("/graph");

    await page.getByLabel("Yeti object IDs").fill("entities/1\nentities/1\nobservables/2");
    await page.getByRole("button", { name: "Explore objects" }).click();

    await expect(page.getByText("2 objects")).toBeVisible();
    expect(requestBody.scope?.items).toEqual(["entities/1", "observables/2"]);
  });

  test("restores a broad query scope and explains ranking and truncation", async ({ page }) => {
    const queryResponse = {
      ...graphResponse,
      scope: {
        kind: "query",
        anchor_ids: [],
        accessible_match_count: 42,
        ranking: [["modified", false], ["_id", true]]
      },
      budget: { ...graphResponse.budget, is_truncated: true, reasons: ["node_limit"] }
    };
    let requestBody: { scope?: { query?: Record<string, unknown> } } = {};
    await page.route("**/api/v2/graph/explore", async route => {
      requestBody = route.request().postDataJSON() as typeof requestBody;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(queryResponse) });
    });

    await page.goto(
      graphUrl({
        kind: "query",
        query: { tags: ["apt29"], modified__gte: "2026-01-01", root_type: "entity" },
        sorting: [],
        filter_aliases: []
      })
    );

    await expect(page.getByText("42 accessible matches")).toBeVisible();
    await expect(page.getByText("Truncated: node_limit")).toBeVisible();
    await expect(page.getByText(/Ranking: modified descending, _id ascending/)).toBeVisible();
    expect(requestBody.scope?.query).toEqual({
      tags: ["apt29"],
      modified__gte: "2026-01-01",
      root_type: "entity"
    });
    expect(page.url()).not.toContain("Synthetic evidence");
  });

  test("keeps the previous workspace after an atomic unavailable-scope error", async ({ page }) => {
    let requestCount = 0;
    await page.route("**/api/v2/graph/explore", async route => {
      requestCount += 1;
      if (requestCount === 1) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(graphResponse) });
      } else {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "One or more requested objects are unavailable" })
        });
      }
    });
    await page.goto(graphUrl({ kind: "items", items: ["entities/1"] }));
    await expect(page.getByText("2 objects")).toBeVisible();

    await page.getByLabel("Yeti object IDs").fill("entities/missing");
    await page.getByRole("button", { name: "Explore objects" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "scope objects are unavailable" })).toBeVisible();
    await expect(page.getByText("2 objects")).toBeVisible();
    await expect(page.getByTestId("graph-canvas").locator("canvas")).toHaveCount(1);
  });

  test("keeps exact directed evidence keyboard-readable and renders CTI text safely", async ({ page }) => {
    const unsafeResponse = {
      ...graphResponse,
      nodes: graphResponse.nodes.map((node, index) =>
        index === 1 ? { ...node, label: '<img src=x onerror="window.__unsafe=true">' } : node
      ),
      edges: graphResponse.edges.map(edge => ({ ...edge, description: "<script>window.__unsafe=true</script>" }))
    };
    await page.route("**/api/v2/graph/explore", route =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(unsafeResponse) })
    );

    await page.goto(graphUrl({ kind: "items", items: ["entities/1"] }));

    await expect(page.getByRole("heading", { name: "Evidence" })).toBeVisible();
    await expect(page.getByText('<img src=x onerror="window.__unsafe=true">')).toBeVisible();
    await expect(page.getByText("<script>window.__unsafe=true</script>")).toBeVisible();
    await expect(page.locator("script", { hasText: "window.__unsafe" })).toHaveCount(0);
    expect(await page.evaluate(() => (window as typeof window & { __unsafe?: boolean }).__unsafe)).toBeUndefined();
    await page.getByRole("button", { name: "Select relationship links/7" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Selected relationship links/7")).toBeVisible();
    await expect(page.getByRole("cell", { name: "entities/1 → observables/2" })).toBeVisible();
  });

  test("expands one hop and replays the workspace when undoing", async ({ page }) => {
    const expansionResponse = {
      ...graphResponse,
      scope: { kind: "items", anchor_ids: ["observables/2"], accessible_match_count: 1, ranking: null },
      nodes: [
        { ...graphResponse.nodes[1], role: "anchor", origin_ids: ["observables/2"] },
        {
          id: "observables/3",
          label: "pivot.test",
          root_type: "observable",
          object_type: "hostname",
          role: "neighbor",
          origin_ids: ["observables/2"]
        }
      ],
      edges: [
        {
          id: "links/8",
          source: "observables/2",
          target: "observables/3",
          type: "resolves",
          description: "Expansion evidence",
          count: 1
        }
      ]
    };
    await page.route("**/api/v2/graph/explore", async route => {
      const body = route.request().postDataJSON() as { scope: { items: string[] } };
      const response = body.scope.items[0] === "observables/2" ? expansionResponse : graphResponse;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(response) });
    });
    await page.goto(graphUrl({ kind: "items", items: ["entities/1"] }));

    await page.getByRole("button", { name: "Expand example.test" }).click();
    await expect(page.getByText("pivot.test")).toBeVisible();
    await expect(page.getByText("3 objects")).toBeVisible();

    await page.getByRole("button", { name: "Undo expansion" }).click();
    await expect(page.getByText("pivot.test")).toHaveCount(0);
    await expect(page.getByText("2 objects")).toBeVisible();
  });

  test("filters and searches the loaded graph without changing its starting scope", async ({ page }) => {
    await page.route("**/api/v2/graph/explore", route =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(graphResponse) })
    );
    await page.goto(graphUrl({ kind: "items", items: ["entities/1"] }));

    await page.getByRole("textbox", { name: "Search loaded graph" }).fill("example.test");
    await page.getByRole("button", { name: "Focus search result" }).click();
    await expect(page.getByText("Focused object: example.test")).toBeVisible();

    await page.getByRole("textbox", { name: "Relationship type filter" }).fill("resolves");
    await expect(page.getByText("0 visible relationships")).toBeVisible();
    await page.getByRole("button", { name: "Reset investigation" }).click();
    await expect(page.getByText("1 visible relationships")).toBeVisible();
    await expect(page).toHaveURL(/entities%2F1/);
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
