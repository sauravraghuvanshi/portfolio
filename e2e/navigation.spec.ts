import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("homepage loads with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Saurav Raghuvanshi/);
  });

  test("nav links navigate to correct pages", async ({ page }) => {
    await page.goto("/");

    // Projects link
    await page.getByRole("link", { name: /projects/i }).first().click();
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole("heading", { name: /all projects/i })).toBeVisible();

    // Blog link
    await page.getByRole("link", { name: /blog/i }).first().click();
    await expect(page).toHaveURL(/\/blog/);

    // Case Studies link
    await page.getByRole("link", { name: /case studies/i }).first().click();
    await expect(page).toHaveURL(/\/case-studies/);

    // Events link
    await page.getByRole("link", { name: /events/i }).first().click();
    await expect(page).toHaveURL(/\/events/);

    // Community link
    await page.getByRole("link", { name: /community/i }).first().click();
    await expect(page).toHaveURL(/\/community/);
  });

  test("command palette opens with Ctrl+K", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+k");
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test("footer is visible on homepage", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });
});
