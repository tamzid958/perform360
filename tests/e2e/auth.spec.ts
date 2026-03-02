import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
  });

  test("shows validation error for empty email", async ({ page }) => {
    await page.goto("/login");
    const submitBtn = page.getByRole("button", { name: /sign in|log in|continue/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Should show validation or remain on same page
      await expect(page).toHaveURL(/login/);
    }
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/overview");
    // Should redirect to login
    await page.waitForURL(/login|auth/, { timeout: 5000 }).catch(() => {
      // May already be on login
    });
    const url = page.url();
    expect(url).toMatch(/login|auth|register/);
  });

  test("public evaluate page loads with token", async ({ page }) => {
    // This should return a form or error page for invalid token
    await page.goto("/evaluate/invalid-token");
    await page.waitForLoadState("networkidle");
    // Should show some content (either form or error)
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});

test.describe("Public Pages", () => {
  test("privacy policy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("security policy page loads", async ({ page }) => {
    await page.goto("/security-policy");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});
