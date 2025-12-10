import { test, expect, testData, checkAccessibility } from './fixtures';

test.describe('Incidents Module', () => {
  test.beforeEach(async ({ incidentsPage }) => {
    await incidentsPage.goto();
  });

  test('should display incidents list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /incidents/i })).toBeVisible();

    // Check for list or empty state
    const list = page.locator('[data-testid="incident-list"], [data-testid="empty-state"]');
    await expect(list).toBeVisible();
  });

  test('should open new incident form', async ({ page }) => {
    const newButton = page.getByRole('button', { name: /new incident|report incident/i });

    if (await newButton.isVisible()) {
      await newButton.click();

      // Check for form fields
      await expect(page.getByLabel(/type|category/i)).toBeVisible();
    }
  });

  test('should filter incidents by severity', async ({ page, incidentsPage }) => {
    const severityFilter = page.getByLabel(/severity/i);

    if (await severityFilter.isVisible()) {
      await severityFilter.selectOption('SERIOUS');

      // Wait for filter to apply
      await page.waitForLoadState('networkidle');

      // Verify URL contains filter param
      expect(page.url()).toContain('severity');
    }
  });

  test('should search incidents', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('test incident');
      await page.keyboard.press('Enter');

      // Wait for search results
      await page.waitForLoadState('networkidle');
    }
  });

  test('should be accessible', async ({ page }) => {
    const issues = await checkAccessibility(page);
    expect(issues).toHaveLength(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through page elements
    await page.keyboard.press('Tab');

    // Should focus on first interactive element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Continue tabbing
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // Focus should still be on an interactive element
    const currentFocus = page.locator(':focus');
    await expect(currentFocus).toBeVisible();
  });
});
