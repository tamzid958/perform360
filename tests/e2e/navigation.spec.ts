import { test, expect } from "@playwright/test";

test.describe("Navigation Guards", () => {
  test("dashboard routes redirect to auth when not logged in", async ({ page }) => {
    const protectedRoutes = ["/overview", "/cycles", "/teams", "/people", "/templates", "/settings"];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForURL(/login|auth/, { timeout: 5000 }).catch(() => {});
      const url = page.url();
      expect(url, `${route} should redirect to auth`).toMatch(/login|auth|register/);
    }
  });

  test("API routes return 401 for unauthenticated requests", async ({ request }) => {
    const apiRoutes = ["/api/teams", "/api/cycles", "/api/users", "/api/templates"];

    for (const route of apiRoutes) {
      const response = await request.get(route);
      expect(response.status(), `${route} should return 401`).toBe(401);
    }
  });

  test("API POST routes return 401 for unauthenticated requests", async ({ request }) => {
    const response = await request.post("/api/teams", {
      data: { name: "Test Team" },
    });
    expect(response.status()).toBe(401);
  });
});
