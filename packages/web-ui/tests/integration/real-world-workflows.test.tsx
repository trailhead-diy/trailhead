/**
 * @fileoverview Real-World User Workflows Integration Tests
 *
 * HIGH-ROI tests covering complex, realistic user journeys that represent
 * how users actually interact with applications using Trailhead UI components:
 * - Multi-step onboarding flows
 * - Data dashboard interactions
 * - E-commerce shopping workflows
 * - Content management scenarios
 * - Error recovery patterns
 * - Async data loading scenarios
 *
 * KNOWN ISSUES WITH HEADLESS UI + TESTING LIBRARY:
 * 1. Headless UI components require PointerEvent which jsdom doesn't provide
 *    - Fixed by adding PointerEvent shim in vitest.setup.ts
 * 2. Input onChange events may not update state synchronously
 *    - Requires explicit waitFor() after typing
 * 3. Button clicks may need additional async handling
 *    - Use waitFor() to ensure state updates after clicks
 *
 * These are implementation issues with the test environment, not bugs in the components.
 * The components work correctly in real browsers.
 * See: https://github.com/tailwindlabs/headlessui/issues/3294
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Button } from '../../src/components/button';
import { Input } from '../../src/components/input';
import { Checkbox } from '../../src/components/checkbox';
import { Badge } from '../../src/components/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../src/components/table';
import { Alert } from '../../src/components/alert';

// Mock async operations
const mockApiCall = vi.fn();
const mockValidation = vi.fn();

describe('Real-World User Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiCall.mockResolvedValue({ success: true });
    mockValidation.mockResolvedValue({ valid: true });
  });

  describe('Multi-Step User Flow', () => {
    it('should handle multi-step form with state management', async () => {
      // Fixed: Headless UI components now work properly with our enhanced JSDOM config
      // The PointerEvent shim and pretendToBeVisual option resolved the issues
      const user = userEvent.setup();
      const onComplete = vi.fn();

      const MultiStepForm = () => {
        const [currentStep, setCurrentStep] = React.useState(1);
        const [formData, setFormData] = React.useState({
          name: '',
          email: '',
          preferences: false,
        });

        const handleNext = () => {
          setCurrentStep(prev => prev + 1);
        };
        const handleComplete = () => onComplete(formData);

        return (
          <div data-testid="multi-step-form">
            <p data-testid="current-step">Step {currentStep}</p>

            {currentStep === 1 && (
              <div data-testid="step-1">
                <Input
                  placeholder="Name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="name-input"
                  name="name"
                />
                <Button onClick={handleNext} disabled={!formData.name} data-testid="next-button">
                  Next
                </Button>
              </div>
            )}

            {currentStep === 2 && (
              <div data-testid="step-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  data-testid="email-input"
                />
                <Button onClick={handleNext} disabled={!formData.email} data-testid="next-button">
                  Next
                </Button>
              </div>
            )}

            {currentStep === 3 && (
              <div data-testid="step-3">
                <Checkbox
                  checked={formData.preferences}
                  onChange={checked => setFormData(prev => ({ ...prev, preferences: checked }))}
                  data-testid="preferences-checkbox"
                >
                  Enable preferences
                </Checkbox>
                <Button onClick={handleComplete} data-testid="complete-button">
                  Complete
                </Button>
              </div>
            )}
          </div>
        );
      };

      render(<MultiStepForm />);

      // Step 1
      expect(screen.getByTestId('current-step')).toHaveTextContent('Step 1');
      const nameInput = screen.getByTestId('name-input');

      // Type in the input - Headless UI Input may need special handling
      await user.type(nameInput, 'John Doe');

      // Wait for input value to be set and state to update
      await waitFor(() => {
        expect(nameInput).toHaveValue('John Doe');
      });

      // Find the button again after state update to ensure it's re-rendered
      await waitFor(() => {
        const nextButton = screen.getByTestId('next-button');
        expect(nextButton).not.toBeDisabled();
      });

      // Now click the button
      await user.click(screen.getByTestId('next-button'));

      // Step 2 - Wait for the step transition
      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toHaveTextContent('Step 2');
      });

      await user.type(screen.getByTestId('email-input'), 'john@example.com');

      // Click and wait for state update
      await user.click(screen.getByTestId('next-button'));

      // Step 3 - Wait for the step transition
      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toHaveTextContent('Step 3');
      });

      await user.click(screen.getByTestId('preferences-checkbox'));
      await user.click(screen.getByTestId('complete-button'));

      // Wait for the form submission to complete
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          preferences: true,
        });
      });
    });
  });

  describe('Data Dashboard Workflow', () => {
    it('should handle complex data filtering and table interactions', async () => {
      const user = userEvent.setup();
      const mockData = [
        { id: 1, name: 'Project Alpha', status: 'active', priority: 'high', assignee: 'John' },
        { id: 2, name: 'Project Beta', status: 'pending', priority: 'medium', assignee: 'Jane' },
        { id: 3, name: 'Project Gamma', status: 'completed', priority: 'low', assignee: 'Bob' },
        { id: 4, name: 'Project Delta', status: 'active', priority: 'high', assignee: 'Alice' },
      ];

      // Working Dashboard component with proper Table structure and state management
      const Dashboard = () => {
        const [searchTerm, setSearchTerm] = React.useState('');
        const [data] = React.useState(mockData);

        const filteredData = React.useMemo(() => {
          return data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }, [data, searchTerm]);

        return (
          <div data-testid="dashboard">
            <div className="mb-4">
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                data-testid="search-input"
              />
            </div>

            <Table data-testid="projects-table">
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Priority</TableHeader>
                  <TableHeader>Assignee</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map(item => (
                  <TableRow key={item.id} data-testid={`row-${item.id}`}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Badge
                        color={
                          item.status === 'active'
                            ? 'green'
                            : item.status === 'pending'
                              ? 'amber'
                              : 'zinc'
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={
                          item.priority === 'high'
                            ? 'red'
                            : item.priority === 'medium'
                              ? 'amber'
                              : 'zinc'
                        }
                      >
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.assignee}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      };

      await act(async () => {
        render(<Dashboard />);
      });

      // Wait for table to render
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();

        // Verify all projects are initially visible
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
        expect(screen.getByText('Project Beta')).toBeInTheDocument();
        expect(screen.getByText('Project Gamma')).toBeInTheDocument();
        expect(screen.getByText('Project Delta')).toBeInTheDocument();
      });

      // Test search filtering
      const searchInput = screen.getByTestId('search-input');
      await act(async () => {
        await user.type(searchInput, 'Alpha');
      });

      await waitFor(() => {
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
        expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
        expect(screen.queryByText('Project Gamma')).not.toBeInTheDocument();
        expect(screen.queryByText('Project Delta')).not.toBeInTheDocument();
      });

      // Clear search
      await act(async () => {
        await user.clear(searchInput);
      });

      await waitFor(() => {
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
        expect(screen.getByText('Project Beta')).toBeInTheDocument();
        expect(screen.getByText('Project Gamma')).toBeInTheDocument();
        expect(screen.getByText('Project Delta')).toBeInTheDocument();
      });
    });
  });

  describe('Shopping Cart Workflow', () => {
    it('should handle cart operations and state management', async () => {
      const user = userEvent.setup();
      const onCheckout = vi.fn();

      const ShoppingCart = () => {
        const [items, setItems] = React.useState<
          Array<{ id: number; name: string; quantity: number }>
        >([]);

        const addItem = (name: string) => {
          const id = items.length + 1;
          setItems(prev => [...prev, { id, name, quantity: 1 }]);
        };

        const removeItem = (id: number) => {
          setItems(prev => prev.filter(item => item.id !== id));
        };

        const updateQuantity = (id: number, quantity: number) => {
          setItems(prev => prev.map(item => (item.id === id ? { ...item, quantity } : item)));
        };

        return (
          <div data-testid="shopping-cart">
            <div className="mb-4">
              <Button onClick={() => addItem('Widget')} data-testid="add-widget">
                Add Widget
              </Button>
              <Button onClick={() => addItem('Gadget')} data-testid="add-gadget">
                Add Gadget
              </Button>
            </div>

            <div data-testid="cart-contents">
              {items.length === 0 ? (
                <p data-testid="empty-cart">Cart is empty</p>
              ) : (
                items.map(item => (
                  <div
                    key={item.id}
                    data-testid={`item-${item.id}`}
                    className="flex gap-2 items-center"
                  >
                    <span>{item.name}</span>
                    <span data-testid={`quantity-${item.id}`}>Qty: {item.quantity}</span>
                    <Button
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      data-testid={`increase-${item.id}`}
                    >
                      +
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      data-testid={`remove-${item.id}`}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <Button onClick={() => onCheckout(items)} data-testid="checkout" className="mt-4">
                Checkout ({items.length} items)
              </Button>
            )}
          </div>
        );
      };

      render(<ShoppingCart />);

      // Initially empty
      expect(screen.getByTestId('empty-cart')).toBeInTheDocument();

      // Add items
      await user.click(screen.getByTestId('add-widget'));
      await user.click(screen.getByTestId('add-gadget'));

      // Check items added
      expect(screen.queryByTestId('empty-cart')).not.toBeInTheDocument();
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-2')).toBeInTheDocument();

      // Increase quantity
      await user.click(screen.getByTestId('increase-1'));
      expect(screen.getByTestId('quantity-1')).toHaveTextContent('Qty: 2');

      // Remove item
      await user.click(screen.getByTestId('remove-2'));
      expect(screen.queryByTestId('item-2')).not.toBeInTheDocument();

      // Checkout
      await user.click(screen.getByTestId('checkout'));
      expect(onCheckout).toHaveBeenCalledWith([{ id: 1, name: 'Widget', quantity: 2 }]);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle network errors and allow user recovery', async () => {
      // Fixed: Enhanced JSDOM configuration now properly handles async state updates
      const user = userEvent.setup();
      let shouldFail = true;

      mockApiCall.mockImplementation(() => {
        if (shouldFail) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ success: true, data: 'Form submitted successfully' });
      });

      const FormWithErrorHandling = () => {
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState<string | null>(null);
        const [success, setSuccess] = React.useState(false);
        const [formData, setFormData] = React.useState({ message: '' });

        const handleSubmit = async () => {
          setLoading(true);
          setError(null);

          try {
            await mockApiCall(formData);
            setSuccess(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
          } finally {
            setLoading(false);
          }
        };

        const retry = () => {
          shouldFail = false; // Simulate fixing the network issue
          handleSubmit();
        };

        return (
          <div data-testid="form-with-error-handling">
            <Input
              value={formData.message}
              onChange={e => setFormData({ message: e.target.value })}
              placeholder="Enter your message"
              data-testid="message-input"
            />

            {error && (
              <Alert
                open={!!error}
                onClose={() => setError(null)}
                color="red"
                data-testid="error-alert"
              >
                <p>{error}</p>
                <Button onClick={retry} data-testid="retry-button" className="mt-2">
                  Try Again
                </Button>
              </Alert>
            )}

            {success && (
              <Alert
                open={success}
                onClose={() => setSuccess(false)}
                color="green"
                data-testid="success-alert"
              >
                Form submitted successfully!
              </Alert>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.message}
              data-testid="submit-button"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        );
      };

      render(<FormWithErrorHandling />);

      // Fill form and submit
      await user.type(screen.getByTestId('message-input'), 'Test message');
      await user.click(screen.getByTestId('submit-button'));

      // Wait for the async operation to complete and error to be shown
      await waitFor(
        () => {
          expect(screen.getByTestId('error-alert')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getByText('Network error')).toBeInTheDocument();

      // Retry should succeed
      await user.click(screen.getByTestId('retry-button'));

      // Wait for success state
      await waitFor(
        () => {
          expect(screen.getByTestId('success-alert')).toBeInTheDocument();
          expect(screen.queryByTestId('error-alert')).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Performance-Critical Interactions', () => {
    it('should handle rapid user interactions without performance degradation', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();

      const PerformanceTestComponent = () => {
        const [count, setCount] = React.useState(0);
        const [items, setItems] = React.useState<number[]>([]);

        React.useEffect(() => {
          onUpdate(count, items.length);
        }, [count, items.length]);

        const addItem = () => {
          setItems(prev => [...prev, Date.now()]);
        };

        const removeItem = (index: number) => {
          setItems(prev => prev.filter((_, i) => i !== index));
        };

        return (
          <div data-testid="performance-test">
            <div className="flex gap-2 mb-4">
              <Button onClick={() => setCount(c => c + 1)} data-testid="increment-button">
                Count: {count}
              </Button>
              <Button onClick={addItem} data-testid="add-item-button">
                Add Item ({items.length})
              </Button>
            </div>

            <div data-testid="items-list">
              {items.map((item, index) => (
                <div key={item} className="flex items-center gap-2 p-1 border-b">
                  <span>Item {index + 1}</span>
                  <Button
                    size="sm"
                    color="red"
                    outline
                    onClick={() => removeItem(index)}
                    data-testid={`remove-item-${index}`}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      };

      render(<PerformanceTestComponent />);

      // Rapid clicks should all be handled
      const incrementButton = screen.getByTestId('increment-button');
      const addItemButton = screen.getByTestId('add-item-button');

      // Rapid increment clicks
      for (let i = 0; i < 10; i++) {
        await user.click(incrementButton);
      }

      // Rapid item additions
      for (let i = 0; i < 5; i++) {
        await user.click(addItemButton);
      }

      await waitFor(() => {
        expect(screen.getByTestId('increment-button')).toHaveTextContent('Count: 10');
        expect(screen.getByTestId('add-item-button')).toHaveTextContent('Add Item (5)');
      });

      // Remove items rapidly
      for (let i = 0; i < 3; i++) {
        const removeButton = screen.getByTestId(`remove-item-${i}`);
        await user.click(removeButton);
      }

      await waitFor(() => {
        expect(screen.getByTestId('add-item-button')).toHaveTextContent('Add Item (2)');
      });

      expect(onUpdate).toHaveBeenCalledWith(10, 2);
    });
  });
});
