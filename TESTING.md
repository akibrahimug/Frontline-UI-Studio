# Testing Guide

This document covers all testing strategies for Refinery UI.

## Unit Testing with Vitest

### Running Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Writing Unit Tests

Unit tests are located next to the files they test in `__tests__` directories:

- `packages/ui/src/__tests__/` - UI component tests
- `apps/studio/src/lib/__tests__/` - Core logic tests

Example unit test:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "../button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

### Configuration

- `vitest.config.ts` - Vitest configuration
- `vitest.setup.ts` - Test setup (imports jest-dom matchers)

## E2E Testing with Playwright

### Running E2E Tests

```bash
# Run E2E tests (headless)
cd apps/studio && pnpm test:e2e

# Run E2E tests with UI
cd apps/studio && pnpm test:e2e:ui

# Run E2E tests in debug mode
cd apps/studio && pnpm test:e2e:debug

# View test report
cd apps/studio && pnpm test:e2e:report
```

### Writing E2E Tests

E2E tests are located in `apps/studio/e2e/`:

- `workspace.spec.ts` - Workspace management tests
- `component.spec.ts` - Component CRUD and refactoring tests

Example E2E test:

```typescript
import { test, expect } from "@playwright/test";

test("should create a new workspace", async ({ page }) => {
  await page.goto("/workspaces");
  await page.getByRole("button", { name: /create workspace/i }).click();
  await page.getByLabel(/name/i).fill("Test Workspace");
  await page.getByRole("button", { name: /save/i }).click();
  await expect(page.getByText("Test Workspace")).toBeVisible();
});
```

### Configuration

- `playwright.config.ts` - Playwright configuration
- `e2e/auth.setup.ts` - Authentication setup for tests

### Installed Browsers

Currently installed: **Chromium only** (to save disk space and CI time)

To install additional browsers:

```bash
# Firefox
pnpm exec playwright install firefox

# WebKit (Safari)
pnpm exec playwright install webkit

# All browsers
pnpm exec playwright install
```

## Error Tracking with Sentry

### Setup

1. Create a free account at [sentry.io](https://sentry.io)
2. Create a new Next.js project
3. Copy your DSN and add to `.env.local`:

```env
NEXT_PUBLIC_SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project-id"
SENTRY_ORG="your-org-name"
SENTRY_PROJECT="your-project-name"
SENTRY_AUTH_TOKEN="your-auth-token"  # For source maps in CI
```

### Features Enabled

- **Error tracking**: All unhandled errors are automatically captured
- **Performance monitoring**: Transaction tracking with 100% sample rate (adjust in production)
- **Session Replay**: 10% of sessions + 100% of error sessions
- **Source maps**: Uploaded automatically during build (requires auth token)
- **Tunnel route**: `/monitoring` - helps bypass ad-blockers

### Testing Sentry

To test error tracking, add a test button to your app:

```typescript
<button onClick={() => { throw new Error("Test Sentry error!") }}>
  Test Sentry
</button>
```

### Configuration Files

- `sentry.client.config.ts` - Client-side Sentry config
- `sentry.server.config.ts` - Server-side Sentry config
- `sentry.edge.config.ts` - Edge runtime Sentry config
- `instrumentation.ts` - Next.js instrumentation for Sentry

## CI/CD Pipeline

### GitHub Actions Workflows

#### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and PR:

1. **Lint & Type Check**: ESLint + TypeScript compilation
2. **Unit Tests**: Vitest with coverage reporting
3. **E2E Tests**: Playwright tests (Chromium only)
4. **Build**: Full production build

#### Deploy Workflow (`.github/workflows/deploy.yml`)

Runs on push to `master`/`main`:

1. **Sentry Release**: Creates release and uploads source maps
2. **Notify**: Deployment notification

### Required GitHub Secrets

Add these in your repository settings (`Settings` > `Secrets and variables` > `Actions`):

```
TEST_DATABASE_URL         # Test database connection string
TEST_DIRECT_URL          # Test database direct connection
AUTH_SECRET              # NextAuth secret
GROQ_API_KEY            # Groq API key for LLM tests
SENTRY_AUTH_TOKEN       # Sentry auth token for source maps
SENTRY_ORG              # Sentry organization name
SENTRY_PROJECT          # Sentry project name
CODECOV_TOKEN           # (Optional) Codecov token for coverage
```

### Local CI Simulation

To run CI checks locally before pushing:

```bash
# Lint
pnpm lint

# Unit tests
pnpm test

# E2E tests
cd apps/studio && pnpm test:e2e

# Build
pnpm build
```

## Test Coverage

Coverage reports are generated in:

- `coverage/` - Unit test coverage (Vitest)
- `apps/studio/playwright-report/` - E2E test reports

### Viewing Coverage

```bash
# Generate and view unit test coverage
pnpm test:coverage
open coverage/index.html

# View Playwright report
cd apps/studio
pnpm test:e2e:report
```

## Best Practices

### Unit Tests

- Test one thing per test
- Use descriptive test names
- Prefer `getByRole` over `getByTestId`
- Mock external dependencies
- Keep tests fast (<100ms each)

### E2E Tests

- Test critical user flows only
- Use data-testid for complex queries
- Clean up test data
- Make tests independent (no shared state)
- Use Page Object Model for complex pages

### CI/CD

- Keep CI runs under 10 minutes
- Use caching for dependencies
- Run E2E tests only on critical paths
- Monitor CI costs (Chromium only saves ~60% time)

## Troubleshooting

### Unit Tests Failing

```bash
# Clear cache
rm -rf node_modules/.vite

# Reinstall dependencies
pnpm install

# Run specific test
pnpm test button.test
```

### E2E Tests Failing

```bash
# Update Playwright
pnpm up @playwright/test

# Clear browser cache
pnpm exec playwright install --force

# Run in debug mode
pnpm test:e2e:debug
```

### Sentry Not Capturing Errors

1. Check DSN is set: `echo $NEXT_PUBLIC_SENTRY_DSN`
2. Verify dev mode: Sentry only works in production by default
3. Check browser console for Sentry initialization
4. Test with: `Sentry.captureException(new Error("Test"))`

## Additional Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
