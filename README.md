# Trailhead Monorepo

Modern Turborepo monorepo containing enhanced Catalyst UI components, CLI frameworks, and development tooling.

## Overview

Trailhead provides:
- **[@trailhead/web-ui](./packages/web-ui)** - Enhanced Catalyst UI with advanced theming system
- **[@trailhead/cli](./packages/cli)** - Reusable CLI framework for development tools
- **Demo Applications** - Next.js and RedwoodJS examples showcasing all components
- **Shared Tooling** - Common configurations for linting, TypeScript, and testing

## Structure

```
trailhead/
├── packages/                    # Public packages
│   ├── cli/                    # @trailhead/cli - CLI framework
│   └── web-ui/                 # @trailhead/web-ui - UI component library
├── apps/                       # Applications
│   └── demos/                  # Demo applications (Next.js, RedwoodJS)
├── tooling/                    # Internal tooling packages
│   ├── oxlint-config/         # @repo/oxlint-config - Shared linting
│   ├── typescript-config/     # @repo/typescript-config - TS configs
│   ├── prettier-config/       # @repo/prettier-config - Code formatting
│   └── vitest-config/         # @repo/vitest-config - Test configuration
├── docs/                       # Monorepo documentation
└── scripts/                    # Monorepo-wide scripts
```

## Quick Start

### Development Setup

```bash
# Clone the repository
git clone github:esteban-url/trailhead
cd trailhead

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Start development mode
pnpm dev
```

### Package-Specific Commands

```bash
# Work on specific package
pnpm build --filter=@trailhead/web-ui
pnpm test --filter=@trailhead/cli
pnpm lint --filter=@trailhead/web-ui

# Work on multiple packages
pnpm build --filter=./packages/*
```

## Installation for Projects

Since this is a private repository, install packages using GitHub references:

```bash
# Install the UI library
pnpm add github:esteban-url/trailhead#packages/web-ui

# Install the CLI framework
pnpm add github:esteban-url/trailhead#packages/cli
```

## Packages

### [@trailhead/web-ui](./packages/web-ui)
Enhanced Catalyst UI with advanced theming system:
- 21 predefined themes using OKLCH color space
- Runtime theme switching with next-themes integration
- Semantic color tokens for consistent theming
- Professional CLI with smart framework detection

### [@trailhead/cli](./packages/cli)
Reusable CLI framework extracted from the UI project:
- Complete error handling system with Result types
- Validation pipeline with composable validators
- FileSystem abstraction with Node.js and memory implementations
- Configuration management with Zod schemas

## Development

Built with modern tooling:
- **pnpm workspaces** for package management and dependency resolution
- **Turborepo** for optimized build system with intelligent caching
- **Renovate** for automated dependency updates and security monitoring
- **Changesets** for coordinated versioning and releases
- **TypeScript** for type safety across all packages
- **OXLint** for fast, modern linting
- **Vitest** for testing with optimal performance

## Documentation

- [Web UI Documentation](./packages/web-ui/README.md) - Component library usage
- [CLI Framework Documentation](./packages/cli/README.md) - CLI development guide
- [Contributing Guide](./docs/CONTRIBUTING.md) - Development workflow
- [Monorepo Architecture](./CLAUDE.md) - Detailed development guidance
