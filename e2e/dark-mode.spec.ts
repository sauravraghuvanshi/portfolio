import { test, expect } from "@playwright/test";

test.describe("Dark Mode", () => {
  test("theme toggle switches between light and dark", async ({ page }) => {
    await page.goto("/");

    // Find theme toggle button
    const toggle = page.getByRole("button", { name: /theme|dark|light/i });
    await expect(toggle).toBeVisible();

    // Check initial state and toggle
    const html = page.locator("html");
    const wasDark = await html.evaluate((el) => el.classList.contains("dark"));

    await toggle.click();

    if (wasDark) {
      await expect(html).not.toHaveClass(/dark/);
    } else {
      await expect(html).toHaveClass(/dark/);
    }

    // Toggle back
    await toggle.click();

    if (wasDark) {
      await expect(html).toHaveClass(/dark/);
    } else {
      await expect(html).not.toHaveClass(/dark/);
    }
  });
});
