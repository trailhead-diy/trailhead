import { test, expect, testUtils } from '../fixtures/test-base';
import { DemoPage } from '../pages/demo-page';

/**
 * Theme Switcher Integration Tests
 *
 * High-ROI tests:
 * - Business Logic: Theme switching and persistence
 * - User Interaction: Click and keyboard navigation
 * - Accessibility: Keyboard support and color contrast
 * - Integration: Theme applied across all components
 */

test.describe('Theme Switcher', () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page);
    await demoPage.goto('/');
  });

  test('should switch themes via UI interaction', async ({ page: _page }) => {
    // Arrange: Get initial theme
    const initialTheme = await demoPage.getCurrentTheme();
    expect(initialTheme).toBeTruthy();

    // Act: Switch to a different theme
    const targetTheme = initialTheme === 'blue' ? 'green' : 'blue';

    await demoPage.switchTheme(targetTheme);

    // Assert: Theme is changed
    const newTheme = await demoPage.getCurrentTheme();
    expect(newTheme).toBe(targetTheme);

    // Verify theme is applied to components
    await demoPage.verifyThemeApplied(targetTheme);
  });

  test('should persist theme selection across page reloads', async ({ page }) => {
    // Arrange: Set a specific theme
    await demoPage.switchTheme('green');

    // Act: Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: Theme persists
    const themeAfterReload = await demoPage.getCurrentTheme();
    expect(themeAfterReload).toBe('green');

    // Verify stored in localStorage
    const storedTheme = await demoPage.getStoredTheme();
    expect(storedTheme).toBe('green');
  });

  test('should support keyboard navigation', async ({ page: _page }) => {
    // This test verifies accessibility requirements
    await demoPage.testKeyboardNavigation();
  });

  test('should apply semantic color tokens to components', async ({ page }) => {
    // Switch to a vibrant theme to test color application
    await demoPage.switchTheme('rose');

    // Check that buttons use semantic tokens
    const buttonClasses = await page.locator('button').first().getAttribute('class');
    expect(testUtils.hasSemanticColorClass(buttonClasses || '')).toBe(true);

    // Check that cards/panels use semantic tokens
    const cardElement = await page.locator('[class*="rounded"], [class*="shadow"]').first();
    if ((await cardElement.count()) > 0) {
      const cardClasses = await cardElement.getAttribute('class');
      expect(testUtils.hasSemanticColorClass(cardClasses || '')).toBe(true);
    }
  });

  test('should maintain accessible color contrast', async ({ page: _page }) => {
    // Test multiple themes for accessibility

    const themesToTest = ['red', 'blue', 'green'];

    for (const theme of themesToTest) {
      await demoPage.switchTheme(theme);
      await demoPage.checkThemeAccessibility();
    }
  });

  test('should handle rapid theme switching', async ({ page }) => {
    // Stress test: Switch themes rapidly

    const themes = ['red', 'blue', 'green', 'orange', 'violet'];

    for (let i = 0; i < 3; i++) {
      for (const theme of themes) {
        await demoPage.switchTheme(theme);

        // Verify theme applied correctly
        const currentTheme = await demoPage.getCurrentTheme();
        expect(currentTheme).toBe(theme);
      }
    }

    // Final verification - page should still be functional
    await expect(page).toHaveTitle(/Catalyst|Demo|Trailhead/i);
  });

  test('should work on mobile viewports', async ({ page: _page, isMobile }) => {
    // Skip if not mobile test
    if (!isMobile) {
      test.skip();
      return;
    }

    // Mobile-specific theme switching test
    await demoPage.switchTheme('violet');

    const theme = await demoPage.getCurrentTheme();
    expect(theme).toBe('violet');
  });
});

test.describe('Theme System Integration', () => {
  let demoPage: DemoPage;

  test.beforeEach(async ({ page }) => {
    demoPage = new DemoPage(page);
  });

  test('should load theme CSS variables', async ({ page }) => {
    await demoPage.goto('/');

    // Verify CSS custom properties are defined
    const hasThemeVariables = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);

      const requiredVars = [
        '--background',
        '--foreground',
        '--primary',
        '--primary-foreground',
        '--secondary',
        '--secondary-foreground',
        '--muted',
        '--muted-foreground',
        '--accent',
        '--accent-foreground',
        '--destructive',
        '--destructive-foreground',
        '--border',
        '--input',
        '--ring',
      ];

      return requiredVars.every(varName => {
        const value = styles.getPropertyValue(varName);
        return value && value.trim() !== '';
      });
    });

    expect(hasThemeVariables).toBe(true);
  });

  test('should handle missing theme gracefully', async ({ page }) => {
    await demoPage.goto('/');

    // Try to set an invalid theme via JavaScript
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'non-existent-theme');
    });

    // Page should still be functional
    await expect(page).not.toHaveTitle(/error/i);

    // Should fall back to a valid theme
    const theme = await demoPage.getCurrentTheme();
    expect(theme).toBeTruthy();
  });
});
