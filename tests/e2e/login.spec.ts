import { expect, test } from "@playwright/test";

/** Covers views/Login.vue and the auth flow through the user store. */

const user = {
  id: "99",
  username: "testadmin",
  enabled: true,
  admin: true,
  global_role: 7,
  api_keys: {},
  root_type: "user"
};

test.describe("Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v2/system/config", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rbac_enabled: true, agents_enabled: false, auth: { module: "local" } })
      });
    });
  });

  /** Not logged in: /auth/me answers 401 until a token is issued. */
  async function anonymous(page: import("@playwright/test").Page, loggedIn: { value: boolean }) {
    await page.route("**/api/v2/auth/me", async route => {
      if (!loggedIn.value) {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Not authenticated" })
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) });
    });
  }

  test("shows the login form and no error snackbar when logged out", async ({ page }) => {
    await anonymous(page, { value: false });
    await page.goto("/login");

    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
    // A 401 from /auth/me is the normal answer for a logged-out visitor: it must
    // not raise the global error snackbar.
    await expect(page.getByText("Not authenticated")).toBeHidden();
  });

  test("logs in and lands on the observables page", async ({ page }) => {
    const loggedIn = { value: false };
    await anonymous(page, loggedIn);

    await page.route("**/api/v2/auth/token", async route => {
      const body = route.request().postData() ?? "";
      expect(body).toContain("testadmin");
      loggedIn.value = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ access_token: "t" })
      });
    });

    await page.route("**/api/v2/observables/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ observables: [], total: 0 })
      });
    });

    await page.goto("/login");
    await page.getByLabel("Username").fill("testadmin");
    await page.getByLabel("Password").fill("hunter2");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL(/\/observables/);
  });

  test("reports a bad password without redirecting", async ({ page }) => {
    await anonymous(page, { value: false });

    await page.route("**/api/v2/auth/token", async route => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Incorrect username or password" })
      });
    });

    await page.goto("/login");
    await page.getByLabel("Username").fill("testadmin");
    await page.getByLabel("Password").fill("wrong");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Incorrect username or password")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects back to the page that bounced you to login", async ({ page }) => {
    const loggedIn = { value: false };
    await anonymous(page, loggedIn);

    await page.route("**/api/v2/auth/token", async route => {
      loggedIn.value = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ access_token: "t" })
      });
    });

    await page.route("**/api/v2/entities/search", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ entities: [], total: 0 })
      });
    });

    // The router guard adds ?next= when it bounces an unauthenticated visitor.
    await page.goto("/entities");
    await expect(page).toHaveURL(/\/login\?next=/);

    await page.getByLabel("Username").fill("testadmin");
    await page.getByLabel("Password").fill("hunter2");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL(/\/entities/);
  });
});
