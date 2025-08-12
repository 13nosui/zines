import { test, expect } from '@playwright/test';
import { isAuthenticated } from './helpers/auth';

test.describe('Authentication Redirect', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all cookies to ensure unauthenticated state
    await page.context().clearCookies();
  });

  test('should redirect unauthenticated users to sign-in when accessing /create', async ({ page }) => {
    // Try to access protected route
    await page.goto('/en/create');

    // Should be redirected to sign-in page
    await expect(page).toHaveURL(/\/auth\/sign-in/);
    
    // Check that returnTo parameter is set
    const url = new URL(page.url());
    expect(url.searchParams.get('returnTo')).toBe('/en/create');
    
    // Verify sign-in form is visible
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should redirect unauthenticated users to sign-in when accessing /me', async ({ page }) => {
    // Try to access profile page
    await page.goto('/en/me');

    // Should be redirected to sign-in page
    await expect(page).toHaveURL(/\/auth\/sign-in/);
    
    // Check that returnTo parameter is set
    const url = new URL(page.url());
    expect(url.searchParams.get('returnTo')).toBe('/en/me');
  });

  test('should redirect unauthenticated users to sign-in when accessing /me/edit', async ({ page }) => {
    // Try to access profile edit page
    await page.goto('/en/me/edit');

    // Should be redirected to sign-in page
    await expect(page).toHaveURL(/\/auth\/sign-in/);
    
    // Check that returnTo parameter is set
    const url = new URL(page.url());
    expect(url.searchParams.get('returnTo')).toBe('/en/me/edit');
  });

  test('should allow access to public routes without authentication', async ({ page }) => {
    // Access home page
    await page.goto('/en');
    
    // Should not be redirected
    await expect(page).toHaveURL(/^[^\/]*\/en\/?$/);
    
    // Verify user is not authenticated
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(false);
  });

  test('should allow access to auth pages without authentication', async ({ page }) => {
    // Access sign-in page directly
    await page.goto('/en/auth/sign-in');
    
    // Should not be redirected
    await expect(page).toHaveURL(/\/auth\/sign-in/);
    
    // Access sign-up page directly
    await page.goto('/en/auth/sign-up');
    
    // Should not be redirected
    await expect(page).toHaveURL(/\/auth\/sign-up/);
  });

  test('should preserve locale in redirect URLs', async ({ page }) => {
    // Test with Japanese locale
    await page.goto('/ja/create');
    
    // Should be redirected to Japanese sign-in page
    await expect(page).toHaveURL(/\/ja\/auth\/sign-in/);
    
    // Check that returnTo parameter preserves locale
    const url = new URL(page.url());
    expect(url.searchParams.get('returnTo')).toBe('/ja/create');
  });

  test('should handle missing locale by adding default', async ({ page }) => {
    // Try to access protected route without locale
    await page.goto('/create');
    
    // Should be redirected with default locale (en)
    await expect(page).toHaveURL(/\/en\/auth\/sign-in/);
  });
});