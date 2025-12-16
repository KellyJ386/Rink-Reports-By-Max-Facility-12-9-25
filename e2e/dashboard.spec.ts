import { test, expect, checkAccessibility } from './fixtures';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  test('should display dashboard with stats cards', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Dashboard|MFO/);

    // Check for main dashboard sections
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Check for navigation
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should navigate to incidents page', async ({ page, dashboardPage }) => {
    await dashboardPage.navigateTo('Incidents');
    await expect(page).toHaveURL(/incidents/);
  });

  test('should navigate to ice depth page', async ({ page, dashboardPage }) => {
    await dashboardPage.navigateTo('Ice Depth');
    await expect(page).toHaveURL(/ice-depth/);
  });

  test('should navigate to schedule page', async ({ page, dashboardPage }) => {
    await dashboardPage.navigateTo('Schedule');
    await expect(page).toHaveURL(/schedule/);
  });

  test('should be accessible', async ({ page }) => {
    const issues = await checkAccessibility(page);
    expect(issues).toHaveLength(0);
  });

  test('should be responsive', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByRole('navigation')).toBeVisible();

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('navigation')).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    // Mobile nav might be in a hamburger menu
    const nav = page.getByRole('navigation');
    const menuButton = page.getByRole('button', { name: /menu/i });

    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(nav).toBeVisible();
    }
  });
});
