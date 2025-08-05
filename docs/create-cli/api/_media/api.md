---
type: reference
title: 'Generator API Reference'
description: 'Programmatic API for @esteban-url/create-cli project generation'
related:
  - /packages/create-cli/docs/reference/schema.md
  - /docs/reference/templates/tutorial-template.md
  - /packages/create-cli/docs/how-to/custom-prompts.md
---

# Generator API Reference

Programmatic interface for generating CLI projects using @esteban-url/create-cli.

## Overview

| Property    | Value                     |
| ----------- | ------------------------- |
| **Package** | `@esteban-url/create-cli` |
| **Module**  | `@esteban-url/create-cli` |
| **Since**   | `v0.1.0`                  |

## Import

```typescript
import { generateProject } from '@esteban-url/create-cli'
import type { ProjectConfig, GeneratorContext } from '@esteban-url/create-cli'
```

## Core Functions

### `generateProject(config: ProjectConfig, context: GeneratorContext): Promise<Result<GenerationResult>>`

Generates a new CLI project with the specified configuration.

```typescript
import { generateProject } from '@esteban-url/create-cli'
import { createContext } from '@esteban-url/cli'

const config: ProjectConfig = {
  projectName: 'my-cli',
  projectPath: '/path/to/my-cli',
  template: 'basic',
  packageManager: 'pnpm',
  includeDocs: false,
  initGit: true,
  force: false,
  dryRun: false,
  verbose: false,
}

const context = createContext()
const result = await generateProject(config, context)

if (result.isOk()) {
  console.log(`Project created at: ${result.value.projectPath}`)
  console.log(`Files created: ${result.value.filesCreated}`)
} else {
  console.error(`Generation failed: ${result.error.message}`)
}
```

### `validateConfig(config: Partial<ProjectConfig>): Result<ProjectConfig>`

Validates and normalizes project configuration.

```typescript
import { validateConfig } from '@esteban-url/create-cli'

const userInput = {
  projectName: 'my-cli',
  template: 'basic',
}

const result = validateConfig(userInput)
if (result.isOk()) {
  const validConfig = result.value
  // All required fields are now present with defaults
}
```

### `getAvailableTemplates(): TemplateInfo[]`

Returns information about available project templates.

```typescript
import { getAvailableTemplates } from '@esteban-url/create-cli'

const templates = getAvailableTemplates()
templates.forEach((template) => {
  console.log(`${template.name}: ${template.description}`)
  console.log(`  Features: ${template.features.join(', ')}`)
})
```

## Type Reference

### ProjectConfig

Complete configuration for project generation.

```typescript
interface ProjectConfig {
  // Required fields
  projectName: string // Name of the CLI project
  projectPath: string // Absolute path where to create project
  template: TemplateType // Template to use ('basic' | 'advanced')

  // Optional fields with defaults
  packageManager?: PackageManager // 'npm' | 'pnpm' (default: 'npm')
  author?: string // Author name (default: from git config)
  includeDocs?: boolean // Include documentation (default: false)
  initGit?: boolean // Initialize git repo (default: true)

  // Generation options
  force?: boolean // Overwrite existing directory (default: false)
  dryRun?: boolean // Preview without creating files (default: false)
  verbose?: boolean // Show detailed output (default: false)
}
```

### GeneratorContext

Context object providing utilities for generation.

```typescript
interface GeneratorContext {
  logger: Logger // Logging utilities
  fs: FileSystem // File system operations
  projectRoot: string // Current working directory
  verbose: boolean // Verbose output flag
}
```

### GenerationResult

Result of successful project generation.

```typescript
interface GenerationResult {
  projectPath: string // Absolute path to generated project
  projectName: string // Name of the project
  template: TemplateType // Template used
  filesCreated: number // Number of files created
  duration: number // Generation time in milliseconds
  nextSteps: string[] // Suggested next steps
}
```

### TemplateInfo

Information about an available template.

```typescript
interface TemplateInfo {
  name: TemplateType // Template identifier
  description: string // Human-readable description
  features: string[] // List of included features
  recommended: boolean // Whether this is recommended for beginners
}
```

## Error Handling

### GeneratorError

All generator errors extend the base GeneratorError class.

```typescript
import { isGeneratorError } from '@esteban-url/create-cli'

const result = await generateProject(config, context)
if (result.isErr() && isGeneratorError(result.error)) {
  console.error(`Generator error: ${result.error.code}`)
  console.error(`Message: ${result.error.message}`)

  if (result.error.suggestion) {
    console.log(`Suggestion: ${result.error.suggestion}`)
  }
}
```

### Error Codes

Common error codes returned by the generator:

```typescript
enum GeneratorErrorCode {
  INVALID_PROJECT_NAME = 'INVALID_PROJECT_NAME',
  DIRECTORY_EXISTS = 'DIRECTORY_EXISTS',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  DEPENDENCY_INSTALL_FAILED = 'DEPENDENCY_INSTALL_FAILED',
  GIT_INIT_FAILED = 'GIT_INIT_FAILED',
  WRITE_PERMISSION_DENIED = 'WRITE_PERMISSION_DENIED',
}
```

## Advanced Usage

### Custom File Transformations

Apply custom transformations during generation:

```typescript
import { generateProject, transformFile } from '@esteban-url/create-cli'

const config = {
  projectName: 'my-cli',
  template: 'basic',
  transforms: [
    {
      pattern: '**/*.ts',
      transform: (content: string) => {
        // Add custom header to all TypeScript files
        return `// Generated by my-company\n${content}`
      },
    },
  ],
}
```

### Dry Run Mode

Preview what would be generated without creating files:

```typescript
const result = await generateProject(
  {
    ...config,
    dryRun: true,
  },
  context
)

if (result.isOk()) {
  console.log('Would create files:')
  result.value.plannedFiles.forEach((file) => {
    console.log(`  ${file.path} (${file.size} bytes)`)
  })
}
```

### Progress Tracking

Track generation progress for UI updates:

```typescript
import { generateProject, GenerationProgress } from '@esteban-url/create-cli'

const onProgress = (progress: GenerationProgress) => {
  console.log(`${progress.phase}: ${progress.percentage}%`)
  if (progress.currentFile) {
    console.log(`  Processing: ${progress.currentFile}`)
  }
}

const result = await generateProject(config, {
  ...context,
  onProgress,
})
```

## Testing Utilities

### Mock Generator

Create a mock generator for testing:

```typescript
import { createMockGenerator } from '@esteban-url/create-cli/testing'

const mockGen = createMockGenerator()
const result = await mockGen.generateProject({
  projectName: 'test-cli',
  template: 'basic',
})

expect(result.isOk()).toBe(true)
expect(mockGen.getGeneratedFiles()).toHaveLength(15)
```

### Template Testing

Test custom templates:

```typescript
import { testTemplate } from '@esteban-url/create-cli/testing'

const result = await testTemplate({
  templatePath: './my-template',
  variables: {
    projectName: 'test-project',
    author: 'Test Author',
  },
})

expect(result.isOk()).toBe(true)
expect(result.value.files).toContainFile('package.json')
```

## Best Practices

### 1. Always Validate Configuration

```typescript
const userConfig = getUserInput()
const validationResult = validateConfig(userConfig)

if (validationResult.isErr()) {
  // Handle validation errors before generation
  console.error(validationResult.error.message)
  return
}

const result = await generateProject(validationResult.value, context)
```

### 2. Handle Errors Gracefully

```typescript
const result = await generateProject(config, context)

if (result.isErr()) {
  if (result.error.code === 'DIRECTORY_EXISTS') {
    const overwrite = await confirm('Directory exists. Overwrite?')
    if (overwrite) {
      return generateProject({ ...config, force: true }, context)
    }
  }

  context.logger.error(result.error.message)
  if (result.error.suggestion) {
    context.logger.info(result.error.suggestion)
  }
}
```

### 3. Provide Progress Feedback

```typescript
const result = await generateProject(config, {
  ...context,
  onProgress: (progress) => {
    updateProgressBar(progress.percentage)
  },
})
```

## See Also

- [Configuration Schema](../../reference/schema.md)- Detailed configuration options
- [Template System](./templates/tutorial-template.md)- Template engine reference
- [CLI Usage](../../../cli/tutorials/getting-started.md)- Using via command line
