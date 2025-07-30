# Trailhead

> Modern toolkit for building production-ready CLIs with functional programming patterns

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![PNPM](https://img.shields.io/badge/PNPM-10.12+-orange.svg)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.5+-red.svg)](https://turbo.build/)

Trailhead provides modern, type-safe foundations for building robust command-line applications. Built with functional programming principles, comprehensive testing utilities, and explicit error handling.

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

### Create Your Own CLI

```bash
# Generate a new CLI project
pnpm create @esteban-url/cli my-cli

# Navigate to your project
cd my-cli

# Start developing
pnpm dev
```

## What's Included

### 🛠️ [@esteban-url/cli](./packages/cli) - Functional CLI Framework

- **Result-based error handling** - Explicit error propagation, no exceptions
- **Functional programming** - Pure functions, immutable data, composition
- **Comprehensive testing** - Built-in mocks, assertions, and test utilities
- **Rich developer experience** - Progress tracking, spinners, and beautiful output
- **Type safety** - Full TypeScript support with strict error handling

### 🚀 [@esteban-url/create-cli](./packages/create-cli) - CLI Project Generator

- **Quick project scaffolding** - Generate production-ready CLI projects in seconds
- **Best practices built-in** - Pre-configured with TypeScript, testing, and linting
- **Flexible templates** - Choose between minimal and full-featured templates
- **Monorepo support** - Optimized for both standalone and monorepo development
- **Interactive setup** - Guided configuration with sensible defaults

### 🚀 Demo Applications

- **[Next.js Demo](./apps/demos/next)** - Example Next.js application structure
- **[RedwoodJS SDK Demo](./apps/demos/rwsdk)** - Edge-ready deployment with Waku SSR

## Architecture

```
trailhead/
├── packages/
│   ├── cli/                    # @esteban-url/cli - Functional CLI framework
│   └── create-cli/             # @esteban-url/create-cli - CLI generator
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

### Create CLI Highlights

- **🎨 Project Templates**: Pre-configured templates for different CLI types
- **🎯 Best Practices**: Built-in linting, formatting, and testing setup
- **⚡ Fast Setup**: Interactive prompts with smart defaults
- **🛠️ Flexible Output**: Generate standalone or monorepo packages
- **🔄 Git Ready**: Automatic git initialization with proper .gitignore

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
pnpm test --filter=@esteban-url/create-cli
```

## Getting Started

### For CLI Development

1. **Install the CLI framework**: `pnpm add @esteban-url/cli`
2. **Read the guide**: [CLI Framework Documentation](./packages/cli/README.md)
3. **Read the documentation**: Review the comprehensive API docs
4. **Build and test**: Use the comprehensive testing utilities

### For Creating New CLIs

1. **Generate a CLI**: `pnpm create @esteban-url/cli my-awesome-cli`
2. **Navigate to project**: `cd my-awesome-cli`
3. **Start developing**: `pnpm dev`
4. **Read the guide**: [Create CLI Documentation](./packages/create-cli/README.md)

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

### Creating a New CLI Project

```bash
# Generate with interactive prompts
pnpm create @esteban-url/cli my-cli

# Or with options
pnpm create @esteban-url/cli my-cli \
  --author "Your Name" \
  --template full \
  --git

# Start developing
cd my-cli
pnpm dev
```

## Documentation

- **[CLI Framework Guide](./packages/cli/README.md)** - Complete CLI development guide
- **[Create CLI Guide](./packages/create-cli/README.md)** - CLI project generation
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
