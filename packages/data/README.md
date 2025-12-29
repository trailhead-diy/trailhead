# @trailhead/data

> Data processing for CSV, JSON, and Excel with Result-based error handling

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/trailhead-diy/trailhead/blob/main/LICENSE)

Unified data processing for CSV, JSON, and Excel formats with automatic format detection, conversion, and streaming support.

## Installation

```bash
pnpm add @trailhead/data
```

## Quick Example

```typescript
import { data } from '@trailhead/data'

// Auto-detect and parse any supported format
const result = await data.parseAuto('./data.csv')
if (result.isOk()) {
  console.log('Data:', result.value.data)
  console.log('Format:', result.value.format)
}

// Write data in any format
await data.writeAuto('./output.json', myData)
```

## Key Features

- **Unified API** - Single interface for CSV, JSON, and Excel formats
- **Auto-detection** - Automatic format detection from file content
- **Format conversion** - Convert between all supported formats
- **Streaming support** - Process large files efficiently
- **Result-based** - Explicit error handling with Result types

### Core Functions

```typescript
import { data } from '@trailhead/data'

// Auto-detect and parse
await data.parseAuto(filePath)
await data.parseAutoFromContent(content, hint?)

// Auto-detect and write
await data.writeAuto(filePath, data)
```

### Format-Specific Operations

```typescript
import { createCSVOperations, createJSONOperations, createExcelOperations } from '@trailhead/data'

// CSV
const csv = createCSVOperations()
await csv.parseFile(path)
await csv.writeFile(data, path) // Note: data first, then path

// JSON
const json = createJSONOperations({ prettify: true })
await json.parseFile(path)
await json.writeFile(path, data)

// Excel
const excel = createExcelOperations()
await excel.parseFile(path)
await excel.writeFile(path, { sheets: [...] })
```

### Format Conversion

```typescript
import { createConversionOperations } from '@trailhead/data/formats/conversion'

const converter = createConversionOperations()
await converter.convert(source, target, { from: 'csv', to: 'json' })
```

## Documentation

- **[API Documentation](../../docs/@trailhead.data.md)** - Complete API reference
- **[Data Pipeline Processing](../../docs/tutorials/data-pipeline-processing.md)** - Tutorial
- **[Convert Data Formats](../../docs/how-to/convert-data-formats.md)** - How-to guide

## License

MIT © [esteban-url](https://github.com/esteban-url)
