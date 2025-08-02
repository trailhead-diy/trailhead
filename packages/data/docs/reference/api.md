---
type: reference
title: 'Data Package API Reference'
description: 'Complete API reference for data processing operations including CSV, JSON, Excel with auto-detection and format-specific operations'
related:
  - /docs/reference/core-api
  - /packages/core/docs/reference/api
---

# Data Package API Reference

Complete API reference for `@esteban-url/data` package providing data processing operations for CSV, JSON, Excel with unified auto-detection interface and format-specific operations.

## Core Types

### `DataResult<T>`

Result type for data operations using CoreError from `@esteban-url/core`.

```typescript
import type { Result, CoreError } from '@esteban-url/core'
type DataResult<T> = Result<T, CoreError>
```

### `ParsedData<T>`

Enhanced parsed data structure with metadata and error tracking.

```typescript
interface ParsedData<T = Record<string, unknown>> {
  readonly data: readonly T[]
  readonly metadata: ParseMetadata
  readonly errors: readonly ParseError[]
}
```

### `ParseMetadata`

Metadata about parsed data.

```typescript
interface ParseMetadata {
  readonly totalRows: number
  readonly format: string
  readonly hasHeaders: boolean
  readonly encoding?: string
  readonly processingTime?: number
}
```

### `ParseError`

Individual parsing error information.

```typescript
interface ParseError {
  readonly type: string
  readonly code: string
  readonly message: string
  readonly row?: number
  readonly column?: number
  readonly field?: string
}
```

### `DataConfig`

Base configuration for data operations.

```typescript
interface DataConfig {
  readonly encoding?: BufferEncoding
  readonly timeout?: number
  readonly maxSize?: number
}
```

### `ProcessingOptions`

Base processing options for data operations.

```typescript
interface ProcessingOptions {
  readonly autoTrim?: boolean
  readonly skipEmptyLines?: boolean
  readonly errorTolerant?: boolean
  readonly maxRows?: number
  readonly onError?: (error: CoreError, context?: Record<string, unknown>) => void
}
```

## Main API

### `data`

Pre-configured unified data operations instance with auto-detection enabled.

```typescript
const data: UnifiedDataOperations
```

### `UnifiedDataOperations`

Main interface providing auto-detection and format-specific operations.

```typescript
interface UnifiedDataOperations {
  // Auto-detection + processing (main API)
  parseAuto: (filePath: string) => Promise<DataResult<any>>
  parseAutoFromContent: (content: string, fileName?: string) => Promise<DataResult<any>>
  writeAuto: (filePath: string, data: any) => Promise<Result<void, CoreError>>

  // Format-specific operations (direct access)
  parseCSV: CSVOperations['parseFile']
  parseJSON: JSONOperations['parseFile']
  parseExcel: ExcelOperations['parseFile']

  parseCSVFromContent: CSVOperations['parseString']
  parseJSONFromContent: JSONOperations['parseString']
  parseExcelFromContent: ExcelOperations['parseBuffer']

  // Format detection (standalone)
  detectFormat: (filePath: string) => Promise<Result<string, CoreError>>
  detectFormatFromContent: (content: string, fileName?: string) => Result<string, CoreError>

  // Format conversion (basic)
  convertFormat: (data: any, targetFormat: 'csv' | 'json' | 'excel') => Result<string, CoreError>
}
```

#### `parseAuto()`

Auto-detects format and parses file using format detection.

```typescript
function parseAuto(filePath: string): Promise<DataResult<any>>
```

**Example**:

```typescript
import { data } from '@esteban-url/data'

const result = await data.parseAuto('/path/to/file.csv')
if (result.isOk()) {
  console.log('Parsed data:', result.value)
}
```

#### `parseAutoFromContent()`

Auto-detects format and parses content string. Note: Excel content parsing not supported.

```typescript
function parseAutoFromContent(content: string, fileName?: string): Promise<DataResult<any>>
```

#### `writeAuto()`

Auto-detects format from file extension and writes data.

```typescript
function writeAuto(filePath: string, data: any): Promise<Result<void, CoreError>>
```

**Note**: CSV and Excel require array data. JSON files default if no extension provided.

#### `detectFormat()`

Detect MIME type from file path.

```typescript
function detectFormat(filePath: string): Promise<Result<string, CoreError>>
```

#### `detectFormatFromContent()`

Simple format detection from content (csv, json, excel).

```typescript
function detectFormatFromContent(content: string, fileName?: string): Result<string, CoreError>
```

#### `convertFormat()`

Basic format conversion. Excel conversion not supported.

```typescript
function convertFormat(data: any, targetFormat: 'csv' | 'json' | 'excel'): Result<string, CoreError>
```

**Supported conversions**:
- `json`: Any data → JSON string
- `csv`: Array of objects → CSV string  
- `excel`: Not supported (returns error)

### `createUnifiedDataOperations()`

Creates a unified data operations instance with custom configuration.

```typescript
function createUnifiedDataOperations(config?: UnifiedDataConfig): UnifiedDataOperations
```

**Parameters**:

- `config` - Optional configuration object

**Returns**: `UnifiedDataOperations` instance

### `UnifiedDataConfig`

Configuration for unified data operations.

```typescript
interface UnifiedDataConfig {
  csv?: DataConfig
  json?: DataConfig
  excel?: DataConfig
  detection?: FormatConfig
  mime?: FormatConfig
  autoDetect?: boolean
  defaultFormat?: 'csv' | 'json' | 'excel'
}
```

## CSV Operations

### `createCSVOperations()`

Creates CSV processing operations.

```typescript
function createCSVOperations(config?: DataConfig): CSVOperations
```

### `CSVOperations`

CSV processing operations interface. All operations return `ParsedData<T>` with metadata and errors.

```typescript
interface CSVOperations {
  readonly parseString: <T = Record<string, unknown>>(
    data: string,
    options?: CSVProcessingOptions
  ) => DataResult<ParsedData<T>>
  
  readonly parseFile: <T = Record<string, unknown>>(
    filePath: string,
    options?: CSVProcessingOptions
  ) => Promise<DataResult<ParsedData<T>>>
  
  readonly stringify: <T = Record<string, unknown>>(
    data: readonly T[],
    options?: CSVProcessingOptions
  ) => DataResult<string>
  
  readonly writeFile: <T = Record<string, unknown>>(
    data: readonly T[],
    filePath: string,
    options?: CSVProcessingOptions
  ) => Promise<DataResult<void>>
  
  readonly validate: (data: string) => DataResult<boolean>
  readonly detectFormat: (data: string) => DataResult<CSVFormatInfo>
  
  // Additional parsing modes
  readonly parseToObjects: (data: string, options?: CSVProcessingOptions) => DataResult<ParsedData<Record<string, unknown>>>
  readonly parseToArrays: (data: string, options?: CSVProcessingOptions) => DataResult<ParsedData<readonly string[]>>
  readonly fromObjects: (data: readonly Record<string, unknown>[], options?: CSVProcessingOptions) => DataResult<string>
  readonly fromArrays: (data: readonly (readonly string[])[], options?: CSVProcessingOptions) => DataResult<string>
}
```

### `CSVProcessingOptions`

Options for CSV processing operations.

```typescript
interface CSVProcessingOptions extends ProcessingOptions {
  readonly delimiter?: string
  readonly quoteChar?: string
  readonly escapeChar?: string
  readonly hasHeader?: boolean
  readonly dynamicTyping?: boolean
  readonly transformHeader?: (header: string) => string
  readonly detectDelimiter?: boolean
  readonly comments?: string
  readonly transform?: (value: string, field: string) => any
}
```

### `CSVFormatInfo`

CSV format detection information.

```typescript
interface CSVFormatInfo {
  readonly delimiter: string
  readonly quoteChar: string
  readonly hasHeader: boolean
  readonly rowCount: number
  readonly columnCount: number
}
```

### `defaultCSVConfig`

Default CSV configuration.

```typescript
const defaultCSVConfig: DataConfig
```

## JSON Operations

### `createJSONOperations()`

Creates JSON processing operations.

```typescript
function createJSONOperations(config?: DataConfig): JSONOperations
```

### `JSONOperations`

JSON processing operations interface.

```typescript
interface JSONOperations {
  readonly parseString: (data: string, options?: JSONProcessingOptions) => DataResult<any>
  readonly parseFile: (filePath: string, options?: JSONProcessingOptions) => Promise<DataResult<any>>
  readonly stringify: (data: any, options?: JSONProcessingOptions) => DataResult<string>
  readonly writeFile: (data: any, filePath: string, options?: JSONProcessingOptions) => Promise<DataResult<void>>
  readonly validate: (data: string) => DataResult<boolean>
  readonly minify: (data: string) => DataResult<string>
  readonly format: (data: string, options?: { indent?: number; sortKeys?: boolean }) => DataResult<string>
}
```

### `JSONProcessingOptions`

Options for JSON processing operations.

```typescript
interface JSONProcessingOptions extends ProcessingOptions {
  readonly allowTrailingCommas?: boolean
  readonly allowComments?: boolean
  readonly allowSingleQuotes?: boolean
  readonly allowUnquotedKeys?: boolean
  readonly reviver?: (key: string, value: any) => any
  readonly replacer?: (key: string, value: any) => any
  readonly space?: string | number
}
```

### `defaultJSONConfig`

Default JSON configuration.

```typescript
const defaultJSONConfig: DataConfig
```

## Excel Operations

### `createExcelOperations()`

Creates Excel processing operations.

```typescript
function createExcelOperations(config?: DataConfig): ExcelOperations
```

### `ExcelOperations`

Excel processing operations interface.

```typescript
interface ExcelOperations {
  readonly parseBuffer: (buffer: Buffer, options?: ExcelProcessingOptions) => DataResult<any[]>
  readonly parseFile: (filePath: string, options?: ExcelProcessingOptions) => Promise<DataResult<any[]>>
  readonly parseWorksheet: (buffer: Buffer, worksheetName: string, options?: ExcelProcessingOptions) => DataResult<any[]>
  readonly parseWorksheetByIndex: (buffer: Buffer, worksheetIndex: number, options?: ExcelProcessingOptions) => DataResult<any[]>
  readonly stringify: (data: any[], options?: ExcelProcessingOptions) => Promise<DataResult<Buffer>>
  readonly writeFile: (data: any[], filePath: string, options?: ExcelProcessingOptions) => Promise<DataResult<void>>
  readonly validate: (buffer: Buffer) => DataResult<boolean>
  readonly detectFormat: (buffer: Buffer) => DataResult<ExcelFormatInfo>
  readonly parseToObjects: (buffer: Buffer, options?: ExcelProcessingOptions) => DataResult<Record<string, any>[]>
  readonly parseToArrays: (buffer: Buffer, options?: ExcelProcessingOptions) => DataResult<any[][]>
  readonly fromObjects: (objects: Record<string, any>[], options?: ExcelProcessingOptions) => Promise<DataResult<Buffer>>
  readonly fromArrays: (arrays: any[][], options?: ExcelProcessingOptions) => Promise<DataResult<Buffer>>
  readonly getWorksheetNames: (buffer: Buffer) => DataResult<string[]>
  readonly createWorkbook: (worksheets: { name: string; data: any[][] }[]) => Promise<DataResult<Buffer>>
}
```

### `ExcelProcessingOptions`

Options for Excel processing operations.

```typescript
interface ExcelProcessingOptions extends ProcessingOptions {
  readonly worksheetName?: string
  readonly worksheetIndex?: number
  readonly hasHeader?: boolean
  readonly dynamicTyping?: boolean
  readonly dateNF?: string
  readonly cellNF?: boolean
  readonly defval?: any
  readonly range?: string
  readonly header?: number
  readonly password?: string
  readonly bookSST?: boolean
  readonly cellHTML?: boolean
  readonly cellStyles?: boolean
  readonly cellDates?: boolean
  readonly sheetStubs?: boolean
  readonly blankrows?: boolean
  readonly bookVBA?: boolean
}
```

### `ExcelFormatInfo`

Excel format detection information.

```typescript
interface ExcelFormatInfo {
  readonly worksheetNames: string[]
  readonly worksheetCount: number
  readonly hasData: boolean
}
```

### `defaultExcelConfig`

Default Excel configuration.

```typescript
const defaultExcelConfig: DataConfig
```

## Format Detection

### `createDetectionOperations()`

Creates format detection operations.

```typescript
function createDetectionOperations(config?: FormatConfig): DetectionOperations
```

### `DetectionOperations`

Format detection operations interface.

```typescript
interface DetectionOperations {
  readonly detectFromFile: (filePath: string) => Promise<Result<DetectionResult, CoreError>>
}
```

### `DetectionResult`

Result of format detection.

```typescript
interface DetectionResult {
  readonly format: {
    readonly mime: string
  }
}
```

**Note**: The detection system is primarily used internally by the unified operations for auto-detection. External usage is limited to file-based detection.

## MIME Operations

### `createMimeOperations()`

Creates MIME type operations.

```typescript
function createMimeOperations(config?: FormatConfig): MimeOperations
```

### `COMMON_MIME_TYPES`

Common MIME type mappings.

```typescript
const COMMON_MIME_TYPES: Record<string, string>
```

### `MIME_TYPE_CATEGORIES`

MIME type categorization.

```typescript
const MIME_TYPE_CATEGORIES: Record<string, string[]>
```

**Note**: MIME operations are primarily used internally by the detection system.

## Advanced Operations

### `createConversionOperations()`

Creates format conversion operations.

```typescript
function createConversionOperations(config?: FormatConfig): ConversionOperations
```

### `CONVERSION_CATEGORIES`

Supported conversion categories.

```typescript
const CONVERSION_CATEGORIES: Record<string, string[]>
```

### `QUALITY_DEFINITIONS`

Quality definitions for conversions.

```typescript
const QUALITY_DEFINITIONS: Record<string, ConversionQuality>
```

**Note**: Advanced conversion operations are available but primarily used internally. Use the `convertFormat` method on `UnifiedDataOperations` for basic conversions.

## Error Handling

### Error Factory Functions

Data processing error factory functions using `@esteban-url/core` error system.

```typescript
// General data errors
function createDataError(type: string, code: string, message: string, options?: ErrorOptions): CoreError

// Format-specific errors  
function createCSVError(type: string, code: string, message: string, options?: ErrorOptions): CoreError
function createJSONError(type: string, code: string, message: string, options?: ErrorOptions): CoreError
function createExcelError(type: string, code: string, message: string, options?: ErrorOptions): CoreError

// Operation-specific errors
function createParsingError(type: string, code: string, message: string, options?: ErrorOptions): CoreError
function createValidationError(type: string, code: string, message: string, options?: ErrorOptions): CoreError
function createFormatDetectionError(type: string, code: string, message: string, options?: ErrorOptions): CoreError
function createConversionError(type: string, code: string, message: string, options?: ErrorOptions): CoreError
```

### Error Mapping Utilities

```typescript
// Node.js error mapping
function mapNodeError(operation: string, path: string, error: unknown): CoreError

// Library error mapping  
function mapLibraryError(library: string, operation: string, error: unknown): CoreError

// Validation error mapping
function mapValidationError(field: string, value: unknown, error: unknown): CoreError
```

## Usage Examples

### Auto-Detection (Recommended)

```typescript
import { data } from '@esteban-url/data'

// Auto-detect format and parse any supported file
const result = await data.parseAuto('/path/to/data.csv')
if (result.isOk()) {
  console.log('Parsed data:', result.value)
} else {
  console.error('Parse error:', result.error.message)
}

// Parse content with format detection
const contentResult = await data.parseAutoFromContent('{"name": "test"}', 'data.json')
if (contentResult.isOk()) {
  console.log('JSON data:', contentResult.value)
}

// Auto-write with format detection from extension
const writeResult = await data.writeAuto('/path/to/output.json', { name: 'test' })
if (writeResult.isErr()) {
  console.error('Write error:', writeResult.error.message)
}
```

### Format-Specific Operations

```typescript
import { createCSVOperations, createJSONOperations, createExcelOperations } from '@esteban-url/data'

// CSV operations
const csvOps = createCSVOperations()
const csvResult = await csvOps.parseFile('/path/to/data.csv')
if (csvResult.isOk()) {
  const parsedData = csvResult.value
  console.log('Rows:', parsedData.metadata.totalRows)
  console.log('Data:', parsedData.data)
}

// JSON operations
const jsonOps = createJSONOperations()
const jsonResult = await jsonOps.parseFile('/path/to/data.json')
const stringifyResult = jsonOps.stringify({ name: 'test' })

// Excel operations  
const excelOps = createExcelOperations()
const excelResult = await excelOps.parseFile('/path/to/data.xlsx')
if (excelResult.isOk()) {
  console.log('Excel data:', excelResult.value)
}
```

### Basic Format Conversion

```typescript
import { data } from '@esteban-url/data'

const csvData = [
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 }
]

// Convert to JSON
const jsonResult = data.convertFormat(csvData, 'json')
if (jsonResult.isOk()) {
  console.log('JSON:', jsonResult.value)
}

// Convert to CSV
const csvResult = data.convertFormat(csvData, 'csv')
if (csvResult.isOk()) {
  console.log('CSV:', csvResult.value)
}
```

### Configuration

```typescript
import { createUnifiedDataOperations } from '@esteban-url/data'

const customData = createUnifiedDataOperations({
  autoDetect: true,
  defaultFormat: 'json',
  csv: {
    encoding: 'utf8',
    timeout: 5000
  },
  json: {
    encoding: 'utf8'
  }
})

const result = await customData.parseAuto('/path/to/file.unknown')
```

## Related APIs

- [Core API Reference](/packages/core/docs/reference/api.md) - Result types and error handling
- [FileSystem API](/packages/fs/docs/reference/api.md) - File operations used internally
