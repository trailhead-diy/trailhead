# @trailhead/data

> Data processing for CSV, JSON, and Excel with Result-based error handling

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/trailhead-diy/trailhead/blob/main/LICENSE)

## Features

- Unified API for CSV, JSON, and Excel formats
- Automatic format detection
- Format conversion between all supported types
- Streaming support for large files
- Result-based error handling
- Full TypeScript support

## Installation

```bash
pnpm add @trailhead/data
# or
npm install @trailhead/data
```

## Quick Start

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

## API Reference

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

## Related Packages

- **@trailhead/core** - Result types and functional utilities
- **@trailhead/fs** - File system operations
- **@trailhead/validation** - Data validation

## Documentation

- [Tutorials](./docs/README.md)
  - [Data Pipeline Processing](../../docs/tutorials/data-pipeline-processing.md)
- [How-to Guides](./docs/how-to/process-data-files.md)
  - [Convert Data Formats](../../docs/how-to/convert-data-formats.md)
- [Explanations](./docs/explanation/format-detection.md)
  - [Result Types Pattern](../../docs/explanation/result-types-pattern.md)
  - [Functional Architecture](../../docs/explanation/functional-architecture.md)
- **[API Documentation](../../docs/@trailhead.data.md)** - Complete API reference with examples and type information

## License

MIT © [Esteban URL](https://github.com/esteban-url)
