# API Reference

Complete API documentation for Trailhead UI.

> **Note**: This documentation is part of the [Trailhead monorepo](../../../README.md).

## Core Exports

### Components

All 27 Catalyst UI components are exported with enhanced TypeScript support:

```tsx
import {
  // Forms
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Switch,

  // Layout
  Dialog,
  Dropdown,
  Sidebar,
  SidebarLayout,
  StackedLayout,

  // Data Display
  Table,
  Badge,
  Avatar,
  DescriptionList,

  // Navigation
  Link,
  Navbar,
  Pagination,

  // Feedback
  Alert,

  // Typography
  Heading,
  Text,

  // Utilities
  Divider,
  Fieldset,
  Listbox,
  Combobox,

  // Layout Components
  AuthLayout,
} from '@esteban-url/trailhead-web-ui';
```

### Theme System

```tsx
import {
  // React Integration
  ThemeProvider,
  useTheme,
  ThemeSwitcher,

  // Theme Registry
  themeRegistry,

  // Theme Building
  createTheme,

  // Theme Presets
  themePresets,

  // Types
  type TrailheadThemeConfig,
  type ShadcnTheme,
  type ComponentThemeOverrides,
} from '@esteban-url/trailhead-web-ui';
```

### Utilities

```tsx
import {
  // Class name utility
  cn,
} from '@esteban-url/trailhead-web-ui';
```

## Component Props

### Button

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: 'blue' | 'white' | 'dark/zinc' | 'light' | 'dark/white' | 'red' | 'amber' | 'zinc';
  outline?: boolean;
  plain?: boolean;
  children: React.ReactNode;
}
```

### Input

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}
```

### Dialog

```tsx
interface DialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  children: React.ReactNode;
}

interface DialogTitleProps {
  children: React.ReactNode;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
}

interface DialogActionsProps {
  children: React.ReactNode;
}
```

### Badge

```tsx
interface BadgeProps extends React.ComponentPropsWithoutRef<'span'> {
  color?: // Traditional colors
  | 'red'
    | 'orange'
    | 'amber'
    | 'yellow'
    | 'lime'
    | 'green'
    | 'emerald'
    | 'teal'
    | 'cyan'
    | 'sky'
    | 'blue'
    | 'indigo'
    | 'violet'
    | 'purple'
    | 'fuchsia'
    | 'pink'
    | 'rose'
    | 'zinc'
    // Semantic tokens (theme-aware)
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'muted'
    | 'destructive';
}
```

The Badge component supports both traditional color names and semantic color tokens that adapt to the current theme.

**Examples:**

```tsx
// Traditional colors
<Badge color="red">Error</Badge>
<Badge color="green">Success</Badge>

// Semantic tokens (theme-aware)
<Badge color="primary">Important</Badge>
<Badge color="destructive">Critical</Badge>
```

### Table

```tsx
interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

interface TableHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}
```

## Theme API

### ThemeProvider Props

```tsx
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string; // Default: 'zinc'
  storageKey?: string; // Default: 'theme'
  enableSystem?: boolean; // Default: true
}
```

### useTheme Hook

```tsx
interface UseThemeResult {
  theme: string | undefined; // Current theme name
  setTheme: (theme: string) => void; // Set theme
  resolvedTheme: string | undefined; // Resolved theme (system aware)
  themes: string[]; // All available themes
  systemTheme: 'light' | 'dark' | undefined; // System preference
}

const { theme, setTheme, resolvedTheme, themes, systemTheme } = useTheme();
```

### Theme Registry

The theme registry manages all available themes:

```tsx
// Register a new theme
themeRegistry.register(name: string, config: TrailheadThemeConfig): void

// Get a specific theme
themeRegistry.get(name: string): TrailheadThemeConfig | undefined

// List all available theme names
themeRegistry.list(): string[]

// Remove a theme
themeRegistry.remove(name: string): void

// Clear all custom themes (keeps built-in themes)
themeRegistry.clear(): void

// Apply a theme to the document
themeRegistry.apply(name: string, mode?: 'light' | 'dark'): void
```

### Theme Builder

```tsx
// Functional theme builder with method chaining
const theme = createTheme('my-theme')
  .withPrimaryColor('oklch(0.7 0.15 250)')
  .withSecondaryColor('oklch(0.6 0.1 200)')
  .withBackgroundColors('oklch(0.98 0 0)', 'oklch(0.1 0 0)')
  .withRadius('0.5rem')
  .withComponentOverrides({
    button: {
      'button-radius': '0.375rem',
      'button-shadow': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    },
  })
  .build();

// Register the theme
themeRegistry.register('my-theme', theme);
```

## Type Definitions

### TrailheadThemeConfig

```tsx
interface TrailheadThemeConfig {
  name: string;
  light: ThemeConfig;
  dark: ThemeConfig;
  radius?: string;
}
```

### ThemeConfig

```tsx
interface ThemeConfig {
  colors: ColorConfig;
  radius?: string;
}
```

### ColorConfig

```tsx
interface ColorConfig {
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  muted: string;
  'muted-foreground': string;
  accent: string;
  'accent-foreground': string;
  destructive: string;
  'destructive-foreground': string;
  border: string;
  input: string;
  ring: string;
  'chart-1'?: string;
  'chart-2'?: string;
  'chart-3'?: string;
  'chart-4'?: string;
  'chart-5'?: string;
  [key: string]: string | undefined; // Component overrides
}
```

### ComponentOverrides

```tsx
interface ComponentOverrides {
  [componentName: string]: {
    [cssVariable: string]: string;
  };
}

// Example:
const overrides: ComponentOverrides = {
  button: {
    'button-radius': '0.375rem',
    'button-shadow': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  },
  card: {
    'card-padding': '1.5rem',
  },
};
```

## Utility Functions

### cn (Class Names)

Combine class names with proper handling:

```tsx
cn(...inputs: ClassValue[]): string

// Usage
cn('base-class', condition && 'conditional-class', {
  'object-class': true,
  'false-class': false
})
// Returns: "base-class conditional-class object-class"
```

## Theme Presets

Trailhead UI includes 8 predefined themes:

```tsx
import { themePresets } from '@esteban-url/trailhead-web-ui';

// Available themes
const redTheme = themePresets.red();
const roseTheme = themePresets.rose();
const orangeTheme = themePresets.orange();
const greenTheme = themePresets.green();
const blueTheme = themePresets.blue();
const yellowTheme = themePresets.yellow();
const violetTheme = themePresets.violet();
const catalystTheme = themePresets.catalyst(); // Original Catalyst colors
```

## CSS Custom Properties

All themes use these CSS variables:

```css
/* Color tokens */
--background
--foreground
--card
--card-foreground
--popover
--popover-foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--muted
--muted-foreground
--accent
--accent-foreground
--destructive
--destructive-foreground
--border
--input
--ring

/* Chart colors */
--chart-1
--chart-2
--chart-3
--chart-4
--chart-5

/* Component overrides (optional) */
--button-*
--input-*
--card-*
/* etc */
```

## Event Handlers

Standard React event handlers are supported:

```tsx
// Click events
onClick?: (event: React.MouseEvent<HTMLElement>) => void

// Change events
onChange?: (event: React.ChangeEvent<HTMLElement>) => void

// Focus events
onFocus?: (event: React.FocusEvent<HTMLElement>) => void
onBlur?: (event: React.FocusEvent<HTMLElement>) => void

// Form events
onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void

// Keyboard events
onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void
onKeyUp?: (event: React.KeyboardEvent<HTMLElement>) => void
```

## Accessibility Props

All components support standard ARIA attributes:

```tsx
// ARIA labels
aria-label?: string
aria-labelledby?: string
aria-describedby?: string

// ARIA states
aria-hidden?: boolean
aria-expanded?: boolean
aria-checked?: boolean
aria-disabled?: boolean
aria-invalid?: boolean
aria-required?: boolean

// ARIA properties
role?: string
tabIndex?: number
```

## SSR Support

The ThemeProvider uses next-themes internally which automatically prevents flash of unstyled content (FOUC). Simply ensure you have `suppressHydrationWarning` on your html tag:

```tsx
<html lang="en" suppressHydrationWarning>
  <body>{children}</body>
</html>
```

## CLI Reference

Trailhead UI includes a CLI for installing and managing UI components in your project. The CLI is built on top of [@esteban-url/trailhead-cli](../../cli/README.md), which provides the underlying framework capabilities (Result types, validation, filesystem abstractions, etc.).

### Installation

```bash
# Install Trailhead UI from the monorepo
pnpm add github:esteban-url/trailhead#packages/web-ui

# Use the CLI
pnpm exec trailhead-ui install
```

> **Note**: For detailed information about the CLI framework architecture, patterns, and utilities, see the [@esteban-url/trailhead-cli documentation](../../cli/README.md).

### Commands

The Trailhead UI CLI provides the following commands specifically for UI component management:

#### install

Install and configure Trailhead UI components in your project:

```bash
trailhead-ui install [options]

Options:
  -f, --framework <type>         Framework type (auto-detected)
  -d, --destination-dir <path>   Destination directory (default: components/th)
  --catalyst-dir <path>          Path to catalyst-ui-kit directory
  --force                        Overwrite existing files
  --dry-run                      Preview changes without making them
  --no-config                    Skip config file generation
  --overwrite                    Always overwrite configs
  -i, --interactive              Run in interactive mode
  -v, --verbose                  Show detailed output
  -h, --help                     Display help
```

The install command:

- Auto-detects your project framework (Next.js, Vite, etc.)
- Installs all 26 UI components with semantic color tokens
- Sets up theme configuration
- Manages dependencies

#### transforms (Development Tool)

Transform components to use semantic tokens:

```bash
trailhead-ui transforms

# Interactive tool for transforming colors to semantic tokens
# Used during development to maintain components
```

This command uses AST-based transformations to convert hardcoded colors (like `zinc-500`) to semantic tokens (like `muted-foreground`).

#### dev:refresh (Development Tool)

Copy fresh Catalyst components for development:

```bash
trailhead-ui dev:refresh

# Copies original Catalyst components with catalyst- prefix
# Useful for comparing or developing new transformations
```

#### profile (Development Tool)

Profile transform performance:

```bash
trailhead-ui profile

# Analyze performance of color transformations
# Helps optimize the transformation process
```

#### init (Coming Soon)

Initialize a new Trailhead UI project:

```bash
trailhead-ui init [options]

# 🚧 This command is under development
# Will scaffold a new project with Trailhead UI pre-configured
# Options will include:
#   -n, --name <name>       Project name
#   -t, --template <type>   Project template
```

#### add (Coming Soon)

Add individual components to your project:

```bash
trailhead-ui add [components...] [options]

# 🚧 This command is under development
# Will allow selective component installation
# Example: trailhead-ui add button dialog table
# Options will include:
#   -f, --force             Overwrite existing files
```

## Next Steps

- [Getting Started](./getting-started.md) - Basic usage
- [Components](./components.md) - Component details
- [Examples](./examples.md) - Real-world patterns
- [Theme Registry](./theme-registry.md) - Advanced theming
