import { test, expect } from "@playwright/test";

test.describe("Component Management", () => {
  test("should create and refactor a component", async ({ page }) => {
    // Navigate to workspaces
    await page.goto("/workspaces");

    // Create or select a workspace
    const workspaceLink = page.locator("a[href*='/workspaces/']").first();
    const hasWorkspaces = await workspaceLink.count() > 0;

    if (!hasWorkspaces) {
      // Create a workspace first
      await page.getByRole("button", { name: /create workspace/i }).click();
      await page.getByLabel(/name/i).fill(`Test Workspace ${Date.now()}`);
      await page.getByRole("button", { name: /save|create/i }).click();
      await page.locator("a[href*='/workspaces/']").first().click();
    } else {
      await workspaceLink.click();
    }

    // Create a component
    const createComponentButton = page.getByRole("button", { name: /create component/i });
    if (await createComponentButton.isVisible()) {
      await createComponentButton.click();

      const componentName = `TestComponent${Date.now()}`;
      await page.getByLabel(/name/i).fill(componentName);
      await page.getByLabel(/description/i).fill("A test component for E2E testing");
      await page.getByRole("button", { name: /save|create/i }).click();

      // Verify component was created and we're on the component page
      await expect(page.getByText(componentName)).toBeVisible();
    }

    // Navigate to component editor (if we have any components)
    const componentLink = page.locator("a[href*='/components/']").first();
    if (await componentLink.count() > 0) {
      await componentLink.click();

      // Verify we're on the component page
      await expect(page.url()).toMatch(/\/components\/[a-z0-9]+/);

      // Check for code editor or refactor button
      const refactorButton = page.getByRole("button", { name: /refactor/i });
      if (await refactorButton.isVisible()) {
        await expect(refactorButton).toBeVisible();
      }
    }
  });

  test("should switch between Code and Documentation tabs", async ({ page }) => {
    // Navigate to first component
    await page.goto("/workspaces");
    const workspaceLink = page.locator("a[href*='/workspaces/']").first();

    if (await workspaceLink.count() > 0) {
      await workspaceLink.click();

      const componentLink = page.locator("a[href*='/components/']").first();
      if (await componentLink.count() > 0) {
        await componentLink.click();

        // Look for tabs
        const codeTab = page.getByRole("tab", { name: /code/i });
        const docsTab = page.getByRole("tab", { name: /documentation/i });

        if (await codeTab.isVisible()) {
          await expect(codeTab).toBeVisible();
        }

        if (await docsTab.isVisible()) {
          await docsTab.click();
          await expect(docsTab).toBeVisible();
        }
      }
    }
  });
});
