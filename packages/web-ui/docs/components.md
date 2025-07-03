# Components

All 27 Catalyst UI components with enhanced TypeScript support and theming.

## Theming System

Trailhead UI provides a comprehensive theming system that works alongside the original Catalyst components:

- **Semantic color tokens** - Components can use theme-aware colors (primary, secondary, muted, etc.)
- **Progressive enhancement** - Components are being progressively transformed to use semantic tokens
- **Dark mode support** - Automatic color adjustments for light/dark modes
- **Runtime theme switching** - Change themes dynamically without reloading
- **Backward compatibility** - Original Catalyst color props still work where not yet transformed

### Semantic Token Support

All components have been enhanced to support semantic color tokens while maintaining backward compatibility with original Catalyst color props. The semantic token system enables:

- **Theme-aware colors** - Components automatically adapt to the current theme
- **Dark mode support** - Seamless light/dark mode switching
- **Custom themes** - Create your own themes using the theme builder
- **Progressive enhancement** - Original color props still work alongside semantic tokens

## Theme Components

### ThemeProvider

Provides theme context and manages theme switching. Wraps next-themes internally for SSR-safe theme management.

```tsx
import { ThemeProvider } from '@esteban-url/trailhead-web-ui';

// All available props
<ThemeProvider
  defaultTheme="zinc" // Default theme name (default: 'zinc')
  storageKey="theme" // localStorage key (default: 'theme')
  enableSystem={true} // Enable system preference detection (default: true)
>
  <App />
</ThemeProvider>;
```

Also exports the `useTheme()` hook for accessing theme state:

```tsx
import { useTheme } from '@esteban-url/trailhead-web-ui';

const { theme, setTheme, themes, resolvedTheme } = useTheme();
```

### ThemeSwitcher

Pre-built UI component for theme selection with dark mode toggle and quick theme access.

```tsx
import { ThemeSwitcher } from '@esteban-url/trailhead-web-ui';

// All available props
<ThemeSwitcher
  className="w-64" // Additional CSS classes
  showDarkModeToggle={true} // Show dark/light toggle (default: true)
  showQuickSelect={true} // Show quick theme buttons (default: true)
  maxQuickSelectThemes={5} // Number of quick select buttons (default: 5)
/>;
```

Features:

- Dropdown select for all available themes
- Quick select buttons for frequently used themes
- Dark/light mode toggle with emoji indicators (☀️/🌙)
- SSR-safe with loading skeleton until mounted

## Available Themes

Trailhead UI includes 21 predefined themes:

**From theme builder presets:**

- `zinc` - Default neutral theme (also available: zinc-dark)
- `slate`, `stone`, `gray`, `neutral` - Neutral color variations
- `purple` - Purple accent theme

**Extended color themes:**

- `red`, `rose` - Warm red tones
- `orange`, `yellow` - Warm accent colors
- `green` - Nature-inspired theme
- `blue` - Cool blue tones
- `violet` - Purple-blue blend

**Special themes:**

- `catalyst` - Original Catalyst UI theme with blue primary

All themes automatically include light and dark mode variants (e.g., `zinc` and `zinc-dark`).

### Theme API Exports

```tsx
import {
  // Theme management
  themeRegistry, // Registry for managing themes
  createTheme, // Create a theme configuration

  // TypeScript types
  type TrailheadThemeConfig, // Full theme configuration
  type ShadcnTheme, // shadcn/ui compatible theme
  type ComponentThemeOverrides, // Component-specific overrides

  // Utility
  cn, // clsx + tailwind-merge utility
} from '@esteban-url/trailhead-web-ui';
```

## Component Categories

### Forms

#### Button

Interactive button with multiple variants and color options.

```tsx
import { Button } from '@esteban-url/trailhead-web-ui'

// Variants
<Button>Default</Button>
<Button outline>Outline</Button>
<Button plain>Plain</Button>

// Colors (still accepts Catalyst color props)
<Button color="blue">Blue Button</Button>
<Button color="red">Red Button</Button>
<Button color="zinc">Zinc Button</Button>

// States
<Button disabled>Disabled</Button>
<Button className="w-full">Full Width</Button>

// Theme-aware styling with className
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Theme Primary
</Button>
```

**Note**: Button still accepts the original Catalyst `color` prop with all Tailwind colors. Use `className` for semantic theme colors.

#### Input

Text input with validation states.

```tsx
import { Input } from '@esteban-url/trailhead-web-ui'

<Input placeholder="Enter text" />
<Input type="email" required />
<Input invalid aria-describedby="error" />
<Input disabled />
```

#### Textarea

Multi-line text input.

```tsx
import { Textarea } from '@esteban-url/trailhead-web-ui'

<Textarea rows={4} placeholder="Enter description" />
<Textarea resizable={false} />
```

#### Select

Native select dropdown.

```tsx
import { Select } from '@esteban-url/trailhead-web-ui';
<Select>
  <option>Option 1</option>
  <option>Option 2</option>
</Select>;
```

#### Checkbox

Checkbox input with label.

```tsx
import { Checkbox } from '@esteban-url/trailhead-web-ui'

<Checkbox name="terms" />
<Checkbox defaultChecked />
<Checkbox disabled />
```

#### Radio

Radio button groups.

```tsx
import { Radio, RadioGroup } from '@esteban-url/trailhead-web-ui';
<RadioGroup name="option">
  <Radio value="1">Option 1</Radio>
  <Radio value="2">Option 2</Radio>
</RadioGroup>;
```

#### Switch

Toggle switch control.

```tsx
import { Switch, SwitchField } from '@esteban-url/trailhead-web-ui';
<SwitchField>
  <Switch name="notifications" />
  <label>Enable notifications</label>
</SwitchField>;
```

### Layout

#### Dialog

Modal dialogs and alerts.

```tsx
import { Dialog, DialogTitle, DialogDescription } from '@esteban-url/trailhead-web-ui';
<Dialog open={open} onClose={setOpen}>
  <DialogTitle>Confirm Action</DialogTitle>
  <DialogDescription>Are you sure you want to continue?</DialogDescription>
</Dialog>;
```

#### Dropdown

Dropdown menus with items.

```tsx
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
} from '@esteban-url/trailhead-web-ui';
<Dropdown>
  <DropdownButton>Options</DropdownButton>
  <DropdownMenu>
    <DropdownItem>Edit</DropdownItem>
    <DropdownItem>Delete</DropdownItem>
  </DropdownMenu>
</Dropdown>;
```

#### Sidebar & SidebarLayout

Navigation sidebar components.

```tsx
import { Sidebar, SidebarLayout } from '@esteban-url/trailhead-web-ui';
<SidebarLayout>
  <Sidebar>{/* Sidebar content */}</Sidebar>
  <main>{/* Main content */}</main>
</SidebarLayout>;
```

#### AuthLayout

Authentication page layout.

```tsx
import { AuthLayout } from '@esteban-url/trailhead-web-ui';
<AuthLayout>
  <form>{/* Login/signup form */}</form>
</AuthLayout>;
```

#### StackedLayout

Stacked layout with navbar.

```tsx
import { StackedLayout, Navbar } from '@esteban-url/trailhead-web-ui';
<StackedLayout navbar={<Navbar>{/* Nav items */}</Navbar>}>
  <main>{/* Main content */}</main>
</StackedLayout>;
```

### Data Display

#### Table

Data tables with sorting.

```tsx
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@esteban-url/trailhead-web-ui';
<Table>
  <TableHead>
    <TableRow>
      <TableHeader>Name</TableHeader>
      <TableHeader>Email</TableHeader>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>;
```

#### Badge

Status indicators and labels with color options.

```tsx
import { Badge } from '@esteban-url/trailhead-web-ui'

// Default styling
<Badge>Default</Badge>

// Color prop (still accepts Catalyst colors)
<Badge color="blue">Blue Badge</Badge>
<Badge color="green">Success</Badge>
<Badge color="red">Error</Badge>
<Badge color="zinc">Zinc Badge</Badge>

// Theme-aware styling with className
<Badge className="bg-destructive text-destructive-foreground">Error</Badge>
<Badge className="bg-secondary text-secondary-foreground">Secondary</Badge>
<Badge className="bg-primary text-primary-foreground">Primary</Badge>
```

**Note**: Badge still accepts the original Catalyst `color` prop. Use `className` for semantic theme colors.

#### Avatar

User profile images.

```tsx
import { Avatar } from '@esteban-url/trailhead-web-ui'

<Avatar src="/user.jpg" alt="User" />
<Avatar initials="JD" />
<Avatar square />
```

#### DescriptionList

Key-value pair lists.

```tsx
import {
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails,
} from '@esteban-url/trailhead-web-ui';
<DescriptionList>
  <DescriptionTerm>Name</DescriptionTerm>
  <DescriptionDetails>John Doe</DescriptionDetails>

  <DescriptionTerm>Email</DescriptionTerm>
  <DescriptionDetails>john@example.com</DescriptionDetails>
</DescriptionList>;
```

### Navigation

#### Link

Styled anchor links.

```tsx
import { Link } from '@esteban-url/trailhead-web-ui'

<Link href="/about">About Us</Link>
<Link href="/contact" target="_blank">Contact</Link>
```

#### Navbar

Top navigation bar.

```tsx
import { Navbar, NavbarSection, NavbarItem } from '@esteban-url/trailhead-web-ui';
<Navbar>
  <NavbarSection>
    <NavbarItem href="/">Home</NavbarItem>
    <NavbarItem href="/products">Products</NavbarItem>
  </NavbarSection>
</Navbar>;
```

#### Pagination

Page navigation controls.

```tsx
import { Pagination, PaginationPrevious, PaginationNext } from '@esteban-url/trailhead-web-ui';
<Pagination>
  <PaginationPrevious href="?page=1" />
  <PaginationNext href="?page=3" />
</Pagination>;
```

### Feedback

#### Alert

Alert messages and notifications using semantic theme colors.

```tsx
import { Alert } from '@esteban-url/trailhead-web-ui'

// Default alert (uses theme colors automatically)
<Alert>Default alert message</Alert>

// Custom styling with className for semantic variants
<Alert className="border-destructive/50 text-destructive">Error message</Alert>
<Alert className="border-green-500/50 text-green-700">Success message</Alert>
<Alert className="border-yellow-500/50 text-yellow-700">Warning message</Alert>
<Alert className="border-blue-500/50 text-blue-700">Info message</Alert>

// Size prop for width constraints
<Alert size="sm">Small width alert</Alert>
<Alert size="md">Medium width alert</Alert>
<Alert size="lg">Large width alert</Alert>
```

**Note**: Alert is fully converted to semantic tokens and does not accept a `color` prop. Use `className` for styling.

### Typography

#### Heading

Semantic heading elements.

```tsx
import { Heading } from '@esteban-url/trailhead-web-ui'

<Heading level={1}>Page Title</Heading>
<Heading level={2}>Section Title</Heading>
<Heading level={3}>Subsection</Heading>
```

#### Text

Styled text with variants.

```tsx
import { Text } from '@esteban-url/trailhead-web-ui'

<Text>Default text</Text>
<Text size="sm">Small text</Text>
<Text weight="semibold">Bold text</Text>
<Text className="text-muted-foreground">Muted text</Text>
```

### Utilities

#### Divider

Visual separators.

```tsx
import { Divider } from '@esteban-url/trailhead-web-ui'

<Divider />
<Divider soft />
```

#### Fieldset

Form field grouping.

```tsx
import { Fieldset, Legend } from '@esteban-url/trailhead-web-ui';
<Fieldset>
  <Legend>User Information</Legend>
  {/* Form fields */}
</Fieldset>;
```

### Advanced

#### Listbox

Custom select with search.

```tsx
import { Listbox, ListboxOption } from '@esteban-url/trailhead-web-ui';
<Listbox value={selected} onChange={setSelected}>
  <ListboxOption value="1">Option 1</ListboxOption>
  <ListboxOption value="2">Option 2</ListboxOption>
</Listbox>;
```

#### Combobox

Autocomplete input.

```tsx
import { Combobox, ComboboxOption } from '@esteban-url/trailhead-web-ui';
<Combobox value={value} onChange={setValue}>
  <ComboboxOption value="react">React</ComboboxOption>
  <ComboboxOption value="vue">Vue</ComboboxOption>
</Combobox>;
```

## Component Patterns

### Form with Validation

```tsx
import { Input, Button, Text } from '@esteban-url/trailhead-web-ui';

function Form() {
  const [error, setError] = useState('');

  return (
    <form className="space-y-4">
      <div>
        <Input type="email" invalid={!!error} aria-describedby="email-error" />
        {error && (
          <Text id="email-error" className="text-destructive" size="sm">
            {error}
          </Text>
        )}
      </div>
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Modal with Actions

```tsx
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogActions,
  Button,
} from '@esteban-url/trailhead-web-ui';

function ConfirmDialog({ open, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Item</DialogTitle>
      <DialogDescription>This action cannot be undone.</DialogDescription>
      <DialogActions>
        <Button plain onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={onConfirm}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### Data Table with Actions

```tsx
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
} from '@esteban-url/trailhead-web-ui';

function DataTable({ data }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Name</TableHeader>
          <TableHeader>Status</TableHeader>
          <TableHeader>Actions</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(item => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              <Badge
                className={
                  item.active ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'
                }
              >
                {item.active ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              <Dropdown>
                <DropdownButton plain>•••</DropdownButton>
                <DropdownMenu>
                  <DropdownItem>Edit</DropdownItem>
                  <DropdownItem>Delete</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Accessibility

All components include:

- Proper ARIA attributes
- Keyboard navigation
- Focus management
- Screen reader support

## TypeScript Support

All components are fully typed:

```tsx
import type { ButtonProps, InputProps } from '@esteban-url/trailhead-web-ui';

// Use component prop types
const MyButton: React.FC<ButtonProps> = props => {
  return <Button {...props} />;
};

// Extend components
interface CustomInputProps extends InputProps {
  label: string;
}
```

## Migration Status

The component library is actively being migrated to use semantic color tokens. Current status:

**✅ Fully Converted Components:**

- Alert - Uses semantic tokens exclusively
- Dialog components - Theme-aware backgrounds and borders
- Layout components - Use theme colors for backgrounds

**🔄 Hybrid Components (retain color props):**

- Button - Accepts `color` prop but can use semantic tokens via className
- Badge - Accepts `color` prop but can use semantic tokens via className
- Other form components - In various stages of conversion

**📋 Conversion Approach:**

1. Components maintain backward compatibility during migration
2. Original Catalyst color props work where not yet converted
3. All components accept className for theme-aware styling
4. Progressive enhancement allows gradual adoption

## Next Steps

- [Examples](./examples.md) - More component examples
- [Getting Started](./getting-started.md) - Basic usage
- [API Reference](./api-reference.md) - Complete API documentation
