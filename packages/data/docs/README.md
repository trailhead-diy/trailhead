---
type: explanation
title: '@repo/data Documentation Hub'
description: 'Functional data processing with format detection and Result-based error handling'
related:
  - /packages/data/docs/how-to/process-data-files.md
  - /packages/data/docs/reference/api.md
  - /packages/data/docs/explanation/format-detection.md
---

# @repo/data Documentation

Functional data processing library with automatic format detection and Result-based error handling.

## Core Principles

- **Format agnostic** - Automatic detection of CSV, JSON, and Excel formats
- **Result-based errors** - Explicit error handling without exceptions
- **Functional patterns** - Pure functions, immutable data, composition
- **Type safety** - Comprehensive TypeScript support

## Documentation Structure

### Getting Started

- [Process Data Files](/packages/data/docs/how-to/process-data-files.md)- Common data processing tasks

### API Reference

Complete API documentation is available in the shared documentation:

- [Data API Reference](/packages/data/docs/reference/api.md)- Complete function and type definitions

### Understanding the Design

- [Format Detection System](/packages/data/docs/explanation/format-detection.md)- How auto-detection works

## Key Features

### 1. Automatic Format Detection

```typescript
import { data } from '@repo/data'

// Automatically detects CSV, JSON, or Excel format
const result = await data.parseAuto('./data.csv')
if (result.success) {
  console.log('Parsed:', result.value)
}
```

### 2. Format-Specific Operations

```typescript
import { createCSVOperations, createJSONOperations } from '@repo/data'

const csv = createCSVOperations()
const json = createJSONOperations()

// CSV processing
const csvResult = await csv.parseFile('./data.csv')

// JSON processing
const jsonResult = await json.parseFile('./config.json')
```

### 3. Data Conversion

```typescript
import { createConversionOperations } from '@repo/data'

const converter = createConversionOperations()

// Convert between formats
const result = await converter.convertFile('./data.csv', './data.json', {
  from: 'csv',
  to: 'json',
})
```

### 4. Result-Based Error Handling

```typescript
const result = await data.parseAuto('./missing-file.csv')
if (!result.success) {
  console.error('Parse failed:', result.error.message)
  return result // Propagate error
}

// Safe to use result.value
const processedData = transformData(result.value)
```

## Quick Examples

### Basic Data Processing

```typescript
import { data } from '@repo/data'

async function processDataFile(filePath: string) {
  // Auto-detect and parse any supported format
  const parseResult = await data.parseAuto(filePath)
  if (!parseResult.success) {
    return parseResult // Propagate error
  }

  // Transform data
  const transformed = parseResult.value.map((row: any) => ({
    ...row,
    processed: true,
    timestamp: new Date(),
  }))

  // Write back to same format
  const writeResult = await data.writeAuto(filePath, transformed)
  if (!writeResult.success) {
    return writeResult // Propagate error
  }

  return ok({ processed: transformed.length })
}
```

### Format Detection

```typescript
import { createDetectionOperations } from '@repo/data'

const detector = createDetectionOperations()

async function analyzeFile(filePath: string) {
  const detection = await detector.detectFormat(filePath)
  if (!detection.success) {
    return detection
  }

  console.log(`Detected format: ${detection.value.format}`)
  console.log(`Confidence: ${detection.value.confidence}`)
  console.log(`Details:`, detection.value.details)

  return detection
}
```

### Error Handling Pattern

```typescript
async function robustDataProcessing(files: string[]) {
  const results = []
  const errors = []

  for (const file of files) {
    const result = await data.parseAuto(file)
    if (result.success) {
      results.push({ file, data: result.value })
    } else {
      errors.push({ file, error: result.error.message })
    }
  }

  return ok({
    successful: results.length,
    failed: errors.length,
    results,
    errors,
  })
}
```

## Supported Formats

| Format    | Extensions        | Features                                   |
| --------- | ----------------- | ------------------------------------------ |
| **CSV**   | `.csv`, `.tsv`    | Custom delimiters, headers, encoding       |
| **JSON**  | `.json`, `.jsonl` | Pretty printing, minification, validation  |
| **Excel** | `.xlsx`, `.xls`   | Multiple sheets, cell formatting, formulas |

## Error Types

The library provides specific error types for different scenarios:

- `DataError` - General data processing errors
- `ParseError` - Format parsing failures
- `ValidationError` - Data validation issues
- `ConversionError` - Format conversion problems
- `FormatDetectionError` - Auto-detection failures

## Next Steps

1. Start with [Process Data Files](/packages/data/docs/how-to/process-data-files.md)for common tasks
2. Review the [API Reference](/packages/data/docs/reference/api.md)for detailed documentation
3. Understand [Format Detection](/packages/data/docs/explanation/format-detection.md)for advanced usage

## Integration Examples

### With CLI Applications

```typescript
import { createCommand } from '@esteban-url/cli/command'
import { data } from '@repo/data'

const convertCommand = createCommand({
  name: 'convert',
  description: 'Convert data between formats',
  options: [
    { name: 'input', type: 'string', required: true },
    { name: 'output', type: 'string', required: true },
  ],
  action: async (options, context) => {
    const parseResult = await data.parseAuto(options.input)
    if (!parseResult.success) {
      context.logger.error(`Parse failed: ${parseResult.error.message}`)
      return parseResult
    }

    const writeResult = await data.writeAuto(options.output, parseResult.value)
    if (!writeResult.success) {
      context.logger.error(`Write failed: ${writeResult.error.message}`)
      return writeResult
    }

    context.logger.success(`Converted ${options.input} → ${options.output}`)
    return ok(undefined)
  },
})
```

### With File System Operations

```typescript
import { fs } from '@repo/fs'
import { data } from '@repo/data'

async function processDataDirectory(dirPath: string) {
  const filesResult = await fs.readDir(dirPath)
  if (!filesResult.success) {
    return filesResult
  }

  const dataFiles = filesResult.value.filter(
    (file) => file.endsWith('.csv') || file.endsWith('.json') || file.endsWith('.xlsx')
  )

  const results = []
  for (const file of dataFiles) {
    const fullPath = path.join(dirPath, file)
    const result = await data.parseAuto(fullPath)
    if (result.success) {
      results.push({ file, rows: result.value.length })
    }
  }

  return ok(results)
}
```

## Contributing

See the [Contributing Guide](/docs/how-to/contributing.md)for development setup and guidelines.

## License

MIT - See [LICENSE](https://github.com/esteban-url/trailhead/blob/main/LICENSE)
