import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Button } from '../../src/components/button';
import { Input } from '../../src/components/input';
import { Alert } from '../../src/components/alert';
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from '../../src/components/table';
import { Text, Strong } from '../../src/components/text';
import { Badge } from '../../src/components/badge';
import { Fieldset, Legend as FieldsetLegend } from '../../src/components/fieldset';

const originalConsoleError = console.error;

describe('Error State Integration Tests', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.restoreAllMocks();
  });

  describe('Form Validation Error Propagation', () => {
    it.skip('should handle cascading validation errors across nested form components', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      const CascadingValidationForm = () => {
        const [formData, setFormData] = React.useState({
          personalInfo: {
            firstName: '',
            lastName: '',
            email: '',
          },
          accountInfo: {
            username: '',
            password: '',
            confirmPassword: '',
          },
          preferences: {
            newsletter: false,
            terms: false,
          },
        });

        const [errors, setErrors] = React.useState<Record<string, Record<string, string>>>({});
        const [isSubmitting, setIsSubmitting] = React.useState(false);

        const validateSection = (section: string, data: any) => {
          const sectionErrors: Record<string, string> = {};

          if (section === 'personalInfo') {
            if (!data.firstName.trim()) sectionErrors.firstName = 'First name is required';
            if (!data.lastName.trim()) sectionErrors.lastName = 'Last name is required';
            if (!data.email.trim()) {
              sectionErrors.email = 'Email is required';
            } else if (!/\S+@\S+\.\S+/.test(data.email)) {
              sectionErrors.email = 'Invalid email format';
            }
          } else if (section === 'accountInfo') {
            if (!data.username.trim()) {
              sectionErrors.username = 'Username is required';
            } else if (data.username.length < 3) {
              sectionErrors.username = 'Username must be at least 3 characters';
            }

            if (!data.password) {
              sectionErrors.password = 'Password is required';
            } else if (data.password.length < 8) {
              sectionErrors.password = 'Password must be at least 8 characters';
            }

            if (data.password !== data.confirmPassword) {
              sectionErrors.confirmPassword = 'Passwords do not match';
            }
          } else if (section === 'preferences') {
            if (!data.terms) {
              sectionErrors.terms = 'You must accept the terms and conditions';
            }
          }

          return sectionErrors;
        };

        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setIsSubmitting(true);

          // Validate all sections
          const allErrors: Record<string, Record<string, string>> = {};
          let hasErrors = false;

          Object.keys(formData).forEach(section => {
            const sectionErrors = validateSection(
              section,
              formData[section as keyof typeof formData]
            );
            if (Object.keys(sectionErrors).length > 0) {
              allErrors[section] = sectionErrors;
              hasErrors = true;
            }
          });

          if (hasErrors) {
            setErrors(allErrors);
            setIsSubmitting(false);
            return;
          }

          try {
            // Simulate API call that might fail
            await new Promise((resolve, reject) => {
              setTimeout(() => {
                if (formData.personalInfo.email === 'existing@example.com') {
                  reject(new Error('Email already exists'));
                } else {
                  resolve(true);
                }
              }, 1000);
            });

            onSubmit(formData);
            setErrors({});
          } catch (_error) {
            setErrors({
              personalInfo: { email: 'This email address is already in use' },
            });
          } finally {
            setIsSubmitting(false);
          }
        };

        const updateNestedField = (section: string, field: string, value: any) => {
          setFormData(prev => ({
            ...prev,
            [section]: {
              ...prev[section as keyof typeof prev],
              [field]: value,
            },
          }));

          // Clear field error when user starts typing
          if (errors[section]?.[field]) {
            setErrors(prev => ({
              ...prev,
              [section]: {
                ...prev[section],
                [field]: '',
              },
            }));
          }
        };

        return (
          <form onSubmit={handleSubmit} data-testid="cascading-form">
            {/* Personal Information Section */}
            <Fieldset>
              <FieldsetLegend>Personal Information</FieldsetLegend>

              <div>
                <Input
                  placeholder="First Name"
                  value={formData.personalInfo.firstName}
                  onChange={e => updateNestedField('personalInfo', 'firstName', e.target.value)}
                  data-testid="first-name-input"
                  aria-invalid={!!errors.personalInfo?.firstName}
                  disabled={isSubmitting}
                />
                {errors.personalInfo?.firstName && (
                  <div role="alert" data-testid="first-name-error" style={{ color: 'red' }}>
                    {errors.personalInfo.firstName}
                  </div>
                )}
              </div>

              <div>
                <Input
                  placeholder="Last Name"
                  value={formData.personalInfo.lastName}
                  onChange={e => updateNestedField('personalInfo', 'lastName', e.target.value)}
                  data-testid="last-name-input"
                  aria-invalid={!!errors.personalInfo?.lastName}
                  disabled={isSubmitting}
                />
                {errors.personalInfo?.lastName && (
                  <div role="alert" data-testid="last-name-error" style={{ color: 'red' }}>
                    {errors.personalInfo.lastName}
                  </div>
                )}
              </div>

              <div>
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={formData.personalInfo.email}
                  onChange={e => updateNestedField('personalInfo', 'email', e.target.value)}
                  data-testid="email-input"
                  aria-invalid={!!errors.personalInfo?.email}
                  disabled={isSubmitting}
                />
                {errors.personalInfo?.email && (
                  <div role="alert" data-testid="email-error" style={{ color: 'red' }}>
                    {errors.personalInfo.email}
                  </div>
                )}
              </div>
            </Fieldset>

            {/* Account Information Section */}
            <Fieldset>
              <FieldsetLegend>Account Information</FieldsetLegend>

              <div>
                <Input
                  placeholder="Username"
                  value={formData.accountInfo.username}
                  onChange={e => updateNestedField('accountInfo', 'username', e.target.value)}
                  data-testid="username-input"
                  aria-invalid={!!errors.accountInfo?.username}
                  disabled={isSubmitting}
                />
                {errors.accountInfo?.username && (
                  <div role="alert" data-testid="username-error" style={{ color: 'red' }}>
                    {errors.accountInfo.username}
                  </div>
                )}
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.accountInfo.password}
                  onChange={e => updateNestedField('accountInfo', 'password', e.target.value)}
                  data-testid="password-input"
                  aria-invalid={!!errors.accountInfo?.password}
                  disabled={isSubmitting}
                />
                {errors.accountInfo?.password && (
                  <div role="alert" data-testid="password-error" style={{ color: 'red' }}>
                    {errors.accountInfo.password}
                  </div>
                )}
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={formData.accountInfo.confirmPassword}
                  onChange={e =>
                    updateNestedField('accountInfo', 'confirmPassword', e.target.value)
                  }
                  data-testid="confirm-password-input"
                  aria-invalid={!!errors.accountInfo?.confirmPassword}
                  disabled={isSubmitting}
                />
                {errors.accountInfo?.confirmPassword && (
                  <div role="alert" data-testid="confirm-password-error" style={{ color: 'red' }}>
                    {errors.accountInfo.confirmPassword}
                  </div>
                )}
              </div>
            </Fieldset>

            {/* Preferences Section */}
            <Fieldset>
              <FieldsetLegend>Preferences</FieldsetLegend>

              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.preferences.newsletter}
                    onChange={e => updateNestedField('preferences', 'newsletter', e.target.checked)}
                    data-testid="newsletter-checkbox"
                    disabled={isSubmitting}
                  />
                  Subscribe to newsletter
                </label>
              </div>

              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.preferences.terms}
                    onChange={e => updateNestedField('preferences', 'terms', e.target.checked)}
                    data-testid="terms-checkbox"
                    disabled={isSubmitting}
                  />
                  I accept the terms and conditions
                </label>
                {errors.preferences?.terms && (
                  <div role="alert" data-testid="terms-error" style={{ color: 'red' }}>
                    {errors.preferences.terms}
                  </div>
                )}
              </div>
            </Fieldset>

            <Button type="submit" disabled={isSubmitting} data-testid="submit-button">
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        );
      };

      render(<CascadingValidationForm />);

      // Test empty form submission - should show all required field errors
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('first-name-error')).toHaveTextContent('First name is required');
        expect(screen.getByTestId('last-name-error')).toHaveTextContent('Last name is required');
        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
        expect(screen.getByTestId('username-error')).toHaveTextContent('Username is required');
        expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
        expect(screen.getByTestId('terms-error')).toHaveTextContent(
          'You must accept the terms and conditions'
        );
      });

      // Fill form with invalid data
      await user.type(screen.getByTestId('first-name-input'), 'John');
      await user.type(screen.getByTestId('last-name-input'), 'Doe');
      await user.type(screen.getByTestId('email-input'), 'invalid-email');
      await user.type(screen.getByTestId('username-input'), 'ab'); // Too short
      await user.type(screen.getByTestId('password-input'), '123'); // Too short
      await user.type(screen.getByTestId('confirm-password-input'), 'different');

      await user.click(screen.getByTestId('submit-button'));

      // Should show validation errors for invalid data
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email format');
        expect(screen.getByTestId('username-error')).toHaveTextContent(
          'Username must be at least 3 characters'
        );
        expect(screen.getByTestId('password-error')).toHaveTextContent(
          'Password must be at least 8 characters'
        );
        expect(screen.getByTestId('confirm-password-error')).toHaveTextContent(
          'Passwords do not match'
        );
      });

      // Fix validation errors
      await user.clear(screen.getByTestId('email-input'));
      await user.type(screen.getByTestId('email-input'), 'existing@example.com');

      await user.clear(screen.getByTestId('username-input'));
      await user.type(screen.getByTestId('username-input'), 'validuser');

      await user.clear(screen.getByTestId('password-input'));
      await user.type(screen.getByTestId('password-input'), 'validpassword123');

      await user.clear(screen.getByTestId('confirm-password-input'));
      await user.type(screen.getByTestId('confirm-password-input'), 'validpassword123');

      await user.click(screen.getByTestId('terms-checkbox'));

      // Submit with existing email - should show server error
      await user.click(screen.getByTestId('submit-button'));

      // Should show loading state
      expect(screen.getByText('Creating Account...')).toBeInTheDocument();

      // Should show server error after API call
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(
          'This email address is already in use'
        );
      });

      // Fix email and submit successfully
      await user.clear(screen.getByTestId('email-input'));
      await user.type(screen.getByTestId('email-input'), 'new@example.com');

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'new@example.com',
          },
          accountInfo: {
            username: 'validuser',
            password: 'validpassword123',
            confirmPassword: 'validpassword123',
          },
          preferences: {
            newsletter: false,
            terms: true,
          },
        });
      });
    });
  });

  describe('Network Error Handling in Data Components', () => {
    it.skip('should handle network errors in data fetching with retry mechanisms', async () => {
      const user = userEvent.setup();
      let requestCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        requestCount++;
        if (requestCount <= 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, name: 'John Doe', email: 'john@example.com' },
              { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
            ]),
        });
      });

      global.fetch = mockFetch;

      const DataTableWithErrorHandling = () => {
        const [data, setData] = React.useState<any[]>([]);
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState<string | null>(null);
        const [retryCount, setRetryCount] = React.useState(0);

        const fetchData = async () => {
          setLoading(true);
          setError(null);

          try {
            const response = await fetch('/api/users');
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const users = await response.json();
            setData(users);
            setRetryCount(0);
          } catch (_err) {
            setError(_err instanceof Error ? _err.message : 'Failed to fetch data');
          } finally {
            setLoading(false);
          }
        };

        const handleRetry = () => {
          setRetryCount(prev => prev + 1);
          fetchData();
        };

        React.useEffect(() => {
          fetchData();
        }, []);

        if (loading) {
          return (
            <div data-testid="loading-state">
              <Text>Loading users...</Text>
              {retryCount > 0 && <Text>Retry attempt {retryCount}</Text>}
            </div>
          );
        }

        if (error) {
          return (
            <div data-testid="error-state">
              <Alert open onClose={() => setError(null)}>
                <div>
                  <Strong>Error loading data</Strong>
                  <Text>{error}</Text>
                </div>
              </Alert>

              <div style={{ marginTop: '16px' }}>
                <Button onClick={handleRetry} data-testid="retry-button">
                  Retry {retryCount > 0 && `(${retryCount})`}
                </Button>

                <Button onClick={() => setError(null)} data-testid="dismiss-error">
                  Dismiss
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div data-testid="data-loaded">
            <Text>Users loaded successfully</Text>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Email</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      };

      render(<DataTableWithErrorHandling />);

      // Should show loading state initially
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText('Loading users...')).toBeInTheDocument();

      // Should show error state after first failed request
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      });

      // Test retry functionality
      await user.click(screen.getByTestId('retry-button'));

      // Should show loading state with retry count
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText('Retry attempt 1')).toBeInTheDocument();

      // Should show error again after second failed request
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByText('Retry (1)')).toBeInTheDocument();
      });

      // Test second retry - should succeed
      await user.click(screen.getByTestId('retry-button'));

      // Should eventually show successful data
      await waitFor(() => {
        expect(screen.getByTestId('data-loaded')).toBeInTheDocument();
        expect(screen.getByText('Users loaded successfully')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle partial data loading failures gracefully', async () => {
      const user = userEvent.setup();

      const PartialLoadingComponent = () => {
        const [userData, setUserData] = React.useState<any>(null);
        const [postsData] = React.useState<any[]>([]);
        const [commentsData, setCommentsData] = React.useState<any[]>([]);
        const [errors, setErrors] = React.useState<Record<string, string>>({});
        const [loadingStates, setLoadingStates] = React.useState({
          user: false,
          posts: false,
          comments: false,
        });

        const updateLoadingState = (key: string, value: boolean) => {
          setLoadingStates(prev => ({ ...prev, [key]: value }));
        };

        const updateError = (key: string, error: string | null) => {
          setErrors(prev => ({ ...prev, [key]: error || '' }));
        };

        const loadUserData = async () => {
          updateLoadingState('user', true);
          updateError('user', null);

          try {
            // Simulate successful user data load
            await new Promise(resolve => setTimeout(resolve, 500));
            setUserData({ id: 1, name: 'John Doe', email: 'john@example.com' });
          } catch (_err) {
            updateError('user', 'Failed to load user data');
          } finally {
            updateLoadingState('user', false);
          }
        };

        const loadPostsData = async () => {
          updateLoadingState('posts', true);
          updateError('posts', null);

          try {
            // Simulate posts data failure
            await new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Posts API unavailable')), 300)
            );
          } catch (_err) {
            updateError('posts', 'Failed to load posts');
          } finally {
            updateLoadingState('posts', false);
          }
        };

        const loadCommentsData = async () => {
          updateLoadingState('comments', true);
          updateError('comments', null);

          try {
            // Simulate successful comments load
            await new Promise(resolve => setTimeout(resolve, 400));
            setCommentsData([
              { id: 1, text: 'Great post!', author: 'Jane' },
              { id: 2, text: 'Thanks for sharing', author: 'Bob' },
            ]);
          } catch (_err) {
            updateError('comments', 'Failed to load comments');
          } finally {
            updateLoadingState('comments', false);
          }
        };

        React.useEffect(() => {
          loadUserData();
          loadPostsData();
          loadCommentsData();
        }, []);

        return (
          <div data-testid="partial-loading-component">
            {/* User Data Section */}
            <div data-testid="user-section">
              <Strong>User Information</Strong>
              {loadingStates.user ? (
                <Text>Loading user...</Text>
              ) : errors.user ? (
                <Alert open onClose={() => updateError('user', null)}>
                  <Text>{errors.user}</Text>
                  <Button onClick={loadUserData} data-testid="retry-user">
                    Retry
                  </Button>
                </Alert>
              ) : userData ? (
                <div>
                  <Text>{userData.name}</Text>
                  <Text>{userData.email}</Text>
                </div>
              ) : null}
            </div>

            {/* Posts Data Section */}
            <div data-testid="posts-section">
              <Strong>Posts</Strong>
              {loadingStates.posts ? (
                <Text>Loading posts...</Text>
              ) : errors.posts ? (
                <Alert open onClose={() => updateError('posts', null)}>
                  <Text>{errors.posts}</Text>
                  <Button onClick={loadPostsData} data-testid="retry-posts">
                    Retry
                  </Button>
                </Alert>
              ) : postsData.length > 0 ? (
                <div>
                  {postsData.map(post => (
                    <div key={post.id}>{post.title}</div>
                  ))}
                </div>
              ) : (
                <Text>No posts available</Text>
              )}
            </div>

            {/* Comments Data Section */}
            <div data-testid="comments-section">
              <Strong>Comments</Strong>
              {loadingStates.comments ? (
                <Text>Loading comments...</Text>
              ) : errors.comments ? (
                <Alert open onClose={() => updateError('comments', null)}>
                  <Text>{errors.comments}</Text>
                  <Button onClick={loadCommentsData} data-testid="retry-comments">
                    Retry
                  </Button>
                </Alert>
              ) : commentsData.length > 0 ? (
                <div>
                  {commentsData.map(comment => (
                    <div key={comment.id}>
                      <Strong>{comment.author}:</Strong> {comment.text}
                    </div>
                  ))}
                </div>
              ) : (
                <Text>No comments available</Text>
              )}
            </div>
          </div>
        );
      };

      render(<PartialLoadingComponent />);

      // Initially all sections should be loading
      expect(screen.getByText('Loading user...')).toBeInTheDocument();
      expect(screen.getByText('Loading posts...')).toBeInTheDocument();
      expect(screen.getByText('Loading comments...')).toBeInTheDocument();

      // Posts should fail first
      await waitFor(() => {
        expect(screen.getByText('Failed to load posts')).toBeInTheDocument();
      });

      // Comments should load successfully
      await waitFor(() => {
        expect(screen.getByText('Jane:')).toBeInTheDocument();
        expect(screen.getByText('Great post!')).toBeInTheDocument();
      });

      // User should load successfully
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });

      // Posts section should still show error with retry option
      expect(screen.getByTestId('retry-posts')).toBeInTheDocument();

      // Test selective retry
      await user.click(screen.getByTestId('retry-posts'));
      expect(screen.getByText('Loading posts...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Failed to load posts')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Error Handling and Fallbacks', () => {
    it.skip('should handle theme switching errors with graceful fallbacks', async () => {
      const user = userEvent.setup();

      // Mock theme provider with error simulation
      const ThemeWithErrors = () => {
        const [currentTheme, setCurrentTheme] = React.useState('light');
        const [themeError, setThemeError] = React.useState<string | null>(null);
        const [isLoading, setIsLoading] = React.useState(false);

        const switchTheme = async (newTheme: string) => {
          setIsLoading(true);
          setThemeError(null);

          try {
            // Simulate theme switch that might fail
            await new Promise((resolve, reject) => {
              setTimeout(() => {
                if (newTheme === 'invalid-theme') {
                  reject(new Error('Theme not found'));
                } else if (newTheme === 'network-theme') {
                  reject(new Error('Network error loading theme'));
                } else {
                  resolve(true);
                }
              }, 500);
            });

            setCurrentTheme(newTheme);
          } catch (_err) {
            setThemeError(_err instanceof Error ? _err.message : 'Theme switch failed');
            // Keep the previous theme as fallback
          } finally {
            setIsLoading(false);
          }
        };

        return (
          <div data-testid="theme-component" data-theme={currentTheme}>
            <div>
              <Strong>Current Theme: {currentTheme}</Strong>
              {isLoading && <Badge color="blue">Switching...</Badge>}
            </div>

            {themeError && (
              <Alert open onClose={() => setThemeError(null)} data-testid="theme-error">
                <div>
                  <Strong>Theme Error</Strong>
                  <Text>{themeError}</Text>
                </div>
              </Alert>
            )}

            <div>
              <Button
                onClick={() => switchTheme('dark')}
                disabled={isLoading}
                data-testid="switch-to-dark"
              >
                Switch to Dark
              </Button>

              <Button
                onClick={() => switchTheme('invalid-theme')}
                disabled={isLoading}
                data-testid="switch-to-invalid"
              >
                Switch to Invalid Theme
              </Button>

              <Button
                onClick={() => switchTheme('network-theme')}
                disabled={isLoading}
                data-testid="switch-to-network"
              >
                Switch to Network Theme
              </Button>
            </div>

            <div
              data-testid="themed-content"
              style={{
                background: currentTheme === 'dark' ? '#000' : '#fff',
                color: currentTheme === 'dark' ? '#fff' : '#000',
              }}
            >
              <Text>This content adapts to the theme</Text>
            </div>
          </div>
        );
      };

      render(<ThemeWithErrors />);

      // Initial state
      expect(screen.getByText('Current Theme: light')).toBeInTheDocument();

      // Test successful theme switch
      await user.click(screen.getByTestId('switch-to-dark'));

      // Should show loading state
      expect(screen.getByText('Switching...')).toBeInTheDocument();
      expect(screen.getByTestId('switch-to-dark')).toBeDisabled();

      // Should successfully switch to dark theme
      await waitFor(() => {
        expect(screen.getByText('Current Theme: dark')).toBeInTheDocument();
        expect(screen.queryByText('Switching...')).not.toBeInTheDocument();
      });

      // Test invalid theme error
      await user.click(screen.getByTestId('switch-to-invalid'));

      await waitFor(() => {
        expect(screen.getByTestId('theme-error')).toBeInTheDocument();
        expect(screen.getByText('Theme not found')).toBeInTheDocument();
        // Should keep previous theme as fallback
        expect(screen.getByText('Current Theme: dark')).toBeInTheDocument();
      });

      // Dismiss error
      await user.click(screen.getByRole('button', { name: /close/i }));
      expect(screen.queryByTestId('theme-error')).not.toBeInTheDocument();

      // Test network error
      await user.click(screen.getByTestId('switch-to-network'));

      await waitFor(() => {
        expect(screen.getByText('Network error loading theme')).toBeInTheDocument();
        // Should still maintain previous theme
        expect(screen.getByText('Current Theme: dark')).toBeInTheDocument();
      });
    });
  });

  describe('Component Unmounting During Async Operations', () => {
    it('should handle component unmounting during async operations without memory leaks', async () => {
      const user = userEvent.setup();
      let isMounted = true;

      const AsyncComponent = ({ onComplete }: { onComplete: (data: any) => void }) => {
        const [data, setData] = React.useState<any>(null);
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState<string | null>(null);

        React.useEffect(() => {
          return () => {
            isMounted = false;
          };
        }, []);

        const loadData = async () => {
          setLoading(true);
          setError(null);

          try {
            // Long-running async operation
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check if component is still mounted before updating state
            if (isMounted) {
              const result = { id: 1, name: 'Test Data' };
              setData(result);
              onComplete(result);
            }
          } catch (_err) {
            if (isMounted) {
              setError('Failed to load data');
            }
          } finally {
            if (isMounted) {
              setLoading(false);
            }
          }
        };

        return (
          <div data-testid="async-component">
            {loading && <Text>Loading data...</Text>}
            {error && (
              <Alert open onClose={() => setError(null)}>
                <Text>{error}</Text>
              </Alert>
            )}
            {data && <Text>Data loaded: {data.name}</Text>}

            <Button onClick={loadData} disabled={loading} data-testid="load-data">
              Load Data
            </Button>
          </div>
        );
      };

      const ComponentWrapper = () => {
        const [showComponent, setShowComponent] = React.useState(true);
        const [completedData, setCompletedData] = React.useState<any>(null);

        return (
          <div>
            <Button onClick={() => setShowComponent(!showComponent)} data-testid="toggle-component">
              {showComponent ? 'Unmount' : 'Mount'} Component
            </Button>

            {showComponent && <AsyncComponent onComplete={setCompletedData} />}

            {completedData && (
              <div data-testid="completion-indicator">Completed: {completedData.name}</div>
            )}
          </div>
        );
      };

      render(<ComponentWrapper />);

      // Start async operation
      await user.click(screen.getByTestId('load-data'));
      expect(screen.getByText('Loading data...')).toBeInTheDocument();

      // Unmount component while async operation is running
      await user.click(screen.getByTestId('toggle-component'));
      expect(screen.queryByTestId('async-component')).not.toBeInTheDocument();

      // Wait for what would have been the completion time
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Should not show completion indicator since component was unmounted
      expect(screen.queryByTestId('completion-indicator')).not.toBeInTheDocument();

      // Remount component
      await user.click(screen.getByTestId('toggle-component'));
      expect(screen.getByTestId('async-component')).toBeInTheDocument();

      // Reset mount flag for new instance
      isMounted = true;

      // Start new async operation that completes normally
      await user.click(screen.getByTestId('load-data'));

      await waitFor(
        () => {
          expect(screen.getByText('Data loaded: Test Data')).toBeInTheDocument();
          expect(screen.getByTestId('completion-indicator')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Error Boundary Integration', () => {
    it.skip('should handle errors across component boundaries with proper isolation', () => {
      class ErrorBoundary extends React.Component<
        { children: React.ReactNode; fallback: React.ReactNode },
        { hasError: boolean; error: Error | null }
      > {
        constructor(props: any) {
          super(props);
          this.state = { hasError: false, error: null };
        }

        static getDerivedStateFromError(error: Error) {
          return { hasError: true, error };
        }

        componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
          console.error('Error caught by boundary:', error, errorInfo);
        }

        render() {
          if (this.state.hasError) {
            return this.props.fallback;
          }

          return this.props.children;
        }
      }

      const BuggyComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('Component crashed!');
        }
        return <Text>Component working normally</Text>;
      };

      const AppWithErrorBoundaries = () => {
        const [throwError1, setThrowError1] = React.useState(false);
        const [throwError2, setThrowError2] = React.useState(false);

        return (
          <div>
            <Button onClick={() => setThrowError1(true)} data-testid="crash-component-1">
              Crash Component 1
            </Button>

            <Button onClick={() => setThrowError2(true)} data-testid="crash-component-2">
              Crash Component 2
            </Button>

            <div data-testid="section-1">
              <Strong>Section 1</Strong>
              <ErrorBoundary
                fallback={
                  <Alert open onClose={() => {}}>
                    <Text>Section 1 crashed but section 2 is still working</Text>
                  </Alert>
                }
              >
                <BuggyComponent shouldThrow={throwError1} />
              </ErrorBoundary>
            </div>

            <div data-testid="section-2">
              <Strong>Section 2</Strong>
              <ErrorBoundary
                fallback={
                  <Alert open onClose={() => {}}>
                    <Text>Section 2 crashed but section 1 is still working</Text>
                  </Alert>
                }
              >
                <BuggyComponent shouldThrow={throwError2} />
              </ErrorBoundary>
            </div>

            <div data-testid="section-3">
              <Strong>Section 3 (No Error Boundary)</Strong>
              <Text>This section has no error boundary</Text>
            </div>
          </div>
        );
      };

      render(<AppWithErrorBoundaries />);

      // Initially both components should work
      expect(screen.getAllByText('Component working normally')).toHaveLength(2);
      expect(screen.getByText('Section 3 (No Error Boundary)')).toBeInTheDocument();

      // Crash first component
      const crashButton1 = screen.getByTestId('crash-component-1');
      crashButton1.click();

      // Section 1 should show error, but section 2 should still work
      expect(
        screen.getByText(content =>
          content.includes('Section 1 crashed but section 2 is still working')
        )
      ).toBeInTheDocument();
      expect(screen.getByText('Component working normally')).toBeInTheDocument(); // Section 2 still working
      expect(screen.getByText('Section 3 (No Error Boundary)')).toBeInTheDocument();

      // Crash second component
      const crashButton2 = screen.getByTestId('crash-component-2');
      crashButton2.click();

      // Both sections should show errors, but section 3 should still work
      expect(
        screen.getByText(content =>
          content.includes('Section 1 crashed but section 2 is still working')
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText('Section 2 crashed but section 1 is still working')
      ).toBeInTheDocument();
      expect(screen.getByText('Section 3 (No Error Boundary)')).toBeInTheDocument();
      expect(screen.queryByText('Component working normally')).not.toBeInTheDocument();
    });
  });
});
