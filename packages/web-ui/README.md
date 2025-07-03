# @esteban-url/trailhead-web-ui

Enhanced Catalyst UI components with advanced theming, TypeScript support, and professional CLI tooling.

**Part of the [Trailhead Monorepo](../../README.md)** - A collection of UI libraries and CLI frameworks.

## Features

- ✨ **26 Catalyst Components** - Complete UI library with semantic color tokens
- 🎨 **21 Built-in Themes** - Professional themes using OKLCH color space
- 🔄 **Runtime Theme Switching** - Dynamic theme changes with next-themes integration
- 🌙 **Dark Mode Support** - Automatic and manual dark mode
- 📱 **SSR Compatible** - Works with Next.js, Vite, RedwoodJS, and more
- 🎯 **Zero Runtime Overhead** - CSS custom properties for optimal performance
- 🔧 **Theme Builder API** - Functional theme creation with shadcn/ui compatibility
- 💪 **Full TypeScript Support** - Complete type definitions and IntelliSense
- 🚀 **Professional CLI** - Interactive installation with smart framework detection
- 🎯 **Semantic Tokens** - Consistent theming with semantic color system

## Installation

### From Private Repository (Recommended)

```bash
# Install the UI library
pnpm add github:esteban-url/trailhead#packages/web-ui

# Install required peer dependencies
pnpm add next-themes react react-dom

# If using the CLI globally
pnpm add -g github:esteban-url/trailhead#packages/web-ui
```

### Using the CLI

```bash
# If installed globally
trailhead-ui install

# If installed locally
pnpm trailhead-ui install

# Or using npx with the private repo
npx --package github:esteban-url/trailhead#packages/web-ui trailhead-ui install
```

## Quick Start

### Using CLI (Recommended)

```bash
# Install and setup your project
pnpm add -g github:esteban-url/trailhead#packages/web-ui
trailhead-ui install

# Or install locally and use directly
pnpm add github:esteban-url/trailhead#packages/web-ui
pnpm trailhead-ui install

# CLI will detect your framework and setup everything
# Interactive prompts guide you through:
# - Framework detection (Next.js, Vite, etc.)
# - File conflict resolution
# - Dependency management
# - Configuration setup
```

### Manual Setup

```tsx
import { ThemeProvider, Button, Card } from '@esteban-url/trailhead-web-ui'

function App() {
  return (
    <ThemeProvider defaultTheme="purple">
      <Card>
        <h1>Welcome to Trailhead UI</h1>
        <Button>Get Started</Button>
      </Card>
    </ThemeProvider>
  )
}
```

## Available Themes

Trailhead UI includes 21 professionally designed themes:

**Vibrant Themes**: `red`, `rose`, `orange`, `yellow`, `green`, `blue`, `violet`, `purple`  
**Neutral Themes**: `zinc`, `slate`, `stone`, `gray`, `neutral`  
**Special Themes**: `catalyst` (original Catalyst UI colors)

## Documentation

📚 **[View Full Documentation](./docs/README.md)**

### Quick Links

- [Installation Guide](./docs/installation.md) - Complete setup instructions
- [Getting Started](./docs/getting-started.md) - Basic usage examples
- [Components Reference](./docs/components.md) - All 26 components
- [Configuration](./docs/configuration.md) - Theme configuration and customization
- [Theme Registry API](./docs/theme-registry.md) - Advanced theme management
- [API Reference](./docs/api-reference.md) - Complete API documentation
- [Examples & Patterns](./docs/examples.md) - Real-world examples

## Theme Registry

Create custom themes programmatically:

```tsx
import { themeRegistry, buildTheme } from '@esteban-url/trailhead-web-ui'

// Build a custom theme
const customTheme = buildTheme('my-brand')
  .withPrimaryColor('oklch(0.7 0.15 250)')
  .withRadius('0.75rem')
  .build()

// Register and use it
themeRegistry.register('my-brand', customTheme)
```

Perfect for:

- SaaS applications with white-labeling
- Multi-tenant platforms
- Theme marketplaces
- A/B testing different designs

## Transform System

Trailhead UI includes a powerful AST-based transform system that automatically converts hardcoded colors to semantic tokens:

```bash
# Transform components to use semantic tokens
pnpm run-transforms

# Profile transformation performance
pnpm profile
```

The transform system (`/src/transforms/`) features:

- **AST-based transformations** for accurate code modifications
- **Component-specific mappings** for each UI component
- **Semantic token resolution** converting colors like `zinc-500` → `muted-foreground`
- **Performance profiling** to optimize transformation speed
- **Comprehensive architecture** detailed in [AST Transformer Documentation](./docs/ast-transformer.md)

This ensures your components automatically adapt to different themes while maintaining visual consistency.

## Components

All 26 Catalyst UI components with semantic color tokens:

**Forms**: Button, Input, Textarea, Select, Checkbox, Radio, Switch  
**Layout**: Dialog, Dropdown, Sidebar, SidebarLayout, StackedLayout, AuthLayout  
**Data**: Table, Badge, Avatar, DescriptionList  
**Navigation**: Link, Navbar, Pagination  
**Typography**: Heading, Text  
**Utilities**: Alert, Divider, Fieldset, Listbox, Combobox

## Contributing

See [Contributing Guide](./docs/CONTRIBUTING.md) for development setup and guidelines.

## License

MIT © [Esteban Dalel R](https://github.com/esteban-url)
