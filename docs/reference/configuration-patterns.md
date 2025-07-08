---
type: reference
title: Configuration Patterns
description: Configuration inheritance patterns and standards used across the Trailhead monorepo
---

# Configuration Patterns

This document explains the configuration inheritance patterns used across the Trailhead monorepo.

## Configuration Strategy

### Root-Level Configuration

All shared configuration is defined at the root level with comprehensive settings:

- `prettier.config.js` - Extends `@repo/prettier-config` with direct import
- `.npmrc` - Comprehensive pnpm configuration with GitHub packages setup
- `.oxlintrc.json` - Base linting rules for all packages

### Package-Level Configuration

Packages extend root configuration with package-specific overrides:

- **Prettier**: Packages inherit from root config automatically
- **NPM Registry**: Packages define scoped registry `@esteban-url:registry=https://npm.pkg.github.com`
- **Oxlint**: Packages extend root config with specific overrides

### Demo Apps Configuration

Demo apps use workspace-independent configuration:

- `.npmrc` with `ignore-workspace=true` for independence
- No registry configuration (uses defaults)
- Prevents parent script execution

## Configuration Inheritance

### Prettier Configuration

```
Root: prettier.config.js → @repo/prettier-config
├── Packages: Inherit automatically
├── Templates: Inline values matching shared config
└── Demo Apps: Inherit automatically
```

### NPM Registry Configuration

```
Root: .npmrc → Comprehensive pnpm settings
├── Packages: .npmrc → @esteban-url scoped registry
└── Demo Apps: .npmrc → Workspace independence
```

### Linting Configuration

```
Root: .oxlintrc.json → Base rules
├── Packages: .oxlintrc.json → Extends root + overrides
└── Demo Apps: Inherit from root
```

## Key Principles

1. **Single Source of Truth**: Shared configuration lives in `tooling/` or root
2. **Minimal Overrides**: Packages only override when necessary
3. **Workspace Independence**: Demo apps work independently of parent workspace
4. **Consistent Namespacing**: All packages use `@esteban-url` namespace
5. **Documentation**: Configuration includes explanatory comments

## Configuration Files

### Root Level

- `prettier.config.js` - Code formatting
- `.npmrc` - Package management
- `.oxlintrc.json` - Base linting rules

### Package Level

- `.npmrc` - Scoped registry configuration
- `.oxlintrc.json` - Package-specific linting overrides

### Demo Apps

- `.npmrc` - Workspace independence configuration
- No additional overrides required

## Troubleshooting

### Missing Configurations

If a package lacks configuration files, it inherits from the root level automatically.

### Registry Issues

Ensure `@esteban-url` namespace is used consistently across all package-level `.npmrc` files.

### Workspace Independence

Demo apps use `ignore-workspace=true` to function independently of the parent workspace.
