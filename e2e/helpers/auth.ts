import { Page } from '@playwright/test';

export const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  username: 'test',
};

export const NEW_USER = {
  email: `testuser_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  get username() {
    return this.email.split('@')[0];
  }
};

export async function signUp(page: Page, email: string, password: string) {
  // Navigate to sign-up page with default locale
  await page.goto('/en/auth/sign-up');
  
  // Fill in the form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit the form
  await page.click('button[type="submit"]');
}

export async function signIn(page: Page, email: string, password: string) {
  // Navigate to sign-in page with default locale
  await page.goto('/en/auth/sign-in');
  
  // Fill in the form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit the form
  await page.click('button[type="submit"]');
}

export async function signOut(page: Page) {
  // Look for the user menu/avatar button
  const userMenuButton = page.locator('[data-testid="user-menu-button"], button:has(img[alt*="avatar"]), button:has-text("Sign out")').first();
  
  // Check if user menu exists
  if (await userMenuButton.isVisible()) {
    await userMenuButton.click();
    
    // Look for sign out button in dropdown
    const signOutButton = page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();
    await signOutButton.click();
  } else {
    // Direct sign out if no menu
    const signOutButton = page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
    }
  }
}

export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check for authentication by looking for user-specific elements
  const userIndicators = [
    '[data-testid="user-menu-button"]',
    'button:has(img[alt*="avatar"])',
    'a[href*="/me"]',
    'a[href*="/create"]'
  ];
  
  for (const selector of userIndicators) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
      return true;
    }
  }
  
  return false;
}

export async function waitForAuthRedirect(page: Page, expectedPath: string, timeout = 10000) {
  await page.waitForURL(url => {
    const pathname = new URL(url).pathname;
    return pathname.includes(expectedPath);
  }, { timeout });
}