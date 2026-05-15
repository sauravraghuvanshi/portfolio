import { test, expect } from "@playwright/test";

test.describe("AI Architecture Advisor", () => {
  test("page renders form and accepts sample workload", async ({ page }) => {
    await page.goto("/advisor");
    await expect(
      page.getByRole("heading", { name: /ai architecture advisor/i, level: 1 })
    ).toBeVisible();
    await expect(page.getByLabel(/workload description/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /assess my workload/i })).toBeVisible();

    await page.getByRole("button", { name: /use sample workload/i }).click();
    const workload = page.getByLabel(/workload description/i);
    await expect(workload).not.toHaveValue("");
  });

  test("client-side validation rejects too-short workload", async ({ page }) => {
    await page.goto("/advisor");
    await page.getByLabel(/workload description/i).fill("short");
    await page.getByRole("button", { name: /assess my workload/i }).click();
    // browser-native validation kicks in (minLength=10); form will not submit.
    await expect(page).toHaveURL(/\/advisor$/);
  });
});
