/**
 * @fileoverview Data Display Integration Tests
 *
 * High-ROI tests focusing on how data components work together:
 * - Table with pagination and sorting workflows
 * - List components with filtering and search
 * - Complex data structures with nested components
 * - Loading states across multiple components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from '../../src/components/table';
import { Pagination } from '../../src/components/pagination';
import { Text, Strong } from '../../src/components/text';
import { Badge } from '../../src/components/badge';
import { Button } from '../../src/components/button';
import { Input } from '../../src/components/input';
import { Select } from '../../src/components/select';
import {
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from '../../src/components/description-list';

// Mock data for testing
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', status: 'active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user', status: 'inactive' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'moderator', status: 'active' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'user', status: 'pending' },
];

describe('Data Display Integration Tests', () => {
  describe('Table with Pagination Integration', () => {
    it('should handle complete table pagination workflow', async () => {
      const user = userEvent.setup();

      const PaginatedTable = () => {
        const [currentPage, setCurrentPage] = React.useState(1);
        const [itemsPerPage] = React.useState(2);
        const [sortField, setSortField] = React.useState<string | null>(null);
        const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

        const sortedData = React.useMemo(() => {
          let sorted = [...mockUsers];
          if (sortField) {
            sorted.sort((a, b) => {
              const aVal = a[sortField as keyof typeof a];
              const bVal = b[sortField as keyof typeof b];
              const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
              return sortDirection === 'asc' ? comparison : -comparison;
            });
          }
          return sorted;
        }, [sortField, sortDirection]);

        const totalPages = Math.ceil(sortedData.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

        const handleSort = (field: string) => {
          if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortField(field);
            setSortDirection('asc');
          }
          setCurrentPage(1); // Reset to first page when sorting
        };

        return (
          <div>
            <div data-testid="table-controls">
              <Text>
                Showing {paginatedData.length} of {sortedData.length} users
              </Text>
              <Text>
                Page {currentPage} of {totalPages}
              </Text>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>
                    <Button onClick={() => handleSort('name')} data-testid="sort-name">
                      Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </Button>
                  </TableHeader>
                  <TableHeader>
                    <Button onClick={() => handleSort('email')} data-testid="sort-email">
                      Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </Button>
                  </TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map(user => (
                  <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                    <TableCell>
                      <Strong>{user.name}</Strong>
                    </TableCell>
                    <TableCell>
                      <Text>{user.email}</Text>
                    </TableCell>
                    <TableCell>
                      <Badge color={user.role === 'admin' ? 'red' : 'blue'}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={
                          user.status === 'active'
                            ? 'green'
                            : user.status === 'inactive'
                              ? 'red'
                              : 'yellow'
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination aria-label="User table pagination" data-testid="pagination">
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                data-testid="prev-page"
              >
                Previous
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  data-active={currentPage === page}
                  data-testid={`page-${page}`}
                >
                  {page}
                </Button>
              ))}

              <Button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                data-testid="next-page"
              >
                Next
              </Button>
            </Pagination>
          </div>
        );
      };

      render(<PaginatedTable />);

      // Verify initial state (page 1, 2 items)
      expect(
        screen.getByText(content => content.includes('Showing 2 of 5 users'))
      ).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByTestId('user-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-row-2')).toBeInTheDocument();
      expect(screen.queryByTestId('user-row-3')).not.toBeInTheDocument();

      // Test pagination navigation
      await user.click(screen.getByTestId('next-page'));
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      expect(screen.queryByTestId('user-row-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('user-row-3')).toBeInTheDocument();
      expect(screen.getByTestId('user-row-4')).toBeInTheDocument();

      // Test page number clicking
      await user.click(screen.getByTestId('page-3'));
      expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
      expect(
        screen.getByText(content => content.includes('Showing 1 of 5 users'))
      ).toBeInTheDocument();
      expect(screen.getByTestId('user-row-5')).toBeInTheDocument();

      // Go back to page 1 for sorting test
      await user.click(screen.getByTestId('page-1'));

      // Test sorting by name
      await user.click(screen.getByTestId('sort-name'));
      expect(screen.getByText('Name ↑')).toBeInTheDocument();

      // Verify sort order changed (Alice should be first now)
      const rows = screen.getAllByTestId(/user-row-/);
      expect(rows[0]).toHaveAttribute('data-testid', 'user-row-4'); // Alice Brown

      // Test reverse sort
      await user.click(screen.getByTestId('sort-name'));
      expect(screen.getByText('Name ↓')).toBeInTheDocument();
    });

    it('should handle table with search and filtering', async () => {
      // Known issue: Headless UI Input components don't always trigger onChange
      // events properly in jsdom environment. The component works correctly in browsers.
      const user = userEvent.setup();

      const FilterableTable = () => {
        const [searchTerm, setSearchTerm] = React.useState('');
        const [statusFilter, setStatusFilter] = React.useState('all');
        const [roleFilter, setRoleFilter] = React.useState('all');

        const filteredData = React.useMemo(() => {
          return mockUsers.filter(user => {
            const matchesSearch =
              user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;

            return matchesSearch && matchesStatus && matchesRole;
          });
        }, [searchTerm, statusFilter, roleFilter]);

        return (
          <div>
            <div data-testid="filters" style={{ marginBottom: '1rem' }}>
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                data-testid="search-input"
              />

              <Select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                data-testid="status-filter"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </Select>

              <Select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                data-testid="role-filter"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="user">User</option>
              </Select>
            </div>

            <div data-testid="results-summary">
              Showing {filteredData.length} of {mockUsers.length} users
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} data-testid="no-results">
                      <Text>No users found matching the current filters</Text>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map(user => (
                    <TableRow key={user.id} data-testid={`filtered-user-${user.id}`}>
                      <TableCell>
                        <Strong>{user.name}</Strong>
                      </TableCell>
                      <TableCell>
                        <Text>{user.email}</Text>
                      </TableCell>
                      <TableCell>
                        <Badge>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{user.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        );
      };

      render(<FilterableTable />);

      // Initial state - all users shown
      expect(
        screen.getByText(content => content.includes('Showing 5 of 5 users'))
      ).toBeInTheDocument();
      expect(screen.getByTestId('filtered-user-1')).toBeInTheDocument();

      // Test search functionality
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'john');

      // Wait for input value to be set and give React time to re-render
      await waitFor(() => {
        expect(searchInput).toHaveValue('john');
      });

      // Small delay to ensure React state update completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Wait for the filter to be applied
      await waitFor(
        () => {
          // The results summary should show "Showing 2 of 5 users"
          const summaryText = screen.getByTestId('results-summary').textContent;
          expect(summaryText).toBe('Showing 2 of 5 users');
        },
        { timeout: 3000 }
      );

      expect(screen.getByTestId('filtered-user-1')).toBeInTheDocument(); // John Doe
      expect(screen.getByTestId('filtered-user-3')).toBeInTheDocument(); // Bob Johnson
      expect(screen.queryByTestId('filtered-user-2')).not.toBeInTheDocument();

      // Clear search and test status filter
      await user.clear(screen.getByTestId('search-input'));

      // Wait for clear to take effect
      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });

      await user.selectOptions(screen.getByTestId('status-filter'), 'active');

      await waitFor(() => {
        expect(
          screen.getByText(content => content.includes('Showing 3 of 5 users'))
        ).toBeInTheDocument();
      });

      expect(screen.queryByTestId('filtered-user-3')).not.toBeInTheDocument(); // Bob is inactive

      // Test role filter
      await user.selectOptions(screen.getByTestId('role-filter'), 'admin');

      await waitFor(() => {
        expect(
          screen.getByText(content => content.includes('Showing 1 of 5 users'))
        ).toBeInTheDocument();
      });

      expect(screen.getByTestId('filtered-user-1')).toBeInTheDocument(); // John is admin and active

      // Test no results
      await user.selectOptions(screen.getByTestId('role-filter'), 'moderator');
      await user.selectOptions(screen.getByTestId('status-filter'), 'inactive');

      await waitFor(() => {
        expect(
          screen.getByText(content => content.includes('Showing 0 of 5 users'))
        ).toBeInTheDocument();
      });

      expect(screen.getByTestId('no-results')).toBeInTheDocument();
    });
  });

  describe('Complex Data Structures', () => {
    it('should handle nested data display with description lists', () => {
      const userProfile = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        profile: {
          bio: 'Software developer with 10 years of experience',
          location: 'San Francisco, CA',
          website: 'https://johndoe.dev',
        },
        preferences: {
          theme: 'dark',
          notifications: true,
          language: 'English',
        },
        stats: {
          projects: 25,
          contributions: 150,
          followers: 45,
        },
      };

      const UserProfileDisplay = () => (
        <div data-testid="user-profile">
          <div>
            <Strong>{userProfile.name}</Strong>
            <Text>{userProfile.email}</Text>
          </div>

          <DescriptionList>
            <DescriptionTerm>Profile Information</DescriptionTerm>
            <DescriptionDetails>
              <DescriptionList>
                <DescriptionTerm>Bio</DescriptionTerm>
                <DescriptionDetails>{userProfile.profile.bio}</DescriptionDetails>

                <DescriptionTerm>Location</DescriptionTerm>
                <DescriptionDetails>{userProfile.profile.location}</DescriptionDetails>

                <DescriptionTerm>Website</DescriptionTerm>
                <DescriptionDetails>{userProfile.profile.website}</DescriptionDetails>
              </DescriptionList>
            </DescriptionDetails>

            <DescriptionTerm>Preferences</DescriptionTerm>
            <DescriptionDetails>
              <DescriptionList>
                <DescriptionTerm>Theme</DescriptionTerm>
                <DescriptionDetails>
                  <Badge>{userProfile.preferences.theme}</Badge>
                </DescriptionDetails>

                <DescriptionTerm>Notifications</DescriptionTerm>
                <DescriptionDetails>
                  <Badge color={userProfile.preferences.notifications ? 'green' : 'red'}>
                    {userProfile.preferences.notifications ? 'Enabled' : 'Disabled'}
                  </Badge>
                </DescriptionDetails>

                <DescriptionTerm>Language</DescriptionTerm>
                <DescriptionDetails>{userProfile.preferences.language}</DescriptionDetails>
              </DescriptionList>
            </DescriptionDetails>

            <DescriptionTerm>Statistics</DescriptionTerm>
            <DescriptionDetails>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Strong>Projects</Strong>
                    </TableCell>
                    <TableCell>
                      <Badge color="blue">{userProfile.stats.projects}</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Strong>Contributions</Strong>
                    </TableCell>
                    <TableCell>
                      <Badge color="green">{userProfile.stats.contributions}</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Strong>Followers</Strong>
                    </TableCell>
                    <TableCell>
                      <Badge color="purple">{userProfile.stats.followers}</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </DescriptionDetails>
          </DescriptionList>
        </div>
      );

      render(<UserProfileDisplay />);

      // Verify all nested data is displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(
        screen.getByText('Software developer with 10 years of experience')
      ).toBeInTheDocument();
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
      expect(screen.getByText('https://johndoe.dev')).toBeInTheDocument();

      // Verify preferences display
      expect(screen.getByText('dark')).toBeInTheDocument();
      expect(screen.getByText('Enabled')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();

      // Verify stats table
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('should handle loading states across multiple data components', async () => {
      const LoadingStateDemo = () => {
        const [usersLoading, setUsersLoading] = React.useState(true);
        const [statsLoading, setStatsLoading] = React.useState(true);
        const [users, setUsers] = React.useState<typeof mockUsers>([]);
        const [stats, setStats] = React.useState({ total: 0, active: 0, inactive: 0 });

        React.useEffect(() => {
          // Simulate loading users
          setTimeout(() => {
            setUsers(mockUsers);
            setUsersLoading(false);
          }, 150);

          // Simulate loading stats (takes longer)
          setTimeout(() => {
            setStats({
              total: mockUsers.length,
              active: mockUsers.filter(u => u.status === 'active').length,
              inactive: mockUsers.filter(u => u.status === 'inactive').length,
            });
            setStatsLoading(false);
          }, 300);
        }, []);

        return (
          <div>
            <div data-testid="stats-section">
              <Strong>User Statistics</Strong>
              {statsLoading ? (
                <div data-testid="stats-loading">Loading statistics...</div>
              ) : (
                <DescriptionList>
                  <DescriptionTerm>Total Users</DescriptionTerm>
                  <DescriptionDetails>
                    <Badge>{stats.total}</Badge>
                  </DescriptionDetails>

                  <DescriptionTerm>Active Users</DescriptionTerm>
                  <DescriptionDetails>
                    <Badge color="green">{stats.active}</Badge>
                  </DescriptionDetails>

                  <DescriptionTerm>Inactive Users</DescriptionTerm>
                  <DescriptionDetails>
                    <Badge color="red">{stats.inactive}</Badge>
                  </DescriptionDetails>
                </DescriptionList>
              )}
            </div>

            <div data-testid="users-section">
              <Strong>Users List</Strong>
              {usersLoading ? (
                <div data-testid="users-loading">Loading users...</div>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Name</TableHeader>
                      <TableHeader>Status</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>
                          <Badge color={user.status === 'active' ? 'green' : 'red'}>
                            {user.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        );
      };

      render(<LoadingStateDemo />);

      // Wait for initial render and verify both are loading
      await waitFor(() => {
        expect(screen.getByTestId('stats-loading')).toBeInTheDocument();
        expect(screen.getByTestId('users-loading')).toBeInTheDocument();
      });

      // Users should load first
      await waitFor(() => {
        expect(screen.queryByTestId('users-loading')).not.toBeInTheDocument();
      });
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByTestId('stats-loading')).toBeInTheDocument(); // Stats still loading

      // Stats should load after
      await waitFor(() => {
        expect(screen.queryByTestId('stats-loading')).not.toBeInTheDocument();
      });
      expect(screen.getByText('5')).toBeInTheDocument(); // Total users
      expect(screen.getByText('3')).toBeInTheDocument(); // Active users
    });
  });

  describe('Interactive Data Operations', () => {
    it('should handle data selection and bulk operations', async () => {
      const user = userEvent.setup();
      const onBulkDelete = vi.fn();

      const SelectableTable = () => {
        const [selectedUsers, setSelectedUsers] = React.useState<number[]>([]);
        const [selectAll, setSelectAll] = React.useState(false);

        const handleSelectAll = (checked: boolean) => {
          setSelectAll(checked);
          setSelectedUsers(checked ? mockUsers.map(u => u.id) : []);
        };

        const handleSelectUser = (userId: number, checked: boolean) => {
          if (checked) {
            setSelectedUsers(prev => [...prev, userId]);
          } else {
            setSelectedUsers(prev => prev.filter(id => id !== userId));
            setSelectAll(false);
          }
        };

        const handleBulkDelete = () => {
          onBulkDelete(selectedUsers);
          setSelectedUsers([]);
          setSelectAll(false);
        };

        React.useEffect(() => {
          setSelectAll(selectedUsers.length === mockUsers.length && mockUsers.length > 0);
        }, [selectedUsers]);

        return (
          <div>
            <div data-testid="bulk-actions">
              {selectedUsers.length > 0 && (
                <div>
                  <Text>{selectedUsers.length} users selected</Text>
                  <Button onClick={handleBulkDelete} data-testid="bulk-delete" color="red">
                    Delete Selected
                  </Button>
                </div>
              )}
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={e => handleSelectAll(e.target.checked)}
                      data-testid="select-all"
                      aria-label="Select all users"
                    />
                  </TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockUsers.map(user => (
                  <TableRow key={user.id} data-selected={selectedUsers.includes(user.id)}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={e => handleSelectUser(user.id, e.target.checked)}
                        data-testid={`select-user-${user.id}`}
                        aria-label={`Select ${user.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Strong>{user.name}</Strong>
                    </TableCell>
                    <TableCell>
                      <Text>{user.email}</Text>
                    </TableCell>
                    <TableCell>
                      <Badge color={user.status === 'active' ? 'green' : 'red'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      };

      render(<SelectableTable />);

      // Initially no users selected
      expect(screen.queryByTestId('bulk-actions')).toBeEmptyDOMElement();

      // Select individual users
      await user.click(screen.getByTestId('select-user-1'));
      await user.click(screen.getByTestId('select-user-3'));

      expect(screen.getByText('2 users selected')).toBeInTheDocument();
      expect(screen.getByTestId('bulk-delete')).toBeInTheDocument();

      // Test bulk delete
      await user.click(screen.getByTestId('bulk-delete'));
      expect(onBulkDelete).toHaveBeenCalledWith([1, 3]);

      // Selection should be cleared after bulk action
      await waitFor(() => {
        expect(screen.queryByText('users selected')).not.toBeInTheDocument();
      });

      // Test select all
      await user.click(screen.getByTestId('select-all'));
      expect(screen.getByText('5 users selected')).toBeInTheDocument();

      // All checkboxes should be checked
      expect(screen.getByTestId('select-user-1')).toBeChecked();
      expect(screen.getByTestId('select-user-2')).toBeChecked();
      expect(screen.getByTestId('select-user-5')).toBeChecked();
    });
  });
});
