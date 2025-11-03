# How to Generate and Integrate API Documentation

This guide explains how to generate API documentation from TypeScript source code using TypeDoc and integrate it with the existing Diátaxis-based documentation framework.

## Overview

The Trailhead monorepo uses TypeDoc with the `typedoc-plugin-markdown` plugin to generate Markdown-based API documentation from TypeScript source code. This approach allows seamless integration with the existing documentation while maintaining type safety and automatic updates.

## Prerequisites

- Node.js 20+ and pnpm installed
- TypeScript packages with proper JSDoc comments
- Monorepo structure with packages in `packages/` directory

## Quick Start

### 1. Generate API Documentation

From the monorepo root, run:

```bash
# Generate API docs for all packages
pnpm docs:api

# Generate with clean output (removes old docs first)
pnpm docs:api:clean

# Watch mode for development
pnpm docs:api:watch

# Validate documentation generation
pnpm docs:api:validate
```

### 2. Generated Output Structure

The optimized API documentation uses a flattened structure with consolidated files:

```
docs/
├── reference/
│   └── api/                                  # Auto-generated TypeDoc output
│       ├── README.md                         # Main API index with package links
│       ├── cli.md                            # Complete CLI package API
│       ├── core.md                           # Complete Core package API
│       ├── config.md                         # Complete Config package API
│       ├── data.md                           # Complete Data package API
│       ├── fs.md                             # Complete FS package API
│       ├── validation.md                     # Complete Validation package API
│       └── create-cli.md                     # Complete Create-CLI package API
```

**Benefits of Optimized Structure:**

- **48 files total** (vs. hundreds with default settings)
- **One file per package** containing all APIs
- **GitHub-friendly** for direct viewing and linking
- **Docusaurus-optimized** with clean URLs and navigation

## Configuration

### Root TypeDoc Configuration

The root `typedoc.json` configures monorepo-wide settings:

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPointStrategy": "packages",
  "entryPoints": ["packages/*"],
  "plugin": ["typedoc-plugin-markdown"],

  "name": "Trailhead API Documentation",
  "includeVersion": true,

  "packageOptions": {
    "entryPoints": ["src/index.ts"],
    "excludePrivate": true,
    "excludeInternal": true,
    "excludeNotDocumented": false,
    "excludeReferences": true,
    "excludeExternals": true
  },

  "excludePrivate": true,
  "excludeInternal": true,
  "excludeNotDocumented": false,
  "excludeReferences": true,
  "excludeExternals": true
}
```

### Optimized Configuration for Docusaurus

The root `typedoc.json` is optimized to generate fewer, consolidated files for GitHub/Docusaurus deployment:

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPointStrategy": "packages",
  "entryPoints": ["packages/*"],
  "plugin": ["typedoc-plugin-markdown"],

  "name": "Trailhead API Documentation",
  "includeVersion": true,

  "flattenOutputFiles": true,
  "mergeReadme": true,
  "entryFileName": "README",
  "membersWithOwnFile": [],
  "fileExtension": ".md",
  "hideBreadcrumbs": false,
  "hidePageHeader": false,
  "hidePageTitle": false,

  "excludeReferences": true,
  "markdownItOptions": {
    "html": false,
    "linkify": true
  }
}
```

**Key Optimizations for Docusaurus:**

- `flattenOutputFiles: true` - Consolidates output into fewer files
- `membersWithOwnFile: []` - Prevents individual files for functions/interfaces
- `excludeReferences: true` - Reduces cross-reference file generation
- `html: false` - Pure markdown output for better Docusaurus compatibility

### Package-Specific Configuration

Each package can have its own `typedoc.json` to override settings:

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "name": "@trailhead/cli",
  "readme": "./README.md",
  "entryPoints": ["src/index.ts"],

  "categorizeByGroup": true,
  "defaultCategory": "CLI Framework",

  "navigationLinks": {
    "GitHub": "https://github.com/esteban-url/trailhead",
    "CLI Package": "../cli/README.md"
  }
}
```

## Writing Documentation Comments

### Basic JSDoc Comments

Add JSDoc comments to your TypeScript code:

````typescript
/**
 * Creates a new CLI application with the specified configuration.
 *
 * @param config - The CLI configuration object
 * @returns A configured CLI instance ready to run
 *
 * @example
 * ```typescript
 * const cli = createCLI({
 *   name: 'my-cli',
 *   version: '1.0.0',
 *   description: 'My CLI application'
 * });
 *
 * await cli.run();
 * ```
 *
 * @since 0.1.0
 */
export function createCLI(config: CLIConfig): CLI {
  // Implementation
}
````

### Module Documentation

Document entire modules using `@module` tag:

````typescript
/**
 * @module @trailhead/cli
 * @description Foundation CLI orchestrator providing a complete CLI framework.
 *
 * This package provides modern CLI application foundations using functional
 * programming patterns and explicit error handling with Result types.
 *
 * @example
 * ```typescript
 * import { createCLI, createCommand } from '@trailhead/cli'
 * import { ok } from '@trailhead/core'
 *
 * const cli = createCLI({ name: 'my-cli', version: '1.0.0' });
 * ```
 */
````

### Interface and Type Documentation

```typescript
/**
 * Configuration options for creating a CLI application.
 */
export interface CLIConfig {
  /** The name of the CLI application */
  name: string

  /** Version string following semver format */
  version: string

  /** Brief description of what the CLI does */
  description?: string

  /** Array of commands to register with the CLI */
  commands?: Command[]
}
```

### Advanced JSDoc Tags

TypeDoc supports numerous JSDoc tags:

- `@param` - Document parameters
- `@returns` - Document return values
- `@throws` - Document potential errors
- `@example` - Provide usage examples
- `@since` - Version when added
- `@deprecated` - Mark as deprecated
- `@internal` - Hide from public API
- `@beta` - Mark as beta feature
- `@defaultValue` - Document default values
- `@see` - Reference related items

## Generation Workflow

### Using the Dev CLI

The monorepo includes a development CLI with advanced documentation features:

```bash
# Generate API docs with options
pnpm dev-cli generate-api --packages core,cli --output ./custom-docs --clean

# Available options:
# --packages <packages>  Comma-separated list of packages
# --output <directory>   Custom output directory
# --clean               Clean output before generation
# --watch               Watch mode for development
```

### Manual TypeDoc Commands

For direct TypeDoc usage:

```bash
# Generate docs for a specific package
npx typedoc \
  --tsconfig packages/cli/tsconfig.json \
  --out docs/cli/api \
  --options typedoc.json \
  packages/cli/src/index.ts

# Generate with custom options
npx typedoc \
  --plugin typedoc-plugin-markdown \
  --out docs/api \
  --entryPointStrategy packages \
  --entryPoints "packages/*"
```

## Integration with Diátaxis Framework

### 1. Reference Documentation

Place generated API docs in the reference section:

```
docs/
├── reference/
│   └── api/               # API documentation
│       ├── README.md      # API overview
│       ├── cli.md         # CLI package API
│       ├── core.md        # Core package API
│       └── ...            # Other packages
```

### 2. Linking from Other Sections

Link to API docs from tutorials and how-to guides:

```markdown
<!-- In a tutorial -->

For detailed API information, see the [CLI API Reference](../reference/api/cli.md).

<!-- In a how-to guide -->

Refer to the [`createCommand` API](../reference/api/cli.md#createcommand) for all available options.
```

### 3. Navigation Structure

Update your documentation navigation to include API docs:

```yaml
# docusaurus.config.js or similar
sidebar:
  - Tutorials:
      - Getting Started: tutorials/getting-started.md
  - How-To Guides:
      - Generate API Docs: how-to/generate-api-docs.md
  - Reference:
      - API Documentation:
          - Overview: reference/api/index.md
          - CLI Package: reference/api/cli.md
          - Core Package: reference/api/core.md
  - Explanation:
      - Architecture: explanation/architecture.md
```

## Best Practices

### 1. Documentation Coverage

Ensure comprehensive documentation:

```typescript
// Configure TypeDoc to require documentation
{
  "requiredToBeDocumented": [
    "Class",
    "Interface",
    "Function",
    "Method"
  ],
  "validation": {
    "notDocumented": false,  // Allow undocumented exported items
    "notExported": true,     // Warn about non-exported references
    "invalidLink": true      // Warn about broken links
  }
}
```

### 2. Code Examples

Include runnable examples:

````typescript
/**
 * @example Basic usage
 * ```typescript
 * import { createCLI } from '@trailhead/cli'
 *
 * const cli = createCLI({
 *   name: 'my-cli',
 *   version: '1.0.0'
 * });
 *
 * await cli.run(process.argv);
 * ```
 *
 * @example With custom commands
 * ```typescript
 * const cli = createCLI({
 *   name: 'my-cli',
 *   version: '1.0.0',
 *   commands: [buildCommand, testCommand]
 * });
 * ```
 */
````

### 3. Version Documentation

Track API changes:

```typescript
/**
 * Creates a new feature
 * @since 1.0.0
 * @deprecated Since 2.0.0, use {@link newFeature} instead
 */
```

### 4. Cross-References

Link related items:

```typescript
/**
 * Creates a command
 * @see {@link CommandOptions} for available options
 * @see {@link createCLI} for registering commands
 */
```

## Automation

### GitHub Actions Integration

Add to your CI/CD pipeline for GitHub Pages deployment:

```yaml
name: Deploy Documentation
on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - 'packages/*/docs/**'
      - 'packages/*/README.md'
      - 'apps/docs/**'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm docs:build # Automatically generates API docs via predocs:build hook

      - name: Upload to GitHub Pages
        uses: actions/upload-pages-artifact@v3
        with:
          path: apps/docs/build

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

**Note**: The `pnpm docs:build` command automatically runs `pnpm docs:api` via the `predocs:build` hook, ensuring API documentation is always up-to-date when the documentation site is built.

### Lefthook Pre-commit Hook

Ensure docs are updated before commits using lefthook:

```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    # Auto-generate API docs when source files change
    docs-regen:
      priority: 8
      glob: 'packages/*/src/**/*.{ts,tsx}'
      run: |
        staged_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E 'packages/.*/src/.*\.(ts|tsx)$' || true)
        if [ -n "$staged_files" ]; then
          echo "📚 Source files changed, regenerating API docs..."
          pnpm docs:api
          git add docs/reference/api/
        fi
```

**Implementation Notes**:

- Add this to your existing `lefthook.yml` configuration by including it in the `pre-commit.commands` section
- The project already includes comprehensive lefthook configuration with documentation validation
- This adds automatic API documentation regeneration when TypeScript source files are modified
- The `priority: 8` ensures it runs after other formatting and linting commands

## Troubleshooting

### Common Issues

1. **Too many files generated**: ✅ Already configured with `flattenOutputFiles: true` and `membersWithOwnFile: []`
2. **Non-markdown files**: ✅ Already configured with `html: false` in `markdownItOptions`
3. **Private/internal items showing**: ✅ Already configured with `excludePrivate: true` and `excludeInternal: true`
4. **Broken links**: Use validation options in TypeDoc config
5. **Build errors**: Ensure TypeScript compiles before generating docs
6. **Re-export duplicates**: ✅ Already configured with `excludeReferences: true`
7. **External dependencies**: ✅ Already configured with `excludeExternals: true`

### Validation Commands

```bash
# Validate TypeScript compilation
pnpm types

# Check for missing documentation
npx typedoc --validation.notDocumented --validation.invalidLink

# Test documentation examples
pnpm dev-cli test-examples --verbose

# Count generated files (should be ~9 for optimized config)
find docs/reference/api -name "*.md" | wc -l
```

### Configuration Troubleshooting

**For exported-only documentation** (current setup):

```json
{
  "excludePrivate": true, // ✅ Hide private members
  "excludeInternal": true, // ✅ Hide @internal items
  "excludeExternals": true, // ✅ Hide external deps
  "excludeReferences": true, // ✅ Hide re-exports
  "excludeNotDocumented": false // ✅ Show undocumented exports
}
```

**For package consistency**:

```json
{
  "packageOptions": {
    "excludePrivate": true,
    "excludeInternal": true,
    "excludeReferences": true,
    "excludeExternals": true
  }
}
```

## Advanced Features

### Custom Themes

Use markdown themes and customization:

```json
{
  "markdownItOptions": {
    "html": true,
    "linkify": true
  },
  "customCss": "./docs/assets/typedoc-custom.css"
}
```

### External Link Mapping

Map external types to documentation:

```json
{
  "externalSymbolLinkMappings": {
    "neverthrow": {
      "Result": "https://github.com/supermacro/neverthrow#result"
    }
  }
}
```

### Search Optimization

Boost important categories:

```json
{
  "searchCategoryBoosts": {
    "Classes": 1.5,
    "Interfaces": 1.5,
    "Functions": 1.3
  }
}
```

## Summary

TypeDoc integration provides:

- ✅ Automatic API documentation from source code
- ✅ Markdown output for easy integration
- ✅ Type-safe documentation with examples
- ✅ Seamless Diátaxis framework integration
- ✅ CI/CD automation support
- ✅ Comprehensive validation and testing

Follow this guide to maintain high-quality, up-to-date API documentation that complements your tutorials, how-to guides, and explanatory content.
