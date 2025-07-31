---
type: how-to
title: 'How to Convert Data Formats'
description: 'Convert between CSV, JSON, and Excel formats using @repo/data conversion operations'
related:
  - /packages/data/docs/reference/api.md
  - /docs/tutorials/data-pipeline-processing.md
---

# How to Convert Data Formats

Convert between CSV, JSON, and Excel formats using @repo/data's conversion operations.

## Quick Reference

```typescript
import { createConversionOperations } from '@repo/data/formats/conversion'

const converter = createConversionOperations()

// CSV to JSON
await converter.convert('./data.csv', './data.json', {
  from: 'csv',
  to: 'json',
})

// Excel to CSV (first sheet)
await converter.convert('./report.xlsx', './report.csv', {
  from: 'excel',
  to: 'csv',
  options: { sheetIndex: 0 },
})

// JSON to Excel with formatting
await converter.convert('./data.json', './formatted.xlsx', {
  from: 'json',
  to: 'excel',
  options: {
    sheetName: 'Exported Data',
    autoWidth: true,
    headerStyle: { bold: true },
  },
})
```

## Common Conversions

### CSV to JSON

```typescript
const result = await converter.convert('./input.csv', './output.json', { from: 'csv', to: 'json' })

if (result.isErr()) {
  console.error('Conversion failed:', result.error.message)
}
```

### JSON to CSV

```typescript
// Flatten nested JSON objects for CSV
const result = await converter.convert('./nested.json', './flat.csv', {
  from: 'json',
  to: 'csv',
  options: { flatten: true },
})
```

### Excel to Multiple Formats

```typescript
// Convert each sheet to a separate file
const workbook = await excel.parseFile('./multi-sheet.xlsx')

if (workbook.isOk()) {
  for (const sheet of workbook.value.sheets) {
    await converter.convert(sheet.data, `./${sheet.name}.csv`, { from: 'data', to: 'csv' })
  }
}
```

## Batch Conversion

Convert multiple files in a directory:

```typescript
import { fs } from '@repo/fs'
import { join } from '@repo/fs/utils'

async function convertDirectory(
  inputDir: string,
  outputDir: string,
  fromFormat: string,
  toFormat: string
) {
  const pattern = `**/*.${fromFormat}`
  const files = await fs.findFiles(pattern, { cwd: inputDir })

  if (files.isErr()) return files

  await fs.ensureDir(outputDir)

  const tasks = files.value.map((file) => {
    const inputPath = join(inputDir, file)
    const outputPath = join(outputDir, file.replace(`.${fromFormat}`, `.${toFormat}`))

    return converter.convert(inputPath, outputPath, {
      from: fromFormat,
      to: toFormat,
    })
  })

  return Promise.all(tasks)
}

// Usage
await convertDirectory('./csv-files', './json-files', 'csv', 'json')
```

## Format-Specific Options

### CSV Options

```typescript
await converter.convert('./data.json', './data.csv', {
  from: 'json',
  to: 'csv',
  options: {
    delimiter: ',',
    headers: true,
    skipEmptyLines: true,
  },
})
```

### Excel Options

```typescript
await converter.convert('./data.json', './report.xlsx', {
  from: 'json',
  to: 'excel',
  options: {
    sheetName: 'Monthly Report',
    autoWidth: true,
    freeze: { row: 1 }, // Freeze header row
    headerStyle: {
      bold: true,
      fill: { color: '#4472C4' },
      font: { color: '#FFFFFF' },
    },
  },
})
```

## Stream Large Files

For files too large for memory:

```typescript
import { createStreamingConverter } from '@repo/data/formats/streaming'

const streamConverter = createStreamingConverter()

// Stream CSV to JSON
await streamConverter.convert('./huge.csv', './huge.json', {
  from: 'csv',
  to: 'json',
  streaming: true,
  chunkSize: 1000, // Process 1000 rows at a time
})
```

## Error Handling

Handle conversion errors appropriately:

```typescript
const result = await converter.convert('./input.xlsx', './output.json', {
  from: 'excel',
  to: 'json',
})

if (result.isErr()) {
  const error = result.error

  switch (error.code) {
    case 'UNSUPPORTED_FORMAT':
      console.error('Format not supported:', error.context?.format)
      break
    case 'PARSE_ERROR':
      console.error('Failed to parse input file')
      console.error('Line:', error.context?.line)
      break
    case 'WRITE_ERROR':
      console.error('Failed to write output file')
      break
    default:
      console.error('Conversion failed:', error.message)
  }
}
```

## Related Resources

- [Data Pipeline Processing Tutorial](/docs/tutorials/data-pipeline-processing.md)
- [@repo/data API Reference](/packages/data/docs/reference/api.md)
- [Working with Large Files](/docs/how-to/handle-large-files.md)
