import { test, expect } from "@playwright/test";

test.describe("Project Detail Pages", () => {
  test("projects listing shows all 6 projects", async ({ page }) => {
    await page.goto("/projects");
    const cards = page.locator("article");
    await expect(cards).toHaveCount(6);
  });

  test("project card links to detail page", async ({ page }) => {
    await page.goto("/projects", { waitUntil: "networkidle" });
    // Click the heading inside the first project card to navigate
    const firstHeading = page.locator("article h3").first();
    await firstHeading.click();
    await expect(page).toHaveURL(/\/projects\/.+/, { timeout: 15000 });
    // Detail page should have a heading and back link
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /back to projects/i })).toBeVisible();
  });

  test("project detail page shows all sections", async ({ page }) => {
    await page.goto("/projects/supportiq-genai");
    // Title
    await expect(page.getByRole("heading", { level: 1, name: /SupportIQ/i })).toBeVisible();
    // Outcomes section
    await expect(page.getByText("Key Outcomes")).toBeVisible();
    // Tech Stack section
    await expect(page.getByText("Tech Stack")).toBeVisible();
    // CTA section
    await expect(page.getByText("Interested in a similar solution?")).toBeVisible();
  });

  test("prev/next navigation works", async ({ page }) => {
    await page.goto("/projects/supportiq-genai", { waitUntil: "networkidle" });
    // First project should have "Next" link but no "Previous"
    const nextLink = page.getByRole("link", { name: /next project/i });
    await expect(nextLink).toBeVisible();
    // Click next
    await nextLink.click();
    await expect(page).toHaveURL(/\/projects\/(?!supportiq-genai).+/, { timeout: 15000 });
    // Now should have "Previous"
    await expect(page.getByRole("link", { name: /previous project/i })).toBeVisible();
  });

  test("back to projects link works", async ({ page }) => {
    await page.goto("/projects/supportiq-genai", { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /back to projects/i }).click();
    await expect(page).toHaveURL(/\/projects$/, { timeout: 15000 });
  });
});
