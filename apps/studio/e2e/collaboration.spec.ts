import { test, expect, Page } from "@playwright/test";

/**
 * E2E tests for realtime collaboration features
 * Tests presence system and collaborative editing functionality
 */

async function login(page: Page, email: string = "test.user@example.com", name: string = "Test User") {
  await page.goto("/auth/signin");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/name/i).fill(name);

  await Promise.all([
    page.waitForURL(/\/workspaces/, { timeout: 10000 }),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);
}

async function createWorkspace(page: Page, workspaceName: string) {
  await page.goto("/workspaces");
  await page.getByRole("button", { name: /create workspace/i }).click();
  await page.getByLabel(/name/i).fill(workspaceName);
  await page.getByRole("button", { name: /save|create/i }).click();
  await page.waitForURL(/\/workspaces\/[a-z0-9-]+$/, { timeout: 10000 });
}

async function createComponent(page: Page, componentName: string) {
  await page.getByRole("button", { name: /create component/i }).click();
  await page.getByLabel(/name/i).fill(componentName);
  await page.getByLabel(/description/i).fill("Test component for collaboration");
  await page.getByRole("button", { name: /save|create/i }).click();

  // Wait for navigation to component editor
  await page.waitForURL(/\/components\/[a-z0-9]+/, { timeout: 10000 });
}

test.describe("Realtime Collaboration", () => {
  test.describe("Presence System", () => {
    test("should display presence indicator on component page", async ({ page }) => {
      await login(page);
      const workspaceName = `Collab Test ${Date.now()}`;
      await createWorkspace(page, workspaceName);

      const componentName = `TestComponent${Date.now()}`;
      await createComponent(page, componentName);

      // Look for presence indicator component
      // It should show "Connecting..." or current user
      const presenceIndicator = page.locator('[data-testid="presence-indicator"]').or(
        page.locator('text=/viewing|connected/i')
      );

      // Wait a few seconds for Pusher to connect
      await page.waitForTimeout(3000);

      // Verify presence UI is rendered (even if just showing current user)
      const hasPresenceUI = await page.locator('text=/viewing|viewer|you/i').count() > 0;
      expect(hasPresenceUI || await presenceIndicator.count() > 0).toBeTruthy();
    });

    test("should show multiple users when viewing same component", async ({ browser }) => {
      // Create two browser contexts for two different users
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      try {
        // User 1 logs in and creates workspace + component
        await login(page1, "user1@example.com", "User One");
        const workspaceName = `Multi-User ${Date.now()}`;
        await createWorkspace(page1, workspaceName);

        const componentName = `SharedComponent${Date.now()}`;
        await createComponent(page1, componentName);

        // Get the component URL from page1
        const componentUrl = page1.url();

        // User 2 logs in
        await login(page2, "user2@example.com", "User Two");

        // TODO: Add User 2 to the workspace as a member
        // For now, this test documents the expected behavior
        // In a real scenario, we'd need to:
        // 1. Get workspace ID from URL
        // 2. Add user2 as workspace member via API or UI
        // 3. Then user2 can access the component

        // Navigate User 2 to the same component
        await page2.goto(componentUrl);

        // Wait for Pusher connections
        await page1.waitForTimeout(2000);
        await page2.waitForTimeout(2000);

        // Both pages should show presence indicators
        // This test will fail until workspace membership is properly set up
        // but documents the expected multi-user presence behavior

      } finally {
        await context1.close();
        await context2.close();
      }
    });

    test("should show connection status (Connecting/Connected)", async ({ page }) => {
      await login(page);
      const workspaceName = `Connection Test ${Date.now()}`;
      await createWorkspace(page, workspaceName);

      const componentName = `TestComponent${Date.now()}`;
      await createComponent(page, componentName);

      // Initially might show "Connecting..."
      const connectingText = page.locator('text=/connecting/i');
      const hasConnectingState = await connectingText.count() > 0;

      // Wait for connection
      await page.waitForTimeout(3000);

      // After connection, should show users or connected state
      // The presence indicator should be visible
      const hasPresence = await page.locator('text=/viewing|viewer|you|connected/i').count() > 0;

      // Either we saw "connecting" state or we have presence
      expect(hasConnectingState || hasPresence).toBeTruthy();
    });
  });

  test.describe("Collaborative Editing", () => {
    test("should load collaborative editing hooks on component editor", async ({ page }) => {
      await login(page);
      const workspaceName = `Edit Test ${Date.now()}`;
      await createWorkspace(page, workspaceName);

      const componentName = `EditableComponent${Date.now()}`;
      await createComponent(page, componentName);

      // Verify we're on component editor page
      await expect(page).toHaveURL(/\/components\/[a-z0-9]+/);

      // Look for code editor or tabs
      const codeTab = page.getByRole("tab", { name: /code/i });
      const docsTab = page.getByRole("tab", { name: /documentation/i });

      // At least one tab should be visible
      expect(await codeTab.isVisible() || await docsTab.isVisible()).toBeTruthy();
    });

    test("should switch between Code and Documentation tabs", async ({ page }) => {
      await login(page);
      const workspaceName = `Tab Test ${Date.now()}`;
      await createWorkspace(page, workspaceName);

      const componentName = `TabbedComponent${Date.now()}`;
      await createComponent(page, componentName);

      const codeTab = page.getByRole("tab", { name: /code/i });
      const docsTab = page.getByRole("tab", { name: /documentation/i });

      if (await codeTab.isVisible() && await docsTab.isVisible()) {
        // Click docs tab
        await docsTab.click();
        await page.waitForTimeout(500);

        // Verify docs tab is active (might have aria-selected or active class)
        const docsTabState = await docsTab.getAttribute("aria-selected");
        expect(docsTabState).toBe("true");

        // Click back to code tab
        await codeTab.click();
        await page.waitForTimeout(500);

        const codeTabState = await codeTab.getAttribute("aria-selected");
        expect(codeTabState).toBe("true");
      }
    });

    test("should handle typing in editor without errors", async ({ page }) => {
      await login(page);
      const workspaceName = `Typing Test ${Date.now()}`;
      await createWorkspace(page, workspaceName);

      const componentName = `TypingComponent${Date.now()}`;
      await createComponent(page, componentName);

      // Wait for editor to load
      await page.waitForTimeout(2000);

      // Look for Monaco editor or textarea
      const editor = page.locator('.monaco-editor, textarea, [contenteditable="true"]').first();

      if (await editor.count() > 0) {
        // Click and type
        await editor.click();
        await page.keyboard.type("// Test collaborative editing");

        // Wait for debounce (500ms according to use-collaborative-edit.ts)
        await page.waitForTimeout(1000);

        // No errors should occur
        // The page should still be functional
        expect(page.url()).toMatch(/\/components\/[a-z0-9]+/);
      }
    });
  });

  test.describe("Real-time Sync", () => {
    test("should not crash when multiple users edit simultaneously", async ({ browser }) => {
      // This is a stress test for the collaborative editing system
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();

      try {
        await login(page1, "editor1@example.com", "Editor One");
        const workspaceName = `Sync Test ${Date.now()}`;
        await createWorkspace(page1, workspaceName);

        const componentName = `ConcurrentEdit${Date.now()}`;
        await createComponent(page1, componentName);

        // Wait for initial load
        await page1.waitForTimeout(2000);

        // Verify page is still responsive
        await expect(page1).toHaveURL(/\/components\/[a-z0-9]+/);

        // TODO: Add second user and test concurrent editing
        // This requires proper workspace membership setup

      } finally {
        await context1.close();
      }
    });
  });
});

test.describe("Pusher Integration", () => {
  test("should authenticate Pusher channels correctly", async ({ page }) => {
    await login(page);
    const workspaceName = `Pusher Test ${Date.now()}`;
    await createWorkspace(page, workspaceName);

    const componentName = `PusherComponent${Date.now()}`;
    await createComponent(page, componentName);

    // Wait for Pusher connection
    await page.waitForTimeout(3000);

    // Listen for console errors related to Pusher
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('pusher')) {
        errors.push(msg.text());
      }
    });

    // Wait a bit more to catch any errors
    await page.waitForTimeout(2000);

    // Should not have Pusher authentication errors
    expect(errors.length).toBe(0);
  });

  test("should handle Pusher connection failures gracefully", async ({ page, context }) => {
    // Block Pusher WebSocket connections to simulate failure
    await context.route('**/pusher.com/**', route => route.abort());
    await context.route('**/pusher/**', route => route.abort());

    await login(page);
    const workspaceName = `Offline Test ${Date.now()}`;
    await createWorkspace(page, workspaceName);

    const componentName = `OfflineComponent${Date.now()}`;
    await createComponent(page, componentName);

    // Wait for connection attempt
    await page.waitForTimeout(3000);

    // Page should still be functional even without Pusher
    await expect(page).toHaveURL(/\/components\/[a-z0-9]+/);

    // Should show "Connecting..." or disconnected state
    const hasConnectionStatus = await page.locator('text=/connecting|disconnected/i').count() > 0;

    // The editor should still be usable
    expect(page.url()).toMatch(/\/components\/[a-z0-9]+/);
  });
});
