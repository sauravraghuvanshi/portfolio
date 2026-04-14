import { test, expect } from "@playwright/test";

test.describe("Responsive Layout", () => {
  test("mobile: hamburger menu visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    // Mobile menu button should be visible
    const menuButton = page.getByRole("button", { name: /menu|navigation/i });
    await expect(menuButton).toBeVisible();
  });

  test("desktop: full navigation visible", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    // Desktop nav links should be visible
    await expect(page.getByRole("link", { name: /projects/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /blog/i }).first()).toBeVisible();
  });
});
