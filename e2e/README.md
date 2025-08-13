# E2E Tests

This directory contains end-to-end tests for the authentication flows using Playwright.

## Test Coverage

### 1. Authentication Redirect (`auth-redirect.spec.ts`)
- ✅ Redirects unauthenticated users to sign-in when accessing protected routes (/create, /me)
- ✅ Preserves returnTo parameter for post-login redirect
- ✅ Allows access to public routes without authentication
- ✅ Handles locale in redirect URLs
- ✅ Adds default locale when missing

### 2. Profile Auto-Creation (`profile-auto-create.spec.ts`)
- ✅ Auto-creates user profile on sign-up
- ✅ Extracts username from email prefix
- ✅ Sets default avatar URL (dicebear)
- ✅ Handles duplicate usernames by appending suffix

### 3. Profile Update (`profile-update.spec.ts`)
- ✅ Updates username with validation
- ✅ Validates username constraints (minimum 3 characters)
- ✅ Uploads and updates avatar image
- ✅ Removes avatar and reverts to default
- ✅ Persists profile changes after page reload

### 4. Sign Out Session (`signout-session.spec.ts`)
- ✅ Clears session and redirects on sign out
- ✅ Clears authentication cookies and storage
- ✅ Requires re-authentication after sign out
- ✅ Signs out from settings page
- ✅ Handles sign out errors gracefully
- ✅ Maintains locale preference after sign out

## Prerequisites

1. Make sure the application is running or can be started
2. Ensure Supabase is properly configured with authentication enabled
3. Install Playwright browsers if not already installed:
   ```bash
   npx playwright install
   ```

## Running Tests

### Run all E2E tests:
```bash
npm run test:e2e
```

### Run tests in UI mode (recommended for debugging):
```bash
npm run test:e2e:ui
```

### Run tests with visible browser:
```bash
npm run test:e2e:headed
```

### Run specific test file:
```bash
npx playwright test e2e/auth-redirect.spec.ts
```

### Run tests in specific browser:
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Configuration

Tests are configured in `playwright.config.ts` with:
- Base URL: http://localhost:3000
- Automatic server start (dev server)
- Screenshots on failure
- Trace on first retry
- Parallel execution
- Multiple browser support (Chromium, Firefox, WebKit)

## Writing New Tests

1. Create a new `.spec.ts` file in the `e2e` directory
2. Import test utilities from `./helpers/auth.ts`
3. Use descriptive test names and group related tests with `test.describe`
4. Always clean up test data and clear cookies/storage between tests
5. Use unique email addresses for test users to avoid conflicts

## Debugging Failed Tests

1. Run tests in UI mode to see step-by-step execution
2. Check screenshots in `test-results/` directory
3. View traces for failed tests:
   ```bash
   npx playwright show-trace trace.zip
   ```
4. Use `page.pause()` to debug specific steps

## Notes

- Some tests may require email confirmation to be disabled in Supabase for local testing
- Tests use timestamp-based unique emails to avoid conflicts
- Avatar upload tests use a minimal base64-encoded PNG image
- Tests handle both successful paths and error conditions