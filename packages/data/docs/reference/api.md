---
type: reference
title: 'Data Package API Reference'
description: 'Complete API reference for data processing operations including CSV, JSON, Excel, and format detection'
related:
  - /docs/reference/core-api
  - /packages/data/docs/explanation/format-detection.md
  - /packages/data/docs/how-to/process-data-files
---

# Data Package API Reference

Complete API reference for `@esteban-url/data` package providing data processing operations for CSV, JSON, Excel, and format detection.

## Core Types

### `ParsedData<T>`

Wrapper type for parsed data with metadata.

```typescript
interface ParsedData<T> {
  readonly data: T
  readonly metadata: {
    readonly rowCount?: number
    readonly columnCount?: number
    readonly format?: string
    readonly encoding?: string
    readonly headers?: string[]
    readonly [key: string]: unknown
  }
}
```

### `DataResult<T>`

Result type for data operations.

```typescript
type DataResult<T> = Result<ParsedData<T>, CoreError>
```

### `DataConfig`

Base configuration for data operations.

```typescript
interface DataConfig {
  readonly encoding?: BufferEncoding
  readonly validate?: boolean
  readonly transform?: boolean
  readonly outputFormat?: 'objects' | 'arrays'
}
```

## Main API

### `data`

Pre-configured unified data operations instance providing auto-detection and format-specific operations.

```typescript
const data: UnifiedDataOperations
```

### `UnifiedDataOperations`

Main interface providing auto-detection and direct format access.

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

  // Conversion utilities
  convertFormat: (data: any, targetFormat: 'csv' | 'json' | 'excel') => Result<string, CoreError>
}
```

#### `parseAuto()`

Auto-detects format and parses file.

```typescript
function parseAuto(filePath: string): Promise<DataResult<any>>
```

**Example**:

```typescript
import { data } from '@esteban-url/data'

const result = await data.parseAuto('/path/to/file.csv')
if (result.isOk()) {
  const parsed = result.value
  console.log('Data:', parsed.data)
  console.log('Rows:', parsed.metadata.rowCount)
}
```

#### `parseAutoFromContent()`

Auto-detects format and parses content string.

```typescript
function parseAutoFromContent(content: string, fileName?: string): Promise<DataResult<any>>
```

#### `writeAuto()`

Auto-detects format from file extension and writes data.

```typescript
function writeAuto(filePath: string, data: any): Promise<Result<void, CoreError>>
```

#### `parseCSV()`

Direct CSV file parsing.

```typescript
function parseCSV<T = Record<string, unknown>>(
  filePath: string, 
  options?: CSVProcessingOptions
): Promise<DataResult<T>>
```

#### `parseJSON()`

Direct JSON file parsing.

```typescript
function parseJSON<T = unknown>(
  filePath: string, 
  options?: JSONProcessingOptions
): Promise<DataResult<T>>
```

#### `parseExcel()`

Direct Excel file parsing.

```typescript
function parseExcel<T = Record<string, unknown>>(
  filePath: string, 
  options?: ExcelProcessingOptions
): Promise<DataResult<T>>
```

#### `parseCSVFromContent()`

Parse CSV from string content.

```typescript
function parseCSVFromContent<T = Record<string, unknown>>(
  data: string, 
  options?: CSVProcessingOptions
): DataResult<T>
```

#### `parseJSONFromContent()`

Parse JSON from string content.

```typescript
function parseJSONFromContent<T = unknown>(
  data: string, 
  options?: JSONProcessingOptions
): DataResult<T>
```

#### `parseExcelFromContent()`

Parse Excel from buffer content.

```typescript
function parseExcelFromContent<T = Record<string, unknown>>(
  buffer: Buffer, 
  options?: ExcelProcessingOptions
): DataResult<T>
```

#### `detectFormat()`

Detect file format from file path.

```typescript
function detectFormat(filePath: string): Promise<Result<string, CoreError>>
```

#### `detectFormatFromContent()`

Detect format from content string.

```typescript
function detectFormatFromContent(content: string, fileName?: string): Result<string, CoreError>
```

#### `convertFormat()`

Convert data to specified format string.

```typescript
function convertFormat(data: any, targetFormat: 'csv' | 'json' | 'excel'): Result<string, CoreError>
```

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

CSV processing operations interface.

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
  
  readonly writeFile: <T = Record<string, unknown>>(
    data: readonly T[],
    filePath: string,
    options?: CSVProcessingOptions
  ) => Promise<DataResult<void>>
}
```

### `CSVProcessingOptions`

Options for CSV processing.

```typescript
interface CSVProcessingOptions {
  readonly delimiter?: string
  readonly quote?: string
  readonly escape?: string
  readonly headers?: boolean | string[]
  readonly skipEmptyLines?: boolean
  readonly comment?: string
  readonly encoding?: BufferEncoding
  readonly validate?: boolean
  readonly transform?: boolean
  readonly outputFormat?: 'objects' | 'arrays'
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
  readonly parseString: <T = unknown>(
    data: string,
    options?: JSONProcessingOptions
  ) => DataResult<ParsedData<T>>
  
  readonly parseFile: <T = unknown>(
    filePath: string,
    options?: JSONProcessingOptions
  ) => Promise<DataResult<ParsedData<T>>>
  
  readonly writeFile: <T = unknown>(
    filePath: string,
    data: T,
    options?: JSONProcessingOptions
  ) => Promise<DataResult<void>>
}
```

### `JSONProcessingOptions`

Options for JSON processing.

```typescript
interface JSONProcessingOptions {
  readonly reviver?: (key: string, value: any) => any
  readonly replacer?: (key: string, value: any) => any
  readonly space?: string | number
  readonly encoding?: BufferEncoding
  readonly validate?: boolean
  readonly transform?: boolean
  readonly outputFormat?: 'objects' | 'arrays'
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
  readonly parseBuffer: <T = Record<string, unknown>>(
    buffer: Buffer,
    options?: ExcelProcessingOptions
  ) => DataResult<ParsedData<T>>
  
  readonly parseFile: <T = Record<string, unknown>>(
    filePath: string,
    options?: ExcelProcessingOptions
  ) => Promise<DataResult<ParsedData<T>>>
  
  readonly writeFile: <T = Record<string, unknown>>(
    data: readonly T[],
    filePath: string,
    options?: ExcelProcessingOptions
  ) => Promise<DataResult<void>>
}
```

### `ExcelProcessingOptions`

Options for Excel processing.

```typescript
interface ExcelProcessingOptions {
  readonly sheetName?: string
  readonly range?: string
  readonly headers?: boolean
  readonly dateNF?: string
  readonly cellText?: boolean
  readonly cellDates?: boolean
  readonly encoding?: BufferEncoding
  readonly validate?: boolean
  readonly transform?: boolean
  readonly outputFormat?: 'objects' | 'arrays'
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
function createDetectionOperations(config?: DetectionConfig): DetectionOperations
```

### `DetectionOperations`

Format detection operations interface.

```typescript
interface DetectionOperations {
  readonly detectFromBuffer: (
    buffer: Buffer,
    config?: DetectionConfig
  ) => Promise<FormatResult<DetectionResult>>
  
  readonly detectFromFile: (
    filePath: string,
    config?: DetectionConfig
  ) => Promise<FormatResult<DetectionResult>>
  
  readonly detectFromExtension: (
    extension: string,
    config?: DetectionConfig
  ) => FormatResult<FileFormatInfo>
  
  readonly detectFromMime: (
    mimeType: string,
    config?: DetectionConfig
  ) => FormatResult<FileFormatInfo>
  
  readonly detectBatch: (
    files: string[],
    config?: DetectionConfig
  ) => Promise<FormatResult<DetectionResult[]>>
}
```

### `DetectionConfig`

Configuration for format detection.

```typescript
interface DetectionConfig extends FormatConfig {
  readonly bufferSize?: number
  readonly useFileExtension?: boolean
  readonly useMagicNumbers?: boolean
}
```

### `DetectionResult`

Result of format detection.

```typescript
interface DetectionResult {
  readonly format: FileFormatInfo
  readonly source: DetectionSource
  readonly reliability: DetectionReliability
}
```

### `FileFormatInfo`

Information about detected file format.

```typescript
interface FileFormatInfo {
  readonly ext: string
  readonly mime: string
  readonly description: string
  readonly category: FileCategory
  readonly confidence: number
  readonly details?: FormatDetails
}
```

### `defaultDetectionConfig`

Default detection configuration.

```typescript
const defaultDetectionConfig: DetectionConfig
```

## MIME Operations

### `createMimeOperations()`

Creates MIME type operations.

```typescript
function createMimeOperations(config?: MimeConfig): MimeOperations
```

### `MimeOperations`

MIME type operations interface.

```typescript
interface MimeOperations {
  readonly getMimeType: (
    input: string | Buffer,
    config?: MimeConfig
  ) => FormatResult<MimeTypeInfo>
  
  readonly getExtensions: (
    mimeType: string,
    config?: MimeConfig
  ) => FormatResult<readonly string[]>
  
  readonly isMimeType: (
    mimeType: string, 
    category: FileCategory
  ) => FormatResult<boolean>
  
  readonly normalizeMimeType: (
    mimeType: string
  ) => FormatResult<string>
  
  readonly parseMimeType: (
    mimeType: string
  ) => FormatResult<MimeTypeInfo>
}
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

## Format Conversion

### `createConversionOperations()`

Creates format conversion operations.

```typescript
function createConversionOperations(config?: ConversionConfig): ConversionOperations
```

### `ConversionOperations`

Format conversion operations interface.

```typescript
interface ConversionOperations {
  readonly checkConversion: (
    fromFormat: string,
    toFormat: string
  ) => FormatResult<ConversionInfo>
  
  readonly getSupportedFormats: (
    category?: FileCategory
  ) => FormatResult<readonly string[]>
  
  readonly getConversionChain: (
    fromFormat: string,
    toFormat: string
  ) => FormatResult<readonly string[]>
  
  readonly estimateConversionQuality: (
    fromFormat: string,
    toFormat: string
  ) => FormatResult<ConversionQuality>
}
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

## Error Factories

### `createDataError()`

Creates general data processing errors.

```typescript
function createDataError(
  type: string,
  code: string,
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError
```

### `createCSVError()`

Creates CSV-specific errors.

```typescript
function createCSVError(
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError
```

### `createJSONError()`

Creates JSON-specific errors.

```typescript
function createJSONError(
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError
```

### `createExcelError()`

Creates Excel-specific errors.

```typescript
function createExcelError(
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError
```

### `createParsingError()`

Creates parsing errors.

```typescript
function createParsingError(
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError
```

### `createValidationError()`

Creates validation errors.

```typescript
function createValidationError(
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError
```

### `createFormatDetectionError()`

Creates format detection errors.

```typescript
function createFormatDetectionError(
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError
```

### `createConversionError()`

Creates format conversion errors.

```typescript
function createConversionError(
  message: string,
  options?: {
    details?: string
    cause?: unknown
    context?: Record<string, unknown>
  }
): CoreError
```

## Error Mapping Utilities

### `mapNodeError()`

Maps Node.js errors to CoreError.

```typescript
function mapNodeError(operation: string, path: string, error: unknown): CoreError
```

### `mapLibraryError()`

Maps library errors to CoreError.

```typescript
function mapLibraryError(library: string, operation: string, error: unknown): CoreError
```

### `mapValidationError()`

Maps validation errors to CoreError.

```typescript
function mapValidationError(field: string, value: unknown, error: unknown): CoreError
```

### `mapFileSystemError()`

Maps filesystem errors to CoreError.

```typescript
function mapFileSystemError(fsError: FileSystemError, operation: string): CoreError
```

## Usage Examples

### Auto-Detection (Recommended)

```typescript
import { data } from '@esteban-url/data'

// Auto-detect format and parse
const result = await data.parseAuto('/path/to/data.csv')
if (result.isOk()) {
  const parsed = result.value
  console.log('Data:', parsed.data)
  console.log('Metadata:', parsed.metadata)
}

// Auto-detect format and write
await data.writeAuto('/path/to/output.json', { users: [] })
```

### Format-Specific Operations

```typescript
import { data } from '@esteban-url/data'

// Direct CSV parsing
const csvResult = await data.parseCSV('/path/to/data.csv', {
  delimiter: ',',
  headers: true
})

// Direct JSON parsing
const jsonResult = await data.parseJSON('/path/to/data.json')

// Parse from content strings
const csvContent = data.parseCSVFromContent('name,age\nJohn,30', {
  headers: true
})
```

### Individual Operations

```typescript
import { createCSVOperations, createJSONOperations } from '@esteban-url/data'

const csvOps = createCSVOperations({ encoding: 'utf8' })
const jsonOps = createJSONOperations({ validate: true })

// CSV operations
const csvResult = await csvOps.parseFile('./data.csv')
await csvOps.writeFile(data, './output.csv')

// JSON operations  
const jsonResult = await jsonOps.parseFile('./data.json')
await jsonOps.writeFile('./output.json', data)
```

### Format Detection Examples

```typescript
import { createDetectionOperations } from '@esteban-url/data'

const detection = createDetectionOperations()

// Detect from file
const fileResult = await detection.detectFromFile('./unknown-file')
if (fileResult.isOk()) {
  console.log('Format:', fileResult.value.format.mime)
  console.log('Confidence:', fileResult.value.format.confidence)
}

// Detect from extension
const extResult = detection.detectFromExtension('csv')
if (extResult.isOk()) {
  console.log('MIME type:', extResult.value.mime)
}
```

### Error Handling

```typescript
import { data, createCSVError } from '@esteban-url/data'

const result = await data.parseAuto('./nonexistent.csv')
if (result.isErr()) {
  const error = result.error
  console.error('Error:', error.message)
  console.error('Component:', error.component)
  console.error('Operation:', error.operation)
  console.error('Details:', error.details)
}

// Custom error creation
const customError = createCSVError('Invalid delimiter', {
  details: 'Expected comma, found semicolon',
  context: { filePath: './data.csv', line: 1 }
})
```

### Format Conversion Examples

```typescript
import { data } from '@esteban-url/data'

// Convert data to different format strings
const jsonData = [{ name: 'John', age: 30 }]

const csvString = data.convertFormat(jsonData, 'csv')
if (csvString.isOk()) {
  console.log('CSV:', csvString.value)
}

const jsonString = data.convertFormat(jsonData, 'json')
if (jsonString.isOk()) {
  console.log('JSON:', jsonString.value)
}
```

## Related APIs

- [Core API Reference](/docs/reference/core-api.md) - Base Result types and error handling
- [FileSystem API](/packages/fs/docs/reference/api.md) - File operations
- [Validation API](/packages/validation/docs/reference/api.md) - Data validation
