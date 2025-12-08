import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/auth/signin");
  await page.getByLabel(/email/i).fill("test.user@example.com");
  await page.getByLabel(/name/i).fill("Test User");

  // Wait for navigation after clicking sign in
  await Promise.all([
    page.waitForURL(/\/workspaces/, { timeout: 10000 }),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);
}

test.describe("Workspace Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/workspaces");
  });

  test("should display workspaces page", async ({ page }) => {
    await expect(page).toHaveURL(/\/workspaces/);
    // Target the main page title explicitly (level 1 heading with exact name)
    await expect(page.getByRole("heading", { name: "Workspaces", level: 1 })).toBeVisible();
  });

  test("should create a new workspace", async ({ page }) => {
    const workspaceName = `Test Workspace ${Date.now()}`;

    await page.getByRole("button", { name: /create workspace/i }).click();
    await page.getByLabel(/name/i).fill(workspaceName);

    // Only fill description if the field exists
    const descriptionField = page.getByLabel(/description/i);
    if (await descriptionField.count()) {
      await descriptionField.fill("A test workspace created by E2E tests");
    }

    await page.getByRole("button", { name: /save|create/i }).click();
    await expect(page.getByText(workspaceName)).toBeVisible();
  });

  test("should navigate to workspace details", async ({ page }) => {
    // Precondition: create a workspace via the UI
    const workspaceName = `E2E Workspace ${Date.now()}`;

    await page.getByRole("button", { name: /create workspace/i }).click();
    await page.getByLabel(/name/i).fill(workspaceName);
    await page.getByRole("button", { name: /save|create/i }).click();
    // Let Playwright auto-wait on navigation
    await expect(page).toHaveURL(/\/workspaces\/[a-z0-9-]+$/);

    // Optional: assert we're on the details page
    await expect(page.getByRole("heading", { name: workspaceName })).toBeVisible();
  });
});
