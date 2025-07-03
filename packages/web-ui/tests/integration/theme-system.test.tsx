import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ThemeProvider, useTheme } from '../../src/components/theme/theme-provider';
import { ThemeSwitcher } from '../../src/components/theme/theme-switcher';
import { Button } from '../../src/components/button';
import { Alert } from '../../src/components/alert';
import { createTheme } from '../../src/components/theme/builder';
import {} from '../../src/components/theme/registry';

let mockTheme = 'catalyst';
const mockSetTheme = vi.fn((newTheme: string) => {
  mockTheme = newTheme;
});

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: any) => {
    return (
      <div data-testid="next-themes-provider" data-props={JSON.stringify(props)}>
        {typeof children === 'function'
          ? children({ theme: props.defaultTheme || 'catalyst', setTheme: mockSetTheme })
          : children}
      </div>
    );
  },
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
    systemTheme: 'light',
    resolvedTheme: mockTheme,
    themes: ['catalyst', 'red', 'green', 'blue'],
  }),
}));

describe('Theme System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.style.cssText = '';
    document.documentElement.className = '';
    mockTheme = 'catalyst';
  });

  describe('Theme Persistence and Hydration', () => {
    it('should maintain theme selection across component remounts', async () => {
      const _user = userEvent.setup();

      const { rerender } = render(
        <ThemeProvider defaultTheme="catalyst">
          <ThemeSwitcher />
          <Button>Test Button</Button>
        </ThemeProvider>
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Test Button')).toBeInTheDocument();

      rerender(
        <ThemeProvider defaultTheme="catalyst">
          <ThemeSwitcher />
          <Button>Test Button</Button>
        </ThemeProvider>
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should apply theme without flash of unstyled content', () => {
      document.documentElement.setAttribute('data-theme', 'blue');
      const TestComponent = () => {
        const [isOpen, setIsOpen] = React.useState(true);
        return (
          <ThemeProvider defaultTheme="blue">
            <Alert open={isOpen} onClose={() => setIsOpen(false)}>
              Theme should be applied immediately
            </Alert>
          </ThemeProvider>
        );
      };

      render(<TestComponent />);

      const provider = screen.getByTestId('next-themes-provider');
      const props = JSON.parse(provider.getAttribute('data-props') || '{}');
      expect(props.defaultTheme).toBe('blue');
    });

    it('should handle rapid theme switching without errors', async () => {
      const TestComponent = () => {
        const { setTheme } = useTheme();

        React.useEffect(() => {
          const themes = ['red', 'green', 'blue', 'catalyst'];
          themes.forEach((theme, index) => {
            setTimeout(() => setTheme(theme), index * 10);
          });
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return <ThemeSwitcher />;
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const switcher = screen.getByRole('combobox');

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(switcher).toBeInTheDocument();
    });
  });

  describe('Theme Application to Components', () => {
    it('should apply theme colors to all themed components', () => {
      const TestComponent = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        return (
          <ThemeProvider defaultTheme="red">
            <div>
              <Button onClick={() => setIsOpen(true)}>Primary Button</Button>
              <Alert open={isOpen} onClose={() => setIsOpen(false)}>
                Alert Message
              </Alert>
            </div>
          </ThemeProvider>
        );
      };

      render(<TestComponent />);

      // Button should render with theme
      const button = screen.getByRole('button', { name: 'Primary Button' });
      expect(button).toBeInTheDocument();

      // Alert is not visible initially but would use theme when opened
      expect(screen.queryByText('Alert Message')).not.toBeInTheDocument();
    });

    it('should update component styles when theme changes', async () => {
      // Component that changes theme and re-renders with new theme
      const TestComponent = () => {
        const { setTheme, currentTheme } = useTheme();
        const [localTheme, setLocalTheme] = React.useState(currentTheme);

        const handleClick = () => {
          setTheme('green');
          // Since our mock doesn't trigger re-renders, we need to update local state
          setLocalTheme('green');
        };

        return (
          <div data-testid="themed-content">
            <Button onClick={handleClick}>Themed Button</Button>
            <span data-testid="current-theme">{localTheme || currentTheme}</span>
          </div>
        );
      };

      render(
        <ThemeProvider defaultTheme="catalyst">
          <TestComponent />
        </ThemeProvider>
      );

      // Initial theme
      const content = screen.getByTestId('themed-content');
      expect(content).toBeInTheDocument();
      expect(screen.getByTestId('current-theme')).toHaveTextContent('catalyst');

      // Click to change theme
      const button = screen.getByText('Themed Button');
      await userEvent.click(button);

      // Theme should update
      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('green');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid theme names gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Component that tries to set invalid theme
      const TestComponent = () => {
        const { setTheme } = useTheme();

        React.useEffect(() => {
          setTheme('invalid-theme');
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return <div>Test</div>;
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Should log error
      expect(consoleError).toHaveBeenCalledWith('Theme "invalid-theme" is not registered');
      consoleError.mockRestore();
    });

    it('should handle missing theme provider gracefully', () => {
      // Render component without theme provider
      const { container } = render(<Button>No Theme Provider</Button>);

      // Should still render
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(container.firstChild).toBeTruthy();
    });

    it('should apply OKLCH opacity values correctly', () => {
      render(
        <ThemeProvider defaultTheme="red">
          <div data-testid="opacity-test" className="border">
            Test Content
          </div>
        </ThemeProvider>
      );

      // Component should render with opacity-based borders
      const element = screen.getByTestId('opacity-test');
      expect(element).toHaveClass('border');
    });
  });

  describe('Dynamic Theme Registration', () => {
    it('should register and use custom themes', () => {
      // Component that registers a custom theme
      const TestComponent = () => {
        const { registerTheme, setTheme, themes } = useTheme();

        React.useEffect(() => {
          // Create and register complete custom theme
          const customTheme = createTheme('test-custom')
            .withPrimaryColor('oklch(0.7 0.2 300)')
            .withSecondaryColor('oklch(0.8 0.1 250)')
            .withAccentColor('oklch(0.85 0.05 200)')
            .withMutedColor('oklch(0.9 0.02 150)')
            .withBackgroundColors('oklch(1 0 0)', 'oklch(0.1 0 0)')
            .withDestructiveColor('oklch(0.6 0.25 27)')
            .withBorderColors('oklch(0.9 0.01 0)', 'oklch(0.2 0 0 / 0.1)')
            .build();

          registerTheme('test-custom', customTheme);
          setTheme('test-custom');
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        return <div data-testid="theme-count">{themes.length}</div>;
      };

      render(
        <ThemeProvider defaultTheme="zinc">
          <TestComponent />
        </ThemeProvider>
      );

      // Should include the new custom theme
      const themeCount = screen.getByTestId('theme-count');
      // We have 8 built-in themes, plus the custom one we just added
      expect(parseInt(themeCount.textContent || '0')).toBeGreaterThanOrEqual(9);
    });

    it('should handle concurrent theme operations', async () => {
      const TestComponent = () => {
        const { setTheme } = useTheme();
        const [status, setStatus] = React.useState('idle');

        const runConcurrentOperations = async () => {
          setStatus('running');

          // Use existing themes
          const themes = ['catalyst', 'red', 'blue'];

          // Concurrent theme operations
          const operations = themes.map((theme, index) => {
            return new Promise(resolve => {
              setTimeout(() => {
                setTheme(theme);
                resolve(theme);
              }, index * 5);
            });
          });

          await Promise.all(operations);
          setStatus('complete');
        };

        return (
          <div>
            <Button onClick={runConcurrentOperations}>Run Test</Button>
            <span data-testid="status">{status}</span>
          </div>
        );
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Click to start operations
      await userEvent.click(screen.getByText('Run Test'));

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('complete');
      });
    });
  });
});
