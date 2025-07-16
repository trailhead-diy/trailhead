import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { Button } from '../../src/components/button'
import { Link } from '../../src/components/link'
import { Input } from '../../src/components/input'
import { Select } from '../../src/components/select'
import { Textarea } from '../../src/components/textarea'
import { Checkbox } from '../../src/components/checkbox'
import { Text, Strong, Code } from '../../src/components/text'
import { Badge } from '../../src/components/badge'
import { Alert } from '../../src/components/alert'
import { Dialog, DialogTitle, DialogBody, DialogActions } from '../../src/components/dialog'
import { Dropdown, DropdownButton, DropdownMenu, DropdownItem } from '../../src/components/dropdown'
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from '../../src/components/table'
import { Fieldset, Legend as FieldsetLegend } from '../../src/components/fieldset'
import {
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from '../../src/components/description-list'

describe('Component Composition Integration Tests', () => {
  describe('Interactive Element Nesting', () => {
    it('should handle buttons with complex content composition', async () => {
      const user = userEvent.setup()
      const onAction = vi.fn()

      const ComplexButtons = () => (
        <div>
          {/* Button with icon and text */}
          <Button onClick={() => onAction('download')} data-testid="download-button">
            <span data-testid="download-icon">⬇️</span>
            <span>Download File</span>
            <Badge color="blue">New</Badge>
          </Button>

          {/* Button with nested formatting */}
          <Button onClick={() => onAction('save')} data-testid="save-button">
            <div>
              <Strong>Save Changes</Strong>
              <Text style={{ fontSize: '0.8em' }}>Ctrl+S</Text>
            </div>
          </Button>

          {/* Button with status indicator */}
          <Button onClick={() => onAction('sync')} data-testid="sync-button">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>🔄</span>
              <div>
                <Text>Sync Data</Text>
                <Badge color="green">Online</Badge>
              </div>
            </div>
          </Button>
        </div>
      )

      render(<ComplexButtons />)

      // Verify complex content renders correctly
      expect(screen.getByTestId('download-icon')).toBeInTheDocument()
      expect(screen.getByText('Download File')).toBeInTheDocument()
      expect(screen.getByText('New')).toBeInTheDocument()

      expect(screen.getByText('Save Changes')).toBeInTheDocument()
      expect(screen.getByText('Ctrl+S')).toBeInTheDocument()

      expect(screen.getByText('Sync Data')).toBeInTheDocument()
      expect(screen.getByText('Online')).toBeInTheDocument()

      // Test interactions work despite complex content
      await user.click(screen.getByTestId('download-button'))
      expect(onAction).toHaveBeenCalledWith('download')

      await user.click(screen.getByTestId('save-button'))
      expect(onAction).toHaveBeenCalledWith('save')

      await user.click(screen.getByTestId('sync-button'))
      expect(onAction).toHaveBeenCalledWith('sync')
    })

    it('should handle interactive elements in navigation compositions', async () => {
      const user = userEvent.setup()
      const onNavigate = vi.fn()
      const onAction = vi.fn()

      const NavigationComposition = () => (
        <div>
          {/* Link with button-like content */}
          <Link
            href="/dashboard"
            onClick={() => onNavigate('dashboard')}
            data-testid="dashboard-link"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span>
              <div>
                <Strong>Dashboard</Strong>
                <Text>View analytics</Text>
              </div>
              <Badge color="red">3</Badge>
            </div>
          </Link>

          {/* Dropdown with complex menu items */}
          <Dropdown>
            <DropdownButton data-testid="user-menu">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>👤</span>
                <div>
                  <Strong>John Doe</Strong>
                  <Text>Admin</Text>
                </div>
              </div>
            </DropdownButton>
            <DropdownMenu>
              <DropdownItem onClick={() => onAction('profile')}>
                <div>
                  <Strong>Profile Settings</Strong>
                  <Text>Manage your account</Text>
                </div>
              </DropdownItem>
              <DropdownItem onClick={() => onAction('preferences')}>
                <div>
                  <Strong>Preferences</Strong>
                  <Text>Customize experience</Text>
                </div>
              </DropdownItem>
              <DropdownItem onClick={() => onAction('logout')}>
                <Text style={{ color: 'red' }}>Sign Out</Text>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      )

      render(<NavigationComposition />)

      // Test link composition
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('View analytics')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()

      await user.click(screen.getByTestId('dashboard-link'))
      expect(onNavigate).toHaveBeenCalledWith('dashboard')

      // Test dropdown composition
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()

      await user.click(screen.getByTestId('user-menu'))

      // Menu items should be visible
      expect(screen.getByText('Profile Settings')).toBeInTheDocument()
      expect(screen.getByText('Manage your account')).toBeInTheDocument()

      await user.click(screen.getByText('Profile Settings'))
      expect(onAction).toHaveBeenCalledWith('profile')
    })
  })

  describe('Form Control Compositions', () => {
    it('should handle complex form field compositions', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()

      const CompositeForm = () => {
        const [formData, setFormData] = React.useState({
          profile: {
            name: '',
            email: '',
            bio: '',
          },
          preferences: {
            notifications: false,
            theme: '',
            language: '',
          },
          settings: {
            privacy: 'public',
            newsletter: true,
          },
        })

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault()
          onSubmit(formData)
        }

        const updateNestedField = (section: string, field: string, value: any) => {
          setFormData((prev) => ({
            ...prev,
            [section]: {
              ...prev[section as keyof typeof prev],
              [field]: value,
            },
          }))
        }

        return (
          <form onSubmit={handleSubmit} data-testid="composite-form">
            {/* Profile section with complex field grouping */}
            <Fieldset>
              <FieldsetLegend>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>👤</span>
                  <Strong>Profile Information</Strong>
                  <Badge color="blue">Required</Badge>
                </div>
              </FieldsetLegend>

              <div data-testid="profile-section">
                <div>
                  <Text>
                    <Strong>Full Name</Strong>
                    <span style={{ color: 'red' }}>*</span>
                  </Text>
                  <Input data-testid="name-input" placeholder="Enter your full name" />
                </div>

                <div>
                  <Text>
                    <Strong>Email Address</Strong>
                    <span style={{ color: 'red' }}>*</span>
                    <Code>Primary contact</Code>
                  </Text>
                  <Input type="email" data-testid="email-input" placeholder="your@email.com" />
                </div>

                <div>
                  <Text>
                    <Strong>Bio</Strong>
                    <Text style={{ color: 'gray' }}>(Optional)</Text>
                  </Text>
                  <Textarea
                    data-testid="bio-textarea"
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              </div>
            </Fieldset>

            {/* Preferences section with mixed controls */}
            <Fieldset>
              <FieldsetLegend>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>⚙️</span>
                  <Strong>Preferences</Strong>
                </div>
              </FieldsetLegend>

              <div data-testid="preferences-section">
                <div>
                  <Checkbox
                    checked={formData.preferences.notifications}
                    onChange={(checked) =>
                      updateNestedField('preferences', 'notifications', checked)
                    }
                    data-testid="notifications-checkbox"
                  >
                    <div>
                      <Strong>Enable Notifications</Strong>
                      <Text>Receive updates about your account</Text>
                    </div>
                  </Checkbox>
                </div>

                <div>
                  <Text>
                    <Strong>Theme Preference</Strong>
                  </Text>
                  <Select
                    value={formData.preferences.theme}
                    onChange={(e) => updateNestedField('preferences', 'theme', e.target.value)}
                    data-testid="theme-select"
                  >
                    <option value="">Choose theme...</option>
                    <option value="light">🌞 Light Mode</option>
                    <option value="dark">🌙 Dark Mode</option>
                    <option value="auto">🔄 Auto (System)</option>
                  </Select>
                </div>

                <div>
                  <Text>
                    <Strong>Language</Strong>
                    <Badge color="green">New</Badge>
                  </Text>
                  <Select
                    value={formData.preferences.language}
                    onChange={(e) => updateNestedField('preferences', 'language', e.target.value)}
                    data-testid="language-select"
                  >
                    <option value="">Select language...</option>
                    <option value="en">🇺🇸 English</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="fr">🇫🇷 Français</option>
                  </Select>
                </div>
              </div>
            </Fieldset>

            {/* Settings with description list composition */}
            <Fieldset>
              <FieldsetLegend>
                <Strong>Privacy Settings</Strong>
              </FieldsetLegend>

              <DescriptionList data-testid="settings-section">
                <DescriptionTerm>
                  <Strong>Profile Visibility</Strong>
                </DescriptionTerm>
                <DescriptionDetails>
                  <Select
                    value={formData.settings.privacy}
                    onChange={(e) => updateNestedField('settings', 'privacy', e.target.value)}
                    data-testid="privacy-select"
                  >
                    <option value="public">🌍 Public</option>
                    <option value="friends">👥 Friends Only</option>
                    <option value="private">🔒 Private</option>
                  </Select>
                  <Text style={{ fontSize: '0.9em', color: 'gray' }}>
                    Control who can see your profile information
                  </Text>
                </DescriptionDetails>

                <DescriptionTerm>
                  <Strong>Newsletter Subscription</Strong>
                </DescriptionTerm>
                <DescriptionDetails>
                  <Checkbox
                    checked={formData.settings.newsletter}
                    onChange={(checked) => updateNestedField('settings', 'newsletter', checked)}
                    data-testid="newsletter-checkbox"
                  >
                    <div>
                      <Text>Subscribe to our newsletter</Text>
                      <Text style={{ fontSize: '0.8em', color: 'gray' }}>
                        Monthly updates and tips
                      </Text>
                    </div>
                  </Checkbox>
                </DescriptionDetails>
              </DescriptionList>
            </Fieldset>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Button type="submit" data-testid="save-button">
                <span>💾</span>
                <Strong>Save Changes</Strong>
              </Button>
              <Button type="button" data-testid="cancel-button">
                Cancel
              </Button>
            </div>
          </form>
        )
      }

      render(<CompositeForm />)

      // Verify complex nested structure renders
      expect(screen.getByText('Profile Information')).toBeInTheDocument()
      expect(screen.getByText('Required')).toBeInTheDocument()
      expect(screen.getByText('Primary contact')).toBeInTheDocument()
      expect(screen.getByText('(Optional)')).toBeInTheDocument()

      // Fill out form with nested data
      await user.clear(screen.getByTestId('name-input'))
      await user.type(screen.getByTestId('name-input'), 'John Doe')
      await user.clear(screen.getByTestId('email-input'))
      await user.type(screen.getByTestId('email-input'), 'john@example.com')
      await user.clear(screen.getByTestId('bio-textarea'))
      await user.type(screen.getByTestId('bio-textarea'), 'Software developer')

      await user.click(screen.getByTestId('notifications-checkbox'))
      await user.selectOptions(screen.getByTestId('theme-select'), 'dark')
      await user.selectOptions(screen.getByTestId('language-select'), 'en')

      await user.selectOptions(screen.getByTestId('privacy-select'), 'friends')

      // Verify form fields have the typed values
      expect(screen.getByTestId('name-input')).toHaveValue('John Doe')
      expect(screen.getByTestId('email-input')).toHaveValue('john@example.com')
      expect(screen.getByTestId('bio-textarea')).toHaveValue('Software developer')

      // Verify other form controls
      expect(screen.getByTestId('notifications-checkbox')).toBeChecked()
      expect(screen.getByTestId('theme-select')).toHaveValue('dark')
      expect(screen.getByTestId('language-select')).toHaveValue('en')
      expect(screen.getByTestId('privacy-select')).toHaveValue('friends')

      // Test form submission workflow
      await user.click(screen.getByTestId('save-button'))
      expect(onSubmit).toHaveBeenCalled()
    })
  })

  describe('Data Display Compositions', () => {
    it('should handle complex table compositions with interactive elements', async () => {
      const user = userEvent.setup()
      const onUserAction = vi.fn()

      const users = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'admin',
          status: 'active',
          lastLogin: '2023-12-01',
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'user',
          status: 'inactive',
          lastLogin: '2023-11-15',
        },
        {
          id: 3,
          name: 'Bob Johnson',
          email: 'bob@example.com',
          role: 'moderator',
          status: 'active',
          lastLogin: '2023-12-03',
        },
      ]

      const InteractiveTable = () => (
        <Table data-testid="users-table">
          <TableHead>
            <TableRow>
              <TableHeader>
                <Strong>User Information</Strong>
              </TableHeader>
              <TableHeader>
                <Strong>Role & Status</Strong>
              </TableHeader>
              <TableHeader>
                <Strong>Activity</Strong>
              </TableHeader>
              <TableHeader>
                <Strong>Actions</Strong>
              </TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                <TableCell>
                  <div>
                    <Strong>{user.name}</Strong>
                    <Text style={{ color: 'gray' }}>
                      <Code>{user.email}</Code>
                    </Text>
                  </div>
                </TableCell>

                <TableCell>
                  <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                    <Badge
                      color={
                        user.role === 'admin' ? 'red' : user.role === 'moderator' ? 'blue' : 'zinc'
                      }
                    >
                      {user.role}
                    </Badge>
                    <Badge color={user.status === 'active' ? 'green' : 'red'}>{user.status}</Badge>
                  </div>
                </TableCell>

                <TableCell>
                  <DescriptionList>
                    <DescriptionTerm>
                      <Text style={{ fontSize: '0.8em' }}>Last Login</Text>
                    </DescriptionTerm>
                    <DescriptionDetails>
                      <Text>{user.lastLogin}</Text>
                    </DescriptionDetails>
                  </DescriptionList>
                </TableCell>

                <TableCell>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Dropdown>
                      <DropdownButton data-testid={`actions-${user.id}`}>
                        <span>⚙️</span>
                        <Text>Actions</Text>
                      </DropdownButton>
                      <DropdownMenu>
                        <DropdownItem onClick={() => onUserAction('edit', user.id)}>
                          <div>
                            <Strong>Edit User</Strong>
                            <Text>Modify user details</Text>
                          </div>
                        </DropdownItem>
                        <DropdownItem onClick={() => onUserAction('permissions', user.id)}>
                          <div>
                            <Strong>Permissions</Strong>
                            <Text>Manage access rights</Text>
                          </div>
                        </DropdownItem>
                        <DropdownItem onClick={() => onUserAction('delete', user.id)}>
                          <Text style={{ color: 'red' }}>
                            <Strong>Delete User</Strong>
                          </Text>
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>

                    <Button
                      onClick={() => onUserAction('message', user.id)}
                      data-testid={`message-${user.id}`}
                    >
                      <span>💬</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )

      render(<InteractiveTable />)

      // Verify complex table structure
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getAllByText('active')).toHaveLength(2) // John and Bob are both active
      expect(screen.getByText('2023-12-01')).toBeInTheDocument()

      // Test dropdown actions
      await user.click(screen.getByTestId('actions-1'))
      expect(screen.getByText('Edit User')).toBeInTheDocument()
      expect(screen.getByText('Modify user details')).toBeInTheDocument()

      await user.click(screen.getByText('Edit User'))
      expect(onUserAction).toHaveBeenCalledWith('edit', 1)

      // Test direct button action
      await user.click(screen.getByTestId('message-2'))
      expect(onUserAction).toHaveBeenCalledWith('message', 2)
    })

    it.skip('should handle modal compositions with complex content', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()

      const ComplexModal = () => {
        const [isOpen, setIsOpen] = React.useState(false)
        const [selectedItems, setSelectedItems] = React.useState<string[]>([])

        const items = [
          { id: 'item1', name: 'Document.pdf', size: '2.3 MB', type: 'PDF' },
          { id: 'item2', name: 'Image.jpg', size: '1.8 MB', type: 'Image' },
          { id: 'item3', name: 'Spreadsheet.xlsx', size: '4.1 MB', type: 'Excel' },
        ]

        const handleItemToggle = (itemId: string, checked: boolean) => {
          if (checked) {
            setSelectedItems((prev) => [...prev, itemId])
          } else {
            setSelectedItems((prev) => prev.filter((id) => id !== itemId))
          }
        }

        const handleConfirm = () => {
          onConfirm(selectedItems)
          setIsOpen(false)
        }

        return (
          <div>
            <Button onClick={() => setIsOpen(true)} data-testid="open-modal">
              Delete Files
            </Button>

            <Dialog open={isOpen} onClose={() => setIsOpen(false)} data-testid="delete-modal">
              <DialogTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.5em' }}>🗑️</span>
                  <Strong>Delete Files</Strong>
                  <Badge color="red">Destructive</Badge>
                </div>
              </DialogTitle>

              <DialogBody>
                <Alert open onClose={() => {}}>
                  <div>
                    <Strong>Warning!</Strong>
                    <Text>
                      This action cannot be undone. Selected files will be permanently deleted.
                    </Text>
                  </div>
                </Alert>

                <Text style={{ marginTop: '16px' }}>
                  <Strong>Select files to delete:</Strong>
                </Text>

                <div data-testid="file-list">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{ padding: '8px', border: '1px solid #ddd', marginTop: '8px' }}
                    >
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onChange={(checked) => handleItemToggle(item.id, checked)}
                        data-testid={`select-${item.id}`}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                          }}
                        >
                          <div>
                            <Strong>{item.name}</Strong>
                            <Text style={{ color: 'gray' }}>{item.size}</Text>
                          </div>
                          <Badge color="blue">{item.type}</Badge>
                        </div>
                      </Checkbox>
                    </div>
                  ))}
                </div>

                {selectedItems.length > 0 && (
                  <div data-testid="selection-summary" style={{ marginTop: '16px' }}>
                    <Text>
                      <Strong>{selectedItems.length} file(s) selected for deletion</Strong>
                    </Text>
                    <DescriptionList>
                      <DescriptionTerm>Total size:</DescriptionTerm>
                      <DescriptionDetails>
                        <Code>
                          {selectedItems
                            .map((id) => items.find((item) => item.id === id)?.size)
                            .join(', ')}
                        </Code>
                      </DescriptionDetails>
                    </DescriptionList>
                  </div>
                )}
              </DialogBody>

              <DialogActions>
                <Button onClick={() => setIsOpen(false)} data-testid="cancel-button">
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={selectedItems.length === 0}
                  color="red"
                  data-testid="confirm-delete"
                >
                  <span>🗑️</span>
                  <Strong>
                    Delete {selectedItems.length > 0 ? `${selectedItems.length} Files` : 'Files'}
                  </Strong>
                </Button>
              </DialogActions>
            </Dialog>
          </div>
        )
      }

      render(<ComplexModal />)

      // Open modal
      await user.click(screen.getByTestId('open-modal'))

      // Wait for modal to be fully rendered
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Verify complex modal content
      expect(screen.getByText('Destructive')).toBeInTheDocument()
      expect(screen.getByText('Warning!')).toBeInTheDocument()

      // Wait for file content to load
      await waitFor(() => {
        expect(screen.getByText('Document.pdf')).toBeInTheDocument()
      })
      expect(screen.getByText('2.3 MB')).toBeInTheDocument()
      expect(screen.getByText('PDF')).toBeInTheDocument()

      // Initially delete button should be disabled
      expect(screen.getByTestId('confirm-delete')).toBeDisabled()

      // Select files
      await user.click(screen.getByTestId('select-item1'))
      await user.click(screen.getByTestId('select-item3'))

      // Selection summary should appear
      expect(screen.getByTestId('selection-summary')).toBeInTheDocument()
      expect(screen.getByText('2 file(s) selected for deletion')).toBeInTheDocument()

      // Delete button should be enabled
      expect(screen.getByTestId('confirm-delete')).toBeEnabled()
      expect(screen.getByText('Delete 2 Files')).toBeInTheDocument()

      // Confirm deletion
      await user.click(screen.getByTestId('confirm-delete'))
      expect(onConfirm).toHaveBeenCalledWith(['item1', 'item3'])

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument()
      })
    })
  })

  describe('Mixed Content Compositions', () => {
    it('should handle rich text content with interactive elements', () => {
      const CommentComponent = () => {
        const [likes, setLikes] = React.useState(5)
        const [isLiked, setIsLiked] = React.useState(false)

        const handleLike = () => {
          if (isLiked) {
            setLikes((prev) => prev - 1)
            setIsLiked(false)
          } else {
            setLikes((prev) => prev + 1)
            setIsLiked(true)
          }
        }

        return (
          <div data-testid="comment-component">
            <div>
              <Strong>John Doe</Strong>
              <Badge color="blue">Contributor</Badge>
              <Text style={{ color: 'gray', fontSize: '0.9em' }}>2 hours ago</Text>
            </div>

            <div style={{ margin: '12px 0' }}>
              <Text>
                Great work on the new feature! I especially like the <Code>useTheme</Code> hook
                implementation. The <Strong>performance improvements</Strong> are noticeable.
              </Text>

              <Text>Here's a quick example of how I'm using it:</Text>

              <Code style={{ display: 'block', padding: '8px', background: '#f5f5f5' }}>
                {`const { theme, setTheme } = useTheme()
return <Button color={theme.primary}>Click me</Button>`}
              </Code>

              <Text>
                Looking forward to the{' '}
                <Link href="/docs/theming" data-testid="docs-link">
                  theming documentation
                </Link>{' '}
                updates!
              </Text>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Button onClick={handleLike} data-testid="like-button" data-liked={isLiked}>
                <span>{isLiked ? '❤️' : '🤍'}</span>
                <Text>{likes}</Text>
              </Button>

              <Button data-testid="reply-button">
                <span>💬</span>
                <Text>Reply</Text>
              </Button>

              <Dropdown>
                <DropdownButton data-testid="comment-menu">
                  <span>⋯</span>
                </DropdownButton>
                <DropdownMenu>
                  <DropdownItem>
                    <Text>Edit</Text>
                  </DropdownItem>
                  <DropdownItem>
                    <Text>Share</Text>
                  </DropdownItem>
                  <DropdownItem>
                    <Text style={{ color: 'red' }}>Report</Text>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        )
      }

      const { container } = render(<CommentComponent />)

      // Verify rich text composition
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Contributor')).toBeInTheDocument()
      expect(screen.getByText('2 hours ago')).toBeInTheDocument()

      // Verify mixed text formatting
      expect(screen.getByText('useTheme')).toBeInTheDocument()
      expect(screen.getByText('performance improvements')).toBeInTheDocument()
      expect(screen.getByTestId('docs-link')).toHaveAttribute('href', '/docs/theming')

      // Verify code block
      const codeBlocks = container.querySelectorAll('code')
      expect(codeBlocks.length).toBeGreaterThan(1) // Both inline and block code

      // Verify interactive elements
      expect(screen.getByTestId('like-button')).toBeInTheDocument()
      expect(screen.getByTestId('reply-button')).toBeInTheDocument()
      expect(screen.getByTestId('comment-menu')).toBeInTheDocument()
    })

    it('should handle dashboard widget compositions', async () => {
      const user = userEvent.setup()

      const DashboardWidget = () => {
        const [timeRange, setTimeRange] = React.useState('7d')
        const [isExpanded, setIsExpanded] = React.useState(false)

        const stats = {
          visitors: 1234,
          revenue: 5678,
          conversion: 3.2,
          change: '+12%',
        }

        return (
          <div data-testid="dashboard-widget" style={{ border: '1px solid #ddd', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Strong>Analytics Overview</Strong>
                <Badge color="green">Live</Badge>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  data-testid="time-range-select"
                >
                  <option value="1d">Last 24h</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </Select>

                <Button onClick={() => setIsExpanded(!isExpanded)} data-testid="expand-button">
                  {isExpanded ? '⬆️' : '⬇️'}
                </Button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginTop: '16px',
              }}
            >
              <div>
                <Text style={{ color: 'gray' }}>Visitors</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Strong style={{ fontSize: '1.5em' }}>{stats.visitors.toLocaleString()}</Strong>
                  <Badge color="green">{stats.change}</Badge>
                </div>
              </div>

              <div>
                <Text style={{ color: 'gray' }}>Revenue</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Strong style={{ fontSize: '1.5em' }}>${stats.revenue.toLocaleString()}</Strong>
                  <Badge color="green">{stats.change}</Badge>
                </div>
              </div>

              <div>
                <Text style={{ color: 'gray' }}>Conversion Rate</Text>
                <Strong style={{ fontSize: '1.5em' }}>{stats.conversion}%</Strong>
              </div>

              <div>
                <Button data-testid="view-details">
                  <span>📊</span>
                  <Text>View Details</Text>
                </Button>
              </div>
            </div>

            {isExpanded && (
              <div
                data-testid="expanded-content"
                style={{ marginTop: '16px', padding: '16px', background: '#f9f9f9' }}
              >
                <Strong>Detailed Breakdown</Strong>

                <Table style={{ marginTop: '8px' }}>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Source</TableHeader>
                      <TableHeader>Visitors</TableHeader>
                      <TableHeader>Conversion</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>🔍</span>
                          <Text>Search</Text>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Strong>623</Strong>
                      </TableCell>
                      <TableCell>
                        <Badge color="green">4.1%</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>📱</span>
                          <Text>Social</Text>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Strong>411</Strong>
                      </TableCell>
                      <TableCell>
                        <Badge color="blue">2.8%</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )
      }

      render(<DashboardWidget />)

      // Verify widget composition
      expect(screen.getByText('Analytics Overview')).toBeInTheDocument()
      expect(screen.getByText('Live')).toBeInTheDocument()
      expect(screen.getByText('1,234')).toBeInTheDocument()
      expect(screen.getByText('$5,678')).toBeInTheDocument()
      expect(screen.getByText('3.2%')).toBeInTheDocument()

      // Test time range selection
      await user.selectOptions(screen.getByTestId('time-range-select'), '30d')
      expect(screen.getByDisplayValue('Last 30 days')).toBeInTheDocument()

      // Test expansion
      expect(screen.queryByTestId('expanded-content')).not.toBeInTheDocument()

      await user.click(screen.getByTestId('expand-button'))
      expect(screen.getByTestId('expanded-content')).toBeInTheDocument()
      expect(screen.getByText('Detailed Breakdown')).toBeInTheDocument()
      expect(screen.getByText('Search')).toBeInTheDocument()
      expect(screen.getByText('623')).toBeInTheDocument()
    })
  })
})
