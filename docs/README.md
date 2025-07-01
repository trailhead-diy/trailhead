# Trailhead Documentation

Welcome to the Trailhead monorepo documentation. This directory contains monorepo-wide documentation and architectural decisions.

## Documentation Structure

- `README.md` - This file, main documentation hub
- `CONTRIBUTING.md` - Contribution guidelines for the monorepo
- `architecture/` - Architecture decisions and monorepo structure

## Package Documentation

- [Web UI Package](../packages/web-ui/docs/) - Component library documentation
- [CLI Package](../packages/cli/) - CLI framework documentation

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Development mode
pnpm dev
```

## Monorepo Structure

The Trailhead monorepo follows modern best practices:

- **packages/**: Public packages (@trailhead/\*)
- **apps/**: Applications and demos
- **tooling/**: Internal shared configurations (@repo/\*)
- **docs/**: Monorepo documentation

## Development Workflow

1. Work from the root directory using `pnpm` commands
2. Use `--filter` flag for package-specific operations
3. Follow conventional commit format for changes
4. All packages share common tooling configurations
