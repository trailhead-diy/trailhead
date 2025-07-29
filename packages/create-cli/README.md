# @esteban-url/create-cli

A modern CLI generator built with functional programming principles and the @esteban-url/cli framework. Creates well-structured, type-safe CLI applications using best practices and proven patterns.

## Features

- 🎯 **CLI Framework Foundation** - Built on @esteban-url/cli for robust command handling
- 🔧 **Functional Programming** - Pure functions, immutable data, composition over inheritance
- 📦 **Template System** - Handlebars-based templates with intelligent caching
- 🛡️ **Type Safety** - Full TypeScript support with Result types for error handling
- 🧪 **Testing Ready** - Comprehensive testing utilities and high-ROI test patterns
- 🎨 **Beautiful Output** - Rich CLI experience with progress indicators and helpful messages

## Quick Start

```bash
# Install globally
npm install -g @esteban-url/create-cli

# Generate a new CLI project
create-trailhead-cli generate my-awesome-cli

# Generate with specific template
create-trailhead-cli generate my-cli --template advanced

# See all options
create-trailhead-cli generate --help
```

## Project Templates

### Basic Template

Perfect for simple CLI tools:

- Core command structure using @esteban-url/cli
- TypeScript configuration
- Testing setup with Vitest
- Build system with tsup
- Basic project structure

### Advanced Template

Full-featured CLI applications:

- All basic template features
- Configuration management with @esteban-url/config
- Data validation with @esteban-url/validation
- Documentation generation
- Advanced testing patterns
- Production-ready setup

## CLI Framework Integration

This generator creates projects using the @esteban-url/cli framework, providing:

### Command Structure

```typescript
import { createCLI, createCommand } from '@esteban-url/cli'

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
import { ok, err, Result, CoreError } from '@esteban-url/core'

function processData(input: string): Result<string, CoreError> {
  if (!input) {
    return err(createError('INPUT_REQUIRED', 'Input is required'))
  }
  return ok(input.toUpperCase())
}
```

### Testing

```typescript
import { expectSuccess, expectError } from '@esteban-url/cli/testing'
import { setupResultMatchers } from '@esteban-url/core/testing'

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
├── templates/                # Template files (advanced)
├── docs/                     # Documentation (advanced)
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
pnpm generate:basic <name>    # Basic template
pnpm generate:advanced <name> # Advanced template

# Manage configuration
pnpm config list              # List configuration
pnpm config set <key> <value> # Set configuration
pnpm config reset             # Reset to defaults
```

## API Reference

### Generator Function

```typescript
import { generateProject } from '@esteban-url/create-cli'

const result = await generateProject(config, context)
if (result.isOk()) {
  console.log(`Project generated at: ${result.value.path}`)
} else {
  console.error(`Generation failed: ${result.error.message}`)
}
```

### Configuration Types

```typescript
interface ProjectConfig {
  projectName: string
  projectPath: string
  template: 'basic' | 'advanced'
  packageManager: 'npm' | 'pnpm'
  includeDocs: boolean
  initGit: boolean
  force: boolean
  dryRun: boolean
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
} from '@esteban-url/create-cli/testing'

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
# Set default template
create-trailhead-cli config set defaultTemplate advanced

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
CI=true create-trailhead-cli generate my-cli --template basic
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
git clone https://github.com/esteban-url/trailhead.git
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

### Available Guides

- [CLI Framework Migration](./docs/CLI_FRAMEWORK_MIGRATION.md) - Migration from legacy patterns
- [Error Handling](./docs/ERROR_HANDLING.md) - Comprehensive error handling guide
- [Testing Patterns](./docs/TESTING_PATTERNS.md) - Testing best practices
- [Functional Patterns](./docs/FUNCTIONAL_PATTERNS.md) - Functional programming guide

### Architecture Decisions

- [ADR-001: CLI Framework Adoption](./docs/adr/001-cli-framework-adoption.md)
- [ADR-002: Functional Programming Patterns](./docs/adr/002-functional-programming.md)
- [ADR-003: Error Handling Strategy](./docs/adr/003-error-handling.md)

## License

MIT © [Esteban URL](https://github.com/esteban-url)

## Support

- [GitHub Issues](https://github.com/esteban-url/trailhead/issues)
- [Documentation](https://trailhead.esteban-url.dev)
- [CLI Framework Docs](https://trailhead.esteban-url.dev/cli)

---

Built with ❤️ using the @esteban-url/cli framework
