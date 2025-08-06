# Trailhead

> Modern toolkit for building production-ready CLIs with functional programming patterns

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![PNPM](https://img.shields.io/badge/PNPM-10.12+-orange.svg)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.5+-red.svg)](https://turbo.build/)

Trailhead provides modern, type-safe foundations for building robust command-line applications. Built with functional programming principles, comprehensive testing utilities, and explicit error handling.

## Quick Navigation

**👋 New to Trailhead?** → [Choose Your Path](#choose-your-path)  
**🔧 Building a CLI?** → [CLI Framework](#cli-framework)  
**📦 Need Utilities?** → [Package Ecosystem](#package-ecosystem)  
**🤝 Want to Contribute?** → [For Contributors](#for-contributors)  
**📚 Looking for Docs?** → [Documentation](#documentation)

## Choose Your Path

### 🚀 I want to build a CLI application

**Best for:** Creating command-line tools, build scripts, developer utilities

→ **Start here:** [@esteban-url/cli Framework](#cli-framework)  
→ **Quick setup:** [Generate CLI Project](#create-your-own-cli)  
→ **Learn by example:** [Build Your First CLI](./packages/cli/docs/tutorials/getting-started.md)

### 🔧 I need data processing utilities

**Best for:** File processing, data validation, format conversion

→ **Start here:** [Package Ecosystem](#package-ecosystem)  
→ **Data processing:** [@repo/data](./packages/data/README.md)  
→ **File operations:** [@repo/fs](./packages/fs/README.md)  
→ **Validation:** [@repo/validation](./packages/validation/README.md)

### 📊 I want to scaffold new projects

**Best for:** Generating CLI projects with best practices built-in

→ **Start here:** [@esteban-url/create-cli](#create-your-own-cli)  
→ **Templates:** [Template System](./packages/create-cli/docs/explanation/templates.md)  
→ **Customization:** [Custom Templates](./packages/create-cli/docs/how-to/customize-templates.md)

### 🤝 I want to contribute to Trailhead

**Best for:** Adding features, fixing bugs, improving documentation

→ **Start here:** [Development Workflow](./CLAUDE.md)  
→ **Architecture:** [Functional Architecture](./docs/explanation/functional-architecture.md)  
→ **Documentation:** [Writing Guide](./docs/reference/writing-guide.md)

---

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

## Package Ecosystem

### 🔗 Package Relationship Matrix

| Package                                              | Purpose           | Dependencies                                 | Best For                           |
| ---------------------------------------------------- | ----------------- | -------------------------------------------- | ---------------------------------- |
| **[@esteban-url/cli](./packages/cli)**               | CLI Framework     | `@repo/core`, `@repo/fs`, `@repo/validation` | Building command-line applications |
| **[@esteban-url/create-cli](./packages/create-cli)** | Project Generator | `@esteban-url/cli`                           | Scaffolding CLI projects           |
| **[@repo/core](./packages/core)**                    | Foundation        | None                                         | Result types, functional utilities |
| **[@repo/fs](./packages/fs)**                        | File System       | `@repo/core`                                 | File operations, path utilities    |
| **[@repo/data](./packages/data)**                    | Data Processing   | `@repo/core`                                 | CSV/JSON/Excel processing          |
| **[@repo/validation](./packages/validation)**        | Validation        | `@repo/core`                                 | Data validation, schema checking   |
| **[@repo/config](./packages/config)**                | Configuration     | `@repo/core`, `@repo/validation`             | Type-safe configuration            |

### 🎯 When to Use Each Package

#### Building a CLI Application?

```typescript
// Use @esteban-url/cli for the framework
import { createCommand } from '@esteban-url/cli/command'
// + @repo/fs for file operations
// + @repo/validation for user input validation
// + @repo/data for processing data files
```

#### Processing Data Files?

```typescript
// Use @repo/data for format handling
import { data } from '@repo/data'
// + @repo/fs for file operations
// + @repo/validation for data validation
```

#### Need File Operations?

```typescript
// Use @repo/fs for filesystem operations
import { fs } from '@repo/fs'
// + @repo/core for Result types
```

#### Validating User Input?

```typescript
// Use @repo/validation for validation
import { validate } from '@repo/validation'
// + @repo/core for Result types
```

### 🔄 Common Integration Patterns

#### CLI + Data Processing Pipeline

```typescript
import { createCommand } from '@esteban-url/cli/command'
import { data } from '@repo/data'
import { fs } from '@repo/fs'
import { validate } from '@repo/validation'

const processCommand = createCommand({
  name: 'process',
  action: async ({ inputFile, outputFile }) => {
    // 1. Validate file exists
    const exists = await fs.exists(inputFile)
    if (!exists.value) return err(new Error('File not found'))

    // 2. Parse data file
    const parseResult = await data.parseAuto(inputFile)
    if (parseResult.isErr()) return parseResult

    // 3. Validate data structure
    const validResult = validate.array(mySchema)(parseResult.value.data)
    if (validResult.isErr()) return validResult

    // 4. Write processed data
    return data.writeAuto(outputFile, validResult.value)
  },
})
```

#### Configuration Management Workflow

```typescript
import { createCommand } from '@esteban-url/cli/command'
import { fs } from '@repo/fs'
import { validate, createSchemaValidator } from '@repo/validation'
import { z } from 'zod'

// Define config schema
const configSchema = z.object({
  apiUrl: z.string().url(),
  timeout: z.number().min(1000).max(30000),
  features: z.array(z.string()),
})

const validateConfig = createSchemaValidator(configSchema)

const deployCommand = createCommand({
  name: 'deploy',
  action: async ({ env }) => {
    // 1. Load environment-specific config
    const configPath = `./config/${env}.json`
    const configResult = await fs.readJson(configPath)
    if (configResult.isErr()) return configResult

    // 2. Validate configuration
    const validConfig = validateConfig(configResult.value)
    if (validConfig.isErr()) return validConfig

    // 3. Deploy with validated config
    return deployWithConfig(validConfig.value)
  },
})
```

#### Multi-Format Data Conversion

```typescript
import { data } from '@repo/data'
import { fs } from '@repo/fs'
import { createCommand } from '@esteban-url/cli/command'

const convertCommand = createCommand({
  name: 'convert',
  action: async ({ inputDir, outputFormat }) => {
    // 1. Find all data files
    const filesResult = await fs.findFiles('**/*.{csv,json,xlsx}', { cwd: inputDir })
    if (filesResult.isErr()) return filesResult

    // 2. Process each file
    const results = await Promise.all(
      filesResult.value.map(async (file) => {
        const inputPath = join(inputDir, file)
        const outputPath = file.replace(/\.[^.]+$/, `.${outputFormat}`)

        // Parse original format
        const parseResult = await data.parseAuto(inputPath)
        if (parseResult.isErr()) return parseResult

        // Write in new format
        return data.writeAuto(outputPath, parseResult.value.data)
      })
    )

    return ok(`Converted ${results.length} files to ${outputFormat}`)
  },
})
```

### 📦 Package Details

#### 🛠️ [@esteban-url/cli](./packages/cli) - Functional CLI Framework

- **Result-based error handling** - Explicit error propagation, no exceptions
- **Functional programming** - Pure functions, immutable data, composition
- **Comprehensive testing** - Built-in mocks, assertions, and test utilities
- **Rich developer experience** - Progress tracking, spinners, and beautiful output
- **Type safety** - Full TypeScript support with strict error handling

#### 🚀 [@esteban-url/create-cli](./packages/create-cli) - CLI Project Generator

- **Quick project scaffolding** - Generate production-ready CLI projects in seconds
- **Best practices built-in** - Pre-configured with TypeScript, testing, and linting
- **Flexible templates** - Choose between minimal and full-featured templates
- **Monorepo support** - Optimized for both standalone and monorepo development
- **Interactive setup** - Guided configuration with sensible defaults

## Monorepo Architecture

```text
trailhead/
├── packages/                           # Public packages
│   ├── cli/                           # @esteban-url/cli - CLI framework
│   ├── create-cli/                    # @esteban-url/create-cli - Project generator
│   ├── core/                          # @repo/core - Foundation (Result types)
│   ├── fs/                            # @repo/fs - File system operations
│   ├── data/                          # @repo/data - Data processing
│   ├── validation/                    # @repo/validation - Data validation
│   └── config/                        # @repo/config - Configuration management
├── apps/demos/                        # Example applications
│   ├── next/                          # Next.js demo
│   └── rwsdk/                         # RedwoodJS SDK demo
├── tooling/                           # Shared development tools
│   ├── typescript-config/             # Shared TypeScript configurations
│   ├── prettier-config/               # Code formatting
│   └── vitest-config/                 # Test configuration
└── docs/                              # Monorepo documentation (Diátaxis framework)
```

**Built on Modern Foundations:**

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

### 📚 Package Documentation

| Package             | Quick Start                                                                 | How-to Guides                                                                | API Reference                                                     |
| ------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **CLI Framework**   | [Getting Started](./packages/cli/docs/tutorials/getting-started.md)         | [Build Complete CLI](./packages/cli/docs/tutorials/build-complete-cli.md)    | [Command API](./packages/cli/docs/reference/command.md)           |
| **Create CLI**      | [Generate Project](./packages/create-cli/docs/tutorials/getting-started.md) | [Custom Templates](./packages/create-cli/docs/how-to/customize-templates.md) | [Template API](./packages/create-cli/docs/reference/templates.md) |
| **Data Processing** | [Data Pipeline Tutorial](./docs/tutorials/data-pipeline-processing.md)      | [Convert Data Formats](./docs/how-to/convert-data-formats.md)                | [Data API](./packages/data/docs/reference/api.md)                 |
| **File Operations** | [File Operations Basics](./docs/tutorials/file-operations-basics.md)        | [Atomic File Operations](./docs/how-to/perform-atomic-file-operations.md)    | [FS API](./packages/fs/docs/reference/api.md)                     |
| **Validation**      | [Form Validation Guide](./docs/tutorials/form-validation-guide.md)          | [Create Custom Validators](./docs/how-to/create-custom-validators.md)        | [Validation API](./packages/validation/docs/reference/api.md)     |

### 🧭 Find What You Need

**Learning (Tutorials)** - Step-by-step guides for building understanding

- [Build Your First CLI](./packages/cli/docs/tutorials/getting-started.md)
- [Complete CLI Application](./packages/cli/docs/tutorials/build-complete-cli.md)
- [Data Processing Pipeline](./docs/tutorials/data-pipeline-processing.md)
- [File Operations Fundamentals](./docs/tutorials/file-operations-basics.md)

**Problem-Solving (How-to Guides)** - Specific solutions for common tasks

- [Handle CLI Errors](./packages/cli/docs/how-to/handle-errors-in-cli.md)
- [Test CLI Applications](./packages/cli/docs/how-to/test-cli-applications.md)
- [Convert Data Formats](./docs/how-to/convert-data-formats.md)
- [Create Custom Validators](./docs/how-to/create-custom-validators.md)

**Reference (API Docs)** - Technical specifications and lookups

- [CLI Command API](./packages/cli/docs/reference/command.md)
- [File System API](./packages/fs/docs/reference/api.md)
- [Data Processing API](./packages/data/docs/reference/api.md)
- [Validation API](./packages/validation/docs/reference/api.md)

**Understanding (Explanations)** - Concepts and design decisions

- [Functional Architecture](./docs/explanation/functional-architecture.md)
- [Result Types Pattern](./docs/explanation/result-types-pattern.md)
- [Package Ecosystem](./docs/explanation/package-ecosystem.md)

### 🤝 Contributing

- **[Development Workflow](./CLAUDE.md)** - Issue-driven development process
- **[Documentation Standards](./docs/reference/documentation-standards.md)** - Diátaxis framework implementation
- **[Writing Guide](./docs/reference/writing-guide.md)** - Quick reference for contributors

## Community

- **Issues**: [GitHub Issues](https://github.com/esteban-url/trailhead/issues)
- **Discussions**: [GitHub Discussions](https://github.com/esteban-url/trailhead/discussions)
- **Contributing**: See [CLAUDE.md](./CLAUDE.md) for guidelines

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with ❤️ using functional programming principles, modern TypeScript, and comprehensive testing.**
