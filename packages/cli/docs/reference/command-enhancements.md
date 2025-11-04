---
type: reference
title: 'Command Enhancement API Reference'
description: 'API reference for boilerplate reduction utilities in command creation'
related:
  - /packages/cli/docs/reference/command.md
  - /packages/cli/docs/how-to/migrate-to-command-enhancements
---

# Command Enhancement API Reference

Boilerplate reduction utilities for command creation, workflow management, and option handling.

## Overview

| Property    | Value                                                       |
| ----------- | ----------------------------------------------------------- |
| **Package** | `@trailhead/cli`                                            |
| **Module**  | `@trailhead/cli/command`                                    |
| **Since**   | `v0.3.0`                                                    |
| **Issue**   | [#112](https://github.com/esteban-url/trailhead/issues/112) |

## Import

```typescript
import {
  createTaskBuilder,
  createFileProcessingCommand,
  commonOptions,
  defineOptions,
} from '@trailhead/cli/command'
```

## Task Builder API

### `createTaskBuilder<T>()`

Creates a task builder function with bound context type.

```typescript
interface MyContext {
  data: string
  result?: string
}

const createMyTask = createTaskBuilder<MyContext>()

const task1 = createMyTask('Loading data', async (ctx) => {
  ctx.result = await loadData(ctx.data) // ctx is typed as MyContext
})
```

### `createTypedTask<T>(title, handler, options?)`

Creates a single task with typed context handler.

```typescript
const task = createTypedTask<MyContext>(
  'Process data',
  async (ctx) => {
    ctx.result = processData(ctx.data)
  },
  { concurrent: true }
)
```

## File Processing Commands

### `createFileProcessingCommand<T>(config)`

Creates a command specialized for file processing with automatic validation.

```typescript
interface FileProcessingConfig<T extends FileProcessingOptions> {
  name: string
  description: string
  inputFile?: {
    required?: boolean
    description?: string
  }
  commonOptions?: Array<keyof typeof commonOptions>
  customOptions?: CommandOption[]
  action: (
    options: T,
    context: CommandContext,
    processing: FileProcessingContext
  ) => Promise<Result<void>>
}
```

### FileProcessingContext

Context provided to file processing commands:

```typescript
interface FileProcessingContext {
  inputFile: string // Validated input file path
  outputPath?: string // Resolved output path (if specified)
  fs: FileSystem // File system instance
}
```

### FileProcessingOptions

Base options for file processing commands:

```typescript
interface FileProcessingOptions extends CommandOptions {
  output?: string
  format?: string
  verbose?: boolean
  dryRun?: boolean
  force?: boolean
}
```

## Common Options

### Option Generators

Pre-defined option generators for consistency:

#### `commonOptions.output(description?)`

```typescript
const option = commonOptions.output('Custom output description')
// Returns: { name: 'output', alias: 'o', type: 'string', description: '...' }
```

#### `commonOptions.format(choices?, default?)`

```typescript
const option = commonOptions.format(['json', 'csv', 'yaml'], 'json')
// Returns: { name: 'format', alias: 'f', type: 'string', choices: [...], default: '...' }
```

#### `commonOptions.verbose(description?)`

```typescript
const option = commonOptions.verbose()
// Returns: { name: 'verbose', alias: 'v', type: 'boolean', default: false }
```

#### `commonOptions.dryRun(description?)`

```typescript
const option = commonOptions.dryRun()
// Returns: { name: 'dryRun', alias: 'd', type: 'boolean', default: false }
```

#### `commonOptions.force(description?)`

```typescript
const option = commonOptions.force()
// Returns: { name: 'force', alias: 'F', type: 'boolean', default: false }
```

#### `commonOptions.interactive(description?)`

```typescript
const option = commonOptions.interactive()
// Returns: { name: 'interactive', alias: 'i', type: 'boolean', default: false }
```

### Fluent Options Builder

#### `defineOptions()`

Creates a fluent interface for building option sets:

```typescript
class OptionsBuilder {
  common(names: Array<keyof typeof commonOptions>): this
  format(choices: string[], default?: string): this
  custom(options: CommandOption[]): this
  build(): CommandOption[]
}
```

Example usage:

```typescript
const options = defineOptions()
  .common(['output', 'verbose', 'dryRun'])
  .format(['json', 'csv', 'yaml'], 'json')
  .custom([{ name: 'parallel', type: 'boolean' }])
  .build()
```

## Type Definitions

### TaskHandler

```typescript
type TaskHandler<T> = (ctx: T) => Promise<void> | void
```

### CommandOption

```typescript
interface CommandOption {
  name: string
  alias?: string
  type: 'string' | 'boolean' | 'number'
  description?: string
  default?: any
  choices?: string[]
  required?: boolean
}
```

## Error Codes

Command enhancement specific error codes:

```typescript
enum CommandEnhancementError {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',
  INVALID_OUTPUT_PATH = 'INVALID_OUTPUT_PATH',
  OUTPUT_EXISTS = 'OUTPUT_EXISTS',
}
```

## Examples

### Complete File Processing Command

```typescript
import {
  createFileProcessingCommand,
  defineOptions,
  type FileProcessingOptions,
} from '@trailhead/cli/command'

interface TransformOptions extends FileProcessingOptions {
  transform?: string
  parallel?: boolean
}

export const transformCommand = createFileProcessingCommand<TransformOptions>({
  name: 'transform',
  description: 'Transform data files',
  inputFile: {
    required: true,
    description: 'Input data file to transform',
  },
  commonOptions: ['output', 'verbose', 'dryRun'],
  customOptions: defineOptions()
    .format(['json', 'csv', 'yaml', 'xml'])
    .custom([
      { name: 'transform', type: 'string', description: 'Transform function' },
      { name: 'parallel', type: 'boolean', description: 'Enable parallel processing' },
    ])
    .build(),
  action: async (options, context, { inputFile, outputPath, fs }) => {
    // File validation complete, business logic starts here
    const data = await parseFile(inputFile, options.format)
    const transformed = await transform(data, options.transform)

    if (outputPath && !options.dryRun) {
      await fs.writeFile(outputPath, transformed)
    }

    return ok(undefined)
  },
})
```

### Workflow with Typed Tasks

```typescript
import { createTaskBuilder } from '@trailhead/cli/workflows'

interface ProcessContext {
  inputPath: string
  data?: any[]
  result?: any[]
}

const createTask = createTaskBuilder<ProcessContext>()

const workflow = [
  createTask('Loading data', async (ctx) => {
    ctx.data = await loadFile(ctx.inputPath)
  }),

  createTask('Validating data', async (ctx) => {
    if (!ctx.data?.length) {
      throw new Error('No data to process')
    }
  }),

  createTask('Processing data', async (ctx) => {
    ctx.result = processData(ctx.data!)
  }),
]
```

## Performance Notes

- Zero runtime overhead - all enhancements are compile-time TypeScript patterns
- Tree-shakeable exports - unused features don't impact bundle size
- Automatic validation happens once at command start

## Compatibility

- Fully backward compatible with existing `createCommand` API
- Can mix enhanced and standard commands in same CLI
- All existing commands continue to work unchanged

## See Also

- [Command API Reference](../../reference/command.md)- Core command creation
- [Migration Guide](../../how-to/migrate-to-command-enhancements.md)- Upgrading existing commands
- [Workflow API Reference](../../reference/flow-control.md)- Task orchestration
