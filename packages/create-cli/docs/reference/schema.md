---
type: reference
title: 'Configuration Schema Reference'
description: 'Complete schema documentation for project configuration options'
related:
  - /docs/reference/api/create-cli.md
  - /docs/reference/templates/tutorial-template.md
  - /packages/create-cli/docs/how-to/configure-defaults.md
---

# Configuration Schema Reference

Complete reference for all configuration options available in @esteban-url/create-cli.

## Overview

The configuration schema defines all options available when generating a CLI project, whether through the command line, interactive prompts, or programmatic API.

## Schema Definition

### ProjectConfig

The main configuration object for project generation.

```typescript
interface ProjectConfig {
  // Core Configuration
  projectName: string
  projectPath: string
  projectType: 'standalone-cli' | 'library' | 'monorepo-package'

  // Package Configuration
  packageManager: 'npm' | 'pnpm'

  // Feature Flags
  features: {
    core: true // Always required
    config?: boolean
    validation?: boolean
    testing?: boolean
    docs?: boolean
    cicd?: boolean
  }

  // Technical Configuration
  nodeVersion: string
  typescript: boolean // Always true
  ide: 'vscode' | 'none'

  // Generation Options
  includeDocs: boolean
  dryRun: boolean
  force: boolean
  verbose: boolean
}
```

## Field Reference

### Core Configuration

#### `projectName` (required)

- **Type**: `string`
- **Pattern**: `/^[a-z0-9-]+$/`
- **Description**: Name of the CLI project. Used for the directory name and default package name.
- **Examples**: `my-cli`, `awesome-tool`, `company-cli`
- **Validation**:
  - Must be lowercase
  - Only letters, numbers, and hyphens
  - Maximum 214 characters (npm package name limit)

#### `projectPath` (required)

- **Type**: `string`
- **Description**: Absolute path where the project will be created
- **Default**: `path.join(process.cwd(), projectName)`
- **Validation**:
  - Must be absolute path
  - Parent directory must exist

#### `projectType` (required)

- **Type**: `'standalone-cli' | 'library' | 'monorepo-package'`
- **Description**: Type of project to generate
- **Options**:
  - `standalone-cli`: Independent CLI application
  - `library`: Reusable library that can be imported
  - `monorepo-package`: Package within a monorepo structure
- **Default**: Determined by prompts or CLI arguments

### Package Configuration

#### `packageManager` (required)

- **Type**: `'npm' | 'pnpm'`
- **Description**: Package manager to use for the project
- **Default**: Auto-detected from system, fallback to `'npm'`
- **Effects**:
  - Determines lockfile format
  - Sets install commands in scripts
  - Configures build tooling
- **Note**: yarn and bun removed for stability and simplicity

### Feature Flags

#### `features` (required)

- **Type**: `object`
- **Description**: Feature modules to include in the generated project
- **Structure**:
  ```typescript
  {
    core: true,        // Always required, cannot be disabled
    config?: boolean,  // Configuration management system
    validation?: boolean, // Data validation utilities
    testing?: boolean, // Testing framework setup
    docs?: boolean,    // Documentation structure
    cicd?: boolean     // CI/CD workflows
  }
  ```
- **Module Details**:
  - **core**: Essential CLI functionality (commands, help, version)
  - **config**: Zod-based configuration with validation
  - **validation**: Input validation helpers
  - **testing**: Vitest setup with integration tests
  - **docs**: Documentation templates following Diátaxis
  - **cicd**: GitHub Actions workflows and Lefthook git hooks

### Technical Configuration

#### `nodeVersion` (required)

- **Type**: `string`
- **Description**: Target Node.js version
- **Pattern**: `/^\d+$/` (numeric string)
- **Default**: `'18'`
- **Validation**: Must be 14 or higher
- **Examples**: `'18'`, `'20'`, `'21'`

#### `typescript` (required)

- **Type**: `boolean`
- **Description**: Use TypeScript (always true in current implementation)
- **Default**: `true`
- **Note**: JavaScript-only projects not currently supported

#### `ide` (required)

- **Type**: `'vscode' | 'none'`
- **Description**: IDE configuration to include
- **Options**:
  - `vscode`: Adds .vscode/settings.json and extensions.json
  - `none`: No IDE-specific configuration
- **Default**: `'vscode'`

#### `includeDocs` (required)

- **Type**: `boolean`
- **Description**: Include documentation structure
- **Default**: `false`
- **Effects**:
  - Adds docs/ directory with Diátaxis structure
  - Includes README templates
  - Adds documentation generation scripts

### Generation Options

#### `force`

- **Type**: `boolean`
- **Description**: Overwrite existing directory
- **Default**: `false`
- **Warning**: This will delete existing files

#### `dryRun`

- **Type**: `boolean`
- **Description**: Preview changes without creating files
- **Default**: `false`
- **Effects**:
  - Shows what would be created
  - No files are written
  - No commands are executed

#### `verbose`

- **Type**: `boolean`
- **Description**: Show detailed output
- **Default**: `false`
- **Effects**:
  - Detailed logging
  - File creation details
  - Template processing information

## Configuration Sources

Configuration can come from multiple sources (in priority order):

1. **Command line arguments** (highest priority)
2. **Interactive prompts**
3. **Preset configurations**
4. **Defaults** (lowest priority)

### Command Line

```bash
npx @esteban-url/create-cli my-cli \
  --type standalone-cli \
  --package-manager pnpm \
  --features config,testing \
  --include-docs
```

### Interactive Mode

When run without arguments, the generator will prompt for:

1. Project name
2. Project type (standalone-cli, library, monorepo-package)
3. Package manager preference
4. Feature selection
5. Documentation inclusion
6. IDE configuration

### Preset Configurations

Presets provide pre-configured feature sets based on project type:

```typescript
// Standalone CLI preset
{
  projectType: 'standalone-cli',
  features: {
    core: true,
    config: true,
    testing: true
  }
}

// Library preset
{
  projectType: 'library',
  features: {
    core: true,
    config: true,
    testing: true
  }
}

// Monorepo package preset
{
  projectType: 'monorepo-package',
  features: {
    core: true,
    testing: true
  }
}
```

## Validation Rules

### Project Name Validation

The project name must follow npm package naming conventions:

- **Required**: Cannot be empty
- **Pattern**: `/^[a-z0-9-]+$/` (lowercase alphanumeric with hyphens)
- **Length**: Maximum 214 characters
- **No leading/trailing hyphens**: Cannot start or end with `-`
- **Examples**: ✅ `my-cli`, ✅ `awesome-tool-2`, ❌ `My-CLI`, ❌ `-cli-`

### Node Version Validation

- **Pattern**: `/^\d+$/` (numeric string only)
- **Minimum**: Version 14 or higher
- **Examples**: ✅ `'18'`, ✅ `'20'`, ❌ `'v18.0.0'`, ❌ `'12'`

### Feature Dependencies

Some features have dependencies that are automatically resolved:

- **testing** → automatically includes **config** if not already selected
- **validation** → can be used independently
- **docs** → can be used independently
- **cicd** → can be used independently

## Schema Validation

The configuration is validated using Zod schemas. Validation errors provide clear, actionable messages:

```typescript
// Example validation error
{
  path: ['projectName'],
  message: 'Project name must be lowercase alphanumeric with hyphens only'
}

// Example with context
{
  path: ['features', 'core'],
  message: 'Core feature is required and must be true'
}
```

## Feature Module System

The generator uses a modular system where features are composed:

### Module Structure

Each feature module includes:

- **name**: Module identifier
- **description**: Human-readable description
- **dependencies**: Other required modules
- **conflicts**: Incompatible modules
- **files**: Template files to generate
- **packageDependencies**: npm packages to install
- **scripts**: package.json scripts to add

### Module Composition

1. **Core module** is always included
2. Selected features are validated for dependencies
3. Conflicts are checked and reported
4. Files from all modules are merged
5. Package dependencies are deduplicated
6. Scripts are combined (later modules can override)

## See Also

- [API Reference](../../reference/api.md)- Programmatic usage
- [Template System](./templates/tutorial-template.md)- Template details
- [Configure Defaults](../../how-to/configure-defaults.md)- Setting personal defaults
