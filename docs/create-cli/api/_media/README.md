---
type: explanation
title: '@esteban-url/create-cli Documentation Overview'
description: 'Complete documentation hub for the CLI project generator'
related:
  - /packages/create-cli/docs/tutorials/getting-started.md
  - /packages/cli/docs/reference/core
  - /packages/create-cli/docs/how-to/customize-templates.md
---

# @esteban-url/create-cli Documentation

The create-cli package provides a modern generator for scaffolding CLI applications built with the @esteban-url/cli framework. It offers intelligent project setup with best practices, TypeScript configuration, and comprehensive testing utilities built-in.

## Framework Philosophy

@esteban-url/create-cli is designed around these principles:

- **Zero-config start** - Sensible defaults with full customization available
- **Best practices built-in** - TypeScript, testing, linting pre-configured
- **Template flexibility** - Multiple templates for different use cases
- **Framework integration** - Seamless integration with @esteban-url/cli

## Documentation Structure

### Getting Started

- [Quick Start Guide](../tutorials/getting-started.md)- Generate your first CLI in minutes
- [Template Overview](../explanation/templates.md)- Understanding available templates
- [Configuration Options](../../cli/reference/config.md)- All generation options

### API Reference

Complete API documentation:

- [Generator API](../../cli/reference/core.md)- Programmatic project generation
- [Configuration Schema](../reference/schema.md)- Project configuration options
- [Template System](../reference/templates.md)- Template engine and customization

### How-To Guides

Task-oriented guides:

- [Customize Templates](../how-to/customize-templates.md)- Modify or create templates
- [Add Custom Prompts](../how-to/custom-prompts.md)- Extend interactive setup
- [Configure Defaults](../how-to/configure-defaults.md)- Set personal preferences

## Key Features

### 1. Interactive Project Setup

```bash
npx @esteban-url/create-cli my-awesome-cli

# Interactive prompts guide you through:
# - Project name and description
# - Template selection (basic/advanced)
# - Package manager choice
# - Optional features (docs, git)
```

### 2. Multiple Templates

**Basic Template**

- Core CLI structure
- TypeScript configuration
- Testing setup with Vitest
- Essential tooling

**Advanced Template**

- Everything from basic
- Configuration management
- Documentation generation
- Advanced testing patterns
- Production optimizations

### 3. Smart Defaults

```typescript
// Automatic detection of:
- Package manager (npm/pnpm/yarn)
- Git repository initialization
- Appropriate .gitignore
- TypeScript strict mode
- Testing configuration
```

### 4. Framework Integration

Generated projects include:

```typescript
import { createCLI, createCommand } from '@esteban-url/cli'
import { Ok, Err } from '@esteban-url/core'

// Pre-configured with:
- Command structure
- Error handling patterns
- Testing utilities
- Build configuration
```

## Quick Examples

### Basic Generation

```bash
# Quick start with defaults
npx @esteban-url/create-cli my-cli

# With options
npx @esteban-url/create-cli my-cli --template advanced --pm pnpm
```

### Programmatic Usage

```typescript
import { generateProject } from '@esteban-url/create-cli'

const result = await generateProject({
  projectName: 'my-cli',
  template: 'advanced',
  packageManager: 'pnpm',
  includeDocs: true,
})

if (result.isOk()) {
  console.log(`Created at: ${result.value.projectPath}`)
}
```

### Generated Structure

```
my-cli/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── commands/          # Command implementations
│   └── lib/               # Shared utilities
├── tests/                 # Test files
├── docs/                  # Documentation (advanced)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript config
├── vitest.config.ts       # Test configuration
└── README.md              # Project documentation
```

## Template System

### Template Processing

Templates use Handlebars with custom helpers:

- **Conditional sections** - Include/exclude based on options
- **Dynamic content** - Project-specific values
- **File filtering** - Smart file inclusion
- **Path transformation** - OS-specific paths

### Available Variables

```handlebars
{{projectName}}
# my-awesome-cli
{{projectPath}}
# /path/to/my-awesome-cli
{{packageManager}}
# npm/pnpm/yarn
{{author}}
# From git config or prompt
{{year}}
# Current year
{{includeDocs}}
# Boolean flags
```

## Development Workflow

### For CLI Generation

1. **Run generator**: `npx @esteban-url/create-cli my-cli`
2. **Navigate to project**: `cd my-cli`
3. **Install dependencies**: `pnpm install` (auto-detected)
4. **Start development**: `pnpm dev`
5. **Run tests**: `pnpm test`

### For Template Development

1. **Clone repository**: Get create-cli source
2. **Modify templates**: Edit in `templates/` directory
3. **Test generation**: Run local generator
4. **Validate output**: Check generated projects

## Configuration

### Global Settings

Set personal defaults:

```bash
# Set default template
create-cli config set defaultTemplate advanced

# Set preferred package manager
create-cli config set packageManager pnpm

# View configuration
create-cli config list
```

### Project Configuration

Generated `package.json` includes:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup",
    "test": "vitest",
    "lint": "oxlint",
    "types": "tsc --noEmit"
  }
}
```

## Next Steps

1. Follow the [Getting Started Guide](../tutorials/getting-started.md)to generate your first CLI
2. Explore [Template Options](../explanation/templates.md)for different project types
3. Learn about [Customization](../how-to/customize-templates.md)for team-specific needs
4. Check the [API Reference](../../cli/reference/core.md)for programmatic usage

## Support

- **Issues**: [GitHub Issues](https://github.com/esteban-url/trailhead/issues)
- **Discussions**: [GitHub Discussions](https://github.com/esteban-url/trailhead/discussions)
- **Examples**: See generated project examples

## License

MIT - See [LICENSE](https://github.com/esteban-url/trailhead/blob/main/LICENSE)
