[**Trailhead API Documentation v0.1.0**](README.md)

---

[Trailhead API Documentation](README.md) / @trailhead/data

# @trailhead/data

Unified data processing library with auto-detection for CSV, JSON, and Excel formats

This package provides:

- Automatic format detection and parsing
- Type-safe data operations with Result types
- Support for CSV, JSON, and Excel formats
- Functional programming patterns
- Comprehensive error handling

## Examples

```typescript
import { data } from '@trailhead/data'

// Auto-detect and parse any supported format
const result = await data.parseAuto('data.csv')
if (result.isOk()) {
  console.log(result.value.data) // Parsed data array
  console.log(result.value.format) // Detected format info
}
```

```typescript
import { createCSVOperations } from '@trailhead/data'

const csvOps = createCSVOperations({ delimiter: ';' })
const result = await csvOps.parseFile('data.csv')
```

## Interfaces

### ConversionConfig

Configuration for format conversion operations

#### Extends

- [`FormatConfig`](#formatconfig)

#### Properties

##### enableExtensionFallback?

> `readonly` `optional` **enableExtensionFallback**: `boolean`

Fall back to extension-based detection

###### Inherited from

[`FormatConfig`](#formatconfig).[`enableExtensionFallback`](#enableextensionfallback-2)

##### maxSize?

> `readonly` `optional` **maxSize**: `number`

Maximum file size in bytes

###### Inherited from

[`FormatConfig`](#formatconfig).[`maxSize`](#maxsize-5)

##### preserveMetadata?

> `readonly` `optional` **preserveMetadata**: `boolean`

Preserve metadata during conversion

##### quality?

> `readonly` `optional` **quality**: `number`

Conversion quality (0-100 for lossy formats)

##### strictMode?

> `readonly` `optional` **strictMode**: `boolean`

Enable strict validation mode

###### Inherited from

[`FormatConfig`](#formatconfig).[`strictMode`](#strictmode-2)

##### timeout?

> `readonly` `optional` **timeout**: `number`

Operation timeout in milliseconds

###### Inherited from

[`FormatConfig`](#formatconfig).[`timeout`](#timeout-5)

---

### ConversionInfo

Information about format conversion capability

#### Properties

##### fromFormat

> `readonly` **fromFormat**: `string`

Source format identifier

##### options?

> `readonly` `optional` **options**: `ConversionOptions`

Available conversion options

##### quality

> `readonly` **quality**: `ConversionQuality`

Expected quality level

##### supported

> `readonly` **supported**: `boolean`

Whether conversion is supported

##### toFormat

> `readonly` **toFormat**: `string`

Target format identifier

---

### ConversionOperations

Interface for format conversion operations
Provides methods to check conversion support and build conversion chains

#### Properties

##### checkConversion

> `readonly` **checkConversion**: `CheckConversionOp`

##### estimateConversionQuality()

> `readonly` **estimateConversionQuality**: (`fromFormat`, `toFormat`) => [`FormatResult`](#formatresult)\<`ConversionQuality`\>

###### Parameters

###### fromFormat

`string`

###### toFormat

`string`

###### Returns

[`FormatResult`](#formatresult)\<`ConversionQuality`\>

##### getConversionChain()

> `readonly` **getConversionChain**: (`fromFormat`, `toFormat`) => [`FormatResult`](#formatresult)\<readonly `string`[]\>

###### Parameters

###### fromFormat

`string`

###### toFormat

`string`

###### Returns

[`FormatResult`](#formatresult)\<readonly `string`[]\>

##### getSupportedFormats

> `readonly` **getSupportedFormats**: `GetSupportedFormatsOp`

---

### CSVConfig

Configuration specific to CSV operations
CSVConfig

#### Extends

- [`DataConfig`](#dataconfig)

#### Properties

##### comments?

> `readonly` `optional` **comments**: `string`

Character to treat as comment prefix

##### delimiter?

> `readonly` `optional` **delimiter**: `string`

Field delimiter character

##### detectDelimiter?

> `readonly` `optional` **detectDelimiter**: `boolean`

Auto-detect delimiter

##### dynamicTyping?

> `readonly` `optional` **dynamicTyping**: `boolean`

Auto-convert numeric/boolean values

##### encoding?

> `readonly` `optional` **encoding**: `BufferEncoding`

File encoding

###### Inherited from

[`DataConfig`](#dataconfig).[`encoding`](#encoding-1)

##### escapeChar?

> `readonly` `optional` **escapeChar**: `string`

Escape character for quotes

##### hasHeader?

> `readonly` `optional` **hasHeader**: `boolean`

Whether first row contains headers

##### maxSize?

> `readonly` `optional` **maxSize**: `number`

Maximum file size in bytes

###### Inherited from

[`DataConfig`](#dataconfig).[`maxSize`](#maxsize-2)

##### quoteChar?

> `readonly` `optional` **quoteChar**: `string`

Quote character for fields

##### skipEmptyLines?

> `readonly` `optional` **skipEmptyLines**: `boolean`

Skip empty lines

##### timeout?

> `readonly` `optional` **timeout**: `number`

Operation timeout in milliseconds

###### Inherited from

[`DataConfig`](#dataconfig).[`timeout`](#timeout-2)

##### transform()?

> `readonly` `optional` **transform**: (`value`, `field`) => `any`

Transform function for values

###### Parameters

###### value

`string`

###### field

`string`

###### Returns

`any`

##### transformHeader()?

> `readonly` `optional` **transformHeader**: (`header`) => `string`

Transform function for headers

###### Parameters

###### header

`string`

###### Returns

`string`

---

### CSVFormatInfo

#### Properties

##### columnCount

> `readonly` **columnCount**: `number`

##### delimiter

> `readonly` **delimiter**: `string`

##### hasHeader

> `readonly` **hasHeader**: `boolean`

##### quoteChar

> `readonly` **quoteChar**: `string`

##### rowCount

> `readonly` **rowCount**: `number`

---

### CSVOperations

#### Properties

##### detectFormat()

> `readonly` **detectFormat**: (`data`) => [`DataResult`](#dataresult)\<[`CSVFormatInfo`](#csvformatinfo)\>

###### Parameters

###### data

`string`

###### Returns

[`DataResult`](#dataresult)\<[`CSVFormatInfo`](#csvformatinfo)\>

##### fromArrays()

> `readonly` **fromArrays**: (`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>

###### Parameters

###### data

readonly readonly `string`[][]

###### options?

[`CSVProcessingOptions`](#csvprocessingoptions)

###### Returns

[`DataResult`](#dataresult)\<`string`\>

##### fromObjects()

> `readonly` **fromObjects**: (`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>

###### Parameters

###### data

readonly `Record`\<`string`, `unknown`\>[]

###### options?

[`CSVProcessingOptions`](#csvprocessingoptions)

###### Returns

[`DataResult`](#dataresult)\<`string`\>

##### parseFile()

> `readonly` **parseFile**: \<`T`\>(`filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>\>

###### Type Parameters

###### T

`T` = `Record`\<`string`, `unknown`\>

###### Parameters

###### filePath

`string`

###### options?

[`CSVProcessingOptions`](#csvprocessingoptions)

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>\>

##### parseString()

> `readonly` **parseString**: \<`T`\>(`data`, `options?`) => [`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>

###### Type Parameters

###### T

`T` = `Record`\<`string`, `unknown`\>

###### Parameters

###### data

`string`

###### options?

[`CSVProcessingOptions`](#csvprocessingoptions)

###### Returns

[`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>

##### parseToArrays()

> `readonly` **parseToArrays**: (`data`, `options?`) => [`DataResult`](#dataresult)\<`ParsedData`\<readonly `string`[]\>\>

###### Parameters

###### data

`string`

###### options?

[`CSVProcessingOptions`](#csvprocessingoptions)

###### Returns

[`DataResult`](#dataresult)\<`ParsedData`\<readonly `string`[]\>\>

##### parseToObjects()

> `readonly` **parseToObjects**: (`data`, `options?`) => [`DataResult`](#dataresult)\<`ParsedData`\<`Record`\<`string`, `unknown`\>\>\>

###### Parameters

###### data

`string`

###### options?

[`CSVProcessingOptions`](#csvprocessingoptions)

###### Returns

[`DataResult`](#dataresult)\<`ParsedData`\<`Record`\<`string`, `unknown`\>\>\>

##### stringify()

> `readonly` **stringify**: \<`T`\>(`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>

###### Type Parameters

###### T

`T` = `Record`\<`string`, `unknown`\>

###### Parameters

###### data

readonly `T`[]

###### options?

[`CSVProcessingOptions`](#csvprocessingoptions)

###### Returns

[`DataResult`](#dataresult)\<`string`\>

##### validate

> `readonly` **validate**: `ValidateStringOperation`

##### writeFile()

> `readonly` **writeFile**: \<`T`\>(`data`, `filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

###### Type Parameters

###### T

`T` = `Record`\<`string`, `unknown`\>

###### Parameters

###### data

readonly `T`[]

###### filePath

`string`

###### options?

[`CSVProcessingOptions`](#csvprocessingoptions)

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

---

### CSVParseResult

#### Properties

##### data

> `readonly` **data**: `any`[]

##### errors

> `readonly` **errors**: `any`[]

##### meta

> `readonly` **meta**: `object`

###### aborted

> `readonly` **aborted**: `boolean`

###### cursor

> `readonly` **cursor**: `number`

###### delimiter

> `readonly` **delimiter**: `string`

###### fields?

> `readonly` `optional` **fields**: `string`[]

###### linebreak

> `readonly` **linebreak**: `string`

###### truncated

> `readonly` **truncated**: `boolean`

---

### CSVProcessingOptions

Base processing options for all data operations
ProcessingOptions

#### Extends

- [`ProcessingOptions`](#processingoptions)

#### Properties

##### autoTrim?

> `readonly` `optional` **autoTrim**: `boolean`

Automatically trim whitespace

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`autoTrim`](#autotrim-3)

##### comments?

> `readonly` `optional` **comments**: `string`

##### delimiter?

> `readonly` `optional` **delimiter**: `string`

##### detectDelimiter?

> `readonly` `optional` **detectDelimiter**: `boolean`

##### dynamicTyping?

> `readonly` `optional` **dynamicTyping**: `boolean`

##### errorTolerant?

> `readonly` `optional` **errorTolerant**: `boolean`

Continue on errors

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`errorTolerant`](#errortolerant-3)

##### escapeChar?

> `readonly` `optional` **escapeChar**: `string`

##### hasHeader?

> `readonly` `optional` **hasHeader**: `boolean`

##### maxRows?

> `readonly` `optional` **maxRows**: `number`

Maximum number of rows to process

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`maxRows`](#maxrows-3)

##### onError()?

> `readonly` `optional` **onError**: (`error`, `context?`) => `void`

Error callback handler

###### Parameters

###### error

[`CoreError`](@trailhead.cli.md#coreerror)

###### context?

`Record`\<`string`, `unknown`\>

###### Returns

`void`

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`onError`](#onerror-3)

##### quoteChar?

> `readonly` `optional` **quoteChar**: `string`

##### skipEmptyLines?

> `readonly` `optional` **skipEmptyLines**: `boolean`

Skip empty lines

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`skipEmptyLines`](#skipemptylines-5)

##### transform()?

> `readonly` `optional` **transform**: (`value`, `field`) => `any`

###### Parameters

###### value

`string`

###### field

`string`

###### Returns

`any`

##### transformHeader()?

> `readonly` `optional` **transformHeader**: (`header`) => `string`

###### Parameters

###### header

`string`

###### Returns

`string`

---

### CSVStringifyOptions

#### Properties

##### columns?

> `readonly` `optional` **columns**: `string`[]

##### delimiter?

> `readonly` `optional` **delimiter**: `string`

##### escapeChar?

> `readonly` `optional` **escapeChar**: `string`

##### header?

> `readonly` `optional` **header**: `boolean`

##### quoteChar?

> `readonly` `optional` **quoteChar**: `string`

##### skipEmptyLines?

> `readonly` `optional` **skipEmptyLines**: `boolean`

##### transform()?

> `readonly` `optional` **transform**: (`value`, `field`) => `string`

###### Parameters

###### value

`any`

###### field

`string`

###### Returns

`string`

---

### DataConfig

Base configuration for all data operations
DataConfig

#### Extended by

- [`CSVConfig`](#csvconfig)
- [`JSONConfig`](#jsonconfig)
- [`ExcelConfig`](#excelconfig)

#### Properties

##### encoding?

> `readonly` `optional` **encoding**: `BufferEncoding`

File encoding

##### maxSize?

> `readonly` `optional` **maxSize**: `number`

Maximum file size in bytes

##### timeout?

> `readonly` `optional` **timeout**: `number`

Operation timeout in milliseconds

---

### DetectionConfig

Configuration for format detection operations

#### Extends

- [`FormatConfig`](#formatconfig)

#### Properties

##### bufferSize?

> `readonly` `optional` **bufferSize**: `number`

Buffer size for reading file headers (default: 4096)

##### enableExtensionFallback?

> `readonly` `optional` **enableExtensionFallback**: `boolean`

Fall back to extension-based detection

###### Inherited from

[`FormatConfig`](#formatconfig).[`enableExtensionFallback`](#enableextensionfallback-2)

##### maxSize?

> `readonly` `optional` **maxSize**: `number`

Maximum file size in bytes

###### Inherited from

[`FormatConfig`](#formatconfig).[`maxSize`](#maxsize-5)

##### strictMode?

> `readonly` `optional` **strictMode**: `boolean`

Enable strict validation mode

###### Inherited from

[`FormatConfig`](#formatconfig).[`strictMode`](#strictmode-2)

##### timeout?

> `readonly` `optional` **timeout**: `number`

Operation timeout in milliseconds

###### Inherited from

[`FormatConfig`](#formatconfig).[`timeout`](#timeout-5)

##### useFileExtension?

> `readonly` `optional` **useFileExtension**: `boolean`

Enable extension-based detection

##### useMagicNumbers?

> `readonly` `optional` **useMagicNumbers**: `boolean`

Enable magic number signature detection

---

### DetectionOperations

Interface for format detection operations
Provides methods to detect file formats from various sources

#### Properties

##### detectBatch()

> `readonly` **detectBatch**: (`files`, `config?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FormatResult`](#formatresult)\<[`DetectionResult`](#detectionresult)[]\>\>

###### Parameters

###### files

`string`[]

###### config?

[`DetectionConfig`](#detectionconfig)

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FormatResult`](#formatresult)\<[`DetectionResult`](#detectionresult)[]\>\>

##### detectFromBuffer

> `readonly` **detectFromBuffer**: `DetectFromBufferOp`

##### detectFromExtension

> `readonly` **detectFromExtension**: `DetectFromExtensionOp`

##### detectFromFile

> `readonly` **detectFromFile**: `DetectFromFileOp`

##### detectFromMime()

> `readonly` **detectFromMime**: (`mimeType`, `config?`) => [`FormatResult`](#formatresult)\<`FileFormatInfo`\>

###### Parameters

###### mimeType

`string`

###### config?

[`DetectionConfig`](#detectionconfig)

###### Returns

[`FormatResult`](#formatresult)\<`FileFormatInfo`\>

---

### DetectionResult

Result of a format detection operation

#### Properties

##### format

> `readonly` **format**: `FileFormatInfo`

Detected format information

##### reliability

> `readonly` **reliability**: `DetectionReliability`

Reliability level of detection

##### source

> `readonly` **source**: `DetectionSource`

Method used for detection

---

### ExcelCellInfo

#### Properties

##### format?

> `readonly` `optional` **format**: `string`

##### style?

> `readonly` `optional` **style**: `Record`\<`string`, `any`\>

##### type

> `readonly` **type**: `"n"` \| `"s"` \| `"b"` \| `"d"` \| `"e"` \| `"z"`

##### value

> `readonly` **value**: `any`

---

### ExcelConfig

Configuration specific to Excel operations
ExcelConfig

#### Extends

- [`DataConfig`](#dataconfig)

#### Properties

##### cellDates?

> `readonly` `optional` **cellDates**: `boolean`

Parse dates to Date objects

##### dateNF?

> `readonly` `optional` **dateNF**: `string`

Date number format

##### defval?

> `readonly` `optional` **defval**: `any`

Default value for empty cells

##### dynamicTyping?

> `readonly` `optional` **dynamicTyping**: `boolean`

Auto-convert numeric/date values

##### encoding?

> `readonly` `optional` **encoding**: `BufferEncoding`

File encoding

###### Inherited from

[`DataConfig`](#dataconfig).[`encoding`](#encoding-1)

##### hasHeader?

> `readonly` `optional` **hasHeader**: `boolean`

Whether first row contains headers

##### header?

> `readonly` `optional` **header**: `number`

Row index containing headers

##### maxSize?

> `readonly` `optional` **maxSize**: `number`

Maximum file size in bytes

###### Inherited from

[`DataConfig`](#dataconfig).[`maxSize`](#maxsize-2)

##### range?

> `readonly` `optional` **range**: `string`

Cell range to read (e.g., 'A1:D10')

##### timeout?

> `readonly` `optional` **timeout**: `number`

Operation timeout in milliseconds

###### Inherited from

[`DataConfig`](#dataconfig).[`timeout`](#timeout-2)

##### worksheetIndex?

> `readonly` `optional` **worksheetIndex**: `number`

Worksheet index to read/write

##### worksheetName?

> `readonly` `optional` **worksheetName**: `string`

Worksheet name to read/write

---

### ExcelFormatInfo

#### Properties

##### hasData

> `readonly` **hasData**: `boolean`

##### worksheetCount

> `readonly` **worksheetCount**: `number`

##### worksheetNames

> `readonly` **worksheetNames**: `string`[]

---

### ExcelMergeRange

#### Properties

##### e

> `readonly` **e**: `object`

###### c

> **c**: `number`

###### r

> **r**: `number`

##### s

> `readonly` **s**: `object`

###### c

> **c**: `number`

###### r

> **r**: `number`

---

### ExcelOperations

#### Properties

##### createWorkbook()

> `readonly` **createWorkbook**: (`worksheets`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\<`ArrayBufferLike`\>\>\>

###### Parameters

###### worksheets

`object`[]

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\<`ArrayBufferLike`\>\>\>

##### detectFormat()

> `readonly` **detectFormat**: (`buffer`) => [`DataResult`](#dataresult)\<[`ExcelFormatInfo`](#excelformatinfo)\>

###### Parameters

###### buffer

`Buffer`

###### Returns

[`DataResult`](#dataresult)\<[`ExcelFormatInfo`](#excelformatinfo)\>

##### fromArrays()

> `readonly` **fromArrays**: (`arrays`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\<`ArrayBufferLike`\>\>\>

###### Parameters

###### arrays

`any`[][]

###### options?

[`ExcelProcessingOptions`](#excelprocessingoptions)

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\<`ArrayBufferLike`\>\>\>

##### fromObjects()

> `readonly` **fromObjects**: (`objects`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\<`ArrayBufferLike`\>\>\>

###### Parameters

###### objects

`Record`\<`string`, `any`\>[]

###### options?

[`ExcelProcessingOptions`](#excelprocessingoptions)

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\<`ArrayBufferLike`\>\>\>

##### getWorksheetNames()

> `readonly` **getWorksheetNames**: (`buffer`) => [`DataResult`](#dataresult)\<`string`[]\>

###### Parameters

###### buffer

`Buffer`

###### Returns

[`DataResult`](#dataresult)\<`string`[]\>

##### parseBuffer()

> `readonly` **parseBuffer**: (`buffer`, `options?`) => [`DataResult`](#dataresult)\<`any`[]\>

###### Parameters

###### buffer

`Buffer`

###### options?

[`ExcelProcessingOptions`](#excelprocessingoptions)

###### Returns

[`DataResult`](#dataresult)\<`any`[]\>

##### parseFile

> `readonly` **parseFile**: [`ParseFileOperation`](#parsefileoperation)\<`any`[], [`ExcelProcessingOptions`](#excelprocessingoptions)\>

##### parseToArrays()

> `readonly` **parseToArrays**: (`buffer`, `options?`) => [`DataResult`](#dataresult)\<`any`[][]\>

###### Parameters

###### buffer

`Buffer`

###### options?

[`ExcelProcessingOptions`](#excelprocessingoptions)

###### Returns

[`DataResult`](#dataresult)\<`any`[][]\>

##### parseToObjects()

> `readonly` **parseToObjects**: (`buffer`, `options?`) => [`DataResult`](#dataresult)\<`Record`\<`string`, `any`\>[]\>

###### Parameters

###### buffer

`Buffer`

###### options?

[`ExcelProcessingOptions`](#excelprocessingoptions)

###### Returns

[`DataResult`](#dataresult)\<`Record`\<`string`, `any`\>[]\>

##### parseWorksheet()

> `readonly` **parseWorksheet**: (`buffer`, `worksheetName`, `options?`) => [`DataResult`](#dataresult)\<`any`[]\>

###### Parameters

###### buffer

`Buffer`

###### worksheetName

`string`

###### options?

[`ExcelProcessingOptions`](#excelprocessingoptions)

###### Returns

[`DataResult`](#dataresult)\<`any`[]\>

##### parseWorksheetByIndex()

> `readonly` **parseWorksheetByIndex**: (`buffer`, `worksheetIndex`, `options?`) => [`DataResult`](#dataresult)\<`any`[]\>

###### Parameters

###### buffer

`Buffer`

###### worksheetIndex

`number`

###### options?

[`ExcelProcessingOptions`](#excelprocessingoptions)

###### Returns

[`DataResult`](#dataresult)\<`any`[]\>

##### stringify()

> `readonly` **stringify**: (`data`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\<`ArrayBufferLike`\>\>\>

###### Parameters

###### data

`any`[]

###### options?

[`ExcelProcessingOptions`](#excelprocessingoptions)

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\<`ArrayBufferLike`\>\>\>

##### validate

> `readonly` **validate**: `ValidateBufferOperation`

##### writeFile

> `readonly` **writeFile**: [`WriteFileOperation`](#writefileoperation)\<`any`[], [`ExcelProcessingOptions`](#excelprocessingoptions)\>

---

### ExcelParseOptions

#### Properties

##### bookDeps?

> `readonly` `optional` **bookDeps**: `boolean`

##### bookFiles?

> `readonly` `optional` **bookFiles**: `boolean`

##### bookProps?

> `readonly` `optional` **bookProps**: `boolean`

##### bookSheets?

> `readonly` `optional` **bookSheets**: `boolean`

##### bookVBA?

> `readonly` `optional` **bookVBA**: `boolean`

##### cellDates?

> `readonly` `optional` **cellDates**: `boolean`

##### cellFormula?

> `readonly` `optional` **cellFormula**: `boolean`

##### cellHTML?

> `readonly` `optional` **cellHTML**: `boolean`

##### cellNF?

> `readonly` `optional` **cellNF**: `boolean`

##### cellStyles?

> `readonly` `optional` **cellStyles**: `boolean`

##### cellText?

> `readonly` `optional` **cellText**: `boolean`

##### codepage?

> `readonly` `optional` **codepage**: `number`

##### dateNF?

> `readonly` `optional` **dateNF**: `string`

##### password?

> `readonly` `optional` **password**: `string`

##### raw?

> `readonly` `optional` **raw**: `boolean`

##### sheetRows?

> `readonly` `optional` **sheetRows**: `number`

##### sheetStubs?

> `readonly` `optional` **sheetStubs**: `boolean`

##### type?

> `readonly` `optional` **type**: `"base64"` \| `"binary"` \| `"buffer"` \| `"file"` \| `"array"`

##### WTF?

> `readonly` `optional` **WTF**: `boolean`

---

### ExcelProcessingOptions

Base processing options for all data operations
ProcessingOptions

#### Extends

- [`ProcessingOptions`](#processingoptions)

#### Properties

##### autoTrim?

> `readonly` `optional` **autoTrim**: `boolean`

Automatically trim whitespace

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`autoTrim`](#autotrim-3)

##### blankrows?

> `readonly` `optional` **blankrows**: `boolean`

##### bookSST?

> `readonly` `optional` **bookSST**: `boolean`

##### bookVBA?

> `readonly` `optional` **bookVBA**: `boolean`

##### cellDates?

> `readonly` `optional` **cellDates**: `boolean`

##### cellHTML?

> `readonly` `optional` **cellHTML**: `boolean`

##### cellNF?

> `readonly` `optional` **cellNF**: `boolean`

##### cellStyles?

> `readonly` `optional` **cellStyles**: `boolean`

##### dateNF?

> `readonly` `optional` **dateNF**: `string`

##### defval?

> `readonly` `optional` **defval**: `any`

##### dynamicTyping?

> `readonly` `optional` **dynamicTyping**: `boolean`

##### errorTolerant?

> `readonly` `optional` **errorTolerant**: `boolean`

Continue on errors

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`errorTolerant`](#errortolerant-3)

##### hasHeader?

> `readonly` `optional` **hasHeader**: `boolean`

##### header?

> `readonly` `optional` **header**: `number`

##### maxRows?

> `readonly` `optional` **maxRows**: `number`

Maximum number of rows to process

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`maxRows`](#maxrows-3)

##### onError()?

> `readonly` `optional` **onError**: (`error`, `context?`) => `void`

Error callback handler

###### Parameters

###### error

[`CoreError`](@trailhead.cli.md#coreerror)

###### context?

`Record`\<`string`, `unknown`\>

###### Returns

`void`

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`onError`](#onerror-3)

##### password?

> `readonly` `optional` **password**: `string`

##### range?

> `readonly` `optional` **range**: `string`

##### sheetStubs?

> `readonly` `optional` **sheetStubs**: `boolean`

##### skipEmptyLines?

> `readonly` `optional` **skipEmptyLines**: `boolean`

Skip empty lines

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`skipEmptyLines`](#skipemptylines-5)

##### worksheetIndex?

> `readonly` `optional` **worksheetIndex**: `number`

##### worksheetName?

> `readonly` `optional` **worksheetName**: `string`

---

### ExcelWorkbookInfo

#### Properties

##### properties?

> `readonly` `optional` **properties**: `object`

###### author?

> `readonly` `optional` **author**: `string`

###### company?

> `readonly` `optional` **company**: `string`

###### created?

> `readonly` `optional` **created**: `Date`

###### modified?

> `readonly` `optional` **modified**: `Date`

###### subject?

> `readonly` `optional` **subject**: `string`

###### title?

> `readonly` `optional` **title**: `string`

##### worksheetCount

> `readonly` **worksheetCount**: `number`

##### worksheetNames

> `readonly` **worksheetNames**: `string`[]

---

### ExcelWorksheet

#### Properties

##### data

> `readonly` **data**: `any`[][]

##### merges?

> `readonly` `optional` **merges**: [`ExcelMergeRange`](#excelmergerange)[]

##### name

> `readonly` **name**: `string`

##### range?

> `readonly` `optional` **range**: `string`

---

### ExcelWriteOptions

#### Properties

##### bookType?

> `readonly` `optional` **bookType**: `"csv"` \| `"xlsx"` \| `"xlsm"` \| `"xlsb"` \| `"xls"` \| `"ods"`

##### compression?

> `readonly` `optional` **compression**: `boolean`

##### Props?

> `readonly` `optional` **Props**: `object`

###### Author?

> `readonly` `optional` **Author**: `string`

###### Category?

> `readonly` `optional` **Category**: `string`

###### Comments?

> `readonly` `optional` **Comments**: `string`

###### Company?

> `readonly` `optional` **Company**: `string`

###### CreatedDate?

> `readonly` `optional` **CreatedDate**: `Date`

###### Keywords?

> `readonly` `optional` **Keywords**: `string`

###### LastAuthor?

> `readonly` `optional` **LastAuthor**: `string`

###### Manager?

> `readonly` `optional` **Manager**: `string`

###### Subject?

> `readonly` `optional` **Subject**: `string`

###### Title?

> `readonly` `optional` **Title**: `string`

---

### FormatConfig

Base configuration for format operations

#### Extended by

- [`DetectionConfig`](#detectionconfig)
- [`MimeConfig`](#mimeconfig)
- [`ConversionConfig`](#conversionconfig)

#### Properties

##### enableExtensionFallback?

> `readonly` `optional` **enableExtensionFallback**: `boolean`

Fall back to extension-based detection

##### maxSize?

> `readonly` `optional` **maxSize**: `number`

Maximum file size in bytes

##### strictMode?

> `readonly` `optional` **strictMode**: `boolean`

Enable strict validation mode

##### timeout?

> `readonly` `optional` **timeout**: `number`

Operation timeout in milliseconds

---

### FormatDetectionResult

Result of format detection operation
FormatDetectionResult

#### Properties

##### confidence

> `readonly` **confidence**: `number`

Confidence score (0-1)

##### details?

> `readonly` `optional` **details**: `object`

Format-specific details

###### delimiter?

> `readonly` `optional` **delimiter**: `string`

###### hasHeader?

> `readonly` `optional` **hasHeader**: `boolean`

###### structure?

> `readonly` `optional` **structure**: `string`

###### worksheetCount?

> `readonly` `optional` **worksheetCount**: `number`

###### worksheetNames?

> `readonly` `optional` **worksheetNames**: `string`[]

##### format

> `readonly` **format**: `"csv"` \| `"json"` \| `"excel"` \| `"unknown"`

Detected format

---

### JSONConfig

Configuration specific to JSON operations
JSONConfig

#### Extends

- [`DataConfig`](#dataconfig)

#### Properties

##### allowComments?

> `readonly` `optional` **allowComments**: `boolean`

Allow comments in JSON

##### allowTrailingCommas?

> `readonly` `optional` **allowTrailingCommas**: `boolean`

Allow trailing commas in JSON

##### encoding?

> `readonly` `optional` **encoding**: `BufferEncoding`

File encoding

###### Inherited from

[`DataConfig`](#dataconfig).[`encoding`](#encoding-1)

##### maxSize?

> `readonly` `optional` **maxSize**: `number`

Maximum file size in bytes

###### Inherited from

[`DataConfig`](#dataconfig).[`maxSize`](#maxsize-2)

##### replacer()?

> `readonly` `optional` **replacer**: (`key`, `value`) => `any`

JSON.stringify replacer function

###### Parameters

###### key

`string`

###### value

`any`

###### Returns

`any`

##### reviver()?

> `readonly` `optional` **reviver**: (`key`, `value`) => `any`

JSON.parse reviver function

###### Parameters

###### key

`string`

###### value

`any`

###### Returns

`any`

##### space?

> `readonly` `optional` **space**: `string` \| `number`

JSON.stringify indentation

##### timeout?

> `readonly` `optional` **timeout**: `number`

Operation timeout in milliseconds

###### Inherited from

[`DataConfig`](#dataconfig).[`timeout`](#timeout-2)

---

### JSONFormatOptions

#### Properties

##### indent?

> `readonly` `optional` **indent**: `number`

##### maxLineLength?

> `readonly` `optional` **maxLineLength**: `number`

##### preserveArrays?

> `readonly` `optional` **preserveArrays**: `boolean`

##### sortArrays?

> `readonly` `optional` **sortArrays**: `boolean` \| (`a`, `b`) => `number`

##### sortKeys?

> `readonly` `optional` **sortKeys**: `boolean` \| `"asc"` \| `"desc"` \| (`a`, `b`) => `number`

---

### JSONMinifyOptions

#### Properties

##### preserveComments?

> `readonly` `optional` **preserveComments**: `boolean`

##### preserveNewlines?

> `readonly` `optional` **preserveNewlines**: `boolean`

---

### JSONOperations

#### Properties

##### format()

> `readonly` **format**: (`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>

###### Parameters

###### data

`string`

###### options?

###### indent?

`number`

###### sortKeys?

`boolean`

###### Returns

[`DataResult`](#dataresult)\<`string`\>

##### minify()

> `readonly` **minify**: (`data`) => [`DataResult`](#dataresult)\<`string`\>

###### Parameters

###### data

`string`

###### Returns

[`DataResult`](#dataresult)\<`string`\>

##### parseFile

> `readonly` **parseFile**: [`ParseFileOperation`](#parsefileoperation)\<`any`, [`JSONProcessingOptions`](#jsonprocessingoptions)\>

##### parseString

> `readonly` **parseString**: [`ParseOperation`](#parseoperation)\<`any`, [`JSONProcessingOptions`](#jsonprocessingoptions)\>

##### stringify

> `readonly` **stringify**: [`StringifyOperation`](#stringifyoperation)\<`any`, [`JSONProcessingOptions`](#jsonprocessingoptions)\>

##### validate

> `readonly` **validate**: `ValidateStringOperation`

##### writeFile

> `readonly` **writeFile**: [`WriteFileOperation`](#writefileoperation)\<`any`, [`JSONProcessingOptions`](#jsonprocessingoptions)\>

---

### JSONProcessingOptions

Base processing options for all data operations
ProcessingOptions

#### Extends

- [`ProcessingOptions`](#processingoptions)

#### Properties

##### allowComments?

> `readonly` `optional` **allowComments**: `boolean`

##### allowSingleQuotes?

> `readonly` `optional` **allowSingleQuotes**: `boolean`

##### allowTrailingCommas?

> `readonly` `optional` **allowTrailingCommas**: `boolean`

##### allowUnquotedKeys?

> `readonly` `optional` **allowUnquotedKeys**: `boolean`

##### autoTrim?

> `readonly` `optional` **autoTrim**: `boolean`

Automatically trim whitespace

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`autoTrim`](#autotrim-3)

##### errorTolerant?

> `readonly` `optional` **errorTolerant**: `boolean`

Continue on errors

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`errorTolerant`](#errortolerant-3)

##### maxRows?

> `readonly` `optional` **maxRows**: `number`

Maximum number of rows to process

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`maxRows`](#maxrows-3)

##### onError()?

> `readonly` `optional` **onError**: (`error`, `context?`) => `void`

Error callback handler

###### Parameters

###### error

[`CoreError`](@trailhead.cli.md#coreerror)

###### context?

`Record`\<`string`, `unknown`\>

###### Returns

`void`

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`onError`](#onerror-3)

##### replacer()?

> `readonly` `optional` **replacer**: (`key`, `value`) => `any`

###### Parameters

###### key

`string`

###### value

`any`

###### Returns

`any`

##### reviver()?

> `readonly` `optional` **reviver**: (`key`, `value`) => `any`

###### Parameters

###### key

`string`

###### value

`any`

###### Returns

`any`

##### skipEmptyLines?

> `readonly` `optional` **skipEmptyLines**: `boolean`

Skip empty lines

###### Inherited from

[`ProcessingOptions`](#processingoptions).[`skipEmptyLines`](#skipemptylines-5)

##### space?

> `readonly` `optional` **space**: `string` \| `number`

---

### JSONStringifyOptions

#### Properties

##### replacer()?

> `readonly` `optional` **replacer**: (`key`, `value`) => `any`

###### Parameters

###### key

`string`

###### value

`any`

###### Returns

`any`

##### skipNull?

> `readonly` `optional` **skipNull**: `boolean`

##### skipUndefined?

> `readonly` `optional` **skipUndefined**: `boolean`

##### sortKeys?

> `readonly` `optional` **sortKeys**: `boolean`

##### space?

> `readonly` `optional` **space**: `string` \| `number`

---

### MimeConfig

Configuration for MIME type operations

#### Extends

- [`FormatConfig`](#formatconfig)

#### Properties

##### charset?

> `readonly` `optional` **charset**: `string`

Default character set (e.g., 'utf-8')

##### defaultMimeType?

> `readonly` `optional` **defaultMimeType**: `string`

Fallback MIME type for unknown formats

##### enableExtensionFallback?

> `readonly` `optional` **enableExtensionFallback**: `boolean`

Fall back to extension-based detection

###### Inherited from

[`FormatConfig`](#formatconfig).[`enableExtensionFallback`](#enableextensionfallback-2)

##### maxSize?

> `readonly` `optional` **maxSize**: `number`

Maximum file size in bytes

###### Inherited from

[`FormatConfig`](#formatconfig).[`maxSize`](#maxsize-5)

##### strictMode?

> `readonly` `optional` **strictMode**: `boolean`

Enable strict validation mode

###### Inherited from

[`FormatConfig`](#formatconfig).[`strictMode`](#strictmode-2)

##### timeout?

> `readonly` `optional` **timeout**: `number`

Operation timeout in milliseconds

###### Inherited from

[`FormatConfig`](#formatconfig).[`timeout`](#timeout-5)

---

### MimeOperations

Interface for MIME type operations
Provides methods to work with MIME types and file extensions

#### Properties

##### getExtensions

> `readonly` **getExtensions**: `GetExtensionsOp`

##### getMimeType

> `readonly` **getMimeType**: `GetMimeTypeOp`

##### isMimeType

> `readonly` **isMimeType**: `IsMimeTypeOp`

##### normalizeMimeType()

> `readonly` **normalizeMimeType**: (`mimeType`) => [`FormatResult`](#formatresult)\<`string`\>

###### Parameters

###### mimeType

`string`

###### Returns

[`FormatResult`](#formatresult)\<`string`\>

##### parseMimeType()

> `readonly` **parseMimeType**: (`mimeType`) => [`FormatResult`](#formatresult)\<[`MimeTypeInfo`](#mimetypeinfo)\>

###### Parameters

###### mimeType

`string`

###### Returns

[`FormatResult`](#formatresult)\<[`MimeTypeInfo`](#mimetypeinfo)\>

---

### MimeTypeInfo

Parsed MIME type information

#### Properties

##### category

> `readonly` **category**: `FileCategory`

File category classification

##### charset?

> `readonly` `optional` **charset**: `string`

Character set if applicable

##### compressible

> `readonly` **compressible**: `boolean`

Whether content is compressible

##### extensions

> `readonly` **extensions**: readonly `string`[]

Associated file extensions

##### full

> `readonly` **full**: `string`

Full MIME type string

##### subtype

> `readonly` **subtype**: `string`

Subtype (e.g., 'json', 'png')

##### type

> `readonly` **type**: `string`

Primary type (e.g., 'application', 'image')

---

### ProcessingOptions

Base processing options for all data operations
ProcessingOptions

#### Extended by

- [`CSVProcessingOptions`](#csvprocessingoptions)
- [`JSONProcessingOptions`](#jsonprocessingoptions)
- [`ExcelProcessingOptions`](#excelprocessingoptions)

#### Properties

##### autoTrim?

> `readonly` `optional` **autoTrim**: `boolean`

Automatically trim whitespace

##### errorTolerant?

> `readonly` `optional` **errorTolerant**: `boolean`

Continue on errors

##### maxRows?

> `readonly` `optional` **maxRows**: `number`

Maximum number of rows to process

##### onError()?

> `readonly` `optional` **onError**: (`error`, `context?`) => `void`

Error callback handler

###### Parameters

###### error

[`CoreError`](@trailhead.cli.md#coreerror)

###### context?

`Record`\<`string`, `unknown`\>

###### Returns

`void`

##### skipEmptyLines?

> `readonly` `optional` **skipEmptyLines**: `boolean`

Skip empty lines

---

### UnifiedDataConfig

Configuration for unified data operations
UnifiedDataConfig

#### Example

```typescript
const config: UnifiedDataConfig = {
  csv: { delimiter: ',', header: true },
  excel: { sheet: 0, raw: false },
  autoDetect: true,
  defaultFormat: 'json',
}
```

#### Properties

##### autoDetect?

> `optional` **autoDetect**: `boolean`

Enable automatic format detection

##### csv?

> `optional` **csv**: [`DataConfig`](#dataconfig)

CSV-specific configuration options

##### defaultFormat?

> `optional` **defaultFormat**: `"csv"` \| `"json"` \| `"excel"`

Default format when detection fails

##### detection?

> `optional` **detection**: [`FormatConfig`](#formatconfig)

Format detection configuration

##### excel?

> `optional` **excel**: [`DataConfig`](#dataconfig)

Excel-specific configuration options

##### json?

> `optional` **json**: [`DataConfig`](#dataconfig)

JSON-specific configuration options

##### mime?

> `optional` **mime**: [`FormatConfig`](#formatconfig)

MIME type detection configuration

---

### UnifiedDataOperations

Unified interface for all data operations with automatic format detection
UnifiedDataOperations

#### Properties

##### convertFormat()

> **convertFormat**: (`data`, `targetFormat`) => `Result`\<`string`, [`CoreError`](@trailhead.cli.md#coreerror)\>

Convert data to specified format

###### Parameters

###### data

`any`

Data to convert

###### targetFormat

Target format

`"csv"` | `"json"` | `"excel"`

###### Returns

`Result`\<`string`, [`CoreError`](@trailhead.cli.md#coreerror)\>

Converted content string

##### detectFormat()

> **detectFormat**: (`filePath`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`Result`\<`string`, [`CoreError`](@trailhead.cli.md#coreerror)\>\>

Detect file format without parsing

###### Parameters

###### filePath

`string`

Path to file

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`Result`\<`string`, [`CoreError`](@trailhead.cli.md#coreerror)\>\>

Detected MIME type

##### detectFormatFromContent()

> **detectFormatFromContent**: (`content`, `fileName?`) => `Result`\<`string`, [`CoreError`](@trailhead.cli.md#coreerror)\>

Detect format from content without parsing

###### Parameters

###### content

`string`

Content to analyze

###### fileName?

`string`

Optional filename hint

###### Returns

`Result`\<`string`, [`CoreError`](@trailhead.cli.md#coreerror)\>

Detected format type

##### parseAuto()

> **parseAuto**: (`filePath`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`any`\>\>

Parse a file with automatic format detection

###### Parameters

###### filePath

`string`

Path to the file to parse

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`any`\>\>

Parsed data with format information

###### Example

```typescript
const result = await data.parseAuto('data.csv')
if (result.isOk()) {
  console.log(result.value.data) // Parsed data array
}
```

##### parseAutoFromContent()

> **parseAutoFromContent**: (`content`, `fileName?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`any`\>\>

Parse content string with automatic format detection

###### Parameters

###### content

`string`

Content to parse

###### fileName?

`string`

Optional filename hint for format detection

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`any`\>\>

Parsed data with format information

##### parseCSV()

> **parseCSV**: \<`T`\>(`filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>\>

Parse CSV file directly

###### Type Parameters

###### T

`T` = `Record`\<`string`, `unknown`\>

###### Parameters

###### filePath

`string`

###### options?

[`CSVProcessingOptions`](#csvprocessingoptions)

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>\>

##### parseCSVFromContent()

> **parseCSVFromContent**: \<`T`\>(`data`, `options?`) => [`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>

Parse CSV from string content

###### Type Parameters

###### T

`T` = `Record`\<`string`, `unknown`\>

###### Parameters

###### data

`string`

###### options?

[`CSVProcessingOptions`](#csvprocessingoptions)

###### Returns

[`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>

##### parseExcel

> **parseExcel**: [`ParseFileOperation`](#parsefileoperation)\<`any`[], [`ExcelProcessingOptions`](#excelprocessingoptions)\>

Parse Excel file directly

##### parseExcelFromContent()

> **parseExcelFromContent**: (`buffer`, `options?`) => [`DataResult`](#dataresult)\<`any`[]\>

Parse Excel from buffer content

###### Parameters

###### buffer

`Buffer`

###### options?

[`ExcelProcessingOptions`](#excelprocessingoptions)

###### Returns

[`DataResult`](#dataresult)\<`any`[]\>

##### parseJSON

> **parseJSON**: [`ParseFileOperation`](#parsefileoperation)\<`any`, [`JSONProcessingOptions`](#jsonprocessingoptions)\>

Parse JSON file directly

##### parseJSONFromContent

> **parseJSONFromContent**: [`ParseOperation`](#parseoperation)\<`any`, [`JSONProcessingOptions`](#jsonprocessingoptions)\>

Parse JSON from string content

##### writeAuto()

> **writeAuto**: (`filePath`, `data`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`Result`\<`void`, [`CoreError`](@trailhead.cli.md#coreerror)\>\>

Write data to file with format determined by file extension

###### Parameters

###### filePath

`string`

Output file path

###### data

`any`

Data to write (arrays for CSV/Excel, any for JSON)

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`Result`\<`void`, [`CoreError`](@trailhead.cli.md#coreerror)\>\>

Success or error result

## Type Aliases

### CreateConversionOperations()

> **CreateConversionOperations** = (`config?`) => [`ConversionOperations`](#conversionoperations)

Factory function type for creating conversion operations

#### Parameters

##### config?

[`ConversionConfig`](#conversionconfig)

#### Returns

[`ConversionOperations`](#conversionoperations)

---

### CreateCSVOperations()

> **CreateCSVOperations** = (`config?`) => [`CSVOperations`](#csvoperations)

#### Parameters

##### config?

[`CSVConfig`](#csvconfig)

#### Returns

[`CSVOperations`](#csvoperations)

---

### CreateDetectionOperations()

> **CreateDetectionOperations** = (`config?`) => [`DetectionOperations`](#detectionoperations)

Factory function type for creating detection operations

#### Parameters

##### config?

[`DetectionConfig`](#detectionconfig)

#### Returns

[`DetectionOperations`](#detectionoperations)

---

### CreateExcelOperations()

> **CreateExcelOperations** = (`config?`) => [`ExcelOperations`](#exceloperations)

#### Parameters

##### config?

[`ExcelConfig`](#excelconfig)

#### Returns

[`ExcelOperations`](#exceloperations)

---

### CreateJSONOperations()

> **CreateJSONOperations** = (`config?`) => [`JSONOperations`](#jsonoperations)

#### Parameters

##### config?

[`JSONConfig`](#jsonconfig)

#### Returns

[`JSONOperations`](#jsonoperations)

---

### CreateMimeOperations()

> **CreateMimeOperations** = (`config?`) => [`MimeOperations`](#mimeoperations)

Factory function type for creating MIME operations

#### Parameters

##### config?

[`MimeConfig`](#mimeconfig)

#### Returns

[`MimeOperations`](#mimeoperations)

---

### CSVConfigProvider()

> **CSVConfigProvider** = () => [`CSVConfig`](#csvconfig)

#### Returns

[`CSVConfig`](#csvconfig)

---

### CSVDetectFormatFunction()

> **CSVDetectFormatFunction** = (`data`) => [`DataResult`](#dataresult)\<[`CSVFormatInfo`](#csvformatinfo)\>

#### Parameters

##### data

`string`

#### Returns

[`DataResult`](#dataresult)\<[`CSVFormatInfo`](#csvformatinfo)\>

---

### CSVParseFileFunction()

> **CSVParseFileFunction** = \<`T`\>(`filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>\>

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

#### Parameters

##### filePath

`string`

##### options?

[`CSVProcessingOptions`](#csvprocessingoptions)

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>\>

---

### CSVParseFunction()

> **CSVParseFunction** = \<`T`\>(`data`, `options?`) => [`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

#### Parameters

##### data

`string`

##### options?

[`CSVProcessingOptions`](#csvprocessingoptions)

#### Returns

[`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>

---

### CSVStringifyFunction()

> **CSVStringifyFunction** = \<`T`\>(`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

#### Parameters

##### data

readonly `T`[]

##### options?

[`CSVProcessingOptions`](#csvprocessingoptions)

#### Returns

[`DataResult`](#dataresult)\<`string`\>

---

### CSVValidateFunction()

> **CSVValidateFunction** = (`data`) => [`DataResult`](#dataresult)\<`boolean`\>

#### Parameters

##### data

`string`

#### Returns

[`DataResult`](#dataresult)\<`boolean`\>

---

### CSVWriteFileFunction()

> **CSVWriteFileFunction** = \<`T`\>(`data`, `filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

#### Type Parameters

##### T

`T` = `Record`\<`string`, `unknown`\>

#### Parameters

##### data

readonly `T`[]

##### filePath

`string`

##### options?

[`CSVProcessingOptions`](#csvprocessingoptions)

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

---

### DataResult

> **DataResult**\<`T`\> = `Result`\<`T`, [`CoreError`](@trailhead.cli.md#coreerror)\>

Standard Result type for all data operations

#### Type Parameters

##### T

`T`

Success value type

---

### ExcelConfigProvider()

> **ExcelConfigProvider** = () => [`ExcelConfig`](#excelconfig)

#### Returns

[`ExcelConfig`](#excelconfig)

---

### ExcelDetectFormatFunction()

> **ExcelDetectFormatFunction** = (`buffer`) => [`DataResult`](#dataresult)\<[`ExcelFormatInfo`](#excelformatinfo)\>

#### Parameters

##### buffer

`Buffer`

#### Returns

[`DataResult`](#dataresult)\<[`ExcelFormatInfo`](#excelformatinfo)\>

---

### ExcelParseBufferFunction()

> **ExcelParseBufferFunction** = (`buffer`, `options?`) => [`DataResult`](#dataresult)\<`any`[]\>

#### Parameters

##### buffer

`Buffer`

##### options?

[`ExcelProcessingOptions`](#excelprocessingoptions)

#### Returns

[`DataResult`](#dataresult)\<`any`[]\>

---

### ExcelParseFileFunction()

> **ExcelParseFileFunction** = (`filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`any`[]\>\>

#### Parameters

##### filePath

`string`

##### options?

[`ExcelProcessingOptions`](#excelprocessingoptions)

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`any`[]\>\>

---

### ExcelStringifyFunction()

> **ExcelStringifyFunction** = (`data`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\>\>

#### Parameters

##### data

`any`[]

##### options?

[`ExcelProcessingOptions`](#excelprocessingoptions)

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\>\>

---

### ExcelValidateFunction()

> **ExcelValidateFunction** = (`buffer`) => [`DataResult`](#dataresult)\<`boolean`\>

#### Parameters

##### buffer

`Buffer`

#### Returns

[`DataResult`](#dataresult)\<`boolean`\>

---

### ExcelWriteFileFunction()

> **ExcelWriteFileFunction** = (`data`, `filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

#### Parameters

##### data

`any`[]

##### filePath

`string`

##### options?

[`ExcelProcessingOptions`](#excelprocessingoptions)

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

---

### FormatResult

> **FormatResult**\<`T`\> = `Result`\<`T`, [`CoreError`](@trailhead.cli.md#coreerror)\>

Standard Result type for format operations

#### Type Parameters

##### T

`T`

Success value type

---

### JSONConfigProvider()

> **JSONConfigProvider** = () => [`JSONConfig`](#jsonconfig)

#### Returns

[`JSONConfig`](#jsonconfig)

---

### JSONFormatFunction()

> **JSONFormatFunction** = (`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>

#### Parameters

##### data

`string`

##### options?

[`JSONFormatOptions`](#jsonformatoptions)

#### Returns

[`DataResult`](#dataresult)\<`string`\>

---

### JSONMinifyFunction()

> **JSONMinifyFunction** = (`data`) => [`DataResult`](#dataresult)\<`string`\>

#### Parameters

##### data

`string`

#### Returns

[`DataResult`](#dataresult)\<`string`\>

---

### JSONParseFileFunction()

> **JSONParseFileFunction** = (`filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`any`\>\>

#### Parameters

##### filePath

`string`

##### options?

[`JSONProcessingOptions`](#jsonprocessingoptions)

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`any`\>\>

---

### JSONParseFunction()

> **JSONParseFunction** = (`data`, `options?`) => [`DataResult`](#dataresult)\<`any`\>

#### Parameters

##### data

`string`

##### options?

[`JSONProcessingOptions`](#jsonprocessingoptions)

#### Returns

[`DataResult`](#dataresult)\<`any`\>

---

### JSONStringifyFunction()

> **JSONStringifyFunction** = (`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>

#### Parameters

##### data

`any`

##### options?

[`JSONProcessingOptions`](#jsonprocessingoptions)

#### Returns

[`DataResult`](#dataresult)\<`string`\>

---

### JSONValidateFunction()

> **JSONValidateFunction** = (`data`) => [`DataResult`](#dataresult)\<`boolean`\>

#### Parameters

##### data

`string`

#### Returns

[`DataResult`](#dataresult)\<`boolean`\>

---

### JSONWriteFileFunction()

> **JSONWriteFileFunction** = (`data`, `filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

#### Parameters

##### data

`any`

##### filePath

`string`

##### options?

[`JSONProcessingOptions`](#jsonprocessingoptions)

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

---

### ParseFileOperation()

> **ParseFileOperation**\<`T`, `O`\> = (`filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`T`\>\>

Function type for parsing file data

#### Type Parameters

##### T

`T`

Output data type

##### O

`O` = [`ProcessingOptions`](#processingoptions)

Options type

#### Parameters

##### filePath

`string`

Path to file

##### options?

`O`

Parsing options

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`T`\>\>

Async parsed result or error

---

### ParseOperation()

> **ParseOperation**\<`T`, `O`\> = (`data`, `options?`) => [`DataResult`](#dataresult)\<`T`\>

Function type for parsing string data

#### Type Parameters

##### T

`T`

Output data type

##### O

`O` = [`ProcessingOptions`](#processingoptions)

Options type

#### Parameters

##### data

`string`

Data to parse

##### options?

`O`

Parsing options

#### Returns

[`DataResult`](#dataresult)\<`T`\>

Parsed result or error

---

### StringifyOperation()

> **StringifyOperation**\<`T`, `O`\> = (`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>

Function type for stringifying data

#### Type Parameters

##### T

`T`

Input data type

##### O

`O` = [`ProcessingOptions`](#processingoptions)

Options type

#### Parameters

##### data

`T`

Data to stringify

##### options?

`O`

Stringify options

#### Returns

[`DataResult`](#dataresult)\<`string`\>

Stringified result or error

---

### ValidateOperation()

> **ValidateOperation** = (`data`) => [`DataResult`](#dataresult)\<`boolean`\>

Validation function for string or buffer data

#### Parameters

##### data

`string` | `Buffer`

#### Returns

[`DataResult`](#dataresult)\<`boolean`\>

---

### WriteFileOperation()

> **WriteFileOperation**\<`T`, `O`\> = (`data`, `filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

Function type for writing data to file

#### Type Parameters

##### T

`T`

Input data type

##### O

`O` = [`ProcessingOptions`](#processingoptions)

Options type

#### Parameters

##### data

`T`

Data to write

##### filePath

`string`

Output file path

##### options?

`O`

Write options

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

Async write result or error

## Variables

### COMMON_MIME_TYPES

> `const` **COMMON_MIME_TYPES**: `object`

Common MIME type string constants organized by category

Provides type-safe constants for frequently used MIME types to avoid
string literals and typos in application code.

#### Type Declaration

##### AVI

> `readonly` **AVI**: `"video/x-msvideo"` = `'video/x-msvideo'`

##### BINARY

> `readonly` **BINARY**: `"application/octet-stream"` = `'application/octet-stream'`

##### BMP

> `readonly` **BMP**: `"image/bmp"` = `'image/bmp'`

##### CSS

> `readonly` **CSS**: `"text/css"` = `'text/css'`

##### CSV

> `readonly` **CSV**: `"text/csv"` = `'text/csv'`

##### DOC

> `readonly` **DOC**: `"application/msword"` = `'application/msword'`

##### DOCX

> `readonly` **DOCX**: `"application/vnd.openxmlformats-officedocument.wordprocessingml.document"` = `'application/vnd.openxmlformats-officedocument.wordprocessingml.document'`

##### FLAC

> `readonly` **FLAC**: `"audio/flac"` = `'audio/flac'`

##### FORM

> `readonly` **FORM**: `"application/x-www-form-urlencoded"` = `'application/x-www-form-urlencoded'`

##### GIF

> `readonly` **GIF**: `"image/gif"` = `'image/gif'`

##### GZIP

> `readonly` **GZIP**: `"application/gzip"` = `'application/gzip'`

##### HTML

> `readonly` **HTML**: `"text/html"` = `'text/html'`

##### ICO

> `readonly` **ICO**: `"image/x-icon"` = `'image/x-icon'`

##### JPEG

> `readonly` **JPEG**: `"image/jpeg"` = `'image/jpeg'`

##### JS

> `readonly` **JS**: `"application/javascript"` = `'application/javascript'`

##### JSON

> `readonly` **JSON**: `"application/json"` = `'application/json'`

##### M4A

> `readonly` **M4A**: `"audio/mp4"` = `'audio/mp4'`

##### MKV

> `readonly` **MKV**: `"video/x-matroska"` = `'video/x-matroska'`

##### MOV

> `readonly` **MOV**: `"video/quicktime"` = `'video/quicktime'`

##### MP3

> `readonly` **MP3**: `"audio/mpeg"` = `'audio/mpeg'`

##### MP4

> `readonly` **MP4**: `"video/mp4"` = `'video/mp4'`

##### MULTIPART

> `readonly` **MULTIPART**: `"multipart/form-data"` = `'multipart/form-data'`

##### OGG

> `readonly` **OGG**: `"audio/ogg"` = `'audio/ogg'`

##### PDF

> `readonly` **PDF**: `"application/pdf"` = `'application/pdf'`

##### PNG

> `readonly` **PNG**: `"image/png"` = `'image/png'`

##### PPT

> `readonly` **PPT**: `"application/vnd.ms-powerpoint"` = `'application/vnd.ms-powerpoint'`

##### PPTX

> `readonly` **PPTX**: `"application/vnd.openxmlformats-officedocument.presentationml.presentation"` = `'application/vnd.openxmlformats-officedocument.presentationml.presentation'`

##### RAR

> `readonly` **RAR**: `"application/vnd.rar"` = `'application/vnd.rar'`

##### SEVENZ

> `readonly` **SEVENZ**: `"application/x-7z-compressed"` = `'application/x-7z-compressed'`

##### SVG

> `readonly` **SVG**: `"image/svg+xml"` = `'image/svg+xml'`

##### TAR

> `readonly` **TAR**: `"application/x-tar"` = `'application/x-tar'`

##### TEXT

> `readonly` **TEXT**: `"text/plain"` = `'text/plain'`

##### TIFF

> `readonly` **TIFF**: `"image/tiff"` = `'image/tiff'`

##### WAV

> `readonly` **WAV**: `"audio/wav"` = `'audio/wav'`

##### WEBM

> `readonly` **WEBM**: `"video/webm"` = `'video/webm'`

##### WEBP

> `readonly` **WEBP**: `"image/webp"` = `'image/webp'`

##### XLS

> `readonly` **XLS**: `"application/vnd.ms-excel"` = `'application/vnd.ms-excel'`

##### XLSX

> `readonly` **XLSX**: `"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"` = `'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'`

##### XML

> `readonly` **XML**: `"application/xml"` = `'application/xml'`

##### YAML

> `readonly` **YAML**: `"application/x-yaml"` = `'application/x-yaml'`

##### ZIP

> `readonly` **ZIP**: `"application/zip"` = `'application/zip'`

---

### CONVERSION_CATEGORIES

> `const` **CONVERSION_CATEGORIES**: `object`

Format categories with supported formats for each category

Used to determine conversion compatibility and available formats
within each category (image, video, audio, document, etc.).

#### Type Declaration

##### ARCHIVE

> `readonly` **ARCHIVE**: readonly \[`"zip"`, `"rar"`, `"7z"`, `"tar"`, `"gz"`, `"bz2"`\]

##### AUDIO

> `readonly` **AUDIO**: readonly \[`"mp3"`, `"wav"`, `"flac"`, `"aac"`, `"ogg"`, `"m4a"`\]

##### DATA

> `readonly` **DATA**: readonly \[`"json"`, `"xml"`, `"yaml"`, `"toml"`, `"csv"`, `"tsv"`\]

##### DOCUMENT_OFFICE

> `readonly` **DOCUMENT_OFFICE**: readonly \[`"doc"`, `"docx"`, `"odt"`, `"pdf"`\]

##### DOCUMENT_TEXT

> `readonly` **DOCUMENT_TEXT**: readonly \[`"txt"`, `"rtf"`, `"md"`, `"html"`, `"tex"`\]

##### IMAGE_RASTER

> `readonly` **IMAGE_RASTER**: readonly \[`"jpg"`, `"jpeg"`, `"png"`, `"bmp"`, `"tiff"`, `"webp"`, `"gif"`\]

##### IMAGE_VECTOR

> `readonly` **IMAGE_VECTOR**: readonly \[`"svg"`, `"eps"`, `"ai"`, `"pdf"`\]

##### PRESENTATION

> `readonly` **PRESENTATION**: readonly \[`"ppt"`, `"pptx"`, `"odp"`, `"pdf"`\]

##### SPREADSHEET

> `readonly` **SPREADSHEET**: readonly \[`"xls"`, `"xlsx"`, `"ods"`, `"csv"`\]

##### VIDEO

> `readonly` **VIDEO**: readonly \[`"mp4"`, `"avi"`, `"mov"`, `"wmv"`, `"flv"`, `"webm"`, `"mkv"`\]

---

### createConversionOperations

> `const` **createConversionOperations**: [`CreateConversionOperations`](#createconversionoperations)

Creates conversion operations for checking format compatibility and conversion chains.
Provides utilities to determine if conversions are supported and estimate quality loss.

#### Param

Optional conversion configuration (currently unused)

#### Returns

Conversion operations interface with format compatibility checks

---

### createCSVOperations

> `const` **createCSVOperations**: [`CreateCSVOperations`](#createcsvoperations)

Create CSV operations with custom configuration

#### Param

CSV configuration options

#### Returns

Configured CSV operations object

#### Examples

```typescript
const csvOps = createCSVOperations()
const result = await csvOps.parseFile('data.csv')
```

```typescript
const csvOps = createCSVOperations({
  delimiter: ';',
  hasHeader: true,
  dynamicTyping: true,
})
```

---

### createDetectionOperations

> `const` **createDetectionOperations**: [`CreateDetectionOperations`](#createdetectionoperations)

Creates detection operations for identifying file formats from various sources.
Supports detection from buffers, files, extensions, and MIME types with configurable reliability.

#### Param

Optional detection configuration for magic number and extension detection

#### Returns

Detection operations interface with format identification methods

---

### createExcelOperations

> `const` **createExcelOperations**: [`CreateExcelOperations`](#createexceloperations)

Create Excel operations with custom configuration

#### Param

Excel configuration options

#### Returns

Configured Excel operations object

#### Examples

```typescript
const excelOps = createExcelOperations()
const result = await excelOps.parseFile('data.xlsx')
```

```typescript
const excelOps = createExcelOperations({
  worksheetName: 'Summary',
  hasHeader: true,
  cellDates: true,
})
```

---

### createJSONOperations

> `const` **createJSONOperations**: [`CreateJSONOperations`](#createjsonoperations)

Create JSON operations with custom configuration

#### Param

JSON configuration options

#### Returns

Configured JSON operations object

#### Examples

```typescript
const jsonOps = createJSONOperations()
const result = await jsonOps.parseFile('config.json')
```

```typescript
const jsonOps = createJSONOperations({
  reviver: (key, value) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return new Date(value)
    }
    return value
  },
})
```

---

### createMimeOperations

> `const` **createMimeOperations**: [`CreateMimeOperations`](#createmimeoperations)

Creates MIME type operations for working with MIME types and file extensions

Provides a complete interface for MIME type detection, extension resolution,
category checking, normalization, and parsing. Uses the mime-types library
for extension-based detection.

#### Param

Optional MIME configuration overrides

#### Returns

MimeOperations interface with all MIME type methods

#### Example

```typescript
const mimeOps = createMimeOperations({ strictMode: true })

// Get MIME type from file path
const result = mimeOps.getMimeType('document.pdf')
if (result.isOk()) {
  console.log(result.value.full) // 'application/pdf'
}

// Get extensions for MIME type
const exts = mimeOps.getExtensions('image/jpeg')
if (exts.isOk()) {
  console.log(exts.value) // ['jpeg', 'jpg']
}
```

---

### data

> `const` **data**: [`UnifiedDataOperations`](#unifieddataoperations)

Default data operations instance with standard configuration

Pre-configured with:

- Auto-detection enabled
- JSON as default format
- Standard CSV/JSON/Excel settings

#### Example

```typescript
import { data } from '@trailhead/data'

// Parse any supported format
const result = await data.parseAuto('report.xlsx')

// Write with auto-format detection
await data.writeAuto('output.json', processedData)
```

---

### defaultCSVConfig

> `const` `readonly` **defaultCSVConfig**: [`Required`](https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype)\<[`CSVConfig`](#csvconfig)\>

Default configuration for CSV operations

---

### defaultExcelConfig

> `const` `readonly` **defaultExcelConfig**: [`Required`](https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype)\<`Omit`\<[`ExcelConfig`](#excelconfig), `"worksheetName"` \| `"range"`\>\> & `Pick`\<[`ExcelConfig`](#excelconfig), `"worksheetName"` \| `"range"`\>

Default configuration for Excel operations

---

### defaultJSONConfig

> `const` `readonly` **defaultJSONConfig**: [`Required`](https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype)\<`Omit`\<[`JSONConfig`](#jsonconfig), `"reviver"` \| `"replacer"` \| `"space"`\>\> & `Pick`\<[`JSONConfig`](#jsonconfig), `"reviver"` \| `"replacer"` \| `"space"`\>

Default configuration for JSON operations

---

### MIME_TYPE_CATEGORIES

> `const` **MIME_TYPE_CATEGORIES**: `Record`\<`FileCategory`, readonly `string`[]\>

Mapping of file categories to their associated MIME types

Used for category-based filtering and classification of MIME types.

---

### QUALITY_DEFINITIONS

> `const` **QUALITY_DEFINITIONS**: `Record`\<`ConversionQuality`, \{ `dataLoss`: `boolean`; `description`: `string`; `fidelity`: `number`; \}\>

Quality level definitions with fidelity and data loss information

Provides metadata about each conversion quality level to help
users understand the implications of format conversions.

## Functions

### createConversionError()

> **createConversionError**(`message`, `options?`): [`CoreError`](@trailhead.cli.md#coreerror)

Create a conversion error for format conversion failures

#### Parameters

##### message

`string`

Error message describing the issue

##### options?

Additional error options

###### cause?

`unknown`

Original error that caused this error

###### context?

`Record`\<`string`, `unknown`\>

Additional context data

###### details?

`string`

Detailed error information

#### Returns

[`CoreError`](@trailhead.cli.md#coreerror)

Standardized conversion error object

#### Example

```typescript
throw createConversionError('Cannot convert Excel to CSV', {
  details: 'Multiple worksheets found, specify which to convert',
  context: { sourceFormat: 'excel', targetFormat: 'csv', sheets: ['Sheet1', 'Sheet2'] },
})
```

---

### createCSVError()

> **createCSVError**(`message`, `options?`): [`CoreError`](@trailhead.cli.md#coreerror)

Create a CSV-specific error with appropriate context

#### Parameters

##### message

`string`

Error message describing the issue

##### options?

Additional error options

###### cause?

`unknown`

Original error that caused this error

###### context?

`Record`\<`string`, `unknown`\>

Additional context data

###### details?

`string`

Detailed error information

#### Returns

[`CoreError`](@trailhead.cli.md#coreerror)

Standardized CSV error object

#### Example

```typescript
throw createCSVError('Invalid delimiter in CSV file', {
  details: 'Expected comma but found semicolon',
  context: { line: 5, column: 3 },
})
```

---

### createExcelError()

> **createExcelError**(`message`, `options?`): [`CoreError`](@trailhead.cli.md#coreerror)

Create an Excel-specific error with appropriate context

#### Parameters

##### message

`string`

Error message describing the issue

##### options?

Additional error options

###### cause?

`unknown`

Original error that caused this error

###### context?

`Record`\<`string`, `unknown`\>

Additional context data

###### details?

`string`

Detailed error information

#### Returns

[`CoreError`](@trailhead.cli.md#coreerror)

Standardized Excel error object

#### Example

```typescript
throw createExcelError('Worksheet not found', {
  details: 'Sheet "Summary" does not exist',
  context: { requestedSheet: 'Summary', availableSheets: ['Sheet1', 'Sheet2'] },
})
```

---

### createFormatDetectionError()

> **createFormatDetectionError**(`message`, `options?`): [`CoreError`](@trailhead.cli.md#coreerror)

Create a format detection error when format cannot be determined

#### Parameters

##### message

`string`

Error message describing the issue

##### options?

Additional error options

###### cause?

`unknown`

Original error that caused this error

###### context?

`Record`\<`string`, `unknown`\>

Additional context data

###### details?

`string`

Detailed error information

#### Returns

[`CoreError`](@trailhead.cli.md#coreerror)

Standardized format detection error object

#### Example

```typescript
throw createFormatDetectionError('Cannot detect file format', {
  details: 'File has no extension and content is ambiguous',
  context: { fileName: 'data', contentSample: '...' },
})
```

---

### createJSONError()

> **createJSONError**(`message`, `options?`): [`CoreError`](@trailhead.cli.md#coreerror)

Create a JSON-specific error with appropriate context

#### Parameters

##### message

`string`

Error message describing the issue

##### options?

Additional error options

###### cause?

`unknown`

Original error that caused this error

###### context?

`Record`\<`string`, `unknown`\>

Additional context data

###### details?

`string`

Detailed error information

#### Returns

[`CoreError`](@trailhead.cli.md#coreerror)

Standardized JSON error object

#### Example

```typescript
throw createJSONError('Invalid JSON syntax', {
  details: 'Unexpected token at position 42',
  context: { position: 42, char: '}' },
})
```

---

### createParsingError()

> **createParsingError**(`message`, `options?`): [`CoreError`](@trailhead.cli.md#coreerror)

Create a parsing error for any format parsing failure

#### Parameters

##### message

`string`

Error message describing the issue

##### options?

Additional error options

###### cause?

`unknown`

Original error that caused this error

###### context?

`Record`\<`string`, `unknown`\>

Additional context data

###### details?

`string`

Detailed error information

#### Returns

[`CoreError`](@trailhead.cli.md#coreerror)

Standardized parsing error object

#### Example

```typescript
throw createParsingError('Failed to parse data', {
  details: 'Unexpected data structure',
  context: { format: 'csv', line: 10 },
})
```

---

### createUnifiedDataOperations()

> **createUnifiedDataOperations**(`config?`): [`UnifiedDataOperations`](#unifieddataoperations)

Create a unified data operations instance with custom configuration

#### Parameters

##### config?

[`UnifiedDataConfig`](#unifieddataconfig) = `{}`

Configuration options

#### Returns

[`UnifiedDataOperations`](#unifieddataoperations)

Configured data operations instance

#### Examples

```typescript
const data = createUnifiedDataOperations()
const result = await data.parseAuto('report.csv')
```

```typescript
const data = createUnifiedDataOperations({
  csv: { delimiter: ';', header: true },
  excel: { sheet: 'Summary', raw: false },
  autoDetect: true,
  defaultFormat: 'json',
})
```

---

### createValidationError()

> **createValidationError**(`message`, `options?`): [`CoreError`](@trailhead.cli.md#coreerror)

Create a validation error for data validation failures

#### Parameters

##### message

`string`

Error message describing the issue

##### options?

Additional error options

###### cause?

`unknown`

Original error that caused this error

###### context?

`Record`\<`string`, `unknown`\>

Additional context data

###### details?

`string`

Detailed error information

#### Returns

[`CoreError`](@trailhead.cli.md#coreerror)

Standardized validation error object

#### Example

```typescript
throw createValidationError('Data validation failed', {
  details: 'Required field "email" is missing',
  context: { field: 'email', row: 5 },
})
```

---

### mapLibraryError()

> **mapLibraryError**(`library`, `operation`, `error`): [`CoreError`](@trailhead.cli.md#coreerror)

Map third-party library errors to standardized CoreError format

#### Parameters

##### library

`string`

Library name (e.g., 'papaparse', 'xlsx')

##### operation

`string`

Operation that caused the error

##### error

`unknown`

Original library error

#### Returns

[`CoreError`](@trailhead.cli.md#coreerror)

Standardized error object

#### Example

```typescript
try {
  Papa.parse(csvContent)
} catch (error) {
  throw mapLibraryError('papaparse', 'parse', error)
}
```

---

### mapNodeError()

> **mapNodeError**(`operation`, `path`, `error`): [`CoreError`](@trailhead.cli.md#coreerror)

Map Node.js errors to standardized CoreError format

#### Parameters

##### operation

`string`

Operation that caused the error (e.g., 'readFile', 'writeFile')

##### path

`string`

File path related to the error

##### error

`unknown`

Original Node.js error

#### Returns

[`CoreError`](@trailhead.cli.md#coreerror)

Standardized error object

#### Example

```typescript
try {
  await fs.readFile(path)
} catch (error) {
  throw mapNodeError('readFile', path, error)
}
```

---

### mapValidationError()

> **mapValidationError**(`field`, `value`, `error`): [`CoreError`](@trailhead.cli.md#coreerror)

Map validation errors to standardized CoreError format

#### Parameters

##### field

`string`

Field that failed validation

##### value

`unknown`

Value that failed validation

##### error

`unknown`

Original validation error

#### Returns

[`CoreError`](@trailhead.cli.md#coreerror)

Standardized error object

#### Example

```typescript
if (!isValidEmail(email)) {
  throw mapValidationError('email', email, 'Invalid email format')
}
```
