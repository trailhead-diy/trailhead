---
type: reference
title: 'Data Package API Reference'
description: 'Complete API reference for data processing operations including CSV, JSON, Excel, and format detection'
related:
  - /docs/reference/core-api
  - /packages/data/docs/explanation/functional-architecture/format-detection.md
  - /packages/data/docs/how-to/process-data-files
---

# Data Package API Reference

Complete API reference for `@esteban-url/data` package providing data processing operations for CSV, JSON, Excel, and format detection.

## Core Types

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

### `ProcessingOptions`

General options for data processing operations.

```typescript
interface ProcessingOptions {
  readonly encoding?: BufferEncoding
  readonly validate?: boolean
  readonly preserveOrder?: boolean
  readonly strict?: boolean
}
```

### `DataResult<T>`

Result type for data operations.

```typescript
type DataResult<T> = Result<T, CoreError>
```

## Main API

### `data`

Pre-configured unified data operations instance.

```typescript
const data: UnifiedDataOperations
```

**Usage**:

```typescript
import { data } from '@esteban-url/data'

const result = await data.csv.parseFile('/path/to/file.csv')
```

### `createUnifiedDataOperations()`

Creates a unified data operations instance with custom configuration.

```typescript
function createUnifiedDataOperations(config?: UnifiedDataConfig): UnifiedDataOperations
```

**Parameters**:

- `config` - Optional configuration object

**Returns**: `UnifiedDataOperations` instance

## CSV Operations

### `createCSVOperations()`

Creates CSV processing operations.

```typescript
function createCSVOperations(config?: CSVConfig): CSVOperations
```

### `CSVConfig`

Configuration for CSV operations.

```typescript
interface CSVConfig extends DataConfig {
  readonly delimiter?: string
  readonly quote?: string
  readonly escape?: string
  readonly headers?: boolean | string[]
  readonly skipEmptyLines?: boolean
  readonly comment?: string
}
```

### `CSVOperations`

CSV processing operations interface.

```typescript
interface CSVOperations {
  parse: CSVParseFunction
  parseFile: CSVParseFileFunction
  stringify: CSVStringifyFunction
  writeFile: CSVWriteFileFunction
  validate: CSVValidateFunction
  detectFormat: CSVDetectFormatFunction
}
```

#### `parse()`

Parses CSV string data.

```typescript
function parse(input: string, options?: CSVParseOptions): DataResult<unknown[]>
```

#### `parseFile()`

Parses CSV file from filesystem.

```typescript
function parseFile(filePath: string, options?: CSVParseOptions): Promise<DataResult<unknown[]>>
```

#### `stringify()`

Converts data to CSV string.

```typescript
function stringify(data: unknown[], options?: CSVStringifyOptions): DataResult<string>
```

#### `writeFile()`

Writes data to CSV file.

```typescript
function writeFile(
  filePath: string,
  data: unknown[],
  options?: CSVStringifyOptions
): Promise<DataResult<void>>
```

#### `validate()`

Validates CSV data structure.

```typescript
function validate(data: unknown): DataResult<boolean>
```

#### `detectFormat()`

Detects CSV format information.

```typescript
function detectFormat(input: string | Buffer): DataResult<CSVFormatInfo>
```

## JSON Operations

### `createJSONOperations()`

Creates JSON processing operations.

```typescript
function createJSONOperations(config?: JSONConfig): JSONOperations
```

### `JSONConfig`

Configuration for JSON operations.

```typescript
interface JSONConfig extends DataConfig {
  readonly indent?: number | string
  readonly replacer?: (key: string, value: any) => any
  readonly reviver?: (key: string, value: any) => any
  readonly allowComments?: boolean
  readonly trailingCommas?: boolean
}
```

### `JSONOperations`

JSON processing operations interface.

```typescript
interface JSONOperations {
  parse: JSONParseFunction
  parseFile: JSONParseFileFunction
  stringify: JSONStringifyFunction
  writeFile: JSONWriteFileFunction
  validate: JSONValidateFunction
  minify: JSONMinifyFunction
  format: JSONFormatFunction
}
```

#### `parse()`

Parses JSON string data.

```typescript
function parse(input: string, options?: JSONParseOptions): DataResult<unknown>
```

#### `parseFile()`

Parses JSON file from filesystem.

```typescript
function parseFile(filePath: string, options?: JSONParseOptions): Promise<DataResult<unknown>>
```

#### `stringify()`

Converts data to JSON string.

```typescript
function stringify(data: unknown, options?: JSONStringifyOptions): DataResult<string>
```

#### `writeFile()`

Writes data to JSON file.

```typescript
function writeFile(
  filePath: string,
  data: unknown,
  options?: JSONStringifyOptions
): Promise<DataResult<void>>
```

#### `validate()`

Validates JSON data structure.

```typescript
function validate(data: unknown): DataResult<boolean>
```

#### `minify()`

Minifies JSON by removing whitespace.

```typescript
function minify(input: string, options?: JSONMinifyOptions): DataResult<string>
```

#### `format()`

Formats JSON with proper indentation.

```typescript
function format(input: string, options?: JSONFormatOptions): DataResult<string>
```

## Excel Operations

### `createExcelOperations()`

Creates Excel processing operations.

```typescript
function createExcelOperations(config?: ExcelConfig): ExcelOperations
```

### `ExcelConfig`

Configuration for Excel operations.

```typescript
interface ExcelConfig extends DataConfig {
  readonly sheetName?: string
  readonly range?: string
  readonly headers?: boolean
  readonly dateNF?: string
  readonly cellText?: boolean
  readonly cellDates?: boolean
}
```

### `ExcelOperations`

Excel processing operations interface.

```typescript
interface ExcelOperations {
  parseBuffer: ExcelParseBufferFunction
  parseFile: ExcelParseFileFunction
  stringify: ExcelStringifyFunction
  writeFile: ExcelWriteFileFunction
  validate: ExcelValidateFunction
  detectFormat: ExcelDetectFormatFunction
}
```

#### `parseBuffer()`

Parses Excel data from buffer.

```typescript
function parseBuffer(buffer: Buffer, options?: ExcelParseOptions): DataResult<ExcelWorksheet[]>
```

#### `parseFile()`

Parses Excel file from filesystem.

```typescript
function parseFile(
  filePath: string,
  options?: ExcelParseOptions
): Promise<DataResult<ExcelWorksheet[]>>
```

#### `stringify()`

Converts data to Excel buffer.

```typescript
function stringify(data: ExcelWorksheet[], options?: ExcelWriteOptions): DataResult<Buffer>
```

#### `writeFile()`

Writes data to Excel file.

```typescript
function writeFile(
  filePath: string,
  data: ExcelWorksheet[],
  options?: ExcelWriteOptions
): Promise<DataResult<void>>
```

#### `validate()`

Validates Excel data structure.

```typescript
function validate(data: unknown): DataResult<boolean>
```

#### `detectFormat()`

Detects Excel format information.

```typescript
function detectFormat(input: Buffer): DataResult<ExcelFormatInfo>
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
  detectByContent: (content: string | Buffer) => DataResult<FormatResult>
  detectByExtension: (filePath: string) => DataResult<FormatResult>
  detectByMimeType: (mimeType: string) => DataResult<FormatResult>
  detectMultiple: (input: DetectionInput) => DataResult<FormatResult[]>
}
```

### `createMimeOperations()`

Creates MIME type operations.

```typescript
function createMimeOperations(config?: MimeConfig): MimeOperations
```

### `MimeOperations`

MIME type operations interface.

```typescript
interface MimeOperations {
  getMimeType: (filePath: string) => DataResult<string>
  getExtensions: (mimeType: string) => DataResult<string[]>
  isSupported: (mimeType: string) => boolean
  getCategory: (mimeType: string) => DataResult<string>
}
```

### `createConversionOperations()`

Creates format conversion operations.

```typescript
function createConversionOperations(config?: ConversionConfig): ConversionOperations
```

### `ConversionOperations`

Format conversion operations interface.

```typescript
interface ConversionOperations {
  convert: (input: ConversionInput) => Promise<DataResult<ConversionOutput>>
  canConvert: (from: string, to: string) => boolean
  getAvailableConversions: (format: string) => string[]
  getBestQuality: (from: string, to: string) => DataResult<ConversionInfo>
}
```

## Error Factories

### `createDataError()`

Creates data processing errors.

```typescript
function createDataError(
  type: string,
  code: string,
  message: string,
  options?: ErrorOptions
): CoreError
```

### `createCSVError()`

Creates CSV-specific errors.

```typescript
function createCSVError(
  type: string,
  code: string,
  message: string,
  options?: ErrorOptions
): CoreError
```

### `createJSONError()`

Creates JSON-specific errors.

```typescript
function createJSONError(
  type: string,
  code: string,
  message: string,
  options?: ErrorOptions
): CoreError
```

### `createExcelError()`

Creates Excel-specific errors.

```typescript
function createExcelError(
  type: string,
  code: string,
  message: string,
  options?: ErrorOptions
): CoreError
```

### `createParsingError()`

Creates parsing errors.

```typescript
function createParsingError(format: string, details?: string, cause?: unknown): CoreError
```

### `createValidationError()`

Creates validation errors.

```typescript
function createValidationError(field: string, value: unknown, details?: string): CoreError
```

### `createFormatDetectionError()`

Creates format detection errors.

```typescript
function createFormatDetectionError(input: string, details?: string): CoreError
```

### `createConversionError()`

Creates format conversion errors.

```typescript
function createConversionError(
  from: string,
  to: string,
  details?: string,
  cause?: unknown
): CoreError
```

## Constants

### `COMMON_MIME_TYPES`

Map of common file extensions to MIME types.

```typescript
const COMMON_MIME_TYPES: Record<string, string>
```

### `MIME_TYPE_CATEGORIES`

Categorization of MIME types.

```typescript
const MIME_TYPE_CATEGORIES: Record<string, string[]>
```

### `CONVERSION_CATEGORIES`

Supported conversion paths between formats.

```typescript
const CONVERSION_CATEGORIES: Record<string, string[]>
```

### `QUALITY_DEFINITIONS`

Quality metrics for format conversions.

```typescript
const QUALITY_DEFINITIONS: Record<string, ConversionQuality>
```

## Usage Examples

### Basic CSV Processing

```typescript
import { data } from '@esteban-url/data'

// Parse CSV file
const result = await data.csv.parseFile('./data.csv')
if (result.isOk()) {
  const rows = result.value
  console.log(`Parsed ${rows.length} rows`)
}

// Write CSV file
const writeResult = await data.csv.writeFile('./output.csv', [
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 },
])
```

### JSON Operations

```typescript
import { data } from '@esteban-url/data'

// Parse and format JSON
const parseResult = data.json.parse(jsonString)
const formatResult = data.json.format(jsonString, { indent: 2 })

// Minify JSON
const minifyResult = data.json.minify(jsonString)
```

### Format Detection

```typescript
import { createDetectionOperations } from '@esteban-url/data'

const detection = createDetectionOperations()

// Detect format by content
const result = detection.detectByContent(fileContent)
if (result.isOk()) {
  const format = result.value
  console.log(`Detected format: ${format.format}`)
}
```

### Error Handling

```typescript
import { data, createDataError } from '@esteban-url/data'

const result = await data.csv.parseFile('./nonexistent.csv')
if (result.isErr()) {
  const error = result.error
  console.error(`Error: ${error.message}`)
  console.error(`Component: ${error.component}`)
  console.error(`Operation: ${error.operation}`)
}
```

## Related APIs

- [Core API Reference](/docs/reference/core-api) - Base Result types and error handling
- [FileSystem API](/packages/fs/docs/reference/api) - File operations
- [Validation API](/packages/validation/docs/reference/api) - Data validation
