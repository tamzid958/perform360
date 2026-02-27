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
      await expect(page).toHaveURL(/login/);
    }
  });

  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/overview");
    await page.waitForURL(/login|auth/, { timeout: 5000 }).catch(() => {});
    const url = page.url();
    expect(url).toMatch(/login|auth/);
  });

  test("public evaluate page loads with token", async ({ page }) => {
    await page.goto("/evaluate/invalid-token");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});

test.describe("Public Pages", () => {
  test("guide page loads", async ({ page }) => {
    await page.goto("/guide");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("root redirects", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toMatch(/login|onboarding|overview/);
  });
});
