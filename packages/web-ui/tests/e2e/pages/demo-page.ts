import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for Demo Application
 *
 * - Single responsibility: handles demo page interactions
 * - Type safety: fully typed methods and properties
 * - DRY: reusable locators and actions
 */
export class DemoPage {
  readonly page: Page;

  // Theme Switcher elements
  readonly themeSwitcher: Locator;
  readonly themeSwitcherButton: Locator;
  readonly themeOptions: Locator;

  // Navigation elements
  readonly navbar: Locator;
  readonly sidebar: Locator;

  // Common UI elements
  readonly buttons: Locator;
  readonly links: Locator;
  readonly cards: Locator;

  constructor(page: Page) {
    this.page = page;

    // Theme Switcher - using actual HTML selectors
    this.themeSwitcher = page.locator('select').first();
    this.themeSwitcherButton = page.locator('select').first();
    this.themeOptions = page.locator('option');

    // Navigation
    this.navbar = page.locator('nav').first();
    this.sidebar = page.locator('aside, [role="complementary"]').first();

    // Common elements
    this.buttons = page.getByRole('button');
    this.links = page.getByRole('link');
    this.cards = page.locator('[class*="card"], [data-testid*="card"]');
  }

  /**
   * Navigate to the demo page
   */
  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get current theme from the document
   */
  async getCurrentTheme(): Promise<string | null> {
    return await this.page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
  }

  /**
   * Get theme from local storage (for persistence testing)
   */
  async getStoredTheme(): Promise<string | null> {
    return await this.page.evaluate(() => {
      return localStorage.getItem('theme');
    });
  }

  /**
   * Switch to a specific theme
   */
  async switchTheme(themeName: string) {
    // First try to find the theme switcher button
    const switcher = await this.page.$(
      '[role="combobox"][aria-label*="theme" i], button:has-text("Theme"), button[aria-label*="theme" i]'
    );

    if (switcher) {
      // Click the theme switcher
      await switcher.click();

      // Wait for options to be visible
      await this.page.waitForSelector('[role="option"], [role="listbox"] button', {
        state: 'visible',
      });

      // Click the theme option
      await this.page.click(
        `[role="option"]:has-text("${themeName}"), [role="listbox"] button:has-text("${themeName}")`
      );
    } else {
      // Fallback: try direct select if it's a select element
      const select = await this.page.$('select[name*="theme" i], select[aria-label*="theme" i]');
      if (select) {
        await select.selectOption({ label: themeName });
      } else {
        throw new Error('Could not find theme switcher on the page');
      }
    }

    // Wait for theme to be applied
    await this.waitForThemeChange();
  }

  /**
   * Wait for theme changes to complete
   */
  async waitForThemeChange() {
    // Wait for CSS transitions
    await this.page.waitForTimeout(300);

    // Wait for any theme-related animations
    await this.page.waitForFunction(() => {
      const animations = document.getAnimations();
      return animations.length === 0;
    });
  }

  /**
   * Verify theme is applied to components
   */
  async verifyThemeApplied(expectedTheme: string) {
    // Check document has theme attribute
    const theme = await this.getCurrentTheme();
    expect(theme).toBe(expectedTheme);

    // Verify CSS custom properties are loaded
    const hasThemeVars = await this.page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return styles.getPropertyValue('--background') !== '';
    });
    expect(hasThemeVars).toBe(true);
  }

  /**
   * Check accessibility of theme
   */
  async checkThemeAccessibility() {
    // Check color contrast for primary elements
    const hasGoodContrast = await this.page.evaluate(() => {
      const getContrast = (rgb1: number[], rgb2: number[]) => {
        const getLuminance = (rgb: number[]) => {
          const [r, g, b] = rgb.map(val => {
            val = val / 255;
            return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const lum1 = getLuminance(rgb1);
        const lum2 = getLuminance(rgb2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);

        return (brightest + 0.05) / (darkest + 0.05);
      };

      // Get background and foreground colors
      const styles = getComputedStyle(document.body);
      const bgColor = styles.backgroundColor;
      const fgColor = styles.color;

      // Parse RGB values (simplified - in real app use a proper parser)
      const parseRGB = (color: string) => {
        const match = color.match(/\d+/g);
        return match ? match.slice(0, 3).map(Number) : [255, 255, 255];
      };

      const bgRGB = parseRGB(bgColor);
      const fgRGB = parseRGB(fgColor);

      const contrast = getContrast(bgRGB, fgRGB);

      // WCAG AA requires 4.5:1 for normal text
      return contrast >= 4.5;
    });

    expect(hasGoodContrast).toBe(true);
  }

  /**
   * Test keyboard navigation for theme switcher
   */
  async testKeyboardNavigation() {
    // Focus on theme switcher
    await this.themeSwitcherButton.focus();

    // Open with Enter key
    await this.page.keyboard.press('Enter');

    // Navigate with arrow keys
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('ArrowDown');

    // Select with Enter
    await this.page.keyboard.press('Enter');

    // Verify focus returns to button
    const hasFocus = await this.themeSwitcherButton.evaluate(el => el === document.activeElement);
    expect(hasFocus).toBe(true);
  }
}
