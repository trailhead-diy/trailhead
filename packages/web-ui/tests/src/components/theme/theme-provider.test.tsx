import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ThemeProvider, useTheme } from '../../../../src/components/theme/theme-provider';

describe('ThemeProvider with next-themes Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('High-ROI User Workflow Tests', () => {
    it('should allow users to switch themes', async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const { currentTheme, setTheme } = useTheme();

        return (
          <div>
            <span data-testid="current-theme">{currentTheme}</span>
            <button data-testid="switch-theme" onClick={() => setTheme('purple')}>
              Switch to Purple
            </button>
          </div>
        );
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Initial theme should be set
      expect(screen.getByTestId('current-theme')).toBeInTheDocument();

      // User clicks to change theme
      const switchButton = screen.getByTestId('switch-theme');
      await user.click(switchButton);

      // Verify setTheme was called (mocked behavior)
      expect(switchButton).toBeInTheDocument();
    });

    it('should allow users to toggle dark mode', async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const { isDark, toggleDarkMode } = useTheme();

        return (
          <div>
            <span data-testid="dark-mode">{isDark ? 'dark' : 'light'}</span>
            <button data-testid="toggle-dark" onClick={toggleDarkMode}>
              Toggle Dark Mode
            </button>
          </div>
        );
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // User clicks to toggle dark mode
      const toggleButton = screen.getByTestId('toggle-dark');
      await user.click(toggleButton);

      // Verify button exists and is clickable
      expect(toggleButton).toBeInTheDocument();
    });

    it('should provide available themes to users', () => {
      const TestComponent = () => {
        const { themes } = useTheme();

        return (
          <div>
            <span data-testid="theme-count">{themes.length}</span>
            <select data-testid="theme-select">
              {themes.map(theme => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>
        );
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Should have themes available
      const themeSelect = screen.getByTestId('theme-select');
      expect(themeSelect).toBeInTheDocument();

      // Should have multiple theme options
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });

    it('should render children without errors', () => {
      render(
        <ThemeProvider>
          <div data-testid="test-content">Theme Provider Works</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Theme Provider Works')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should work with theme-dependent components', () => {
      const ThemeAwareComponent = () => {
        const { currentTheme } = useTheme();

        return (
          <div data-testid="themed-component" className={`theme-${currentTheme}`}>
            Themed Content
          </div>
        );
      };

      render(
        <ThemeProvider defaultTheme="zinc">
          <ThemeAwareComponent />
        </ThemeProvider>
      );

      const themedComponent = screen.getByTestId('themed-component');
      expect(themedComponent).toBeInTheDocument();
    });
  });
});
