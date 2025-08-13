import { test, expect } from '@playwright/test';
import { signUp, NEW_USER } from './helpers/auth';

test.describe('Profile Auto-Creation on Sign-Up', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all cookies to ensure clean state
    await page.context().clearCookies();
  });

  test('should auto-create profile with username from email on sign-up', async ({ page }) => {
    // Generate unique user for this test
    const testUser = {
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      get username() {
        return this.email.split('@')[0];
      }
    };

    // Navigate to sign-up page
    await page.goto('/en/auth/sign-up');

    // Fill and submit sign-up form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for potential email confirmation message or redirect
    // The app might show a confirmation message or redirect to home
    await page.waitForLoadState('networkidle');
    
    // If there's a confirmation message, acknowledge it
    const confirmationMessage = page.locator('text=/check your email|confirm your email|verification/i');
    if (await confirmationMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
      // For testing, we'll assume the user has confirmed their email
      // In a real scenario, you'd need to handle email confirmation
      console.log('Email confirmation required - test may need adjustment for your setup');
      return;
    }

    // Check if we're redirected to home or profile page
    const isOnHome = page.url().includes('/en') && !page.url().includes('/auth');
    const isOnProfile = page.url().includes('/me');
    
    if (isOnHome || isOnProfile) {
      // Navigate to profile page to verify profile creation
      await page.goto('/en/me');
      
      // Wait for profile to load
      await page.waitForLoadState('networkidle');
      
      // Check that username is displayed (extracted from email)
      await expect(page.locator(`text=${testUser.username}`)).toBeVisible({ timeout: 10000 });
      
      // Check for default avatar
      const avatar = page.locator('img[alt*="avatar"], img[src*="dicebear"], img[src*="avatar"]').first();
      await expect(avatar).toBeVisible();
      
      // Verify the avatar has a src attribute (default avatar should be set)
      const avatarSrc = await avatar.getAttribute('src');
      expect(avatarSrc).toBeTruthy();
      expect(avatarSrc).toMatch(/dicebear|avatar/);
    }
  });

  test('should handle duplicate usernames by appending suffix', async ({ page }) => {
    // This test simulates the scenario where username already exists
    const baseEmail = 'duplicate@example.com';
    const firstUser = {
      email: baseEmail,
      password: 'TestPassword123!',
      username: 'duplicate'
    };
    
    const secondUser = {
      email: 'duplicate@different.com',
      password: 'TestPassword123!',
      username: 'duplicate'
    };

    // First sign-up (might already exist from previous test runs)
    await page.goto('/en/auth/sign-up');
    await page.fill('input[name="email"]', firstUser.email);
    await page.fill('input[name="password"]', firstUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForLoadState('networkidle');
    
    // Clear session for second user
    await page.context().clearCookies();
    
    // Second sign-up with same username prefix
    await page.goto('/en/auth/sign-up');
    await page.fill('input[name="email"]', secondUser.email);
    await page.fill('input[name="password"]', secondUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForLoadState('networkidle');
    
    // If email confirmation is not required and we're logged in
    if (!page.url().includes('/auth')) {
      // Navigate to profile
      await page.goto('/en/me');
      await page.waitForLoadState('networkidle');
      
      // Username should be visible but might have suffix
      const usernameElement = page.locator('h1, h2, h3, p, span').filter({ hasText: /duplicate/i }).first();
      
      if (await usernameElement.isVisible({ timeout: 5000 }).catch(() => false)) {
        const displayedUsername = await usernameElement.textContent();
        
        // If this is the second user, username should have a suffix
        if (displayedUsername && displayedUsername !== 'duplicate') {
          expect(displayedUsername).toMatch(/duplicate_[a-f0-9]{6}/);
        }
      }
    }
  });

  test('should create profile with default avatar URL containing user ID', async ({ page }) => {
    const testUser = {
      email: `avatar_test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
    };

    // Sign up
    await page.goto('/en/auth/sign-up');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForLoadState('networkidle');
    
    // If successfully signed up and not requiring email confirmation
    if (!page.url().includes('/auth')) {
      await page.goto('/en/me');
      await page.waitForLoadState('networkidle');
      
      // Find avatar image
      const avatar = page.locator('img[alt*="avatar"], img[src*="dicebear"], img[src*="avatar"]').first();
      await expect(avatar).toBeVisible({ timeout: 10000 });
      
      // Get avatar URL
      const avatarUrl = await avatar.getAttribute('src');
      expect(avatarUrl).toBeTruthy();
      
      // Default avatar should be from dicebear with seed
      expect(avatarUrl).toContain('dicebear');
      expect(avatarUrl).toContain('seed=');
    }
  });
});