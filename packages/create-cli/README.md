# @trailhead/create-cli

A modern CLI generator built with functional programming principles and the @trailhead/cli framework. Creates well-structured, type-safe CLI applications using best practices and proven patterns.

## Features

- 🎯 **CLI Framework Foundation** - Built on @trailhead/cli for robust command handling
- 🔧 **Functional Programming** - Pure functions, immutable data, composition over inheritance
- 📦 **Template System** - Handlebars-based templates with intelligent caching
- 🛡️ **Type Safety** - Full TypeScript support with Result types for error handling
- 🧪 **Testing Ready** - Comprehensive testing utilities and high-ROI test patterns
- 🎨 **Beautiful Output** - Rich CLI experience with progress indicators and helpful messages

## Quick Start

```bash
# Run directly with npx (no installation required)
npx @trailhead/create-cli my-awesome-cli

# Or with explicit generate command
npx @trailhead/create-cli generate my-awesome-cli

# Install globally for repeated use
npm install -g @trailhead/create-cli
create-trailhead-cli my-awesome-cli

# With options
npx @trailhead/create-cli my-cli --docs --package-manager npm

# See all options
npx @trailhead/create-cli --help
npx @trailhead/create-cli generate --help
```

## Project Types & Features

### Project Types

Choose the type that matches your use case:

- **standalone-cli**: Independent CLI application with its own dependencies
- **library**: Reusable library that can be imported by other projects
- **monorepo-package**: Package within a monorepo structure

### Feature Modules

Select features based on your needs:

- **core** (required): Essential CLI functionality, commands, help system
- **config**: Configuration management with Zod validation
- **validation**: Input validation utilities and helpers
- **testing**: Vitest setup with integration tests
- **docs**: Documentation structure following Diátaxis framework
- **cicd**: GitHub Actions workflows and git hooks

## CLI Framework Integration

This generator creates projects using the @trailhead/cli framework, providing:

### Command Structure

```typescript
import { createCLI, createCommand } from '@trailhead/cli'

const myCommand = createCommand({
  name: 'hello',
  description: 'Say hello',
  action: async (options, context) => {
    context.logger.info('Hello, World!')
    return ok(undefined)
  },
})

const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  commands: [myCommand],
})
```

### Error Handling

```typescript
import { ok, err, Result, CoreError } from '@trailhead/core'

const processData = (input: string): Result<string, CoreError> => {
  if (!input) {
    return err(createError('INPUT_REQUIRED', 'Input is required'))
  }
  return ok(input.toUpperCase())
}
```

### Testing

```typescript
import { expectSuccess, expectError } from '@trailhead/cli/testing'
import { setupResultMatchers } from '@trailhead/core/testing'

setupResultMatchers()

it('should process valid input', async () => {
  const result = processData('hello')
  expectSuccess(result)
  expect(result).toBeOk()
  expect(result.value).toBe('HELLO')
})
```

## Architecture

### Functional Programming Patterns

The generated projects follow functional programming principles:

- **Pure Functions**: No side effects, predictable outputs
- **Immutable Data**: Data structures don't change after creation
- **Composition**: Building complex behavior from simple functions
- **Result Types**: Explicit error handling without exceptions

### Error Handling System

Standardized error handling with:

```typescript
// Consistent error creation
return err(
  createMyComponentError(ERROR_CODES.OPERATION_FAILED, 'Operation failed: invalid input', {
    operation: 'processInput',
    context: { input: userInput },
    recoverable: true,
    suggestion: 'Provide valid input format',
  })
)
```

### Template System

Advanced template processing with:

- **Handlebars Integration**: Full template engine support
- **Intelligent Caching**: Performance optimization with cache invalidation
- **Security**: Context sanitization and XSS prevention
- **Extensibility**: Custom helpers and partial support

## Generated Project Structure

```
my-cli/
├── src/
│   ├── index.ts              # Main CLI entry point
│   ├── commands/             # Command implementations
│   │   ├── hello.ts
│   │   └── version.ts
│   ├── lib/                  # Shared utilities
│   └── __tests__/            # Test files
├── templates/                # Template files (if docs feature selected)
├── docs/                     # Documentation (if docs feature selected)
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── tsup.config.ts            # Build configuration
├── vitest.config.ts          # Test configuration
└── README.md                 # Project documentation
```

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Available Scripts

```bash
# Development
pnpm dev                      # Start development mode
pnpm build                    # Build for production
pnpm test                     # Run tests
pnpm test:watch              # Run tests in watch mode

# Quality
pnpm types                    # Type checking
pnpm lint                     # Lint code
pnpm format                   # Format code

# Release
pnpm clean                    # Clean build artifacts
```

### Project Commands

```bash
# Generate new project
pnpm generate <name>          # Interactive generation
pnpm generate <name> --type standalone-cli  # Standalone CLI
pnpm generate <name> --type library         # Reusable library
pnpm generate <name> --type monorepo-package # Monorepo package

# Manage configuration
pnpm config list              # List configuration
pnpm config set <key> <value> # Set configuration
pnpm config reset             # Reset to defaults
```

## API Reference

### Generator Function

```typescript
import { generateProject } from '@trailhead/create-cli'

const result = await generateProject(config, context)
if (result.isOk()) {
  console.log(`Project generated at: ${result.value.projectPath}`)
  console.log(`Files created: ${result.value.filesCreated}`)
} else {
  console.error(`Generation failed: ${result.error.message}`)
}
```

### Configuration Types

```typescript
interface ProjectConfig {
  projectName: string
  projectPath: string
  projectType: 'standalone-cli' | 'library' | 'monorepo-package'
  packageManager: 'npm' | 'pnpm'
  features: {
    core: true
    config?: boolean
    validation?: boolean
    testing?: boolean
    docs?: boolean
    cicd?: boolean
  }
  nodeVersion: string
  typescript: boolean
  ide: 'vscode' | 'none'
  includeDocs: boolean
  dryRun: boolean
  force: boolean
  verbose: boolean
}
```

### Testing Utilities

```typescript
import {
  createMockScaffolder,
  assertProjectGeneration,
  validateProjectGeneration,
  templateFixtures,
} from '@trailhead/create-cli/testing'

// Mock scaffolder for testing
const scaffolder = createMockScaffolder()
const result = await scaffolder.generateProject('test-cli', 'basic')

// Assertions
assertProjectGeneration(result, 'test-cli', 15)

// Functional validation
const validation = validateProjectGeneration(result, 'test-cli')
expectSuccess(validation)
```

## Configuration

### Global Configuration

```bash
# Set default project type
create-trailhead-cli config set projectType standalone-cli

# Set default package manager
create-trailhead-cli config set packageManager pnpm

# View current configuration
create-trailhead-cli config list
```

### Environment Variables

```bash
# Debug mode
DEBUG=create-cli:* create-trailhead-cli generate my-cli

# Skip interactive prompts
CI=true create-trailhead-cli generate my-cli --type standalone-cli
```

## Error Handling

The generator uses a comprehensive error handling system:

### Error Categories

- **Validation Errors**: Invalid inputs, missing requirements
- **Template Errors**: Template compilation or rendering failures
- **File System Errors**: Permission issues, disk space problems
- **Network Errors**: Package manager or dependency issues

### Error Recovery

```typescript
// Automatic retry for transient failures
const result = await generateProject(config, context)
if (result.isErr() && result.error.recoverable) {
  console.log(`Retrying: ${result.error.suggestion}`)
  // User can fix and retry
}
```

### Error Context

All errors include helpful context:

```typescript
if (result.isErr()) {
  console.error(`Error: ${result.error.message}`)
  console.error(`Suggestion: ${result.error.suggestion}`)
  console.error(`Context:`, result.error.context)
}
```

## Performance

### Template Caching

- **Smart Caching**: Templates cached based on file modification time
- **Memory Management**: LRU cache with configurable size limits
- **Cache Invalidation**: Automatic invalidation on file changes

### Build Optimization

- **Tree Shaking**: Only bundle used functionality
- **Code Splitting**: Separate chunks for templates and utilities
- **Bundle Analysis**: Built-in bundle size monitoring

## Contributing

### Development Setup

```bash
# Clone repository
git clone https://github.com/trailhead-diy/trailhead.git
cd trailhead/packages/create-cli

# Install dependencies
pnpm install

# Run tests
pnpm test

# Start development
pnpm dev
```

### Testing

Follow the High-ROI testing philosophy:

✅ **Focus on**: Business logic, integration, error handling, user interactions
❌ **Avoid**: Basic rendering, framework internals, implementation details

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test generator

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Code Quality

```bash
# Type checking
pnpm types

# Linting
pnpm lint

# Formatting
pnpm format

# Full quality check
pnpm qc
```

## Documentation

Complete documentation is available in the [docs directory](./docs/README.md)

### 📚 Tutorials

- [Getting Started](./docs/tutorials/getting-started.md)- Generate your first CLI in 5 minutes

### 📖 How-To Guides

- [Customize Templates](./docs/how-to/customize-templates.md)- Modify or create templates
- [Add Custom Prompts](./docs/how-to/custom-prompts.md)- Extend interactive setup
- [Configure Defaults](./docs/how-to/configure-defaults.md)- Set personal preferences

### 📋 Reference

- **[API Documentation](../../docs/reference/api/create-cli.md)** - Complete API reference with examples and type information
- [Configuration Schema](./docs/reference/schema.md)- All configuration options
- [Template System](./docs/reference/templates.md)- Template engine details

### 💡 Explanation

- [Template Architecture](./docs/explanation/templates.md)- Understanding the design

## License

MIT © [Esteban URL](https://github.com/esteban-url)

## Support

- [GitHub Issues](https://github.com/trailhead-diy/trailhead/issues)
- [Documentation](https://trailhead.esteban-url.dev)
- [CLI Framework Docs](https://trailhead.esteban-url.dev/cli)

---

Built with ❤️ using the @trailhead/cli framework
