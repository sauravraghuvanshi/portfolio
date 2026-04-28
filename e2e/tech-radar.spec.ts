import { test, expect } from "@playwright/test";

test.describe("Tech Radar", () => {
  test("page renders heading, SVG, and lists", async ({ page }) => {
    await page.goto("/tech-radar");
    await expect(page.getByRole("heading", { name: /tech radar/i, level: 1 })).toBeVisible();
    await expect(page.getByRole("img", { name: /tech radar diagram/i })).toBeVisible();
    // quadrant section headings
    await expect(page.getByRole("heading", { name: /languages & frameworks/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /platforms/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /tools/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /techniques/i })).toBeVisible();
  });

  test("clicking a tag opens the detail drawer", async ({ page }) => {
    await page.goto("/tech-radar");
    // click a known entry tag in the lists below the radar
    await page.getByRole("button", { name: /^Bicep/ }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /bicep/i })).toBeVisible();
    await expect(dialog.getByText(/use when/i)).toBeVisible();
    // close
    await dialog.getByRole("button", { name: /close details/i }).click();
    await expect(dialog).toBeHidden();
  });

  test("quadrant filter narrows visible content", async ({ page }) => {
    await page.goto("/tech-radar");
    await page.getByRole("button", { name: /^Platforms/ }).first().click();
    // Languages quadrant heading should disappear in lists
    await expect(page.getByRole("heading", { name: /languages & frameworks/i })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /platforms/i })).toBeVisible();
  });
});
