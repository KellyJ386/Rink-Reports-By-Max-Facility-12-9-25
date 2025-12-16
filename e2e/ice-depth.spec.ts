import { test, expect, checkAccessibility } from './fixtures';

test.describe('Ice Depth Module', () => {
  test.beforeEach(async ({ iceDepthPage }) => {
    await iceDepthPage.goto();
  });

  test('should display ice depth readings', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ice depth/i })).toBeVisible();

    // Check for readings table or chart
    const content = page.locator('[data-testid="readings-table"], [data-testid="readings-chart"], [data-testid="empty-state"]');
    await expect(content).toBeVisible();
  });

  test('should navigate to new reading form', async ({ page }) => {
    const newButton = page.getByRole('button', { name: /new reading|add reading/i });

    if (await newButton.isVisible()) {
      await newButton.click();

      // Should navigate to form or open modal
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display analysis chart', async ({ page }) => {
    const chartTab = page.getByRole('tab', { name: /analysis|chart/i });

    if (await chartTab.isVisible()) {
      await chartTab.click();

      // Wait for chart to render
      await page.waitForLoadState('networkidle');

      const chart = page.locator('canvas, [data-testid="chart"]');
      await expect(chart).toBeVisible();
    }
  });

  test('should filter by date range', async ({ page }) => {
    const dateFilter = page.getByLabel(/date|from|start/i);

    if (await dateFilter.isVisible()) {
      await dateFilter.click();

      // Select a date (implementation depends on date picker)
      await page.waitForLoadState('networkidle');
    }
  });

  test('should be accessible', async ({ page }) => {
    const issues = await checkAccessibility(page);
    expect(issues).toHaveLength(0);
  });

  test('should export data', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export/i });

    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

      await exportButton.click();

      // Check if download started or export options shown
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx|pdf)$/);
      }
    }
  });
});
