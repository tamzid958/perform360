import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectNoA11yViolations(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(
    results.violations,
    `a11y violations on ${path}:\n${results.violations
      .map(
        (v) =>
          `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"})`
      )
      .join("\n")}`
  ).toEqual([]);
}

test.describe("Accessibility (a11y) — Public Pages", () => {
  test("landing page has no a11y violations", async ({ page }) => {
    await expectNoA11yViolations(page, "/");
  });

  test("login page has no a11y violations", async ({ page }) => {
    await expectNoA11yViolations(page, "/login");
  });

  test("register page has no a11y violations", async ({ page }) => {
    await expectNoA11yViolations(page, "/register");
  });

  test("evaluate page has no a11y violations", async ({ page }) => {
    await expectNoA11yViolations(page, "/evaluate/test-invalid-token");
  });

  test("privacy policy page has no a11y violations", async ({ page }) => {
    await expectNoA11yViolations(page, "/privacy");
  });

  test("security policy page has no a11y violations", async ({ page }) => {
    await expectNoA11yViolations(page, "/security-policy");
  });

  test("guide page has no a11y violations", async ({ page }) => {
    await expectNoA11yViolations(page, "/guide");
  });
});
