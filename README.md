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

→ **Start here:** [@trailhead/cli Framework](#cli-framework)  
→ **Quick setup:** [Generate CLI Project](#create-your-own-cli)  
→ **Learn by example:** [Build Your First CLI](./packages/cli/docs/tutorials/getting-started.md)

### 🔧 I need data processing utilities

**Best for:** File processing, data validation, format conversion

→ **Start here:** [Package Ecosystem](#package-ecosystem)
→ **Data processing:** [@trailhead/data](./packages/data/README.md)
→ **File operations:** [@trailhead/cli/fs](./packages/cli/README.md#filesystem-operations)

### 📊 I want to scaffold new projects

**Best for:** Generating CLI projects with best practices built-in

→ **Start here:** [@trailhead/create-cli](#create-your-own-cli)  
→ **Templates:** [Template System](./packages/create-cli/docs/explanation/templates.md)  
→ **Customization:** [Custom Templates](./packages/create-cli/docs/how-to/customize-templates.md)

### 🤝 I want to contribute to Trailhead

**Best for:** Adding features, fixing bugs, improving documentation

→ **Start here:** [Development Workflow](./CLAUDE.md)
→ **Architecture:** [Architecture Overview](./packages/cli/docs/explanation/architecture.md)
→ **Design:** [Design Decisions](./packages/cli/docs/explanation/design-decisions.md)

---

## Quick Start

### CLI Framework

```bash
# Install the functional CLI framework
pnpm add @trailhead/cli
```

```typescript
# Create your first command
import { createCommand } from '@trailhead/cli/command';

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
pnpm create @trailhead/cli my-cli

# Navigate to your project
cd my-cli

# Start developing
pnpm dev
```

## Package Ecosystem

### 🔗 Package Relationship Matrix

| Package                                            | Purpose           | Dependencies                         | Best For                           |
| -------------------------------------------------- | ----------------- | ------------------------------------ | ---------------------------------- |
| **[@trailhead/cli](./packages/cli)**               | CLI Framework     | `@trailhead/core`                    | Building command-line applications |
| **[@trailhead/create-cli](./packages/create-cli)** | Project Generator | `@trailhead/cli`                     | Scaffolding CLI projects           |
| **[@trailhead/core](./packages/core)**             | Foundation        | None                                 | Result types, functional utilities |
| **[@trailhead/data](./packages/data)**             | Data Processing   | `@trailhead/core`, `@trailhead/cli`  | CSV/JSON/Excel processing          |

### 🎯 When to Use Each Package

#### Building a CLI Application?

```typescript
// Use @trailhead/cli for the framework
import { createCommand } from '@trailhead/cli/command'
// + @trailhead/cli/fs for file operations
// + @trailhead/data for processing data files
```

#### Processing Data Files?

```typescript
// Use @trailhead/data for format handling
import { data } from '@trailhead/data'
// + @trailhead/cli/fs for file operations
```

#### Need File Operations?

```typescript
// Use @trailhead/cli/fs for filesystem operations
import { fs } from '@trailhead/cli/fs'
// + @trailhead/core for Result types
```

### 🔄 Common Integration Patterns

#### CLI + Data Processing Pipeline

```typescript
import { createCommand } from '@trailhead/cli/command'
import { data } from '@trailhead/data'
import { fs } from '@trailhead/cli/fs'

const processCommand = createCommand({
  name: 'process',
  action: async ({ inputFile, outputFile }) => {
    // 1. Validate file exists
    const exists = await fs.exists(inputFile)
    if (!exists.value) return err(new Error('File not found'))

    // 2. Parse data file
    const parseResult = await data.parseAuto(inputFile)
    if (parseResult.isErr()) return parseResult

    // 3. Write processed data
    return data.writeAuto(outputFile, parseResult.value.data)
  },
})
```

#### Multi-Format Data Conversion

```typescript
import { data } from '@trailhead/data'
import { fs } from '@trailhead/cli/fs'
import { createCommand } from '@trailhead/cli/command'

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

#### 🛠️ [@trailhead/cli](./packages/cli) - Functional CLI Framework

- **Result-based error handling** - Explicit error propagation, no exceptions
- **Functional programming** - Pure functions, immutable data, composition
- **Comprehensive testing** - Built-in mocks, assertions, and test utilities
- **Rich developer experience** - Progress tracking, spinners, and beautiful output
- **Type safety** - Full TypeScript support with strict error handling

#### 🚀 [@trailhead/create-cli](./packages/create-cli) - CLI Project Generator

- **Quick project scaffolding** - Generate production-ready CLI projects in seconds
- **Best practices built-in** - Pre-configured with TypeScript, testing, and linting
- **Flexible templates** - Choose between minimal and full-featured templates
- **Monorepo support** - Optimized for both standalone and monorepo development
- **Interactive setup** - Guided configuration with sensible defaults

## Monorepo Architecture

```text
trailhead/
├── packages/                           # Public packages
│   ├── cli/                           # @trailhead/cli - CLI framework (includes fs)
│   ├── create-cli/                    # @trailhead/create-cli - Project generator
│   ├── core/                          # @trailhead/core - Foundation (Result types)
│   └── data/                          # @trailhead/data - Data processing
├── tooling/                           # Shared development tools
│   ├── typescript-config/             # @repo/typescript-config - TypeScript configs
│   ├── prettier-config/               # @repo/prettier-config - Code formatting
│   ├── vitest-config/                 # @repo/vitest-config - Test configuration
│   └── tsup-config/                   # @repo/tsup-config - Build configuration
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
- **🎨 Beautiful Output**: Modern prompts, progress bars, and spinners
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

# Run tests with coverage (opt-in)
pnpm coverage

# Run local CI without coverage
pnpm ci:run

# Run local CI with coverage (opt-in)
pnpm ci:coverage

# Lint and type check
pnpm lint && pnpm types

# Format code
pnpm format

# Package-specific commands
pnpm dev --filter=@trailhead/cli
pnpm test --filter=@trailhead/create-cli
```

## Getting Started

### For CLI Development

1. **Install the CLI framework**: `pnpm add @trailhead/cli`
2. **Read the guide**: [CLI Framework Documentation](./packages/cli/README.md)
3. **Read the documentation**: Review the comprehensive API docs
4. **Build and test**: Use the comprehensive testing utilities

### For Creating New CLIs

1. **Generate a CLI**: `pnpm create @trailhead/cli my-awesome-cli`
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
import { createCommand, Result } from '@trailhead/cli'

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
pnpm create @trailhead/cli my-cli

# Or with options
pnpm create @trailhead/cli my-cli \
  --author "Your Name" \
  --template full \
  --git

# Start developing
cd my-cli
pnpm dev
```

## Documentation

### 📚 Package Documentation

| Package             | Quick Start                                                                 | How-to Guides                                                                | API Reference                           |
| ------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------- |
| **CLI Framework**   | [Getting Started](./packages/cli/docs/tutorials/getting-started.md)         | [Build Complete CLI](./packages/cli/docs/tutorials/build-complete-cli.md)    | [CLI API](./docs/@trailhead.cli.md)     |
| **Create CLI**      | [Generate Project](./packages/create-cli/docs/tutorials/getting-started.md) | [Custom Templates](./packages/create-cli/docs/how-to/customize-templates.md) | [Create CLI API](./docs/@trailhead.create-cli.md) |
| **Data Processing** | [Process Data Files](./packages/data/docs/how-to/process-data-files.md)     | [Format Detection](./packages/data/docs/explanation/format-detection.md)     | [Data API](./docs/@trailhead.data.md)   |
| **Core Utilities**  | [Result Types](./packages/core/README.md)                                   | [Error Handling](./packages/cli/docs/how-to/handle-errors-in-cli.md)         | [Core API](./docs/@trailhead.core.md)   |

### 🧭 Find What You Need

**Learning (Tutorials)** - Step-by-step guides for building understanding

- [Build Your First CLI](./packages/cli/docs/tutorials/getting-started.md)
- [Complete CLI Application](./packages/cli/docs/tutorials/build-complete-cli.md)
- [Generate a CLI Project](./packages/create-cli/docs/tutorials/getting-started.md)

**Problem-Solving (How-to Guides)** - Specific solutions for common tasks

- [Handle CLI Errors](./packages/cli/docs/how-to/handle-errors-in-cli.md)
- [Test CLI Applications](./packages/cli/docs/how-to/test-cli-applications.md)
- [Add File Operations](./packages/cli/docs/how-to/add-file-operations.md)
- [Process Data Files](./packages/data/docs/how-to/process-data-files.md)

**Reference (API Docs)** - Complete API documentation

- [CLI API](./docs/@trailhead.cli.md)
- [Core API](./docs/@trailhead.core.md)
- [Data API](./docs/@trailhead.data.md)
- [Create CLI API](./docs/@trailhead.create-cli.md)

**Understanding (Explanations)** - Concepts and design decisions

- [Architecture Overview](./packages/cli/docs/explanation/architecture.md)
- [Design Decisions](./packages/cli/docs/explanation/design-decisions.md)
- [Format Detection](./packages/data/docs/explanation/format-detection.md)
- [Template System](./packages/create-cli/docs/explanation/templates.md)

### 🤝 Contributing

- **[Development Workflow](./CLAUDE.md)** - Issue-driven development process
- **[API Documentation](./docs/README.md)** - TypeDoc-generated API reference

## Community

- **Issues**: [GitHub Issues](https://github.com/trailhead-diy/trailhead/issues)
- **Discussions**: [GitHub Discussions](https://github.com/trailhead-diy/trailhead/discussions)
- **Contributing**: See [CLAUDE.md](./CLAUDE.md) for guidelines

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with intention, care and frustration, using functional programming principles, modern TypeScript, and comprehensive testing.**
