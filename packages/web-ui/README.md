# @esteban-url/trailhead-web-ui

Enhanced Catalyst UI components with default color system, semantic tokens, and professional CLI.

## Overview

@esteban-url/trailhead-web-ui provides a comprehensive UI component library built on top of Tailwind's official Catalyst components, featuring:

- **26 Enhanced Components** with semantic color tokens
- **Default Color System** for consistent component styling without prop passing
- **Professional CLI** with smart framework detection and interactive setup
- **Zero Performance Overhead** using CSS custom properties
- **Full TypeScript Support** with comprehensive type definitions

## Quick Start

### Installation

```bash
# Install globally for CLI access
pnpm add -g github:esteban-url/trailhead#packages/web-ui

# Or install locally in your project
pnpm add github:esteban-url/trailhead#packages/web-ui
```

### CLI Setup

```bash
# Interactive installation wizard
trailhead-ui install

# Framework-specific installation
trailhead-ui install --framework nextjs
trailhead-ui install --framework react
trailhead-ui install --framework vite
```

### Basic Usage

```tsx
import { Button, Alert, DefaultColorProvider } from './components/ui';

export default function App() {
  return (
    <DefaultColorProvider colors={{ button: 'green', badge: 'blue' }}>
      <Alert variant="success">Welcome to Trailhead UI!</Alert>
      <Button variant="solid">Get Started</Button> {/* Uses default green color */}
    </DefaultColorProvider>
  );
}
```

## Features

### Components

All 26 Catalyst UI components with enhanced TypeScript interfaces:

**Forms**: Button, Input, Textarea, Select, Checkbox, Radio, Switch  
**Layout**: Dialog, Dropdown, Sidebar, SidebarLayout, StackedLayout, AuthLayout  
**Data**: Table, Badge, Avatar, DescriptionList  
**Navigation**: Link, Navbar, Pagination  
**Typography**: Heading, Text  
**Utilities**: Alert, Divider, Fieldset, Listbox, Combobox

### Color System

- **Default Color System**: Set component colors once without repetitive prop passing
- **Semantic Tokens**: Never hardcode colors, always use semantic tokens
- **Color Consistency**: Maintain uniform styling across your application

### CLI Features

- **Smart Detection**: Automatically detects framework and dependencies
- **Interactive Setup**: Guided component installation with conflict resolution
- **Transform Commands**: Convert hardcoded colors to semantic tokens
- **Performance Profiling**: Analyze and optimize transform performance
- **Dry Run Mode**: Preview changes before applying

## Documentation

- **[Getting Started](docs/tutorial/getting-started.md)** - Your first component installation
- **[How-To Guides](docs/how-to/)** - Task-oriented solutions
- **[API Reference](docs/reference/)** - Complete technical documentation
- **[Architecture](docs/explanation/)** - Design principles and concepts

## CLI Commands

```bash
trailhead-ui install              # Interactive installation wizard
trailhead-ui transforms           # Transform components to semantic tokens
trailhead-ui dev:refresh          # Copy fresh Catalyst components
trailhead-ui profile              # Profile transform performance
trailhead-ui --help               # Show all available commands
```

## Development

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Type checking
pnpm types

# Linting
pnpm lint
```

## Framework Support

- **Next.js** - App Router and Pages Router
- **React** - Create React App and Vite
- **RedwoodJS** - SDK integration
- **Vite** - Native support with fast dev server

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and coding standards.

## Links

- **Repository**: [github.com/esteban-url/trailhead](https://github.com/esteban-url/trailhead)
- **Issues**: [Report bugs and request features](https://github.com/esteban-url/trailhead/issues)
- **Catalyst UI**: [Built on Tailwind's official React components](https://tailwindui.com/templates/catalyst)
