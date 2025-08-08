---
type: reference
title: 'Template System Reference'
description: 'Complete guide to the template engine and customization system'
related:
  - /packages/create-cli/docs/reference/schema.md
  - /docs/reference/api/create-cli.md
  - /packages/create-cli/docs/how-to/customize-templates.md
---

# Template System Reference

Technical reference for the @esteban-url/create-cli template system, which uses Handlebars for dynamic project generation.

## Overview

| Property    | Value                 |
| ----------- | --------------------- |
| **Engine**  | Handlebars 4.x        |
| **Format**  | `.hbs` template files |
| **Caching** | LRU cache with TTL    |

## Template Architecture

### Module-Based System

Templates are organized into feature modules that can be composed:

```
templates/
├── modules/          # Feature modules
│   ├── core/        # Essential CLI functionality
│   ├── config/      # Configuration management
│   ├── testing/     # Testing setup
│   ├── validation/  # Input validation
│   ├── docs/        # Documentation
│   └── cicd/        # CI/CD workflows
└── shared/          # Shared infrastructure files
```

### Template Processing Pipeline

1. **Module Selection** - Based on project configuration
2. **File Collection** - Gather files from selected modules
3. **Template Compilation** - Handlebars processing
4. **Post-Processing** - Code formatting with Prettier
5. **File Writing** - Create files with proper permissions

## Available Variables

### Core Variables

These variables are available in all templates:

```handlebars
{{projectName}}
# Project name (e.g., 'my-cli')
{{projectPath}}
# Absolute path to project
{{projectType}}
# 'standalone-cli' | 'library' | 'monorepo-package'
{{packageManager}}
# 'npm' | 'pnpm'
{{nodeVersion}}
# Target Node.js version (e.g., '18')
{{timestamp}}
# ISO timestamp of generation
{{year}}
# Current year (for copyright)
```

### Feature Flags

Boolean flags for conditional sections:

```handlebars
{{features.core}}
# Always true
{{features.config}}
# Configuration management included
{{features.validation}}
# Validation utilities included
{{features.testing}}
# Testing framework included
{{features.docs}}
# Documentation structure included
{{features.cicd}}
# CI/CD workflows included
{{includeDocs}}
# Include documentation (separate flag)
```

### Computed Variables

These are derived from other values:

```handlebars
{{isMonorepo}}
# true if projectType === 'monorepo-package'
{{isLibrary}}
# true if projectType === 'library'
{{isStandaloneCLI}}
# true if projectType === 'standalone-cli'
{{hasVSCode}}
# true if ide === 'vscode'
{{npmClient}}
# Package manager executable name
```

## Handlebars Helpers

### Built-in Helpers

Standard Handlebars helpers are available:

```handlebars
{{#if condition}}...{{/if}}
{{#unless condition}}...{{/unless}}
{{#each array}}...{{/each}}
{{#with object}}...{{/with}}
```

### Custom Helpers

#### `eq` - Equality comparison

```handlebars
{{#if (eq projectType 'library')}}
  // Library-specific content
{{/if}}
```

#### `includes` - Array/string inclusion

```handlebars
{{#if (includes features 'testing')}}
  // Testing-specific content
{{/if}}
```

#### `json` - JSON stringification

```handlebars
{ "config":
{{json configObject}}
}
```

## File Naming Conventions

### Template Files

- `.hbs` extension for all template files
- Base filename indicates target filename
- Special prefixes for dotfiles

### Special File Handling

```
Template                    → Generated
─────────────────────────────────────
DOT_gitignore              → .gitignore
DOT_npmrc.hbs              → .npmrc
_gitignore                 → .gitignore (static)
package.json.hbs           → package.json
```

### Directory Structure

Directories maintain their structure:

```
modules/core/src/commands/  → src/commands/
shared/scripts/            → scripts/
```

## Template Examples

### Conditional Features

```handlebars
{ "name": "{{projectName}}", "version": "0.1.0", "type": "module", "scripts": { "dev": "tsx
src/index.ts", "build": "tsup",
{{#if features.testing}}
  "test": "vitest", "test:watch": "vitest watch",
{{/if}}
{{#if features.docs}}
  "docs:build": "typedoc",
{{/if}}
"types": "tsc --noEmit" } }
```

### Package Manager Specific

```handlebars
{{#if (eq packageManager 'pnpm')}}
  # Using pnpm pnpm install pnpm dev
{{else}}
  # Using npm npm install npm run dev
{{/if}}
```

### Project Type Specific

```handlebars
{{#if isMonorepo}}
  import { defineConfig } from 'tsup' export default defineConfig({ entry: ['src/index.ts'], format:
  ['esm'], dts: true, clean: true, external: ['@repo/*'] })
{{else}}
  import { defineConfig } from 'tsup' export default defineConfig({ entry: ['src/index.ts'], format:
  ['esm', 'cjs'], dts: true, clean: true })
{{/if}}
```

## Module Definition

Each feature module is defined with:

```typescript
interface FeatureModule {
  name: string
  description: string
  dependencies: string[] // Required modules
  conflicts: string[] // Incompatible modules
  files: TemplateFile[] // Files to generate
  packageDependencies?: string[] // npm packages
  scripts?: Record<string, string> // package.json scripts
}
```

### TemplateFile Structure

```typescript
interface TemplateFile {
  source: string // Path in templates directory
  destination: string // Path in generated project
  isTemplate: boolean // Process with Handlebars?
  executable: boolean // Set executable permission?
}
```

## Post-Processing

### Code Formatting

All generated code is formatted using Prettier:

1. TypeScript/JavaScript files
2. JSON files
3. YAML files
4. Markdown files

### File Permissions

- Executable files (bin scripts) get `chmod +x`
- Regular files get standard permissions
- Directories are created with proper permissions

## Caching System

### Template Compilation Cache

- **Type**: LRU (Least Recently Used)
- **Size**: 100 compiled templates
- **TTL**: Based on file modification time
- **Key**: File path + content hash

### Performance Benefits

- Compiled templates are cached
- File reads are minimized
- Repeated generations are faster

## Error Handling

### Template Errors

Common template errors and solutions:

```typescript
// Missing variable
Error: "projectName" not defined
Solution: Ensure all required variables are provided

// Invalid helper
Error: Unknown helper "customHelper"
Solution: Register helper before compilation

// Syntax error
Error: Expecting 'ID', got 'EOF'
Solution: Check for unclosed blocks
```

### File System Errors

- Permission denied → Check write permissions
- Directory exists → Use --force flag
- Path too long → Shorten project path

## Best Practices

### 1. Variable Safety

Always provide defaults or check existence:

```handlebars
{{#if author}}
  Author:
  {{author}}
{{else}}
  Author: Unknown
{{/if}}
```

### 2. Maintainable Templates

Keep logic simple in templates:

```handlebars
{{! Good: Simple condition }}
{{#if features.testing}}
  import { test } from 'vitest'
{{/if}}

{{! Avoid: Complex logic }}
{{#if (and (eq projectType 'library') (includes features 'testing'))}}
  // Complex nested logic
{{/if}}
```

### 3. Comments

Use Handlebars comments for template notes:

```handlebars
{{! This section is only for monorepo packages }}
{{#if isMonorepo}}
  // Monorepo-specific code
{{/if}}
```

## Extending the System

### Adding New Modules

1. Create directory in `templates/modules/`
2. Add module definition to `modules.ts`
3. Include template files
4. Define dependencies and scripts

### Custom Templates

See [Customize Templates](../../how-to/customize-templates.md)for detailed guide.

## See Also

- [Configuration Schema](../../reference/schema.md)- Available variables
- [API Reference](../../reference/api.md)- Programmatic usage
- [Custom Templates Guide](../../how-to/customize-templates.md)- Customization
