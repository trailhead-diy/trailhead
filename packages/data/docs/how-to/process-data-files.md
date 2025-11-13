---
type: how-to
title: 'Process Data Files'
description: 'Convert, validate, and transform CSV, JSON, and Excel files with automatic format detection'
prerequisites:
  - 'Understanding of Result types'
  - 'Basic TypeScript knowledge'
  - 'File system operations'
related:
  - /docs/reference/api/data.md
  - /docs/how-to/apply-functional-patterns
  - /packages/fs/docs/how-to/file-operations
---

# Process Data Files

This guide shows you how to process data files across different formats using automatic detection and Result-based error handling.

## Parse Data Files Automatically

### Parse Any Supported Format

```typescript
import { data } from '@trailhead/data'

constparseDataFile = async (filePath: string) => {
  const result = await data.parseAuto(filePath)
  if (!result.success) {
    console.error('Parse failed:', result.error.message)
    return result
  }

  console.log(`Parsed ${result.value.length} rows`)
  return result
}
```

### Parse from String Content

```typescript
import { data } from '@trailhead/data'

constparseFromContent = async (content: string, fileName?: string) => {
  const result = await data.parseAutoFromContent(content, fileName)
  if (!result.success) {
    console.error('Parse failed:', result.error.message)
    return result
  }

  return result
}

// Usage
const csvContent = 'name,age\nJohn,30\nJane,25'
const result = await parseFromContent(csvContent, 'data.csv')
```

## Process Specific Formats

### CSV Processing

```typescript
import { createCSVOperations } from '@trailhead/data'

const csv = createCSVOperations({
  delimiter: ',',
  hasHeaders: true,
  encoding: 'utf8',
})

constprocessCSV = async (filePath: string) => {
  // Parse CSV file
  const parseResult = await csv.parseFile(filePath)
  if (!parseResult.success) {
    return parseResult
  }

  // Transform data
  const transformed = parseResult.value.map((row) => ({
    ...row,
    fullName: `${row.firstName} ${row.lastName}`,
    processed: new Date().toISOString(),
  }))

  // Write back to file
  const writeResult = await csv.writeFile(filePath, transformed)
  return writeResult
}
```

### JSON Processing

```typescript
import { createJSONOperations } from '@trailhead/data'

const json = createJSONOperations({
  spaces: 2,
  encoding: 'utf8',
})

constprocessJSON = async (filePath: string) => {
  // Parse JSON file
  const parseResult = await json.parseFile(filePath)
  if (!parseResult.success) {
    return parseResult
  }

  // Update configuration
  const config = {
    ...parseResult.value,
    lastUpdated: new Date().toISOString(),
    version: '2.0.0',
  }

  // Write formatted JSON
  const writeResult = await json.writeFile(filePath, config)
  return writeResult
}
```

### Excel Processing

```typescript
import { createExcelOperations } from '@trailhead/data'

const excel = createExcelOperations({
  sheetName: 'Sheet1',
  hasHeaders: true,
})

constprocessExcel = async (filePath: string) => {
  // Parse Excel file
  const parseResult = await excel.parseFile(filePath)
  if (!parseResult.success) {
    return parseResult
  }

  // Process data from multiple sheets
  const results = []
  for (const [sheetName, data] of Object.entries(parseResult.value)) {
    const processed = data.map((row) => ({
      ...row,
      sheet: sheetName,
      processed: true,
    }))
    results.push({ sheet: sheetName, data: processed })
  }

  // Write to new Excel file
  const writeResult = await excel.writeFile(
    filePath.replace('.xlsx', '_processed.xlsx'),
    results.reduce((acc, { sheet, data }) => ({ ...acc, [sheet]: data }), {})
  )
  return writeResult
}
```

## Convert Between Formats

### Basic Format Conversion

```typescript
import { createConversionOperations } from '@trailhead/data'

const converter = createConversionOperations()

constconvertFile = async (inputPath: string, outputPath: string) => {
  const result = await converter.convertFile(inputPath, outputPath, {
    from: 'csv',
    to: 'json',
    preserveTypes: true,
  })

  if (!result.success) {
    console.error('Conversion failed:', result.error.message)
    return result
  }

  console.log('Conversion completed successfully')
  return result
}
```

### Batch Conversion

```typescript
import { fs } from '@trailhead/fs'
import { createConversionOperations } from '@trailhead/data'
import { path } from 'node:path'

const converter = createConversionOperations()

constconvertDirectory = async (dirPath: string, targetFormat: 'json' | 'csv' | 'xlsx') => {
  const filesResult = await fs.readDir(dirPath)
  if (!filesResult.success) {
    return filesResult
  }

  const dataFiles = filesResult.value.filter(
    (file) => file.endsWith('.csv') || file.endsWith('.json') || file.endsWith('.xlsx')
  )

  const results = []
  const errors = []

  for (const file of dataFiles) {
    const inputPath = path.join(dirPath, file)
    const outputPath = path.join(
      dirPath,
      `${path.basename(file, path.extname(file))}.${targetFormat}`
    )

    if (inputPath === outputPath) continue // Skip same format

    const result = await converter.convertFile(inputPath, outputPath)
    if (result.success) {
      results.push({ input: file, output: path.basename(outputPath) })
    } else {
      errors.push({ file, error: result.error.message })
    }
  }

  return ok({ converted: results.length, errors: errors.length, results, errors })
}
```

## Validate Data

### Schema Validation

```typescript
import { data } from '@trailhead/data'
import { validate } from '@trailhead/validation'

constvalidateDataFile = async (filePath: string) => {
  // Parse data
  const parseResult = await data.parseAuto(filePath)
  if (!parseResult.success) {
    return parseResult
  }

  // Define validation schema
  const rowValidator = validate.object({
    email: validate.email,
    age: validate.numberRange(0, 120),
    name: validate.stringLength(1, 100),
  })

  // Validate each row
  const validRows = []
  const invalidRows = []

  for (const [index, row] of parseResult.value.entries()) {
    const validation = rowValidator(row)
    if (validation.success) {
      validRows.push(row)
    } else {
      invalidRows.push({
        row: index + 1,
        data: row,
        error: validation.error.message,
      })
    }
  }

  if (invalidRows.length > 0) {
    console.warn(`Found ${invalidRows.length} invalid rows`)
    invalidRows.forEach(({ row, error }) => {
      console.warn(`Row ${row}: ${error}`)
    })
  }

  return ok({ valid: validRows, invalid: invalidRows })
}
```

### Data Type Detection

```typescript
import { createDetectionOperations } from '@trailhead/data'

const detector = createDetectionOperations()

constanalyzeDataStructure = async (filePath: string) => {
  const parseResult = await data.parseAuto(filePath)
  if (!parseResult.success) {
    return parseResult
  }

  const analysis = {
    totalRows: parseResult.value.length,
    columns: {},
    types: {},
  }

  if (parseResult.value.length > 0) {
    const firstRow = parseResult.value[0]

    for (const [key, value] of Object.entries(firstRow)) {
      analysis.columns[key] = {
        sampleValue: value,
        type: typeof value,
        hasNulls: parseResult.value.some((row) => row[key] == null),
        uniqueValues: new Set(parseResult.value.map((row) => row[key])).size,
      }
    }
  }

  return ok(analysis)
}
```

## Handle Large Files

### Stream Processing

```typescript
import { createCSVOperations } from '@trailhead/data'
import { createWriteStream } from 'node:fs'

constprocessLargeCSV = async (inputPath: string, outputPath: string) => {
  const csv = createCSVOperations()

  // For large files, process in chunks
  const chunkSize = 1000
  let offset = 0
  let hasMore = true

  const writeStream = createWriteStream(outputPath)
  writeStream.write('id,name,processed_at\n') // Headers

  while (hasMore) {
    const result = await csv.parseFile(inputPath, { offset, limit: chunkSize })
    if (!result.success) {
      writeStream.close()
      return result
    }

    const chunk = result.value
    hasMore = chunk.length === chunkSize

    // Process chunk
    for (const row of chunk) {
      const processed = {
        id: row.id,
        name: row.name,
        processed_at: new Date().toISOString(),
      }

      writeStream.write(`${processed.id},"${processed.name}",${processed.processed_at}\n`)
    }

    offset += chunkSize
  }

  writeStream.close()
  return ok({ processed: offset })
}
```

### Memory-Efficient Processing

```typescript
constprocessDataEfficiently = async (filePath: string) => {
  const parseResult = await data.parseAuto(filePath)
  if (!parseResult.success) {
    return parseResult
  }

  // Process in batches to manage memory
  const batchSize = 100
  const results = []

  for (let i = 0; i < parseResult.value.length; i += batchSize) {
    const batch = parseResult.value.slice(i, i + batchSize)

    const processedBatch = batch.map((row) => {
      // Transform each row
      return {
        ...row,
        normalized: normalizeData(row),
        validated: validateRow(row),
      }
    })

    results.push(...processedBatch)

    // Optional: Save intermediate results
    if (results.length % 1000 === 0) {
      console.log(`Processed ${results.length} rows...`)
    }
  }

  return ok(results)
}
```

## Error Recovery

### Handle Missing Files

```typescript
import { fs } from '@trailhead/fs'

constprocessWithFallback = async (primaryPath: string, fallbackPath: string) => {
  // Try primary file first
  let result = await data.parseAuto(primaryPath)

  if (!result.success) {
    console.warn(`Primary file failed: ${result.error.message}`)
    console.log('Trying fallback file...')

    // Try fallback file
    result = await data.parseAuto(fallbackPath)
    if (!result.success) {
      console.error('Both files failed')
      return result
    }

    console.log('Using fallback file')
  }

  return result
}
```

### Partial Processing

```typescript
constprocessWithPartialSuccess = async (filePaths: string[]) => {
  const results = []
  const errors = []

  for (const filePath of filePaths) {
    const result = await data.parseAuto(filePath)

    if (result.success) {
      results.push({
        file: filePath,
        data: result.value,
        rows: result.value.length,
      })
    } else {
      errors.push({
        file: filePath,
        error: result.error.message,
      })

      // Continue processing other files
      console.warn(`Skipping ${filePath}: ${result.error.message}`)
    }
  }

  // Return partial results
  return ok({
    successful: results.length,
    failed: errors.length,
    totalFiles: filePaths.length,
    results,
    errors,
  })
}
```

## Performance Optimization

### Cache Parsed Data

```typescript
const parseCache = new Map<string, any>()

constcachedParse = async (filePath: string) => {
  if (parseCache.has(filePath)) {
    console.log('Using cached result')
    return ok(parseCache.get(filePath))
  }

  const result = await data.parseAuto(filePath)
  if (result.success) {
    parseCache.set(filePath, result.value)
  }

  return result
}
```

### Parallel Processing

```typescript
constprocessFilesInParallel = async (filePaths: string[]) => {
  const promises = filePaths.map(async (filePath) => {
    const result = await data.parseAuto(filePath)
    return { filePath, result }
  })

  const results = await Promise.all(promises)

  const successful = results.filter(({ result }) => result.success)
  const failed = results.filter(({ result }) => !result.success)

  return ok({
    successful: successful.length,
    failed: failed.length,
    results: successful.map(({ filePath, result }) => ({
      file: filePath,
      data: result.value,
    })),
    errors: failed.map(({ filePath, result }) => ({
      file: filePath,
      error: result.error.message,
    })),
  })
}
```

## Integration Patterns

### CLI Command Integration

```typescript
import { createCommand } from '@trailhead/cli/command'

const processCommand = createCommand({
  name: 'process',
  description: 'Process data files',
  options: [
    { name: 'input', type: 'string', required: true },
    { name: 'output', type: 'string' },
    { name: 'format', type: 'string', choices: ['csv', 'json', 'xlsx'] },
  ],
  action: async (options, context) => {
    const spinner = context.spinner('Processing data...')

    try {
      // Parse input file
      const parseResult = await data.parseAuto(options.input)
      if (!parseResult.success) {
        spinner.fail('Parse failed')
        context.logger.error(parseResult.error.message)
        return parseResult
      }

      spinner.text = 'Transforming data...'

      // Transform data
      const transformed = parseResult.value.map((row) => ({
        ...row,
        processed: true,
        timestamp: new Date().toISOString(),
      }))

      // Write output
      const outputPath = options.output || options.input
      const writeResult = await data.writeAuto(outputPath, transformed)

      if (!writeResult.success) {
        spinner.fail('Write failed')
        context.logger.error(writeResult.error.message)
        return writeResult
      }

      spinner.succeed(`Processed ${transformed.length} rows`)
      return ok(undefined)
    } catch (error) {
      spinner.fail('Processing failed')
      throw error
    }
  },
})
```

### Configuration-Based Processing

```typescript
interface ProcessingConfig {
  input: string
  output?: string
  format?: string
  transforms?: Array<{
    type: 'filter' | 'map' | 'sort'
    config: any
  }>
  validation?: {
    schema: any
    skipInvalid: boolean
  }
}

constprocessWithConfig = async (config: ProcessingConfig) => {
  // Parse input
  const parseResult = await data.parseAuto(config.input)
  if (!parseResult.success) {
    return parseResult
  }

  let processedData = parseResult.value

  // Apply transforms
  if (config.transforms) {
    for (const transform of config.transforms) {
      switch (transform.type) {
        case 'filter':
          processedData = processedData.filter(transform.config.predicate)
          break
        case 'map':
          processedData = processedData.map(transform.config.mapper)
          break
        case 'sort':
          processedData.sort(transform.config.compareFn)
          break
      }
    }
  }

  // Apply validation
  if (config.validation) {
    const validationResults = processedData.map((row) =>
      validate.object(config.validation.schema)(row)
    )

    if (config.validation.skipInvalid) {
      processedData = processedData.filter((_, index) => validationResults[index].success)
    }
  }

  // Write output
  const outputPath = config.output || config.input
  const writeResult = await data.writeAuto(outputPath, processedData)

  return writeResult
}
```

## Next Steps

- Review [Data API Documentation](/docs/@trailhead.data.md) for detailed function documentation
- Learn about [Format Detection](../../explanation/format-detection.md)system
- Explore [File System Operations](../../../fs/how-to/file-operations.md)for file handling
