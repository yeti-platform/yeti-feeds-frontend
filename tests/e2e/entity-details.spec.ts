import { test, expect } from '@playwright/test';

test.describe('Entity Details', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user authentication
    await page.route('**/api/v2/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          username: 'testadmin',
          admin: true,
          email: 'test@example.com'
        })
      });
    });

    // Mock system config
    await page.route('**/api/v2/system/config', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rbac_enabled: true,
          agents_enabled: false
        })
      });
    });

    // Mock the entity details endpoint
    await page.route('**/api/v2/entities/123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          name: 'Fancy Bear',
          type: 'intrusion-set',
          root_type: 'entity',
          description: 'A very *fancy* bear indeed.',
          tags: [{ name: 'apt28' }, { name: 'russia' }],
          acls: {},
          created: '2026-03-23T10:00:00Z',
          modified: '2026-03-23T10:00:00Z'
        })
      });
    });
  });

  test('should display entity details and related objects correctly', async ({ page }) => {
    // Catch console logs to debug
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`BROWSER ${msg.type().toUpperCase()}:`, msg.text());
      }
    });

    // Mock graph search for related objects
    await page.route('**/api/v2/graph/search', async route => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = JSON.parse(request.postData() || '{}');
        const sourceId = 'entities/123';
        
        // Base response always includes the source entity
        const responseData = {
          vertices: {
            [sourceId]: { id: '123', name: 'Fancy Bear', type: 'intrusion-set', root_type: 'entity' }
          },
          paths: [],
          total: 0
        };

        // Specific mock for Indicators tab
        if (postData.target_types && postData.target_types.includes('yara')) {
          responseData.vertices['indicators/789'] = { id: '789', name: 'bad-ip.yara', type: 'yara', root_type: 'indicator' };
          responseData.paths.push([{ 
            source: sourceId, 
            target: 'indicators/789', 
            type: 'indicates', 
            id: 'edge2', 
            description: '',
            created: '2026-03-23T10:00:00Z' 
          }]);
          responseData.total = 1;
        } 
        // Specific mock for Observables tab
        else if (postData.target_types && postData.target_types.includes('ipv4')) {
          responseData.vertices['observables/456'] = { id: '456', value: '10.0.0.1', type: 'ipv4', root_type: 'observable', tags: [{ name: 'c2', fresh: true }] };
          responseData.paths.push([{ 
            source: sourceId, 
            target: 'observables/456', 
            type: 'uses', 
            id: 'edge1', 
            description: '',
            created: '2026-03-23T10:00:00Z' 
          }]);
          responseData.total = 1;
        }

        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseData) });
      } else {
        await route.continue();
      }
    });

    // Navigate directly to the entity page
    await page.goto('/entities/123');

    // Wait for the main title to render
    await expect(page.locator('.yeti-object-title code')).toContainText('Fancy Bear');

    // Wait for the indicators tab to show the count, ensuring data has loaded
    const indicatorsTab = page.locator('.v-tab', { hasText: 'Related indicators' });
    await expect(indicatorsTab.locator('.v-chip')).toContainText('1', { timeout: 10000 });

    // Verify indicator row
    await expect(page.locator('tbody tr').filter({ hasText: 'bad-ip.yara' })).toBeVisible();

    // Click observables tab
    const observablesTab = page.locator('.v-tab', { hasText: 'Related observables' });
    await expect(observablesTab.locator('.v-chip')).toContainText('1');
    await observablesTab.click();

    // Verify observable row
    await expect(page.locator('tbody tr').filter({ hasText: '10.0.0.1' })).toBeVisible();
  });

  test('swaps and removes a link from the related-objects table', async ({ page }) => {
    const swapRequests: Array<{ method: string; url: string }> = [];
    const deleteRequests: Array<{ method: string; url: string }> = [];

    await page.route('**/api/v2/graph/search', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          vertices: {
            'observables/456': {
              id: '456',
              value: '10.0.0.1',
              type: 'ipv4',
              root_type: 'observable',
              tags: []
            }
          },
          paths: [
            [
              {
                id: 'edge1',
                source: 'entities/123',
                target: 'observables/456',
                type: 'resolves',
                description: 'a link',
                created: '2026-03-23T10:00:00Z',
                modified: '2026-03-23T10:00:00Z',
                count: 1
              }
            ]
          ],
          total: 1
        })
      });
    });

    // The swap endpoint is POST (not PATCH) — assert the verb too.
    await page.route('**/api/v2/graph/edge1/swap', async route => {
      swapRequests.push({ method: route.request().method(), url: route.request().url() });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.route('**/api/v2/graph/edge1', async route => {
      deleteRequests.push({ method: route.request().method(), url: route.request().url() });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto('/entities/123');

    // ObjectDetails renders one DirectNeighbors table per tab, so scope to the
    // visible (active) one.
    await expect(page.locator('tbody tr:visible').filter({ hasText: '10.0.0.1' }).first()).toBeVisible();

    // Swap the link direction.
    await page.locator('button:visible:has(.mdi-swap-horizontal)').first().click();
    await expect.poll(() => swapRequests.length).toBe(1);
    expect(swapRequests[0].method).toBe('POST');

    // Unlink (the component asks for confirmation first).
    page.once('dialog', dialog => dialog.accept());
    await page.locator('button:visible:has(.mdi-link-off)').first().click();
    await expect.poll(() => deleteRequests.length).toBe(1);
    expect(deleteRequests[0].method).toBe('DELETE');
  });

  test('saves tags on the entity', async ({ page }) => {
    const tagRequests: Array<Record<string, unknown>> = [];

    await page.route('**/api/v2/graph/search', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ vertices: {}, paths: [], total: 0 })
      });
    });

    await page.route('**/api/v2/entities/tag', async route => {
      tagRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tagged: 1, tags: {} })
      });
    });

    await page.goto('/entities/123');
    await expect(page.locator('.yeti-object-title code')).toContainText('Fancy Bear');

    // The tag combobox is pre-populated from the entity's tags.
    const tagBox = page.locator('.v-combobox input').first();
    await tagBox.fill('newtag');
    await tagBox.press('Enter');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => tagRequests.length).toBe(1);
    expect(tagRequests[0]).toMatchObject({ ids: ['123'], strict: true });
    expect(tagRequests[0].tags).toContain('newtag');
    // The pre-existing tags are preserved (strict: true replaces the whole set).
    expect(tagRequests[0].tags).toContain('apt28');
  });

  test('edits a link through the EditLink dialog', async ({ page }) => {
    const patchRequests: Array<Record<string, unknown>> = [];

    await page.route('**/api/v2/graph/search', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          vertices: {
            'entities/123': { id: '123', name: 'Fancy Bear', type: 'intrusion-set', root_type: 'entity', tags: [] },
            'observables/456': { id: '456', value: '10.0.0.1', type: 'ipv4', root_type: 'observable', tags: [] }
          },
          paths: [
            [
              {
                id: 'edge1',
                source: 'entities/123',
                target: 'observables/456',
                type: 'resolves',
                description: 'a link',
                created: '2026-03-23T10:00:00Z',
                modified: '2026-03-23T10:00:00Z',
                count: 1
              }
            ]
          ],
          total: 1
        })
      });
    });

    // EditLink patches the edge (link_type + description) via PATCH /graph/{id}.
    await page.route('**/api/v2/graph/edge1', async route => {
      if (route.request().method() !== 'PATCH') {
        await route.fallback();
        return;
      }
      patchRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'edge1', source: 'entities/123', target: 'observables/456', type: 'related-to' })
      });
    });

    await page.goto('/entities/123');
    const neighborRow = page.locator('tbody tr:visible').filter({ hasText: '10.0.0.1' }).first();
    await expect(neighborRow).toBeVisible();

    // Open the EditLink dialog from the neighbor row's pencil (not the entity's
    // own Edit button, which also uses mdi-pencil).
    await neighborRow.locator('button:has(.mdi-pencil)').click();

    // Scope to the EditLink card (its title starts with "Edit:").
    const dialog = page.locator('.v-card').filter({ hasText: 'Edit:' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Description').fill('now related');
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => patchRequests.length).toBe(1);
    expect(patchRequests[0]).toEqual({ description: 'now related', link_type: 'resolves' });
  });
});
