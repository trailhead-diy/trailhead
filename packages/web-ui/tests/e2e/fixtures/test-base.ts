import { test as base, expect } from '@playwright/test';

/**
 * Custom test fixture
 *
 * Provides:
 * - Shared test context
 * - Common utilities
 * - Type-safe extensions
 */

// Define custom fixtures interface
export interface TestFixtures {
  // Add custom fixtures here as needed
  testId: (id: string) => string;
  isMobile: boolean;
}

// Extend base test with custom fixtures
export const test = base.extend<TestFixtures>({
  // Test ID helper for consistent data-testid selectors
  testId: async (_, use) => {
    await use((id: string) => `[data-testid="${id}"]`);
  },

  // Mobile detection fixture - use project name from testInfo
  isMobile: [
    async (_, use, testInfo) => {
      const isMobile = testInfo.project.name?.includes('mobile') || false;
      await use(isMobile);
    },
    { scope: 'test' },
  ],
});

// Re-export expect for convenience
export { expect };

// Common test utilities
export const testUtils = {
  /**
   * Wait for theme to be applied
   * Themes may have transition effects, so we wait for stability
   */
  async waitForThemeChange(page: typeof base.prototype.page) {
    // Wait for any CSS transitions to complete
    await page.waitForTimeout(300);

    // Wait for the document to be in a stable state
    await page.waitForLoadState('domcontentloaded');
  },

  /**
   * Get current theme from document
   */
  async getCurrentTheme(page: typeof base.prototype.page): Promise<string | null> {
    return await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
  },

  /**
   * Check if element has semantic color class
   */
  hasSemanticColorClass(classes: string): boolean {
    const semanticTokens = [
      'bg-background',
      'text-foreground',
      'border-border',
      'bg-primary',
      'text-primary',
      'bg-secondary',
      'text-secondary',
      'bg-muted',
      'text-muted-foreground',
      'bg-accent',
      'text-accent-foreground',
      'bg-destructive',
      'text-destructive-foreground',
    ];

    return semanticTokens.some(token => classes.includes(token));
  },
};
