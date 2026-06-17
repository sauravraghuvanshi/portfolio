import { test, expect } from "@playwright/test";

test.describe("Certifications", () => {
  test("section renders heading, filter chips, and tiles for all 12 certs", async ({ page }) => {
    await page.goto("/#certifications");
    const section = page.locator("section#certifications");
    await expect(section).toBeVisible();
    await expect(
      section.getByRole("heading", { name: /^Certifications$/i })
    ).toBeVisible();
    // Filter chips include all four with counts.
    await expect(section.getByRole("button", { name: /^All\s+12$/ })).toBeVisible();
    await expect(section.getByRole("button", { name: /^Microsoft\s+4$/ })).toBeVisible();
    await expect(section.getByRole("button", { name: /^AWS\s+2$/ })).toBeVisible();
    await expect(section.getByRole("button", { name: /^Udacity\s+6$/ })).toBeVisible();
  });

  test("clicking a cert tile opens the detail drawer and ESC closes it", async ({ page }) => {
    await page.goto("/#certifications");
    const section = page.locator("section#certifications");
    await section.getByRole("button", { name: /Azure AI Fundamentals/ }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /Azure AI Fundamentals/i })).toBeVisible();
    await expect(dialog.getByText(/Issued by/i)).toBeVisible();
    await dialog.getByRole("button", { name: /close details/i }).click();
    await expect(dialog).toBeHidden();
  });

  test("issuer filter narrows visible tiles", async ({ page }) => {
    await page.goto("/#certifications");
    const section = page.locator("section#certifications");
    // Initial: a Microsoft cert is present.
    await expect(section.getByRole("button", { name: /Azure AI Fundamentals/ })).toBeVisible();
    // Click the AWS filter chip — buttons render the label then a count "2".
    await section.getByRole("button", { name: /^AWS\s+2$/ }).click();
    // AWS cert remains visible; Microsoft and Udacity tiles disappear.
    await expect(section.getByRole("button", { name: /AWS Certified Solutions Architect/ })).toBeVisible();
    await expect(section.getByRole("button", { name: /Azure AI Fundamentals/ })).toHaveCount(0);
    await expect(section.getByRole("button", { name: /Computer Vision Nanodegree/ })).toHaveCount(0);
  });
});
