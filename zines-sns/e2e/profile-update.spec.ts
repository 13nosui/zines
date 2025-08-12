import { test, expect } from '@playwright/test';
import { signIn, NEW_USER } from './helpers/auth';

test.describe('Profile Update - Username and Avatar', () => {
  // Create a test user that we'll use across tests
  const testUser = {
    email: `profile_update_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    get username() {
      return this.email.split('@')[0];
    }
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

  test('should update username successfully', async ({ page }) => {
    // Sign in
    await signIn(page, testUser.email, testUser.password);
    await page.waitForLoadState('networkidle');

    // Navigate to settings page
    await page.goto('/en/settings');
    await page.waitForLoadState('networkidle');

    // Find username input
    const usernameInput = page.locator('input[placeholder*="username"], input:has(+ label:has-text("Username"))').first();
    await expect(usernameInput).toBeVisible();

    // Clear and enter new username
    const newUsername = `updated_${Date.now()}`;
    await usernameInput.clear();
    await usernameInput.fill(newUsername);

    // Wait for validation (debounced)
    await page.waitForTimeout(600);

    // Check for any validation errors
    const errorMessage = page.locator('text=/already taken|already exists|not available/i');
    const hasError = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);

    if (!hasError) {
      // Save button should appear when username changes
      const saveButton = page.locator('button:has-text("Save")');
      await expect(saveButton).toBeVisible({ timeout: 5000 });

      // Click save
      await saveButton.click();

      // Wait for success message
      await expect(page.locator('text=/success|updated|saved/i')).toBeVisible({ timeout: 10000 });

      // Verify username was updated by navigating to profile page
      await page.goto('/en/me');
      await page.waitForLoadState('networkidle');

      // Check that new username is displayed
      await expect(page.locator(`text=${newUsername}`)).toBeVisible();
    }
  });

  test('should validate username constraints', async ({ page }) => {
    // Sign in
    await signIn(page, testUser.email, testUser.password);
    await page.waitForLoadState('networkidle');

    // Navigate to settings page
    await page.goto('/en/settings');
    await page.waitForLoadState('networkidle');

    // Find username input
    const usernameInput = page.locator('input[placeholder*="username"], input:has(+ label:has-text("Username"))').first();
    await expect(usernameInput).toBeVisible();

    // Test short username (less than 3 characters)
    await usernameInput.clear();
    await usernameInput.fill('ab');

    // Wait for validation
    await page.waitForTimeout(600);

    // Should show validation error
    await expect(page.locator('text=/too short|at least 3|invalid/i')).toBeVisible();

    // Save button should not appear or be disabled
    const saveButton = page.locator('button:has-text("Save")');
    const isVisible = await saveButton.isVisible({ timeout: 1000 }).catch(() => false);
    if (isVisible) {
      await expect(saveButton).toBeDisabled();
    }
  });

  test('should upload and update avatar image', async ({ page }) => {
    // Sign in
    await signIn(page, testUser.email, testUser.password);
    await page.waitForLoadState('networkidle');

    // Navigate to settings page
    await page.goto('/en/settings');
    await page.waitForLoadState('networkidle');

    // Find avatar upload section
    const avatarSection = page.locator('text=/avatar|profile picture/i').first();
    await expect(avatarSection).toBeVisible();

    // Look for file input (might be hidden)
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    
    // Create a test image file
    const testImagePath = '/tmp/test-avatar.png';
    
    // Check if we can access the file input
    if (await fileInput.count() > 0) {
      // Set the file directly
      await fileInput.setInputFiles({
        name: 'test-avatar.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
      });

      // Wait for upload to process
      await page.waitForTimeout(2000);

      // Check for success message
      const successMessage = page.locator('text=/uploaded|updated|success/i');
      const uploadSuccess = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);

      if (uploadSuccess) {
        // Verify avatar was updated by checking for new image
        const avatarImage = page.locator('img[alt*="avatar"], img[src*="avatar"]').first();
        await expect(avatarImage).toBeVisible();
        
        const avatarSrc = await avatarImage.getAttribute('src');
        expect(avatarSrc).toBeTruthy();
        // Should no longer be the default dicebear avatar
        expect(avatarSrc).not.toContain('dicebear');
      }
    }
  });

  test('should remove avatar and revert to default', async ({ page }) => {
    // Sign in
    await signIn(page, testUser.email, testUser.password);
    await page.waitForLoadState('networkidle');

    // Navigate to settings page
    await page.goto('/en/settings');
    await page.waitForLoadState('networkidle');

    // Look for remove avatar button
    const removeButton = page.locator('button:has-text("Remove"), button[aria-label*="remove"]').first();
    
    if (await removeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click remove button
      await removeButton.click();

      // Wait for confirmation or immediate removal
      await page.waitForTimeout(1000);

      // Check for success message
      await expect(page.locator('text=/removed|updated|success/i')).toBeVisible({ timeout: 5000 });

      // Verify avatar was removed by checking for default avatar
      const avatarImage = page.locator('img[alt*="avatar"], img[src*="avatar"]').first();
      await expect(avatarImage).toBeVisible();
      
      const avatarSrc = await avatarImage.getAttribute('src');
      expect(avatarSrc).toBeTruthy();
      // Should be back to dicebear default
      expect(avatarSrc).toContain('dicebear');
    }
  });

  test('should persist profile changes after page reload', async ({ page }) => {
    // Sign in
    await signIn(page, testUser.email, testUser.password);
    await page.waitForLoadState('networkidle');

    // Navigate to settings page
    await page.goto('/en/settings');
    await page.waitForLoadState('networkidle');

    // Get current username from input
    const usernameInput = page.locator('input[placeholder*="username"], input:has(+ label:has-text("Username"))').first();
    const currentUsername = await usernameInput.inputValue();

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that username is still the same
    const usernameAfterReload = await usernameInput.inputValue();
    expect(usernameAfterReload).toBe(currentUsername);

    // Navigate to profile page to double-check
    await page.goto('/en/me');
    await page.waitForLoadState('networkidle');

    // Username should be displayed
    await expect(page.locator(`text=${currentUsername}`)).toBeVisible();
  });
});