---
type: tutorial
title: 'Building Data Processing Pipelines'
description: 'Learn to build functional data processing pipelines using @repo/data with Result types and pure functions'
prerequisites:
  - Basic TypeScript knowledge
  - Understanding of Result types
  - '@repo/data installed in your project'
related:
  - /docs/explanation/result-types-pattern.md
  - /packages/data/docs/reference/api.md
  - /docs/how-to/convert-data-formats.md
---

# Tutorial: Building Data Processing Pipelines

This tutorial will teach you how to build functional data processing pipelines using `@repo/data`. You'll learn to compose pure functions, handle errors with Result types, and process data across multiple formats.

## What You'll Learn

- Creating pure transformation functions
- Composing operations with Result types
- Processing data in multiple output formats
- Handling errors functionally

## Prerequisites

- Basic TypeScript knowledge
- Understanding of Result types (see [Result Types Pattern](/docs/explanation/result-types-pattern.md))
- `@repo/data` installed in your project

## Step 1: Set Up Your Environment

First, install the required dependencies:

```bash
pnpm add @repo/data @repo/core
```

Create a new file `data-pipeline.ts` for our pipeline code.

## Step 2: Create Pure Transformation Functions

Start by defining pure functions that transform your data:

```typescript
import { data } from '@repo/data'
import { pipe, ok, err } from '@repo/core'
import { createDataError } from '@repo/data'

// Pure transformation functions
const isActive = (row: any) => row.status === 'active'

const transformDataRow = (row: any) => ({
  id: row.id,
  name: row.name.toUpperCase(),
  value: parseFloat(row.value) * 1.1,
})
```

These functions:

- Take input and return output without side effects
- Can be tested in isolation
- Can be composed together

## Step 3: Create Output Writers

Define a function that creates output tasks:

```typescript
// Function to create output writers
const createOutputWriters = (transformedData: any[]) => [
  data.writeAuto('./output.json', transformedData),
  data.writeAuto('./output.csv', transformedData),
  data.writeAuto('./output.xlsx', transformedData),
]
```

This approach:

- Returns an array of promises
- Allows parallel execution
- Keeps the function pure

## Step 4: Handle Results

Create a function to check if all operations succeeded:

```typescript
// Check results and create appropriate response
const checkAllSucceeded = (results: any[]) => {
  const failed = results.filter((r) => r.isErr())
  return failed.length > 0
    ? err(createDataError('WRITE_ERROR', `Failed to write ${failed.length} output files`))
    : ok({ processed: results.length })
}
```

## Step 5: Build the Main Pipeline

Combine everything into a main pipeline function:

```typescript
// Main pipeline function using composition
const processDataPipeline = async (inputFile: string) => {
  const parseResult = await data.parseAuto(inputFile)

  if (parseResult.isErr()) return parseResult

  // Transform data using pure functions
  const transformed = parseResult.value.data.filter(isActive).map(transformDataRow)

  // Save in multiple formats
  const outputs = await Promise.all(createOutputWriters(transformed))

  return checkAllSucceeded(outputs)
}
```

## Step 6: Alternative Using Pipe

For more complex transformations, use the `pipe` utility:

```typescript
// Alternative using pipe for transformations
const processWithPipe = async (inputFile: string) => {
  const parseResult = await data.parseAuto(inputFile)

  if (parseResult.isErr()) return parseResult

  const transform = pipe(
    (data: any[]) => data.filter(isActive),
    (data: any[]) => data.map(transformDataRow)
  )

  const transformed = transform(parseResult.value.data)
  const outputs = await Promise.all(createOutputWriters(transformed))

  return checkAllSucceeded(outputs)
}
```

## Step 7: Use the Pipeline

Execute your pipeline and handle the results:

```typescript
// Example usage
async function main() {
  const result = await processDataPipeline('./sales-data.csv')

  if (result.isErr()) {
    console.error('Pipeline failed:', result.error.message)
    process.exit(1)
  }

  console.log('Pipeline completed successfully!')
  console.log(`Processed ${result.value.processed} output files`)
}

main()
```

## Testing Your Pipeline

Test each component in isolation:

```typescript
import { describe, it, expect } from 'vitest'

describe('Data Pipeline', () => {
  it('filters active records', () => {
    const data = [
      { status: 'active', id: 1 },
      { status: 'inactive', id: 2 },
    ]

    const filtered = data.filter(isActive)
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe(1)
  })

  it('transforms data correctly', () => {
    const row = { id: 1, name: 'test', value: '10' }
    const result = transformDataRow(row)

    expect(result.name).toBe('TEST')
    expect(result.value).toBe(11)
  })
})
```

## Key Concepts

1. **Pure Functions**: All transformations are pure functions that can be tested independently
2. **Error Propagation**: Errors bubble up through Result types without exceptions
3. **Parallel Processing**: Multiple outputs are written in parallel for efficiency
4. **Composability**: Functions can be composed using `pipe` or standard array methods

## Next Steps

- Try adding more transformation functions
- Implement data validation before processing
- Add progress tracking for large files
- Explore streaming for files too large for memory

## Related Resources

- [How to Convert Data Formats](/docs/how-to/convert-data-formats.md)
- [Result Types Pattern](/docs/explanation/result-types-pattern.md)
- [@repo/data API Reference](/packages/data/docs/reference/api.md)
