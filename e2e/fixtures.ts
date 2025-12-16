import { test as base, expect, Page } from '@playwright/test';

/**
 * Custom Test Fixtures
 *
 * Extends Playwright's base test with custom fixtures for MFO testing.
 */

// Page Object Models
export class DashboardPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  async getStatsCard(title: string) {
    return this.page.locator(`[data-testid="stats-card-${title}"]`);
  }

  async getRecentActivity() {
    return this.page.locator('[data-testid="recent-activity"]');
  }

  async navigateTo(section: string) {
    await this.page.getByRole('link', { name: new RegExp(section, 'i') }).click();
  }
}

export class IncidentsPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto('/dashboard/incidents');
  }

  async createIncident(data: {
    type: string;
    severity: string;
    description: string;
    location: string;
  }) {
    await this.page.getByRole('button', { name: /new incident/i }).click();

    await this.page.getByLabel(/incident type/i).selectOption(data.type);
    await this.page.getByLabel(/severity/i).selectOption(data.severity);
    await this.page.getByLabel(/description/i).fill(data.description);
    await this.page.getByLabel(/location/i).fill(data.location);

    await this.page.getByRole('button', { name: /submit/i }).click();
  }

  async getIncidentList() {
    return this.page.locator('[data-testid="incident-list"]');
  }

  async filterBySeverity(severity: string) {
    await this.page.getByLabel(/severity filter/i).selectOption(severity);
  }
}

export class IceDepthPage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto('/dashboard/ice-depth');
  }

  async getReadingsTable() {
    return this.page.locator('[data-testid="readings-table"]');
  }

  async createReading() {
    await this.page.getByRole('button', { name: /new reading/i }).click();
  }
}

// Extended test with fixtures
export const test = base.extend<{
  dashboardPage: DashboardPage;
  incidentsPage: IncidentsPage;
  iceDepthPage: IceDepthPage;
}>({
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  incidentsPage: async ({ page }, use) => {
    await use(new IncidentsPage(page));
  },
  iceDepthPage: async ({ page }, use) => {
    await use(new IceDepthPage(page));
  },
});

// Re-export expect
export { expect };

// Test data factory
export const testData = {
  incident: {
    type: 'INJURY',
    severity: 'MODERATE',
    description: 'Test incident description for E2E testing',
    location: 'Main Rink - Section A',
  },
  iceDepthReading: {
    rinkId: 'test-rink',
    points: [
      { x: 0, y: 0, depth: 1.2 },
      { x: 100, y: 0, depth: 1.3 },
      { x: 50, y: 50, depth: 1.25 },
    ],
  },
};

// Accessibility testing helpers
export async function checkAccessibility(page: Page) {
  // Check for basic accessibility issues
  const accessibilityIssues = await page.evaluate(() => {
    const issues: string[] = [];

    // Check for images without alt text
    document.querySelectorAll('img:not([alt])').forEach((img) => {
      issues.push(`Image missing alt text: ${img.outerHTML.slice(0, 100)}`);
    });

    // Check for buttons without accessible names
    document.querySelectorAll('button').forEach((button) => {
      if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
        issues.push(`Button missing accessible name: ${button.outerHTML.slice(0, 100)}`);
      }
    });

    // Check for form inputs without labels
    document.querySelectorAll('input, select, textarea').forEach((input) => {
      const id = input.id;
      if (id && !document.querySelector(`label[for="${id}"]`) && !input.getAttribute('aria-label')) {
        issues.push(`Input missing label: ${input.outerHTML.slice(0, 100)}`);
      }
    });

    return issues;
  });

  return accessibilityIssues;
}
