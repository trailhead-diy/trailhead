# @esteban-url/web-ui

> Enhanced Catalyst UI with advanced theming system, semantic tokens, and professional CLI

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1+-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)

A professional UI component library that enhances Tailwind's official Catalyst components with advanced theming capabilities, semantic token architecture, and comprehensive CLI tooling. Maintains 1:1 visual parity with Catalyst while adding modern theming superpowers.

## Why Choose Trailhead Web UI?

### 🎨 **Advanced Theming System**

21 predefined themes using OKLCH color space with runtime switching, SSR safety, and shadcn/ui compatibility.

### 🎯 **Semantic Token Architecture**

Hierarchical color system preserving Catalyst's visual consistency while enabling powerful theming capabilities.

### 🛠️ **Professional CLI Tooling**

Smart framework detection, interactive installation, and AST-based code transformations for seamless integration.

### ⚡ **1:1 Catalyst Compatibility**

All 26 components maintain exact Catalyst visual parity and behavior while adding enhanced TypeScript support.

## Quick Start

### Installation & Setup

```bash
# Install globally for CLI access
pnpm add -g @esteban-url/web-ui

# Or install locally in your project
pnpm add @esteban-url/web-ui

# Interactive installation wizard (multiple aliases available)
trailhead-ui install    # Primary command (brand recognition)
esteban-ui install      # Namespace-consistent alias
eu-ui install           # Short alias

# Or install with specific framework
trailhead-ui install --framework nextjs
```

### Your First Component

```tsx
// After CLI installation, components are ready to use
import { Button, Alert } from './components/ui'
import { ThemeProvider, useTheme } from './components/ui/theme'

function ThemeDemo() {
  const { setTheme, themes } = useTheme()

  return (
    <div className="space-y-4">
      <Alert variant="success">Trailhead UI is ready! 🎉</Alert>

      <div className="flex gap-2">
        {themes.slice(0, 5).map((theme) => (
          <Button key={theme} variant="outline" onClick={() => setTheme(theme)}>
            {theme}
          </Button>
        ))}
      </div>

      <Button variant="solid" color="primary">
        Get Started
      </Button>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="zinc">
      <ThemeDemo />
    </ThemeProvider>
  )
}
```

## Core Concepts

### Enhanced Catalyst Components

All 26 Catalyst UI components with semantic token support:

```tsx
// Forms & Inputs
import { Button, Input, Textarea, Select, Checkbox, Radio, Switch } from './components/ui'

// Layout & Navigation
import {
  Dialog,
  Dropdown,
  Sidebar,
  SidebarLayout,
  StackedLayout,
  AuthLayout,
  Navbar,
  Pagination,
} from './components/ui'

// Data Display
import { Table, Badge, Avatar, DescriptionList, Alert, Divider } from './components/ui'

// Typography & Utilities
import { Heading, Text, Link, Fieldset, Listbox, Combobox } from './components/ui'
```

### Semantic Token System

Hierarchical tokens preserving Catalyst's visual hierarchy:

```tsx
// Text tokens by contrast level
'text-primary' // Highest contrast - headlines, key content
'text-secondary' // Medium-high contrast - body text
'text-tertiary' // Medium contrast - supporting text
'text-muted' // Lowest contrast - placeholders, disabled

// Icon state tokens
'icon-primary' // Active icons
'icon-secondary' // Navigation icons
'icon-active' // Interactive states
'icon-inactive' // Disabled states

// Border weight tokens
'border-strong' // High emphasis borders
'border-medium' // Default borders
'border-subtle' // Low emphasis borders
'border-ghost' // Barely visible borders

// Component-specific tokens
'sidebar-text-primary' // Sidebar-specific text
'table-header-text' // Table header styling
'button-text-hover' // Button hover states
```

### Functional Theme Builder

Create custom themes with type-safe builder API:

```tsx
import { createTheme } from './components/ui/theme'

// Build custom theme
const brandTheme = createTheme('Brand')
  .withPrimaryColor(
    'oklch(0.623 0.214 259.815)', // Light mode
    'oklch(0.546 0.245 262.881)' // Dark mode
  )
  .withSecondaryColor('oklch(0.967 0.001 286.375)')
  .withBackgroundColors(
    'oklch(1 0 0)', // Light background
    'oklch(0.141 0.005 285.823)' // Dark background
  )
  .withSidebarColors('custom', {
    background: 'oklch(0.95 0.002 286.375)',
    text: 'oklch(0.141 0.005 285.823)',
  })
  .build()

// Use in ThemeProvider
;<ThemeProvider themes={[...defaultThemes, brandTheme]}>
  <App />
</ThemeProvider>
```

## Advanced Features

### Runtime Theme Switching

```tsx
import { useTheme, ThemeSwitcher } from './components/ui/theme'

function CustomThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div className="flex gap-2">
      {themes.map((themeName) => (
        <button
          key={themeName}
          onClick={() => setTheme(themeName)}
          className={`px-3 py-1 rounded ${
            theme === themeName
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          {themeName}
        </button>
      ))}
    </div>
  )
}

// Or use the built-in component
;<ThemeSwitcher />
```

### Component Composition

```tsx
import { Button, Dialog, Input, Badge } from './components/ui'

function UserProfileDialog({ user, isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Dialog.Panel>
        <div className="flex items-center gap-3 mb-4">
          <Avatar src={user.avatar} alt={user.name} />
          <div>
            <Heading level={3}>{user.name}</Heading>
            <Badge color="green">{user.role}</Badge>
          </div>
        </div>

        <form className="space-y-4">
          <Input label="Email" defaultValue={user.email} type="email" />
          <Input label="Department" defaultValue={user.department} />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="solid" color="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog.Panel>
    </Dialog>
  )
}
```

## CLI Reference

### Installation Commands

```bash
# Interactive installation with prompts
trailhead-ui install

# Framework-specific installation
trailhead-ui install --framework nextjs
trailhead-ui install --framework react
trailhead-ui install --framework vite

# Custom destination directory
trailhead-ui install --destination components/ui

# Dry run to preview changes
trailhead-ui install --dry-run

# Force overwrite existing files
trailhead-ui install --force
```

### Transform Commands

Convert hardcoded colors to semantic tokens:

```bash
# Transform all components
trailhead-ui transforms

# Transform specific files
trailhead-ui transforms --files "components/**/*.tsx"

# Preview transformations
trailhead-ui transforms --dry-run

# Profile performance
trailhead-ui profile --transforms
```

### Development Commands

```bash
# Copy fresh Catalyst components (for development)
trailhead-ui dev:refresh

# Enhance existing components (coming soon)
trailhead-ui enhance

# Initialize new project (coming soon)
trailhead-ui init
```

## Framework Integration

### Next.js Setup

```tsx
// app/layout.tsx
import { ThemeProvider } from './components/ui/theme'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="zinc" enableSystem themes={['zinc', 'slate', 'blue', 'green']}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### React/Vite Setup

```tsx
// main.tsx
import { ThemeProvider } from './components/ui/theme'
import './globals.css'

function App() {
  return (
    <ThemeProvider defaultTheme="zinc">
      <YourApp />
    </ThemeProvider>
  )
}
```

### RedwoodJS SDK Setup

```tsx
// src/app/Document.tsx
import { ThemeProvider } from './components/ui/theme'

export const Document = ({ children }) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>My RedwoodJS App</title>
    </head>
    <body>
      <ThemeProvider defaultTheme="zinc">
        <div id="root">{children}</div>
      </ThemeProvider>
    </body>
  </html>
)
```

## Architecture

### Component Structure

```
components/ui/
├── button.tsx              # Wrapper component
├── lib/catalyst-button.tsx # Enhanced Catalyst implementation
├── theme/
│   ├── index.ts            # Theme system exports
│   ├── builder.ts          # Theme builder API
│   ├── presets.ts          # 21 predefined themes
│   ├── semantic-tokens.ts  # Token definitions
│   └── theme-provider.tsx  # React context provider
└── utils/
    └── cn.ts               # Class name utility
```

### Wrapper Pattern

Each component is a thin wrapper that:

- Re-exports the enhanced Catalyst implementation
- Adds semantic token support
- Preserves all original Catalyst props and behavior
- Maintains full TypeScript type safety

```tsx
// button.tsx (wrapper)
export { Button } from './lib/catalyst-button'
export type { ButtonProps } from './lib/catalyst-button'

// lib/catalyst-button.tsx (enhanced implementation)
import { Button as CatalystButton } from '@headlessui/react'
import { cn } from '../utils/cn'

export interface ButtonProps extends ComponentProps<typeof CatalystButton> {
  variant?: 'solid' | 'outline' | 'plain'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

export function Button({ className, variant = 'solid', color, ...props }) {
  return (
    <CatalystButton
      className={cn(
        // Base styles with semantic tokens
        'text-button-text bg-button-background border-button-border',
        // Variant styles
        variant === 'solid' && 'bg-primary text-primary-foreground',
        variant === 'outline' && 'border-primary text-primary',
        className
      )}
      {...props}
    />
  )
}
```

## Theme System Deep Dive

### OKLCH Color Space

Uses OKLCH for perceptual uniformity:

```typescript
// OKLCH format: oklch(lightness chroma hue)
const colors = {
  primary: {
    50: 'oklch(0.971 0.013 106.75)', // Very light
    500: 'oklch(0.623 0.214 259.815)', // Medium
    950: 'oklch(0.145 0.057 255.542)', // Very dark
  },
}
```

### Semantic Token Mapping

```typescript
// Component-specific token mappings
const buttonTokens = {
  solid: {
    background: 'var(--button-solid-background)',
    text: 'var(--button-solid-text)',
    border: 'var(--button-solid-border)',
  },
  outline: {
    background: 'var(--button-outline-background)',
    text: 'var(--button-outline-text)',
    border: 'var(--button-outline-border)',
  },
}
```

### Theme Registration

```typescript
// Register custom themes
import { registerTheme } from './components/ui/theme'

const customTheme = {
  name: 'corporate',
  colors: {
    primary: 'oklch(0.623 0.214 259.815)',
    secondary: 'oklch(0.967 0.001 286.375)',
    // ... more colors
  },
}

registerTheme(customTheme)
```

## Testing

The library includes comprehensive tests following High-ROI testing principles:

### Component Tests

```tsx
import { render, screen } from '@testing-library/react'
import { Button } from './button'
import { ThemeProvider } from './theme'

describe('Button', () => {
  test('renders with semantic tokens', () => {
    render(
      <ThemeProvider defaultTheme="zinc">
        <Button variant="solid" color="primary">
          Click me
        </Button>
      </ThemeProvider>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
  })

  test('handles theme switching', async () => {
    const { rerender } = render(
      <ThemeProvider defaultTheme="zinc">
        <Button>Test</Button>
      </ThemeProvider>
    )

    // Test theme change
    rerender(
      <ThemeProvider defaultTheme="blue">
        <Button>Test</Button>
      </ThemeProvider>
    )

    // Verify CSS custom properties updated
    expect(document.documentElement.style.getPropertyValue('--primary')).toBeTruthy()
  })
})
```

### Integration Tests

```tsx
describe('Theme System Integration', () => {
  test('theme switching updates all components', async () => {
    const { user } = setupUserEvent()

    render(
      <ThemeProvider>
        <ThemeSwitcher />
        <Button>Primary Button</Button>
        <Alert variant="success">Success message</Alert>
      </ThemeProvider>
    )

    // Switch theme
    await user.click(screen.getByText('blue'))

    // Verify all components updated
    expect(screen.getByRole('button')).toHaveThemeColors('blue')
    expect(screen.getByRole('alert')).toHaveThemeColors('blue')
  })
})
```

## Performance

### Zero Runtime Overhead

- CSS custom properties for theming (no JavaScript recalculation)
- Tree-shakeable component imports
- Optimized bundle size with subpath exports

### Build Optimizations

```typescript
// Only import what you need
import { Button } from './components/ui/button'
import { useTheme } from './components/ui/theme'

// Not the entire library
// import * from './components/ui'; // ❌ Don't do this
```

### Theme Caching

```typescript
// Themes are cached and persist across sessions
const themeCache = {
  current: 'zinc',
  preferences: {
    enableSystem: true,
    themes: ['zinc', 'blue', 'green'],
  },
}
```

## Migration Guides

### From shadcn/ui

```tsx
// Before (shadcn/ui)
import { Button } from '@/components/ui/button'
;<Button variant="default" size="default">
  Click me
</Button>

// After (Trailhead UI)
import { Button } from './components/ui/button'
;<Button variant="solid" color="primary">
  Click me
</Button>
```

### From Vanilla Catalyst

```tsx
// Before (Vanilla Catalyst)
import { Button } from '@headlessui/react'
;<Button className="bg-blue-600 text-white px-4 py-2 rounded">Click me</Button>

// After (Trailhead UI)
import { Button } from './components/ui/button'
;<Button variant="solid" color="primary">
  Click me
</Button>
```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Watch mode for tests
pnpm test:watch

# Type checking
pnpm types

# Linting
pnpm lint

# Format code
pnpm format

# Coverage report
pnpm test:coverage
```

## Component Reference

### Complete Component List

**Forms & Inputs**

- `Button` - Enhanced with semantic color variants
- `Input` - Text input with validation states
- `Textarea` - Multi-line text input
- `Select` - Dropdown selection with search
- `Checkbox` - Toggle selection
- `Radio` - Single selection from group
- `Switch` - Toggle switch component

**Layout & Structure**

- `Dialog` - Modal dialogs and overlays
- `Dropdown` - Contextual menus and actions
- `Sidebar` - Navigation sidebar component
- `SidebarLayout` - Full layout with sidebar
- `StackedLayout` - Stacked page layout
- `AuthLayout` - Authentication pages layout

**Data Display**

- `Table` - Data tables with sorting
- `Badge` - Status indicators and labels
- `Avatar` - User profile images
- `DescriptionList` - Key-value data display
- `Alert` - Notifications and messages
- `Divider` - Visual content separation

**Navigation**

- `Link` - Styled navigation links
- `Navbar` - Top navigation bar
- `Pagination` - Page navigation controls

**Typography**

- `Heading` - Semantic heading levels
- `Text` - Body text with variants

**Utilities**

- `Fieldset` - Form field grouping
- `Listbox` - Single/multi selection lists
- `Combobox` - Searchable selection input

## Browser Support

- **Chrome** 88+
- **Firefox** 89+
- **Safari** 14.1+
- **Edge** 88+

All modern browsers with CSS custom properties support.

## License

MIT - see [LICENSE](../../LICENSE) for details.

## Contributing

See [CLAUDE.md](../../CLAUDE.md) for development workflow and coding standards.

## Links

- **Repository**: [github.com/esteban-url/trailhead](https://github.com/esteban-url/trailhead)
- **Issues**: [Report bugs and request features](https://github.com/esteban-url/trailhead/issues)
- **Catalyst UI**: [Built on Tailwind's official components](https://tailwindui.com/templates/catalyst)
- **Next Themes**: [Theme persistence powered by next-themes](https://github.com/pacocoursey/next-themes)
