---
type: how-to
title: 'Migrate to Command Enhancements'
description: 'Reduce boilerplate in existing CLI commands using enhancement utilities'
prerequisites:
  - Basic understanding of @trailhead/cli commands
  - Existing CLI project using standard commands
related:
  - /packages/cli/docs/reference/command-enhancements.md
  - /packages/cli/docs/reference/command.md
---

# Migrate to Command Enhancements

This guide shows you how to migrate existing CLI commands to use the command enhancement utilities, reducing boilerplate by 60-70%.

## Migrating Task Handlers

### Step 1: Identify Repetitive Context Types

Look for repeated context type annotations:

```typescript
// Before: Repetitive type annotations
const task1 = createTask('Loading', async (ctx: MyContext) => {
  // ...
})

const task2 = createTask('Processing', async (ctx: MyContext) => {
  // ...
})

const task3 = createTask('Saving', async (ctx: MyContext) => {
  // ...
})
```

### Step 2: Create a Task Builder

Replace with a typed task builder:

```typescript
// After: Single type definition
import { createTaskBuilder } from '@trailhead/cli/workflows'

const createMyTask = createTaskBuilder<MyContext>()

const task1 = createMyTask('Loading', async (ctx) => {
  // ctx is automatically typed as MyContext
})

const task2 = createMyTask('Processing', async (ctx) => {
  // No manual type annotation needed
})

const task3 = createMyTask('Saving', async (ctx) => {
  // Type safety maintained
})
```

## Migrating File Processing Commands

### Step 1: Identify File Processing Pattern

Look for commands with file validation boilerplate:

```typescript
// Before: Manual file validation
export const processCommand = createCommand<ProcessOptions>({
  name: 'process',
  description: 'Process files',
  options: [
    { name: 'output', alias: 'o', type: 'string', description: 'Output file' },
    { name: 'format', alias: 'f', type: 'string', choices: ['json', 'csv'] },
    { name: 'verbose', alias: 'v', type: 'boolean', default: false },
  ],
  action: async (options, context) => {
    const [inputFile] = context.args
    if (!inputFile) {
      return Err(new Error('Input file is required'))
    }

    const fileCheck = await context.fs.access(inputFile)
    if (!fileCheck.success) {
      return Err(new Error(`File does not exist: ${inputFile}`))
    }

    // Actual logic starts here...
    const data = await readFile(inputFile)
    // ...
  },
})
```

### Step 2: Convert to File Processing Command

Replace with specialized command builder:

```typescript
// After: Automatic file validation
import { createFileProcessingCommand } from '@trailhead/cli/command'

export const processCommand = createFileProcessingCommand<ProcessOptions>({
  name: 'process',
  description: 'Process files',
  inputFile: { required: true },
  commonOptions: ['output', 'format', 'verbose'],
  action: async (options, context, { inputFile, outputPath, fs }) => {
    // File already validated, jump to logic
    const data = await readFile(inputFile)
    // ...
  },
})
```

## Migrating Option Definitions

### Step 1: Identify Common Options

Find repeated option patterns:

```typescript
// Before: Duplicated options across commands
const command1Options = [
  { name: 'output', alias: 'o', type: 'string', description: 'Output file path' },
  { name: 'format', alias: 'f', type: 'string', choices: ['json', 'csv'], default: 'json' },
  { name: 'verbose', alias: 'v', type: 'boolean', default: false },
  { name: 'custom1', type: 'string' },
]

const command2Options = [
  { name: 'output', alias: 'o', type: 'string', description: 'Output file path' },
  { name: 'format', alias: 'f', type: 'string', choices: ['json', 'csv'], default: 'json' },
  { name: 'verbose', alias: 'v', type: 'boolean', default: false },
  { name: 'custom2', type: 'boolean' },
]
```

### Step 2: Use Common Options

Replace with pre-defined options:

```typescript
// After: Reusable option definitions
import { commonOptions } from '@trailhead/cli/command'

const command1Options = [
  commonOptions.output(),
  commonOptions.format(['json', 'csv']),
  commonOptions.verbose(),
  { name: 'custom1', type: 'string' },
]

const command2Options = [
  commonOptions.output(),
  commonOptions.format(['json', 'csv']),
  commonOptions.verbose(),
  { name: 'custom2', type: 'boolean' },
]
```

### Step 3: Use Fluent Builder (Optional)

For more complex option sets:

```typescript
// Using fluent API
import { defineOptions } from '@trailhead/cli/command'

const options = defineOptions()
  .common(['output', 'format', 'verbose', 'dryRun'])
  .format(['json', 'csv', 'yaml'])
  .custom([
    { name: 'parallel', type: 'boolean' },
    { name: 'workers', type: 'number', default: 4 },
  ])
  .build()
```

## Complete Migration Example

### Before Migration

```typescript
// commands/transform.ts - Before
import { createCommand } from '@trailhead/cli/command'
import { createTask } from '@trailhead/cli/workflows'

interface TransformContext {
  inputFile: string
  data?: any[]
  transformed?: any[]
  outputFile?: string
}

export const transformCommand = createCommand({
  name: 'transform',
  description: 'Transform data files',
  options: [
    { name: 'output', alias: 'o', type: 'string', description: 'Output file path' },
    { name: 'format', alias: 'f', type: 'string', choices: ['json', 'csv'], default: 'json' },
    { name: 'verbose', alias: 'v', type: 'boolean', default: false },
    { name: 'dryRun', alias: 'd', type: 'boolean', default: false },
    { name: 'transform', alias: 't', type: 'string', required: true },
  ],
  action: async (options, context) => {
    const [inputFile] = context.args
    if (!inputFile) {
      return Err(new Error('Input file is required'))
    }

    const fileCheck = await context.fs.access(inputFile)
    if (!fileCheck.success) {
      return Err(new Error(`File does not exist: ${inputFile}`))
    }

    const tasks = [
      createTask('Loading data', async (ctx: TransformContext) => {
        const result = await readFile(ctx.inputFile)
        if (!result.success) {
          throw new Error(`Failed to read file: ${result.error.message}`)
        }
        ctx.data = result.value
      }),

      createTask('Transforming data', async (ctx: TransformContext) => {
        ctx.transformed = await applyTransform(ctx.data!, options.transform)
      }),

      createTask('Writing output', async (ctx: TransformContext) => {
        if (options.output && !options.dryRun) {
          const result = await writeFile(options.output, ctx.transformed!)
          if (!result.success) {
            throw new Error(`Failed to write: ${result.error.message}`)
          }
          ctx.outputFile = options.output
        }
      }),
    ]

    const taskContext: TransformContext = { inputFile }
    const taskList = createTaskList(tasks)
    const result = await taskList.run(taskContext)

    if (!result.success) {
      return Err(result.error)
    }

    return Ok(undefined)
  },
})
```

### After Migration

```typescript
// commands/transform.ts - After
import {
  createFileProcessingCommand,
  createTaskBuilder,
  defineOptions,
  type FileProcessingOptions,
} from '@trailhead/cli/command'

interface TransformOptions extends FileProcessingOptions {
  transform: string
}

interface TransformContext {
  inputFile: string
  data?: any[]
  transformed?: any[]
  outputFile?: string
}

const createTransformTask = createTaskBuilder<TransformContext>()

export const transformCommand = createFileProcessingCommand<TransformOptions>({
  name: 'transform',
  description: 'Transform data files',
  inputFile: { required: true },
  commonOptions: ['output', 'verbose', 'dryRun'],
  customOptions: defineOptions()
    .format(['json', 'csv'])
    .custom([{ name: 'transform', alias: 't', type: 'string', required: true }])
    .build(),
  action: async (options, context, { inputFile, outputPath, fs }) => {
    const tasks = [
      createTransformTask('Loading data', async (ctx) => {
        const result = await readFile(ctx.inputFile)
        if (!result.success) {
          throw new Error(`Failed to read file: ${result.error.message}`)
        }
        ctx.data = result.value
      }),

      createTransformTask('Transforming data', async (ctx) => {
        ctx.transformed = await applyTransform(ctx.data!, options.transform)
      }),

      createTransformTask('Writing output', async (ctx) => {
        if (outputPath && !options.dryRun) {
          const result = await fs.writeFile(outputPath, ctx.transformed!)
          if (!result.success) {
            throw new Error(`Failed to write: ${result.error.message}`)
          }
          ctx.outputFile = outputPath
        }
      }),
    ]

    const taskContext: TransformContext = { inputFile }
    const taskList = createTaskList(tasks)
    return taskList.run(taskContext)
  },
})
```

### Migration Results

- **Before**: 55 lines of code
- **After**: 40 lines of code
- **Reduction**: 27% fewer lines
- **Benefits**:
  - No manual file validation
  - No repetitive type annotations
  - Consistent option behavior
  - Cleaner, more focused code

## Testing Migrated Commands

### Update Test Setup

```typescript
// Before: Manual mocking
it('processes files', async () => {
  const fs = createMemoryFileSystem()
  await fs.writeFile('/input.csv', 'data')

  const result = await command.action(
    { format: 'json' },
    {
      args: ['/input.csv'],
      fs,
      // ... other context
    }
  )
})
```

```typescript
// After: Simplified testing
it('processes files', async () => {
  const { fs, runCommand } = createTestContext()
  await fs.writeFile('/input.csv', 'data')

  const result = await runCommand(transformCommand, {
    args: ['/input.csv'],
    options: { format: 'json' },
  })
})
```

## Gradual Migration Strategy

### Phase 1: Common Options

Start by migrating option definitions:

1. Replace duplicated options with `commonOptions`
2. Test to ensure behavior unchanged
3. Commit this change separately

### Phase 2: Task Builders

Next, migrate task handlers:

1. Create task builders for each context type
2. Update task definitions one at a time
3. Verify type safety maintained

### Phase 3: File Commands

Finally, migrate file processing commands:

1. Identify commands that process files
2. Convert to `createFileProcessingCommand`
3. Remove manual validation code

## Troubleshooting

### Type Inference Issues

If TypeScript can't infer types:

```typescript
// Explicitly type the builder
const createTask = createTaskBuilder<MyContext>()

// Or use type assertion
const task = createTask('Name', async (ctx) => {
  const data = ctx.data as string[] // If needed
})
```

### Option Compatibility

When migrating options:

```typescript
// Preserve custom behavior
const customOutput = {
  ...commonOptions.output(),
  description: 'My custom description',
  validate: (value: string) => value.endsWith('.json'),
}
```

### Testing Compatibility

Ensure tests still work:

```typescript
// Wrap existing test utilities
const runMigratedCommand = (command, options) => {
  return createFileProcessingCommand.testHelper(command, {
    ...options,
    inputFile: options.args[0],
  })
}
```

## Best Practices

### 1. Migrate Incrementally

- Don't migrate all commands at once
- Test each migration thoroughly
- Keep commits focused

### 2. Maintain Backward Compatibility

- Keep old commands working during migration
- Use feature flags if needed
- Document breaking changes

### 3. Update Documentation

- Update command help text
- Update README examples
- Update API documentation

## Next Steps

- Review [Command Enhancements Reference](../../reference/command-enhancements)
- Learn about [Pipeline Utilities](../../how-to/use-result-pipelines)
- Explore [Testing Enhanced Commands](../../how-to/test-cli-applications)
