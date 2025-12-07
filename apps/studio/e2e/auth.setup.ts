import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Navigate to login page
  await page.goto("/");

  // Check if we're already logged in by looking for a sign out button or user indicator
  const isLoggedIn = await page.getByText(/sign out/i).isVisible().catch(() => false);

  if (!isLoggedIn) {
    // Fill in login form
    await page.getByPlaceholder(/email/i).fill("test@example.com");
    await page.getByPlaceholder(/name/i).fill("Test User");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for redirect after login
    await page.waitForURL("**/workspaces", { timeout: 10000 });
  }

  // Save signed-in state
  await page.context().storageState({ path: authFile });
});
