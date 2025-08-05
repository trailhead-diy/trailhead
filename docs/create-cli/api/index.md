**@esteban-url/create-cli**

---

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
# Run directly with npx (no installation required)
npx @esteban-url/create-cli my-awesome-cli

# Or with explicit generate command
npx @esteban-url/create-cli generate my-awesome-cli

# Install globally for repeated use
npm install -g @esteban-url/create-cli
create-trailhead-cli my-awesome-cli

# With options
npx @esteban-url/create-cli my-cli --docs --package-manager npm

# See all options
npx @esteban-url/create-cli --help
npx @esteban-url/create-cli generate --help
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

const processData = (input: string): Result<string, CoreError> => {
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
import { generateProject } from '@esteban-url/create-cli'

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

Complete documentation is available in the [docs directory](_media/README.md)

### 📚 Tutorials

- [Getting Started](_media/getting-started.md)- Generate your first CLI in 5 minutes

### 📖 How-To Guides

- [Customize Templates](_media/customize-templates.md)- Modify or create templates
- [Add Custom Prompts](_media/custom-prompts.md)- Extend interactive setup
- [Configure Defaults](_media/configure-defaults.md)- Set personal preferences

### 📋 Reference

- [API Reference](_media/api.md)- Programmatic usage
- [Configuration Schema](_media/schema.md)- All configuration options
- [Template System](_media/templates.md)- Template engine details

### 💡 Explanation

- [Template Architecture](_media/templates-1.md)- Understanding the design

## License

MIT © [Esteban URL](https://github.com/esteban-url)

## Support

- [GitHub Issues](https://github.com/esteban-url/trailhead/issues)
- [Documentation](https://trailhead.esteban-url.dev)
- [CLI Framework Docs](https://trailhead.esteban-url.dev/cli)

---

Built with ❤️ using the @esteban-url/cli framework

## Interfaces

### ProjectConfig

Complete project configuration for the generation process

#### Properties

| Property                                       | Type                                                      | Description                                                 |
| ---------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| <a id="projectname"></a> `projectName`         | `string`                                                  | Name of the project (used for directory and package naming) |
| <a id="projectpath"></a> `projectPath`         | `string`                                                  | Absolute path where the project will be created             |
| <a id="packagemanager-1"></a> `packageManager` | [`PackageManager`](#packagemanager)                       | Package manager for dependency installation                 |
| <a id="features"></a> `features`               | `object`                                                  | Feature flags                                               |
| `features.core`                                | `true`                                                    | -                                                           |
| `features.config?`                             | `boolean`                                                 | -                                                           |
| `features.validation?`                         | `boolean`                                                 | -                                                           |
| `features.testing?`                            | `boolean`                                                 | -                                                           |
| `features.docs?`                               | `boolean`                                                 | -                                                           |
| `features.cicd?`                               | `boolean`                                                 | -                                                           |
| <a id="projecttype"></a> `projectType`         | `"standalone-cli"` \| `"library"` \| `"monorepo-package"` | Project type                                                |
| <a id="nodeversion"></a> `nodeVersion`         | `string`                                                  | Target Node.js version                                      |
| <a id="typescript"></a> `typescript`           | `boolean`                                                 | Whether to use TypeScript (always true)                     |
| <a id="ide"></a> `ide`                         | `"vscode"` \| `"none"`                                    | IDE configuration                                           |
| <a id="includedocs"></a> `includeDocs`         | `boolean`                                                 | Whether to include documentation                            |
| <a id="dryrun"></a> `dryRun`                   | `boolean`                                                 | Whether to run in dry-run mode (no actual file operations)  |
| <a id="force"></a> `force`                     | `boolean`                                                 | Whether to force overwrite existing directories             |
| <a id="verbose"></a> `verbose`                 | `boolean`                                                 | Whether to enable verbose logging                           |

---

### GeneratorContext

Execution context for the generator system

Provides access to essential services and configuration needed
throughout the generation process, including logging and filesystem
abstraction for testing and cross-platform compatibility.

#### Properties

| Property                                      | Type                                            | Description                                                      |
| --------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| <a id="logger"></a> `logger`                  | `Logger`                                        | Logger instance for user feedback and debugging                  |
| <a id="verbose-1"></a> `verbose`              | `boolean`                                       | Whether to enable verbose logging output                         |
| <a id="templateconfig"></a> `templateConfig?` | [`TemplateLoaderConfig`](#templateloaderconfig) | Optional template loader configuration for custom template paths |

---

### TemplateContext

Template context variables for Handlebars compilation

This interface defines all variables available to Handlebars templates
during the compilation process. These variables are interpolated into
template files to generate the final project structure.

#### Example

```handlebars
{
  "name": "{{packageName}}",
  "version": "{{version}}",
  "author": "{{author}} <{{email}}>",
  "license": "{{license}}"
}
```

#### Properties

| Property                                                 | Type                                                                                                              | Description                                         |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| <a id="projectname-1"></a> `projectName`                 | `string`                                                                                                          | Project name as provided by user                    |
| <a id="packagename"></a> `packageName`                   | `string`                                                                                                          | Sanitized package name (kebab-case, npm-compatible) |
| <a id="description"></a> `description`                   | `string`                                                                                                          | Project description                                 |
| <a id="author"></a> `author`                             | `string`                                                                                                          | Author name                                         |
| <a id="email"></a> `email`                               | `string`                                                                                                          | Author email address                                |
| <a id="license"></a> `license`                           | `string`                                                                                                          | License identifier (SPDX format)                    |
| <a id="version"></a> `version`                           | `string`                                                                                                          | Initial project version                             |
| <a id="packagemanager-2"></a> `packageManager`           | [`PackageManager`](#packagemanager)                                                                               | Selected package manager                            |
| <a id="currentyear"></a> `currentYear`                   | `number`                                                                                                          | Current year for copyright notices                  |
| <a id="hasdocs"></a> `hasDocs`                           | `boolean`                                                                                                         | Whether documentation generation is enabled         |
| <a id="features-1"></a> `features`                       | `object`                                                                                                          | Feature flags for template conditional logic        |
| `features.core`                                          | `boolean`                                                                                                         | -                                                   |
| `features.config?`                                       | `boolean`                                                                                                         | -                                                   |
| `features.validation?`                                   | `boolean`                                                                                                         | -                                                   |
| `features.testing?`                                      | `boolean`                                                                                                         | -                                                   |
| `features.docs?`                                         | `boolean`                                                                                                         | -                                                   |
| `features.examples?`                                     | `boolean`                                                                                                         | -                                                   |
| `features.cicd?`                                         | `boolean`                                                                                                         | -                                                   |
| <a id="cli_version"></a> `CLI_VERSION`                   | `string`                                                                                                          | CLI version for smart test runner                   |
| <a id="project_name"></a> `PROJECT_NAME`                 | `string`                                                                                                          | Project name for template context                   |
| <a id="is_monorepo"></a> `IS_MONOREPO`                   | `boolean`                                                                                                         | Whether project is a monorepo                       |
| <a id="package_manager"></a> `PACKAGE_MANAGER`           | `string`                                                                                                          | Package manager command                             |
| <a id="packages_dir"></a> `PACKAGES_DIR`                 | `string`                                                                                                          | Directory containing packages (for monorepos)       |
| <a id="packages_pattern"></a> `PACKAGES_PATTERN`         | `string`                                                                                                          | Regex pattern to match package files                |
| <a id="test_command"></a> `TEST_COMMAND`                 | `string`                                                                                                          | Test command to execute                             |
| <a id="timeout"></a> `TIMEOUT`                           | `number`                                                                                                          | Test execution timeout in seconds                   |
| <a id="file_patterns"></a> `FILE_PATTERNS`               | `string`                                                                                                          | File patterns for template processing               |
| <a id="high_risk_patterns"></a> `HIGH_RISK_PATTERNS`     | `string`[]                                                                                                        | High-risk file patterns that trigger full tests     |
| <a id="skip_patterns"></a> `SKIP_PATTERNS`               | `string`[]                                                                                                        | File patterns to skip for test execution            |
| <a id="has_subpath_exports"></a> `HAS_SUBPATH_EXPORTS`   | `boolean`                                                                                                         | Whether project has subpath exports                 |
| <a id="subpath_exports"></a> `SUBPATH_EXPORTS`           | `string`[]                                                                                                        | List of subpath exports                             |
| <a id="package_mappings"></a> `PACKAGE_MAPPINGS?`        | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `string`\> | Package name mappings (for monorepos)               |
| <a id="lint_command"></a> `LINT_COMMAND`                 | `string`                                                                                                          | Lint command                                        |
| <a id="typecheck_command"></a> `TYPECHECK_COMMAND`       | `string`                                                                                                          | TypeScript type checking command                    |
| <a id="smart_test_command"></a> `SMART_TEST_COMMAND`     | `string`                                                                                                          | Smart test runner script path                       |
| <a id="secrets_priority"></a> `SECRETS_PRIORITY`         | `number`                                                                                                          | Secrets scanning priority                           |
| <a id="filesize_priority"></a> `FILESIZE_PRIORITY`       | `number`                                                                                                          | File size check priority                            |
| <a id="tests_priority"></a> `TESTS_PRIORITY`             | `number`                                                                                                          | Tests execution priority                            |
| <a id="docs_validation"></a> `DOCS_VALIDATION`           | `boolean`                                                                                                         | Whether docs validation is enabled                  |
| <a id="changeset_reminder"></a> `CHANGESET_REMINDER`     | `boolean`                                                                                                         | Whether changeset reminder is enabled               |
| <a id="conventional_commits"></a> `CONVENTIONAL_COMMITS` | `boolean`                                                                                                         | Whether conventional commits are enforced           |
| <a id="lockfile_validation"></a> `LOCKFILE_VALIDATION`   | `boolean`                                                                                                         | Whether lockfile validation is enabled              |

---

### TemplateFile

Template file metadata for processing pipeline

Describes a single file in the template system with metadata
about how it should be processed and where it should be placed
in the generated project structure.

#### Properties

| Property                               | Type      | Description                                          |
| -------------------------------------- | --------- | ---------------------------------------------------- |
| <a id="source"></a> `source`           | `string`  | Source path relative to templates directory          |
| <a id="destination"></a> `destination` | `string`  | Destination path relative to project root            |
| <a id="istemplate"></a> `isTemplate`   | `boolean` | Whether file requires Handlebars template processing |
| <a id="executable"></a> `executable`   | `boolean` | Whether file should be marked as executable          |

---

### TemplateLoaderConfig

Template loader configuration options

Allows customization of template discovery and loading behavior,
particularly useful for testing and advanced use cases.

#### Properties

| Property                                      | Type       | Description                                                               |
| --------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| <a id="templatesdir"></a> `templatesDir?`     | `string`   | Base directory containing template files (defaults to built-in templates) |
| <a id="shareddir"></a> `sharedDir?`           | `string`   | Custom shared template directory (overrides default shared path)          |
| <a id="additionaldirs"></a> `additionalDirs?` | `string`[] | Additional template search directories (appended to default paths)        |

---

### TemplateInfo

Information about an available template

#### Properties

| Property                                 | Type                                    | Description                                |
| ---------------------------------------- | --------------------------------------- | ------------------------------------------ |
| <a id="name"></a> `name`                 | `string`                                | Template identifier/name                   |
| <a id="description-1"></a> `description` | `string`                                | Human-readable description                 |
| <a id="features-2"></a> `features`       | `string`[]                              | List of features provided by this template |
| <a id="type"></a> `type`                 | `"custom"` \| `"basic"` \| `"advanced"` | Template type                              |
| <a id="builtin"></a> `builtin`           | `boolean`                               | Whether this is a built-in template        |

## Type Aliases

### PackageManager

> **PackageManager** = `"npm"` \| `"pnpm"`

Supported package managers for dependency installation

Focus on the two most widely used and stable package managers:

- npm: Universal compatibility, industry standard
- pnpm: Modern, efficient, monorepo-ready

## Functions

### validateConfig()

> **validateConfig**(`config`): [`Result`](https://github.com/supermacro/neverthrow#result)\<[`ProjectConfig`](#projectconfig), `CoreError`\>

Validate and normalize project configuration with defaults

Takes a partial project configuration and returns a complete ProjectConfig
with validated values and sensible defaults applied.

#### Parameters

| Parameter | Type                                                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `config`  | [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<[`ProjectConfig`](#projectconfig)\> |

#### Returns

[`Result`](https://github.com/supermacro/neverthrow#result)\<[`ProjectConfig`](#projectconfig), `CoreError`\>

---

### generateProject()

> **generateProject**(`config`, `context`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`Result`](https://github.com/supermacro/neverthrow#result)\<`void`, `CoreError`\>\>

Generate a new CLI project from templates

This is the main entry point for project generation. It orchestrates the entire
process from template loading through file processing to dependency installation.

#### Parameters

| Parameter | Type                                    | Description                                                                   |
| --------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| `config`  | [`ProjectConfig`](#projectconfig)       | Complete project configuration including template variant, paths, and options |
| `context` | [`GeneratorContext`](#generatorcontext) | Generator execution context with logger, filesystem, and environment          |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`Result`](https://github.com/supermacro/neverthrow#result)\<`void`, `CoreError`\>\>

Promise resolving to Result indicating success or detailed error information

#### Example

```typescript
const config: ProjectConfig = {
  projectName: 'my-cli',
  projectPath: '/path/to/project',
  template: 'basic',
  packageManager: 'pnpm',
  includeDocs: true,
  dryRun: false,
}

const result = await generateProject(config, context)
if (result.isOk()) {
  console.log('Project generated successfully!')
} else {
  console.error('Generation failed:', result.error.message)
}
```

#### See

- [ProjectConfig](#projectconfig) for configuration options
- [GeneratorContext](#generatorcontext) for context requirements

---

### getTemplateFiles()

> **getTemplateFiles**(`variant`, `config?`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`TemplateFile`](#templatefile)[]\>

Load and discover template files for a specific template variant

Scans both variant-specific and shared template directories to build
a complete list of files needed for project generation. Combines
templates from both sources with proper precedence and metadata.

#### Parameters

| Parameter | Type                                            | Description                                                   |
| --------- | ----------------------------------------------- | ------------------------------------------------------------- |
| `variant` | `string`                                        | Template variant identifier (deprecated, always uses 'basic') |
| `config?` | [`TemplateLoaderConfig`](#templateloaderconfig) | Optional configuration for custom template paths              |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`TemplateFile`](#templatefile)[]\>

Promise resolving to array of template file metadata objects

#### Example

```typescript
// Using default built-in templates
const files = await getTemplateFiles('advanced')

// Using custom template directories
const customFiles = await getTemplateFiles('basic', {
  templatesDir: '/custom/templates',
  additionalDirs: ['/extra/templates'],
})

console.log(`Found ${files.length} template files`)
files.forEach((file) => {
  console.log(`${file.source} -> ${file.destination}`)
  if (file.isTemplate) console.log('  (will be processed with Handlebars)')
  if (file.executable) console.log('  (will be made executable)')
})
```

File discovery process:

1. Determine template directories (built-in or custom)
2. Load variant-specific files from variant directory
3. Load shared files from shared directory
4. Load files from additional directories if specified
5. Combine all sets with variant files taking precedence
6. Process file metadata (template detection, executable flags, path mapping)

#### See

- loadTemplateFilesFromDirectory for directory scanning logic
- [TemplateFile](#templatefile) for file metadata structure
- [TemplateLoaderConfig](#templateloaderconfig) for configuration options

---

### getAvailableTemplates()

> **getAvailableTemplates**(): [`TemplateInfo`](#templateinfo)[]

Get information about all available project templates

Returns metadata about built-in templates that can be used for project generation.
This includes template names, descriptions, and feature lists.

#### Returns

[`TemplateInfo`](#templateinfo)[]

Array of template information objects

#### Example

```typescript
import { getAvailableTemplates } from '@esteban-url/create-cli'

const templates = getAvailableTemplates()
templates.forEach((template) => {
  console.log(`${template.name}: ${template.description}`)
  console.log(`  Features: ${template.features.join(', ')}`)
})
```
