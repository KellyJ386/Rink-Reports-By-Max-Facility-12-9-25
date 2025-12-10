import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

/**
 * Authentication Setup
 *
 * This setup runs before all tests to authenticate the user.
 * The auth state is saved and reused across all tests.
 */
setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/auth/signin');

  // Check if already logged in (session exists)
  const isLoggedIn = await page.evaluate(() => {
    return document.cookie.includes('next-auth.session-token');
  });

  if (!isLoggedIn) {
    // For testing, we'll use test credentials
    // In a real scenario, you'd have test user credentials
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

    // Fill in login form
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Submit the form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation to dashboard
    await page.waitForURL(/dashboard/, { timeout: 10000 });
  }

  // Verify we're logged in
  await expect(page).toHaveURL(/dashboard/);

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
