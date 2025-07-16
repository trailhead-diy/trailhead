# Trailhead

> Modern toolkit for building production-ready CLIs and themeable UI libraries

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![PNPM](https://img.shields.io/badge/PNPM-10.12+-orange.svg)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.5+-red.svg)](https://turbo.build/)

Trailhead provides modern, type-safe foundations for building robust command-line applications and beautiful UI libraries. Built with functional programming principles, comprehensive testing utilities, and advanced theming capabilities.

## Quick Start

### CLI Framework

```bash
# Install the functional CLI framework
pnpm add @esteban-url/cli

# Create your first command
import { createCommand } from '@esteban-url/cli';

const myCommand = createCommand({
  name: 'build',
  description: 'Build your project',
  action: async () => {
    // Result-based error handling, no exceptions
    return { success: true, data: 'Build completed!' };
  }
});
```

### UI Library

```bash
# Install the enhanced Catalyst UI library
pnpm add @esteban-url/web-ui

# Interactive setup with professional CLI
npx trailhead-ui install

# Start using enhanced components with advanced theming
import { Button } from './components/ui/button';
import { ThemeProvider } from './components/ui/theme';
```

## What's Included

### 🛠️ [@esteban-url/cli](./packages/cli) - Functional CLI Framework

- **Result-based error handling** - Explicit error propagation, no exceptions
- **Functional programming** - Pure functions, immutable data, composition
- **Comprehensive testing** - Built-in mocks, assertions, and test utilities
- **Rich developer experience** - Progress tracking, spinners, and beautiful output
- **Type safety** - Full TypeScript support with strict error handling

### 🎨 [@esteban-url/web-ui](./packages/web-ui) - Enhanced Catalyst UI

- **Advanced theming system** - 21 predefined themes with runtime switching
- **Semantic color tokens** - Consistent theming across all components
- **Professional CLI tooling** - Interactive installation and code transforms
- **1:1 Catalyst compatibility** - All 26 components with enhanced TypeScript support
- **OKLCH color space** - Perceptual uniformity for beautiful themes

### 🚀 Demo Applications

- **[Next.js Demo](./apps/demos/next)** - Showcase all UI components with theme switching
- **[RedwoodJS SDK Demo](./apps/demos/rwsdk)** - Edge-ready deployment with Waku SSR

## Architecture

```
trailhead/
├── packages/
│   ├── cli/                    # @esteban-url/cli - Functional CLI framework
│   └── web-ui/                 # @esteban-url/web-ui - Enhanced Catalyst UI
├── apps/demos/
│   ├── next/                   # Next.js demo application
│   └── rwsdk/                  # RedwoodJS SDK demo
└── tooling/                    # Shared configurations and utilities
```

**Monorepo Architecture:**

- **Turborepo** - Optimized build system with intelligent caching
- **PNPM Workspaces** - Efficient package management and dependency resolution
- **Shared Tooling** - Common TypeScript, linting, and formatting configurations
- **Functional Design** - Pure functions and immutable patterns throughout

## Key Features

### CLI Framework Highlights

- **🎯 Explicit Error Handling**: Uses Result types instead of exceptions
- **🧪 Testing First**: Built-in mocking and assertion utilities
- **⚡ Performance**: Command caching and optimized execution patterns
- **🎨 Beautiful Output**: Chalk styling, progress bars, and spinners
- **🔧 Modular**: Tree-shakeable subpath exports

### UI Library Highlights

- **🎨 Advanced Theming**: Functional theme builder with OKLCH colors
- **🎯 Semantic Tokens**: Hierarchical color system preserving visual consistency
- **⚡ Runtime Switching**: Change themes without page reload
- **🛠️ Professional CLI**: Smart framework detection and interactive setup
- **🔄 AST Transforms**: Convert hardcoded colors to semantic tokens

## Development Commands

```bash
# Install dependencies
pnpm install

# Development mode (all packages)
pnpm dev

# Build all packages
pnpm build

# Run tests across packages
pnpm test

# Lint and type check
pnpm lint && pnpm types

# Format code
pnpm format

# Package-specific commands
pnpm dev --filter=@trailhead/cli
pnpm test --filter=@esteban-url/trailhead-web-ui
```

## Getting Started

### For CLI Development

1. **Install the CLI framework**: `pnpm add @esteban-url/cli`
2. **Read the guide**: [CLI Framework Documentation](./packages/cli/README.md)
3. **Explore examples**: Check out [CLI examples](./packages/cli/examples/)
4. **Build and test**: Use the comprehensive testing utilities

### For UI Development

1. **Install the UI library**: `pnpm add @esteban-url/web-ui`
2. **Interactive setup**: Run `npx trailhead-ui install`
3. **Read the guide**: [UI Library Documentation](./packages/web-ui/README.md)
4. **Explore themes**: Try the 21 predefined themes and create custom ones

### For Contributors

1. **Clone and setup**: `git clone` → `pnpm install` → `pnpm build`
2. **Follow the workflow**: Issue-driven development with feature branches
3. **Read guidelines**: [Contributing Guide](./CLAUDE.md)
4. **Test thoroughly**: Use high-ROI testing approach

## Examples

### Functional CLI with Result Types

```typescript
import { createCommand, Result } from '@esteban-url/cli'

const deployCommand = createCommand({
  name: 'deploy',
  description: 'Deploy your application',
  options: {
    env: {
      type: 'string',
      description: 'Target environment',
      required: true,
    },
  },
  action: async ({ env }): Promise<Result<string, Error>> => {
    // Explicit error handling
    const buildResult = await buildApp()
    if (!buildResult.success) {
      return buildResult // Propagate error
    }

    const deployResult = await deployToEnv(env)
    return deployResult
  },
})
```

### Advanced Theme Switching

```typescript
import { createTheme, useTheme } from '@esteban-url/web-ui';

// Create custom theme
const brandTheme = createTheme('Brand')
  .withPrimaryColor('oklch(0.623 0.214 259.815)')
  .withSecondaryColor('oklch(0.967 0.001 286.375)')
  .build();

// Use in components
function ThemeDemo() {
  const { setTheme, themes } = useTheme();

  return (
    <div>
      {themes.map(theme => (
        <Button key={theme} onClick={() => setTheme(theme)}>
          {theme}
        </Button>
      ))}
    </div>
  );
}
```

## Documentation

- **[CLI Framework Guide](./packages/cli/README.md)** - Complete CLI development guide
- **[UI Library Guide](./packages/web-ui/README.md)** - Theming and component usage
- **[Development Workflow](./CLAUDE.md)** - Contributing guidelines and principles
- **[API References](./docs/)** - Detailed API documentation

## Community

- **Issues**: [GitHub Issues](https://github.com/esteban-url/trailhead/issues)
- **Discussions**: [GitHub Discussions](https://github.com/esteban-url/trailhead/discussions)
- **Contributing**: See [CLAUDE.md](./CLAUDE.md) for guidelines

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with ❤️ using functional programming principles, modern TypeScript, and comprehensive testing.**
