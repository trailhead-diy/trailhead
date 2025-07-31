---
type: how-to
title: 'How to Contribute to Trailhead'
description: 'Development workflow and contribution guidelines for the Trailhead monorepo'
prerequisites:
  - 'Node.js 18+ installed'
  - 'PNPM 8+ installed'
  - 'Git knowledge'
  - 'Basic TypeScript familiarity'
related:
  - /packages/cli/docs/README.md
  - /packages/create-cli/docs/README.md
  - /docs/README.md
---

# How to Contribute to Trailhead

Thank you for contributing to the Trailhead monorepo! This guide covers the development workflow and contribution guidelines.

## Development Setup

1. **Prerequisites**
   - Node.js 18+
   - PNPM 8+

2. **Package Manager Notes**

   The monorepo uses different PNPM versions:
   - **Root**: PNPM 8.15.0 (specified in root package.json)
   - **Individual packages**: May specify their own PNPM versions for specific feature requirements

   This is intentional to support different feature requirements. The root version manages the monorepo infrastructure while individual packages can specify their own versions for optimal compatibility.

3. **Installation**

   ```bash
   pnpm install
   ```

4. **Build**

   ```bash
   pnpm build
   ```

## Development Workflow

### Working with Packages

```bash
# Work on specific package
pnpm build --filter=@esteban-url/cli
pnpm test --filter=@esteban-url/create-cli

# Work on multiple packages
pnpm build --filter=./packages/*
```

### Making Changes

1. Create a feature branch from `main`
2. Make your changes in the appropriate package
3. Write tests for new functionality
4. Run tests: `pnpm test`
5. Run linting: `pnpm lint`
6. Commit using conventional commit format

### Commit Format

Use conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `test:` - Test changes
- `chore:` - Maintenance tasks

## Code Standards

- Follow existing code style and patterns
- Use semantic color tokens, never hardcoded colors
- Write high-ROI tests focusing on user behavior
- Follow functional programming principles
- Use TypeScript with strict type checking

## Package Structure

- **packages/**: Public packages (@esteban-url/\*)
- **apps/**: Applications and demos
- **tooling/**: Internal configurations (@repo/\*)

All internal tooling packages use the `@repo/*` namespace and are marked as private.
