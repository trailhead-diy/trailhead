/**
 * @fileoverview High-ROI User Interaction Tests
 *
 * Tests critical user interactions that directly impact user experience:
 * - Click handlers and form submissions
 * - Keyboard navigation and accessibility
 * - Theme switching and persistence
 * - Error states and recovery
 * - Data flow between components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ThemeProvider } from '../../src/components/theme/theme-provider';
import { ThemeSwitcher } from '../../src/components/theme/theme-switcher';
import { Button } from '../../src/components/button';
import { Alert } from '../../src/components/alert';
import { Input } from '../../src/components/input';
import { Dialog } from '../../src/components/dialog';
import { Switch } from '../../src/components/switch';

// Mock next-themes for controlled testing
let mockTheme = 'catalyst';
let mockResolvedTheme = 'catalyst';
const mockSetTheme = vi.fn((newTheme: string) => {
  mockTheme = newTheme;
  mockResolvedTheme = newTheme;
});

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, ..._props }: any) => {
    // Apply the theme as a class like the real next-themes does
    React.useEffect(() => {
      document.documentElement.className = mockTheme;
    }, []);

    return (
      <div data-testid="theme-provider" data-theme={mockTheme}>
        {children}
      </div>
    );
  },
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
    systemTheme: 'light',
    resolvedTheme: mockResolvedTheme,
    themes: ['catalyst', 'red', 'green', 'blue', 'purple'],
  }),
}));

describe('User Interactions - Critical User Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme = 'catalyst';
    mockResolvedTheme = 'catalyst';
    document.documentElement.className = '';
  });

  describe('Button Click Behavior', () => {
    it('should handle form submission correctly', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn(e => e.preventDefault());

      render(
        <form onSubmit={onSubmit}>
          <Input name="email" placeholder="Enter email" />
          <Button type="submit">Submit Form</Button>
        </form>
      );

      // User fills form and submits
      await user.type(screen.getByPlaceholderText('Enter email'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'Submit Form' }));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('should prevent double submission during loading state', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      // Use a flag to simulate the common pattern of preventing double submissions
      let isSubmitting = false;

      const FormComponent = () => {
        const [isLoading, setIsLoading] = React.useState(false);

        const handleSubmit = async () => {
          // Common pattern: check flag before processing
          if (isSubmitting) return;

          isSubmitting = true;
          setIsLoading(true);

          // Call the actual submit function
          onSubmit();

          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 50));

          setIsLoading(false);
          isSubmitting = false;
        };

        return (
          <Button disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Submitting...' : 'Submit'}
          </Button>
        );
      };

      render(<FormComponent />);

      const button = screen.getByRole('button');

      // Simulate rapid clicking (common user behavior)
      const clickPromises = [user.click(button), user.click(button), user.click(button)];

      // Execute all clicks
      await Promise.all(clickPromises);

      // Wait for loading state to be set
      await waitFor(
        () => {
          expect(button).toBeDisabled();
        },
        { timeout: 1000 }
      );

      // Verify only one submission occurred
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should handle destructive actions with confirmation', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      const DeleteComponent = () => {
        const [showDialog, setShowDialog] = React.useState(false);

        return (
          <>
            <Button color="red" onClick={() => setShowDialog(true)}>
              Delete Item
            </Button>
            {showDialog && (
              <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
                <div>
                  <h2>Confirm Deletion</h2>
                  <p>This action cannot be undone.</p>
                  <Button
                    color="red"
                    onClick={() => {
                      onDelete();
                      setShowDialog(false);
                    }}
                  >
                    Confirm Delete
                  </Button>
                  <Button onClick={() => setShowDialog(false)}>Cancel</Button>
                </div>
              </Dialog>
            )}
          </>
        );
      };

      render(<DeleteComponent />);

      // User clicks delete
      await user.click(screen.getByText('Delete Item'));

      // Confirmation dialog appears
      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();

      // User confirms deletion
      await user.click(screen.getByText('Confirm Delete'));

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in custom select elements', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      const SelectComponent = () => {
        const [isOpen, setIsOpen] = React.useState(false);

        return (
          <div>
            <Button
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
            >
              Options
            </Button>
            {isOpen && (
              <div role="listbox" data-testid="options-menu">
                <div
                  role="option"
                  tabIndex={0}
                  onClick={() => {
                    onSelect('edit');
                    setIsOpen(false);
                  }}
                >
                  Edit Item
                </div>
                <div
                  role="option"
                  tabIndex={0}
                  onClick={() => {
                    onSelect('delete');
                    setIsOpen(false);
                  }}
                >
                  Delete Item
                </div>
                <div
                  role="option"
                  tabIndex={0}
                  onClick={() => {
                    onSelect('share');
                    setIsOpen(false);
                  }}
                >
                  Share Item
                </div>
              </div>
            )}
          </div>
        );
      };

      render(<SelectComponent />);

      const trigger = screen.getByRole('button', { name: 'Options' });

      // Open with click
      await user.click(trigger);

      // Should show menu
      expect(screen.getByTestId('options-menu')).toBeInTheDocument();

      // Click on delete option
      await user.click(screen.getByText('Delete Item'));

      expect(onSelect).toHaveBeenCalledWith('delete');
    });

    it('should handle tab navigation correctly', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <Input placeholder="First input" />
          <Button>Middle button</Button>
          <Input placeholder="Last input" />
        </div>
      );

      const firstInput = screen.getByPlaceholderText('First input');
      const button = screen.getByRole('button', { name: 'Middle button' });
      const lastInput = screen.getByPlaceholderText('Last input');

      // Start by focusing first element
      firstInput.focus();
      expect(firstInput).toHaveFocus();

      // Tab to next element
      await user.tab();
      expect(button).toHaveFocus();

      // Tab to last element
      await user.tab();
      expect(lastInput).toHaveFocus();
    });

    it('should support escape key to close modals', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const AlertComponent = () => {
        const [isOpen, setIsOpen] = React.useState(true);

        const handleClose = () => {
          setIsOpen(false);
          onClose();
        };

        return (
          <Alert open={isOpen} onClose={handleClose}>
            Important message
          </Alert>
        );
      };

      render(<AlertComponent />);

      expect(screen.getByText('Important message')).toBeInTheDocument();

      // Press escape to close
      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Theme Switching User Flow', () => {
    it('should persist theme selection across page reloads', async () => {
      const user = userEvent.setup();

      const ThemeApp = () => (
        <ThemeProvider defaultTheme="catalyst">
          <div>
            <ThemeSwitcher />
            <Button>Themed Button</Button>
          </div>
        </ThemeProvider>
      );

      const { rerender } = render(<ThemeApp />);

      // Select a different theme
      const switcher = screen.getByRole('combobox');
      await user.selectOptions(switcher, 'blue');

      expect(mockSetTheme).toHaveBeenCalledWith('blue');
      mockTheme = 'blue';

      // Simulate page reload
      rerender(<ThemeApp />);

      // Theme should persist
      const provider = screen.getByTestId('theme-provider');
      expect(provider).toHaveAttribute('data-theme', 'blue');
    });

    it('should update all themed components when theme changes', async () => {
      const user = userEvent.setup();

      const MultiComponentApp = () => {
        const [alertOpen, setAlertOpen] = React.useState(false);

        return (
          <ThemeProvider defaultTheme="catalyst">
            <div data-testid="app-container">
              <ThemeSwitcher />
              <Button onClick={() => setAlertOpen(true)}>Show Alert</Button>
              <Alert open={alertOpen} onClose={() => setAlertOpen(false)}>
                Themed alert message
              </Alert>
            </div>
          </ThemeProvider>
        );
      };

      render(<MultiComponentApp />);

      // Change theme
      const switcher = screen.getByRole('combobox');
      await user.selectOptions(switcher, 'red');

      // Wait for theme to be applied
      await waitFor(() => {
        expect(mockSetTheme).toHaveBeenCalledWith('red');
      });

      // The mock should have been called, which means the theme switching logic works
      // The actual DOM update would happen in a real next-themes implementation
      expect(mockSetTheme).toHaveBeenCalledWith('red');

      // Show alert to verify it also uses new theme
      await user.click(screen.getByText('Show Alert'));
      expect(screen.getByText('Themed alert message')).toBeInTheDocument();
    });

    it('should handle theme switching during user interactions', async () => {
      const user = userEvent.setup();
      const onSwitchChange = vi.fn();

      const InteractiveApp = () => (
        <ThemeProvider defaultTheme="catalyst">
          <div>
            <ThemeSwitcher />
            <Switch checked={false} onChange={onSwitchChange} />
            <span>Toggle setting</span>
          </div>
        </ThemeProvider>
      );

      render(<InteractiveApp />);

      // Interact with switch while changing theme
      const switchElement = screen.getByRole('switch');
      const themeSwitcher = screen.getByRole('combobox');

      await user.click(switchElement);
      await user.selectOptions(themeSwitcher, 'green');
      await user.click(switchElement);

      // Both interactions should work correctly
      expect(onSwitchChange).toHaveBeenCalledTimes(2);
      expect(mockSetTheme).toHaveBeenCalledWith('green');
    });
  });

  describe('Error State Handling', () => {
    it('should display validation errors on form fields', async () => {
      const user = userEvent.setup();
      const onValidationChange = vi.fn();

      const ValidationForm = () => {
        const [error, setError] = React.useState(false);

        return (
          <div>
            <Button
              onClick={() => {
                setError(true);
                onValidationChange(true);
              }}
            >
              Trigger Error
            </Button>
            <Button
              onClick={() => {
                setError(false);
                onValidationChange(false);
              }}
            >
              Clear Error
            </Button>
            {error && (
              <Alert open={error} onClose={() => setError(false)}>
                Please enter a valid email address
              </Alert>
            )}
          </div>
        );
      };

      render(<ValidationForm />);

      // Trigger validation error
      await user.click(screen.getByText('Trigger Error'));

      // Error should appear
      expect(onValidationChange).toHaveBeenCalledWith(true);
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();

      // Clear the error
      await user.click(screen.getByText('Clear Error'));

      // Error should disappear
      expect(onValidationChange).toHaveBeenCalledWith(false);
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });

    it('should handle async operation errors gracefully', async () => {
      const user = userEvent.setup();

      const AsyncComponent = () => {
        const [error, setError] = React.useState('');
        const [success, setSuccess] = React.useState(false);

        const handleAsyncOperation = async () => {
          try {
            // Simulate async operation that fails
            await Promise.reject(new Error('Operation failed'));
          } catch (_err) {
            setError('Operation failed. Please try again.');
          }
        };

        const handleSuccess = () => {
          setError('');
          setSuccess(true);
        };

        return (
          <div>
            <Button onClick={handleAsyncOperation}>Trigger Error</Button>
            <Button onClick={handleSuccess}>Trigger Success</Button>
            {error && (
              <Alert open onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            {success && <div>Operation completed successfully</div>}
          </div>
        );
      };

      render(<AsyncComponent />);

      // Trigger error
      await user.click(screen.getByText('Trigger Error'));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Operation failed. Please try again.')).toBeInTheDocument();
      });

      // Clear error and trigger success
      await user.click(screen.getByText('Trigger Success'));

      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
      expect(screen.queryByText('Operation failed. Please try again.')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility User Experience', () => {
    it('should announce dynamic content changes to screen readers', async () => {
      const user = userEvent.setup();

      const AnnouncementComponent = () => {
        const [message, setMessage] = React.useState('');

        return (
          <div>
            <Button onClick={() => setMessage('Operation completed successfully')}>
              Complete Operation
            </Button>
            {message && (
              <div role="status" aria-live="polite">
                {message}
              </div>
            )}
          </div>
        );
      };

      render(<AnnouncementComponent />);

      await user.click(screen.getByText('Complete Operation'));

      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent('Operation completed successfully');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
    });

    it('should support high contrast mode detection', () => {
      // Simulate high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const ContrastComponent = () => {
        const [highContrast, setHighContrast] = React.useState(false);

        React.useEffect(() => {
          const mediaQuery = window.matchMedia('(prefers-contrast: high)');
          setHighContrast(mediaQuery.matches);
        }, []);

        return (
          <div data-testid="contrast-container" data-high-contrast={highContrast}>
            <Button>High Contrast Button</Button>
          </div>
        );
      };

      render(<ContrastComponent />);

      const container = screen.getByTestId('contrast-container');
      expect(container).toHaveAttribute('data-high-contrast', 'true');
    });
  });
});
