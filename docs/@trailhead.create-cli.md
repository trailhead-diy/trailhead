[**Trailhead API Documentation v0.1.0**](README.md)

---

[Trailhead API Documentation](README.md) / @trailhead/create-cli

# @trailhead/create-cli

CLI generator for creating new Trailhead-based CLI applications.

This package provides a comprehensive generator for creating new CLI applications
using the @trailhead/\* architecture. It features interactive project setup,
template-based generation, and integrated development environment configuration.

## Examples

```bash
# Interactive generation
npx @trailhead/create-cli
npx @trailhead/create-cli my-awesome-cli

# Programmatic usage
npm install @trailhead/create-cli
```

```typescript
import { generateProject } from '@trailhead/create-cli'

const result = await generateProject(
  {
    projectName: 'my-cli',
    projectPath: '/path/to/project',
    packageManager: 'pnpm',
    features: { core: true, config: true },
    projectType: 'standalone-cli',
    nodeVersion: '18.0.0',
    typescript: true,
    ide: 'vscode',
    dryRun: false,
    force: false,
    verbose: false,
  },
  context
)
```

## Since

0.1.0

## Interfaces

### GeneratorContext

Execution context for the generator system

Provides access to essential services and configuration needed
throughout the generation process, including logging and filesystem
abstraction for testing and cross-platform compatibility.

#### Properties

##### logger

> **logger**: `Logger`

Logger instance for user feedback and debugging

##### templateConfig?

> `optional` **templateConfig**: [`TemplateLoaderConfig`](#templateloaderconfig)

Optional template loader configuration for custom template paths

##### verbose

> **verbose**: `boolean`

Whether to enable verbose logging output

---

### ProjectConfig

Complete project configuration for the generation process

#### Properties

##### author?

> `optional` **author**: `object`

Project author information

###### email

> **email**: `string`

###### name

> **name**: `string`

##### description?

> `optional` **description**: `string`

Project description

##### dryRun

> **dryRun**: `boolean`

Whether to run in dry-run mode (no actual file operations)

##### features

> **features**: `object`

Feature flags

###### cicd?

> `optional` **cicd**: `boolean`

###### config?

> `optional` **config**: `boolean`

###### core

> **core**: `true`

###### testing?

> `optional` **testing**: `boolean`

###### validation?

> `optional` **validation**: `boolean`

##### force

> **force**: `boolean`

Whether to force overwrite existing directories

##### ide

> **ide**: `"vscode"` \| `"none"`

IDE configuration

##### license?

> `optional` **license**: `string`

Project license

##### nodeVersion

> **nodeVersion**: `string`

Target Node.js version

##### packageManager

> **packageManager**: [`PackageManager`](#packagemanager-2)

Package manager for dependency installation

##### projectName

> **projectName**: `string`

Name of the project (used for directory and package naming)

##### projectPath

> **projectPath**: `string`

Absolute path where the project will be created

##### projectType

> **projectType**: `"standalone-cli"` \| `"library"` \| `"monorepo-package"`

Project type

##### typescript

> **typescript**: `boolean`

Whether to use TypeScript (always true)

##### verbose

> **verbose**: `boolean`

Whether to enable verbose logging

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

##### author

> **author**: `string`

Author name

##### CHANGESET_REMINDER

> **CHANGESET_REMINDER**: `boolean`

Whether changeset reminder is enabled

##### CLI_VERSION

> **CLI_VERSION**: `string`

CLI version for smart test runner

##### CONVENTIONAL_COMMITS

> **CONVENTIONAL_COMMITS**: `boolean`

Whether conventional commits are enforced

##### currentYear

> **currentYear**: `number`

Current year for copyright notices

##### description

> **description**: `string`

Project description

##### email

> **email**: `string`

Author email address

##### features

> **features**: `object`

Feature flags for template conditional logic

###### cicd?

> `optional` **cicd**: `boolean`

###### config?

> `optional` **config**: `boolean`

###### core

> **core**: `boolean`

###### examples?

> `optional` **examples**: `boolean`

###### testing?

> `optional` **testing**: `boolean`

###### validation?

> `optional` **validation**: `boolean`

##### FILE_PATTERNS

> **FILE_PATTERNS**: `string`

File patterns for template processing

##### FILESIZE_PRIORITY

> **FILESIZE_PRIORITY**: `number`

File size check priority

##### HAS_SUBPATH_EXPORTS

> **HAS_SUBPATH_EXPORTS**: `boolean`

Whether project has subpath exports

##### HIGH_RISK_PATTERNS

> **HIGH_RISK_PATTERNS**: `string`[]

High-risk file patterns that trigger full tests

##### IS_MONOREPO

> **IS_MONOREPO**: `boolean`

Whether project is a monorepo

##### license

> **license**: `string`

License identifier (SPDX format)

##### LINT_COMMAND

> **LINT_COMMAND**: `string`

Lint command

##### LOCKFILE_VALIDATION

> **LOCKFILE_VALIDATION**: `boolean`

Whether lockfile validation is enabled

##### PACKAGE_MANAGER

> **PACKAGE_MANAGER**: `string`

Package manager command

##### PACKAGE_MAPPINGS?

> `optional` **PACKAGE_MAPPINGS**: `Record`\<`string`, `string`\>

Package name mappings (for monorepos)

##### packageManager

> **packageManager**: [`PackageManager`](#packagemanager-2)

Selected package manager

##### packageName

> **packageName**: `string`

Sanitized package name (kebab-case, npm-compatible)

##### PACKAGES_DIR

> **PACKAGES_DIR**: `string`

Directory containing packages (for monorepos)

##### PACKAGES_PATTERN

> **PACKAGES_PATTERN**: `string`

Regex pattern to match package files

##### PROJECT_NAME

> **PROJECT_NAME**: `string`

Project name for template context

##### projectName

> **projectName**: `string`

Project name as provided by user

##### SECRETS_PRIORITY

> **SECRETS_PRIORITY**: `number`

Secrets scanning priority

##### SKIP_PATTERNS

> **SKIP_PATTERNS**: `string`[]

File patterns to skip for test execution

##### SMART_TEST_COMMAND

> **SMART_TEST_COMMAND**: `string`

Smart test runner script path

##### SUBPATH_EXPORTS

> **SUBPATH_EXPORTS**: `string`[]

List of subpath exports

##### TEST_COMMAND

> **TEST_COMMAND**: `string`

Test command to execute

##### TESTS_PRIORITY

> **TESTS_PRIORITY**: `number`

Tests execution priority

##### TIMEOUT

> **TIMEOUT**: `number`

Test execution timeout in seconds

##### TYPECHECK_COMMAND

> **TYPECHECK_COMMAND**: `string`

TypeScript type checking command

##### version

> **version**: `string`

Initial project version

---

### TemplateFile

Template file metadata for processing pipeline

Describes a single file in the template system with metadata
about how it should be processed and where it should be placed
in the generated project structure.

#### Properties

##### destination

> **destination**: `string`

Destination path relative to project root

##### executable

> **executable**: `boolean`

Whether file should be marked as executable

##### isTemplate

> **isTemplate**: `boolean`

Whether file requires Handlebars template processing

##### source

> **source**: `string`

Source path relative to templates directory

---

### TemplateInfo

Information about an available template

#### Properties

##### builtin

> **builtin**: `boolean`

Whether this is a built-in template

##### description

> **description**: `string`

Human-readable description

##### features

> **features**: `string`[]

List of features provided by this template

##### name

> **name**: `string`

Template identifier/name

##### type

> **type**: `"custom"` \| `"basic"` \| `"advanced"`

Template type

---

### TemplateLoaderConfig

Template loader configuration options

Allows customization of template discovery and loading behavior,
particularly useful for testing and advanced use cases.

#### Properties

##### additionalDirs?

> `optional` **additionalDirs**: `string`[]

Additional template search directories (appended to default paths)

##### sharedDir?

> `optional` **sharedDir**: `string`

Custom shared template directory (overrides default shared path)

##### templatesDir?

> `optional` **templatesDir**: `string`

Base directory containing template files (defaults to built-in templates)

## Type Aliases

### PackageManager

> **PackageManager** = `"npm"` \| `"pnpm"`

Supported package managers for dependency installation

Focus on the two most widely used and stable package managers:

- npm: Universal compatibility, industry standard
- pnpm: Modern, efficient, monorepo-ready

## Functions

### generateProject()

> **generateProject**(`config`, `context`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`Result`\<`void`, [`CoreError`](@trailhead.cli.md#coreerror)\>\>

Generate a new CLI project from templates

This is the main entry point for project generation. It orchestrates the entire
process from template loading through file processing to dependency installation.

#### Parameters

##### config

[`ProjectConfig`](#projectconfig)

Complete project configuration including template variant, paths, and options

##### context

[`GeneratorContext`](#generatorcontext)

Generator execution context with logger, filesystem, and environment

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`Result`\<`void`, [`CoreError`](@trailhead.cli.md#coreerror)\>\>

Promise resolving to Result indicating success or detailed error information

#### Example

```typescript
const config: ProjectConfig = {
  projectName: 'my-cli',
  projectPath: '/path/to/project',
  template: 'basic',
  packageManager: 'pnpm',
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
import { getAvailableTemplates } from '@trailhead/create-cli'

const templates = getAvailableTemplates()
templates.forEach((template) => {
  console.log(`${template.name}: ${template.description}`)
  console.log(`  Features: ${template.features.join(', ')}`)
})
```

---

### getTemplateFiles()

> **getTemplateFiles**(`variant`, `config?`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`TemplateFile`](#templatefile)[]\>

Load and discover template files for a specific template variant

Scans both variant-specific and shared template directories to build
a complete list of files needed for project generation. Combines
templates from both sources with proper precedence and metadata.

#### Parameters

##### variant

`string`

Template variant identifier (deprecated, always uses 'basic')

##### config?

[`TemplateLoaderConfig`](#templateloaderconfig)

Optional configuration for custom template paths

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

- [loadTemplateFilesFromDirectory](#) for directory scanning logic
- [TemplateFile](#templatefile) for file metadata structure
- [TemplateLoaderConfig](#templateloaderconfig) for configuration options
