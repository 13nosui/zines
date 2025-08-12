import { test, expect } from '@playwright/test';
import { signIn, signOut, isAuthenticated } from './helpers/auth';

test.describe('Sign Out Session Clearing', () => {
  // Create a test user for these tests
  const testUser = {
    email: `signout_test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  test.beforeAll(async ({ browser }) => {
    // Sign up the test user once
    const page = await browser.newPage();
    await page.goto('/en/auth/sign-up');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.close();
  });

  test('should clear session and redirect to home when signing out', async ({ page }) => {
    // Sign in first
    await signIn(page, testUser.email, testUser.password);
    await page.waitForLoadState('networkidle');

    // Verify user is authenticated
    const authBefore = await isAuthenticated(page);
    expect(authBefore).toBe(true);

    // Sign out
    await signOut(page);
    
    // Wait for redirect
    await page.waitForLoadState('networkidle');

    // Should be redirected to home page or sign-in page
    const url = page.url();
    expect(url).toMatch(/\/(en|ja|zh)(\/(auth\/sign-in)?)?$/);

    // Verify user is no longer authenticated
    const authAfter = await isAuthenticated(page);
    expect(authAfter).toBe(false);
  });

  test('should clear cookies and storage on sign out', async ({ page, context }) => {
    // Sign in
    await signIn(page, testUser.email, testUser.password);
    await page.waitForLoadState('networkidle');

    // Get cookies before sign out
    const cookiesBefore = await context.cookies();
    const authCookiesBefore = cookiesBefore.filter(c => 
      c.name.includes('auth') || 
      c.name.includes('supabase') || 
      c.name.includes('session')
    );
    expect(authCookiesBefore.length).toBeGreaterThan(0);

    // Check localStorage for auth data
    const localStorageBefore = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.filter(key => 
        key.includes('auth') || 
        key.includes('supabase') || 
        key.includes('session')
      );
    });

    // Sign out
    await signOut(page);
    await page.waitForLoadState('networkidle');

    // Get cookies after sign out
    const cookiesAfter = await context.cookies();
    const authCookiesAfter = cookiesAfter.filter(c => 
      c.name.includes('auth-token') || 
      c.name.includes('sb-') && c.value !== ''
    );
    
    // Auth cookies should be cleared or empty
    expect(authCookiesAfter.length).toBe(0);

    // Check localStorage is cleared
    const localStorageAfter = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.filter(key => 
        key.includes('auth-token') || 
        (key.includes('supabase') && localStorage.getItem(key) !== '{}')
      );
    });
    expect(localStorageAfter.length).toBe(0);
  });

  test('should require authentication again after sign out', async ({ page }) => {
    // Sign in
    await signIn(page, testUser.email, testUser.password);
    await page.waitForLoadState('networkidle');

    // Navigate to a protected route
    await page.goto('/en/me');
    await expect(page).toHaveURL(/\/me/);

    // Sign out
    await signOut(page);
    await page.waitForLoadState('networkidle');

    // Try to access protected route again
    await page.goto('/en/me');
    
    // Should be redirected to sign-in
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test('should sign out from settings page', async ({ page }) => {
    // Sign in
    await signIn(page, testUser.email, testUser.password);
    await page.waitForLoadState('networkidle');

    // Navigate to settings page
    await page.goto('/en/settings');
    await page.waitForLoadState('networkidle');

    // Find and click sign out button in settings
    const signOutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout")').first();
    await expect(signOutButton).toBeVisible();
    await signOutButton.click();

    // Wait for redirect
    await page.waitForLoadState('networkidle');

    // Should be redirected to sign-in page (as per settings page logic)
    await expect(page).toHaveURL(/\/auth\/sign-in/);

    // Verify user is no longer authenticated
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(false);
  });

  test('should handle sign out errors gracefully', async ({ page }) => {
    // Sign in
    await signIn(page, testUser.email, testUser.password);
    await page.waitForLoadState('networkidle');

    // Intercept sign out request to simulate error
    await page.route('**/auth/v1/logout', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    // Attempt to sign out
    await signOut(page);
    
    // Even with error, should still redirect (AuthProvider handles this)
    await page.waitForLoadState('networkidle');
    
    // User might still be redirected but check for error handling
    // The app should handle errors gracefully without crashing
    const pageContent = await page.content();
    expect(pageContent).not.toContain('Application error');
  });

  test('should maintain locale preference after sign out', async ({ page }) => {
    // Sign in with Japanese locale
    await page.goto('/ja/auth/sign-in');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to Japanese settings page
    await page.goto('/ja/settings');
    await page.waitForLoadState('networkidle');

    // Sign out from Japanese locale
    const signOutButton = page.locator('button:has-text("ログアウト"), button:has-text("Sign out")').first();
    await signOutButton.click();

    // Wait for redirect
    await page.waitForLoadState('networkidle');

    // Should maintain Japanese locale in redirect
    await expect(page).toHaveURL(/\/ja\/auth\/sign-in/);
  });
});