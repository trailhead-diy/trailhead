**@esteban-url/data**

---

# @repo/data

> Data processing for CSV, JSON, and Excel with Result-based error handling

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/esteban-url/trailhead/blob/main/LICENSE)

## Features

- Unified API for CSV, JSON, and Excel formats
- Automatic format detection
- Format conversion between all supported types
- Streaming support for large files
- Result-based error handling
- Full TypeScript support

## Installation

```bash
pnpm add @repo/data
# or
npm install @repo/data
```

## Quick Start

```typescript
import { data } from '@repo/data'

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
import { data } from '@repo/data'

// Auto-detect and parse
await data.parseAuto(filePath)
await data.parseAutoFromContent(content, hint?)

// Auto-detect and write
await data.writeAuto(filePath, data)
```

### Format-Specific Operations

```typescript
import { createCSVOperations, createJSONOperations, createExcelOperations } from '@repo/data'

// CSV
const csv = createCSVOperations()
await csv.parseFile(path)
await csv.writeFile(path, data)

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
import { createConversionOperations } from '@repo/data/formats/conversion'

const converter = createConversionOperations()
await converter.convert(source, target, { from: 'csv', to: 'json' })
```

## Related Packages

- **@repo/core** - Result types and functional utilities
- **@repo/fs** - File system operations
- **@repo/validation** - Data validation

## Documentation

- [Tutorials](_media/README.md)
  - [Data Pipeline Processing](_media/data-pipeline-processing.md)
- [How-to Guides](_media/process-data-files.md)
  - [Convert Data Formats](_media/convert-data-formats.md)
- [Explanations](_media/format-detection.md)
  - [Result Types Pattern](_media/result-types-pattern.md)
  - [Functional Architecture](_media/functional-architecture.md)
- [API Reference](_media/api.md)

## License

MIT © [Esteban URL](https://github.com/esteban-url)

## Interfaces

### CSVParseResult

#### Properties

| Property                     | Modifier   | Type       |
| ---------------------------- | ---------- | ---------- |
| <a id="data-1"></a> `data`   | `readonly` | `any`[]    |
| <a id="errors"></a> `errors` | `readonly` | `any`[]    |
| <a id="meta"></a> `meta`     | `readonly` | `object`   |
| `meta.delimiter`             | `readonly` | `string`   |
| `meta.linebreak`             | `readonly` | `string`   |
| `meta.aborted`               | `readonly` | `boolean`  |
| `meta.truncated`             | `readonly` | `boolean`  |
| `meta.cursor`                | `readonly` | `number`   |
| `meta.fields?`               | `readonly` | `string`[] |

---

### CSVStringifyOptions

#### Properties

| Property                                      | Modifier   | Type                           |
| --------------------------------------------- | ---------- | ------------------------------ |
| <a id="delimiter"></a> `delimiter?`           | `readonly` | `string`                       |
| <a id="quotechar"></a> `quoteChar?`           | `readonly` | `string`                       |
| <a id="escapechar"></a> `escapeChar?`         | `readonly` | `string`                       |
| <a id="header"></a> `header?`                 | `readonly` | `boolean`                      |
| <a id="columns"></a> `columns?`               | `readonly` | `string`[]                     |
| <a id="skipemptylines"></a> `skipEmptyLines?` | `readonly` | `boolean`                      |
| <a id="transform"></a> `transform?`           | `readonly` | (`value`, `field`) => `string` |

---

### ExcelWorksheet

#### Properties

| Property                      | Modifier   | Type                                    |
| ----------------------------- | ---------- | --------------------------------------- |
| <a id="name"></a> `name`      | `readonly` | `string`                                |
| <a id="data-2"></a> `data`    | `readonly` | `any`[][]                               |
| <a id="range"></a> `range?`   | `readonly` | `string`                                |
| <a id="merges"></a> `merges?` | `readonly` | [`ExcelMergeRange`](#excelmergerange)[] |

---

### ExcelMergeRange

#### Properties

| Property           | Modifier   | Type     |
| ------------------ | ---------- | -------- |
| <a id="s"></a> `s` | `readonly` | `object` |
| `s.c`              | `public`   | `number` |
| `s.r`              | `public`   | `number` |
| <a id="e"></a> `e` | `readonly` | `object` |
| `e.c`              | `public`   | `number` |
| `e.r`              | `public`   | `number` |

---

### ExcelWorkbookInfo

#### Properties

| Property                                     | Modifier   | Type       |
| -------------------------------------------- | ---------- | ---------- |
| <a id="worksheetnames"></a> `worksheetNames` | `readonly` | `string`[] |
| <a id="worksheetcount"></a> `worksheetCount` | `readonly` | `number`   |
| <a id="properties"></a> `properties?`        | `readonly` | `object`   |
| `properties.title?`                          | `readonly` | `string`   |
| `properties.subject?`                        | `readonly` | `string`   |
| `properties.author?`                         | `readonly` | `string`   |
| `properties.company?`                        | `readonly` | `string`   |
| `properties.created?`                        | `readonly` | `Date`     |
| `properties.modified?`                       | `readonly` | `Date`     |

---

### ExcelCellInfo

#### Properties

| Property                      | Modifier   | Type                                                                                                           |
| ----------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| <a id="value"></a> `value`    | `readonly` | `any`                                                                                                          |
| <a id="type"></a> `type`      | `readonly` | `"n"` \| `"s"` \| `"b"` \| `"d"` \| `"e"` \| `"z"`                                                             |
| <a id="format"></a> `format?` | `readonly` | `string`                                                                                                       |
| <a id="style"></a> `style?`   | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\> |

---

### ExcelParseOptions

#### Properties

| Property                                | Modifier   | Type                                                            |
| --------------------------------------- | ---------- | --------------------------------------------------------------- |
| <a id="type-1"></a> `type?`             | `readonly` | `"base64"` \| `"binary"` \| `"buffer"` \| `"file"` \| `"array"` |
| <a id="raw"></a> `raw?`                 | `readonly` | `boolean`                                                       |
| <a id="codepage"></a> `codepage?`       | `readonly` | `number`                                                        |
| <a id="cellformula"></a> `cellFormula?` | `readonly` | `boolean`                                                       |
| <a id="cellhtml"></a> `cellHTML?`       | `readonly` | `boolean`                                                       |
| <a id="cellnf"></a> `cellNF?`           | `readonly` | `boolean`                                                       |
| <a id="cellstyles"></a> `cellStyles?`   | `readonly` | `boolean`                                                       |
| <a id="celltext"></a> `cellText?`       | `readonly` | `boolean`                                                       |
| <a id="celldates"></a> `cellDates?`     | `readonly` | `boolean`                                                       |
| <a id="datenf"></a> `dateNF?`           | `readonly` | `string`                                                        |
| <a id="sheetstubs"></a> `sheetStubs?`   | `readonly` | `boolean`                                                       |
| <a id="sheetrows"></a> `sheetRows?`     | `readonly` | `number`                                                        |
| <a id="bookdeps"></a> `bookDeps?`       | `readonly` | `boolean`                                                       |
| <a id="bookfiles"></a> `bookFiles?`     | `readonly` | `boolean`                                                       |
| <a id="bookprops"></a> `bookProps?`     | `readonly` | `boolean`                                                       |
| <a id="booksheets"></a> `bookSheets?`   | `readonly` | `boolean`                                                       |
| <a id="bookvba"></a> `bookVBA?`         | `readonly` | `boolean`                                                       |
| <a id="password"></a> `password?`       | `readonly` | `string`                                                        |
| <a id="wtf"></a> `WTF?`                 | `readonly` | `boolean`                                                       |

---

### ExcelWriteOptions

#### Properties

| Property                                | Modifier   | Type                                                              |
| --------------------------------------- | ---------- | ----------------------------------------------------------------- |
| <a id="booktype"></a> `bookType?`       | `readonly` | `"csv"` \| `"xlsx"` \| `"xlsm"` \| `"xlsb"` \| `"xls"` \| `"ods"` |
| <a id="compression"></a> `compression?` | `readonly` | `boolean`                                                         |
| <a id="props"></a> `Props?`             | `readonly` | `object`                                                          |
| `Props.Title?`                          | `readonly` | `string`                                                          |
| `Props.Subject?`                        | `readonly` | `string`                                                          |
| `Props.Author?`                         | `readonly` | `string`                                                          |
| `Props.Manager?`                        | `readonly` | `string`                                                          |
| `Props.Company?`                        | `readonly` | `string`                                                          |
| `Props.Category?`                       | `readonly` | `string`                                                          |
| `Props.Keywords?`                       | `readonly` | `string`                                                          |
| `Props.Comments?`                       | `readonly` | `string`                                                          |
| `Props.LastAuthor?`                     | `readonly` | `string`                                                          |
| `Props.CreatedDate?`                    | `readonly` | `Date`                                                            |

---

### FormatConfig

#### Extended by

- [`DetectionConfig`](#detectionconfig)
- [`MimeConfig`](#mimeconfig)
- [`ConversionConfig`](#conversionconfig)

#### Properties

| Property                                                        | Modifier   | Type      |
| --------------------------------------------------------------- | ---------- | --------- |
| <a id="timeout"></a> `timeout?`                                 | `readonly` | `number`  |
| <a id="maxsize"></a> `maxSize?`                                 | `readonly` | `number`  |
| <a id="strictmode"></a> `strictMode?`                           | `readonly` | `boolean` |
| <a id="enableextensionfallback"></a> `enableExtensionFallback?` | `readonly` | `boolean` |

---

### DetectionConfig

#### Extends

- [`FormatConfig`](#formatconfig)

#### Properties

| Property                                                          | Modifier   | Type      | Inherited from                                                                        |
| ----------------------------------------------------------------- | ---------- | --------- | ------------------------------------------------------------------------------------- |
| <a id="timeout-1"></a> `timeout?`                                 | `readonly` | `number`  | [`FormatConfig`](#formatconfig).[`timeout`](#timeout)                                 |
| <a id="maxsize-1"></a> `maxSize?`                                 | `readonly` | `number`  | [`FormatConfig`](#formatconfig).[`maxSize`](#maxsize)                                 |
| <a id="strictmode-1"></a> `strictMode?`                           | `readonly` | `boolean` | [`FormatConfig`](#formatconfig).[`strictMode`](#strictmode)                           |
| <a id="enableextensionfallback-1"></a> `enableExtensionFallback?` | `readonly` | `boolean` | [`FormatConfig`](#formatconfig).[`enableExtensionFallback`](#enableextensionfallback) |
| <a id="buffersize"></a> `bufferSize?`                             | `readonly` | `number`  | -                                                                                     |
| <a id="usefileextension"></a> `useFileExtension?`                 | `readonly` | `boolean` | -                                                                                     |
| <a id="usemagicnumbers"></a> `useMagicNumbers?`                   | `readonly` | `boolean` | -                                                                                     |

---

### MimeConfig

#### Extends

- [`FormatConfig`](#formatconfig)

#### Properties

| Property                                                          | Modifier   | Type      | Inherited from                                                                        |
| ----------------------------------------------------------------- | ---------- | --------- | ------------------------------------------------------------------------------------- |
| <a id="timeout-2"></a> `timeout?`                                 | `readonly` | `number`  | [`FormatConfig`](#formatconfig).[`timeout`](#timeout)                                 |
| <a id="maxsize-2"></a> `maxSize?`                                 | `readonly` | `number`  | [`FormatConfig`](#formatconfig).[`maxSize`](#maxsize)                                 |
| <a id="strictmode-2"></a> `strictMode?`                           | `readonly` | `boolean` | [`FormatConfig`](#formatconfig).[`strictMode`](#strictmode)                           |
| <a id="enableextensionfallback-2"></a> `enableExtensionFallback?` | `readonly` | `boolean` | [`FormatConfig`](#formatconfig).[`enableExtensionFallback`](#enableextensionfallback) |
| <a id="charset"></a> `charset?`                                   | `readonly` | `string`  | -                                                                                     |
| <a id="defaultmimetype"></a> `defaultMimeType?`                   | `readonly` | `string`  | -                                                                                     |

---

### ConversionConfig

#### Extends

- [`FormatConfig`](#formatconfig)

#### Properties

| Property                                                          | Modifier   | Type      | Inherited from                                                                        |
| ----------------------------------------------------------------- | ---------- | --------- | ------------------------------------------------------------------------------------- |
| <a id="timeout-3"></a> `timeout?`                                 | `readonly` | `number`  | [`FormatConfig`](#formatconfig).[`timeout`](#timeout)                                 |
| <a id="maxsize-3"></a> `maxSize?`                                 | `readonly` | `number`  | [`FormatConfig`](#formatconfig).[`maxSize`](#maxsize)                                 |
| <a id="strictmode-3"></a> `strictMode?`                           | `readonly` | `boolean` | [`FormatConfig`](#formatconfig).[`strictMode`](#strictmode)                           |
| <a id="enableextensionfallback-3"></a> `enableExtensionFallback?` | `readonly` | `boolean` | [`FormatConfig`](#formatconfig).[`enableExtensionFallback`](#enableextensionfallback) |
| <a id="quality"></a> `quality?`                                   | `readonly` | `number`  | -                                                                                     |
| <a id="preservemetadata"></a> `preserveMetadata?`                 | `readonly` | `boolean` | -                                                                                     |

---

### DetectionResult

#### Properties

| Property                               | Modifier   | Type                   |
| -------------------------------------- | ---------- | ---------------------- |
| <a id="format-1"></a> `format`         | `readonly` | `FileFormatInfo`       |
| <a id="source"></a> `source`           | `readonly` | `DetectionSource`      |
| <a id="reliability"></a> `reliability` | `readonly` | `DetectionReliability` |

---

### MimeTypeInfo

#### Properties

| Property                                 | Modifier   | Type                |
| ---------------------------------------- | ---------- | ------------------- |
| <a id="type-2"></a> `type`               | `readonly` | `string`            |
| <a id="subtype"></a> `subtype`           | `readonly` | `string`            |
| <a id="full"></a> `full`                 | `readonly` | `string`            |
| <a id="extensions"></a> `extensions`     | `readonly` | readonly `string`[] |
| <a id="charset-1"></a> `charset?`        | `readonly` | `string`            |
| <a id="compressible"></a> `compressible` | `readonly` | `boolean`           |
| <a id="category"></a> `category`         | `readonly` | `FileCategory`      |

---

### ConversionInfo

#### Properties

| Property                             | Modifier   | Type                |
| ------------------------------------ | ---------- | ------------------- |
| <a id="fromformat"></a> `fromFormat` | `readonly` | `string`            |
| <a id="toformat"></a> `toFormat`     | `readonly` | `string`            |
| <a id="supported"></a> `supported`   | `readonly` | `boolean`           |
| <a id="quality-1"></a> `quality`     | `readonly` | `ConversionQuality` |
| <a id="options"></a> `options?`      | `readonly` | `ConversionOptions` |

---

### DetectionOperations

#### Properties

| Property                                               | Modifier   | Type                                                                                                                                                                                                        |
| ------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="detectfrombuffer"></a> `detectFromBuffer`       | `readonly` | `DetectFromBufferOp`                                                                                                                                                                                        |
| <a id="detectfromfile"></a> `detectFromFile`           | `readonly` | `DetectFromFileOp`                                                                                                                                                                                          |
| <a id="detectfromextension"></a> `detectFromExtension` | `readonly` | `DetectFromExtensionOp`                                                                                                                                                                                     |
| <a id="detectfrommime"></a> `detectFromMime`           | `readonly` | (`mimeType`, `config?`) => [`FormatResult`](#formatresult)\<`FileFormatInfo`\>                                                                                                                              |
| <a id="detectbatch"></a> `detectBatch`                 | `readonly` | (`files`, `config?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FormatResult`](#formatresult)\<[`DetectionResult`](#detectionresult)[]\>\> |

---

### MimeOperations

#### Properties

| Property                                           | Modifier   | Type                                                                               |
| -------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| <a id="getmimetype"></a> `getMimeType`             | `readonly` | `GetMimeTypeOp`                                                                    |
| <a id="getextensions"></a> `getExtensions`         | `readonly` | `GetExtensionsOp`                                                                  |
| <a id="ismimetype"></a> `isMimeType`               | `readonly` | `IsMimeTypeOp`                                                                     |
| <a id="normalizemimetype"></a> `normalizeMimeType` | `readonly` | (`mimeType`) => [`FormatResult`](#formatresult)\<`string`\>                        |
| <a id="parsemimetype"></a> `parseMimeType`         | `readonly` | (`mimeType`) => [`FormatResult`](#formatresult)\<[`MimeTypeInfo`](#mimetypeinfo)\> |

---

### ConversionOperations

#### Properties

| Property                                                           | Modifier   | Type                                                                                 |
| ------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------ |
| <a id="checkconversion"></a> `checkConversion`                     | `readonly` | `CheckConversionOp`                                                                  |
| <a id="getsupportedformats"></a> `getSupportedFormats`             | `readonly` | `GetSupportedFormatsOp`                                                              |
| <a id="getconversionchain"></a> `getConversionChain`               | `readonly` | (`fromFormat`, `toFormat`) => [`FormatResult`](#formatresult)\<readonly `string`[]\> |
| <a id="estimateconversionquality"></a> `estimateConversionQuality` | `readonly` | (`fromFormat`, `toFormat`) => [`FormatResult`](#formatresult)\<`ConversionQuality`\> |

---

### JSONStringifyOptions

#### Properties

| Property                                    | Modifier   | Type                      |
| ------------------------------------------- | ---------- | ------------------------- |
| <a id="replacer"></a> `replacer?`           | `readonly` | (`key`, `value`) => `any` |
| <a id="space"></a> `space?`                 | `readonly` | `string` \| `number`      |
| <a id="skipundefined"></a> `skipUndefined?` | `readonly` | `boolean`                 |
| <a id="skipnull"></a> `skipNull?`           | `readonly` | `boolean`                 |
| <a id="sortkeys"></a> `sortKeys?`           | `readonly` | `boolean`                 |

---

### JSONFormatOptions

#### Properties

| Property                                      | Modifier   | Type      |
| --------------------------------------------- | ---------- | --------- |
| <a id="indent"></a> `indent?`                 | `readonly` | `number`  |
| <a id="sortkeys-1"></a> `sortKeys?`           | `readonly` | `boolean` |
| <a id="preservearrays"></a> `preserveArrays?` | `readonly` | `boolean` |
| <a id="maxlinelength"></a> `maxLineLength?`   | `readonly` | `number`  |

---

### JSONMinifyOptions

#### Properties

| Property                                          | Modifier   | Type      |
| ------------------------------------------------- | ---------- | --------- |
| <a id="preservecomments"></a> `preserveComments?` | `readonly` | `boolean` |
| <a id="preservenewlines"></a> `preserveNewlines?` | `readonly` | `boolean` |

---

### UnifiedDataConfig

#### Properties

| Property                                    | Type                             |
| ------------------------------------------- | -------------------------------- |
| <a id="csv-1"></a> `csv?`                   | [`DataConfig`](#dataconfig)      |
| <a id="json-1"></a> `json?`                 | [`DataConfig`](#dataconfig)      |
| <a id="excel"></a> `excel?`                 | [`DataConfig`](#dataconfig)      |
| <a id="detection"></a> `detection?`         | [`FormatConfig`](#formatconfig)  |
| <a id="mime"></a> `mime?`                   | [`FormatConfig`](#formatconfig)  |
| <a id="autodetect"></a> `autoDetect?`       | `boolean`                        |
| <a id="defaultformat"></a> `defaultFormat?` | `"csv"` \| `"json"` \| `"excel"` |

---

### UnifiedDataOperations

#### Properties

| Property                                                       | Type                                                                                                                                                                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="parseauto"></a> `parseAuto`                             | (`filePath`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`any`\>\>                                                       |
| <a id="parseautofromcontent"></a> `parseAutoFromContent`       | (`content`, `fileName?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`any`\>\>                                           |
| <a id="writeauto"></a> `writeAuto`                             | (`filePath`, `data`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`Result`](https://github.com/supermacro/neverthrow#result)\<`void`, `CoreError`\>\> |
| <a id="parsecsv"></a> `parseCSV`                               | \<`T`\>(`filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>\>                      |
| <a id="parsejson"></a> `parseJSON`                             | [`ParseFileOperation`](#parsefileoperation)\<`any`, [`JSONProcessingOptions`](#jsonprocessingoptions)\>                                                                                                             |
| <a id="parseexcel"></a> `parseExcel`                           | [`ParseFileOperation`](#parsefileoperation)\<`any`[], [`ExcelProcessingOptions`](#excelprocessingoptions)\>                                                                                                         |
| <a id="parsecsvfromcontent"></a> `parseCSVFromContent`         | \<`T`\>(`data`, `options?`) => [`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>                                                                                                                                   |
| <a id="parsejsonfromcontent"></a> `parseJSONFromContent`       | [`ParseOperation`](#parseoperation)\<`any`, [`JSONProcessingOptions`](#jsonprocessingoptions)\>                                                                                                                     |
| <a id="parseexcelfromcontent"></a> `parseExcelFromContent`     | (`buffer`, `options?`) => [`DataResult`](#dataresult)\<`any`[]\>                                                                                                                                                    |
| <a id="detectformat"></a> `detectFormat`                       | (`filePath`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`Result`](https://github.com/supermacro/neverthrow#result)\<`string`, `CoreError`\>\>       |
| <a id="detectformatfromcontent"></a> `detectFormatFromContent` | (`content`, `fileName?`) => [`Result`](https://github.com/supermacro/neverthrow#result)\<`string`, `CoreError`\>                                                                                                    |
| <a id="convertformat"></a> `convertFormat`                     | (`data`, `targetFormat`) => [`Result`](https://github.com/supermacro/neverthrow#result)\<`string`, `CoreError`\>                                                                                                    |

---

### DataConfig

#### Extended by

- [`CSVConfig`](#csvconfig)
- [`JSONConfig`](#jsonconfig)
- [`ExcelConfig`](#excelconfig)

#### Properties

| Property                          | Modifier   | Type             |
| --------------------------------- | ---------- | ---------------- |
| <a id="encoding"></a> `encoding?` | `readonly` | `BufferEncoding` |
| <a id="timeout-4"></a> `timeout?` | `readonly` | `number`         |
| <a id="maxsize-4"></a> `maxSize?` | `readonly` | `number`         |

---

### CSVConfig

#### Extends

- [`DataConfig`](#dataconfig)

#### Properties

| Property                                        | Modifier   | Type                        | Inherited from                                      |
| ----------------------------------------------- | ---------- | --------------------------- | --------------------------------------------------- |
| <a id="encoding-1"></a> `encoding?`             | `readonly` | `BufferEncoding`            | [`DataConfig`](#dataconfig).[`encoding`](#encoding) |
| <a id="timeout-5"></a> `timeout?`               | `readonly` | `number`                    | [`DataConfig`](#dataconfig).[`timeout`](#timeout-4) |
| <a id="maxsize-5"></a> `maxSize?`               | `readonly` | `number`                    | [`DataConfig`](#dataconfig).[`maxSize`](#maxsize-4) |
| <a id="delimiter-1"></a> `delimiter?`           | `readonly` | `string`                    | -                                                   |
| <a id="quotechar-1"></a> `quoteChar?`           | `readonly` | `string`                    | -                                                   |
| <a id="escapechar-1"></a> `escapeChar?`         | `readonly` | `string`                    | -                                                   |
| <a id="hasheader"></a> `hasHeader?`             | `readonly` | `boolean`                   | -                                                   |
| <a id="dynamictyping"></a> `dynamicTyping?`     | `readonly` | `boolean`                   | -                                                   |
| <a id="comments"></a> `comments?`               | `readonly` | `string`                    | -                                                   |
| <a id="skipemptylines-1"></a> `skipEmptyLines?` | `readonly` | `boolean`                   | -                                                   |
| <a id="transform-1"></a> `transform?`           | `readonly` | (`value`, `field`) => `any` | -                                                   |
| <a id="transformheader"></a> `transformHeader?` | `readonly` | (`header`) => `string`      | -                                                   |
| <a id="detectdelimiter"></a> `detectDelimiter?` | `readonly` | `boolean`                   | -                                                   |

---

### JSONConfig

#### Extends

- [`DataConfig`](#dataconfig)

#### Properties

| Property                                                | Modifier   | Type                      | Inherited from                                      |
| ------------------------------------------------------- | ---------- | ------------------------- | --------------------------------------------------- |
| <a id="encoding-2"></a> `encoding?`                     | `readonly` | `BufferEncoding`          | [`DataConfig`](#dataconfig).[`encoding`](#encoding) |
| <a id="timeout-6"></a> `timeout?`                       | `readonly` | `number`                  | [`DataConfig`](#dataconfig).[`timeout`](#timeout-4) |
| <a id="maxsize-6"></a> `maxSize?`                       | `readonly` | `number`                  | [`DataConfig`](#dataconfig).[`maxSize`](#maxsize-4) |
| <a id="reviver"></a> `reviver?`                         | `readonly` | (`key`, `value`) => `any` | -                                                   |
| <a id="replacer-1"></a> `replacer?`                     | `readonly` | (`key`, `value`) => `any` | -                                                   |
| <a id="space-1"></a> `space?`                           | `readonly` | `string` \| `number`      | -                                                   |
| <a id="allowtrailingcommas"></a> `allowTrailingCommas?` | `readonly` | `boolean`                 | -                                                   |
| <a id="allowcomments"></a> `allowComments?`             | `readonly` | `boolean`                 | -                                                   |

---

### ExcelConfig

#### Extends

- [`DataConfig`](#dataconfig)

#### Properties

| Property                                      | Modifier   | Type             | Inherited from                                      |
| --------------------------------------------- | ---------- | ---------------- | --------------------------------------------------- |
| <a id="encoding-3"></a> `encoding?`           | `readonly` | `BufferEncoding` | [`DataConfig`](#dataconfig).[`encoding`](#encoding) |
| <a id="timeout-7"></a> `timeout?`             | `readonly` | `number`         | [`DataConfig`](#dataconfig).[`timeout`](#timeout-4) |
| <a id="maxsize-7"></a> `maxSize?`             | `readonly` | `number`         | [`DataConfig`](#dataconfig).[`maxSize`](#maxsize-4) |
| <a id="worksheetname"></a> `worksheetName?`   | `readonly` | `string`         | -                                                   |
| <a id="worksheetindex"></a> `worksheetIndex?` | `readonly` | `number`         | -                                                   |
| <a id="hasheader-1"></a> `hasHeader?`         | `readonly` | `boolean`        | -                                                   |
| <a id="dynamictyping-1"></a> `dynamicTyping?` | `readonly` | `boolean`        | -                                                   |
| <a id="datenf-1"></a> `dateNF?`               | `readonly` | `string`         | -                                                   |
| <a id="range-1"></a> `range?`                 | `readonly` | `string`         | -                                                   |
| <a id="header-1"></a> `header?`               | `readonly` | `number`         | -                                                   |
| <a id="celldates-1"></a> `cellDates?`         | `readonly` | `boolean`        | -                                                   |
| <a id="defval"></a> `defval?`                 | `readonly` | `any`            | -                                                   |

---

### ProcessingOptions

#### Extended by

- [`CSVProcessingOptions`](#csvprocessingoptions)
- [`JSONProcessingOptions`](#jsonprocessingoptions)
- [`ExcelProcessingOptions`](#excelprocessingoptions)

#### Properties

| Property                                        | Modifier   | Type                            |
| ----------------------------------------------- | ---------- | ------------------------------- |
| <a id="autotrim"></a> `autoTrim?`               | `readonly` | `boolean`                       |
| <a id="skipemptylines-2"></a> `skipEmptyLines?` | `readonly` | `boolean`                       |
| <a id="errortolerant"></a> `errorTolerant?`     | `readonly` | `boolean`                       |
| <a id="maxrows"></a> `maxRows?`                 | `readonly` | `number`                        |
| <a id="onerror"></a> `onError?`                 | `readonly` | (`error`, `context?`) => `void` |

---

### CSVProcessingOptions

#### Extends

- [`ProcessingOptions`](#processingoptions)

#### Properties

| Property                                          | Modifier   | Type                            | Inherited from                                                                  |
| ------------------------------------------------- | ---------- | ------------------------------- | ------------------------------------------------------------------------------- |
| <a id="autotrim-1"></a> `autoTrim?`               | `readonly` | `boolean`                       | [`ProcessingOptions`](#processingoptions).[`autoTrim`](#autotrim)               |
| <a id="skipemptylines-3"></a> `skipEmptyLines?`   | `readonly` | `boolean`                       | [`ProcessingOptions`](#processingoptions).[`skipEmptyLines`](#skipemptylines-2) |
| <a id="errortolerant-1"></a> `errorTolerant?`     | `readonly` | `boolean`                       | [`ProcessingOptions`](#processingoptions).[`errorTolerant`](#errortolerant)     |
| <a id="maxrows-1"></a> `maxRows?`                 | `readonly` | `number`                        | [`ProcessingOptions`](#processingoptions).[`maxRows`](#maxrows)                 |
| <a id="onerror-1"></a> `onError?`                 | `readonly` | (`error`, `context?`) => `void` | [`ProcessingOptions`](#processingoptions).[`onError`](#onerror)                 |
| <a id="delimiter-2"></a> `delimiter?`             | `readonly` | `string`                        | -                                                                               |
| <a id="quotechar-2"></a> `quoteChar?`             | `readonly` | `string`                        | -                                                                               |
| <a id="escapechar-2"></a> `escapeChar?`           | `readonly` | `string`                        | -                                                                               |
| <a id="hasheader-2"></a> `hasHeader?`             | `readonly` | `boolean`                       | -                                                                               |
| <a id="dynamictyping-2"></a> `dynamicTyping?`     | `readonly` | `boolean`                       | -                                                                               |
| <a id="transformheader-1"></a> `transformHeader?` | `readonly` | (`header`) => `string`          | -                                                                               |
| <a id="detectdelimiter-1"></a> `detectDelimiter?` | `readonly` | `boolean`                       | -                                                                               |
| <a id="comments-1"></a> `comments?`               | `readonly` | `string`                        | -                                                                               |
| <a id="transform-2"></a> `transform?`             | `readonly` | (`value`, `field`) => `any`     | -                                                                               |

---

### JSONProcessingOptions

#### Extends

- [`ProcessingOptions`](#processingoptions)

#### Properties

| Property                                                  | Modifier   | Type                            | Inherited from                                                                  |
| --------------------------------------------------------- | ---------- | ------------------------------- | ------------------------------------------------------------------------------- |
| <a id="autotrim-2"></a> `autoTrim?`                       | `readonly` | `boolean`                       | [`ProcessingOptions`](#processingoptions).[`autoTrim`](#autotrim)               |
| <a id="skipemptylines-4"></a> `skipEmptyLines?`           | `readonly` | `boolean`                       | [`ProcessingOptions`](#processingoptions).[`skipEmptyLines`](#skipemptylines-2) |
| <a id="errortolerant-2"></a> `errorTolerant?`             | `readonly` | `boolean`                       | [`ProcessingOptions`](#processingoptions).[`errorTolerant`](#errortolerant)     |
| <a id="maxrows-2"></a> `maxRows?`                         | `readonly` | `number`                        | [`ProcessingOptions`](#processingoptions).[`maxRows`](#maxrows)                 |
| <a id="onerror-2"></a> `onError?`                         | `readonly` | (`error`, `context?`) => `void` | [`ProcessingOptions`](#processingoptions).[`onError`](#onerror)                 |
| <a id="allowtrailingcommas-1"></a> `allowTrailingCommas?` | `readonly` | `boolean`                       | -                                                                               |
| <a id="allowcomments-1"></a> `allowComments?`             | `readonly` | `boolean`                       | -                                                                               |
| <a id="allowsinglequotes"></a> `allowSingleQuotes?`       | `readonly` | `boolean`                       | -                                                                               |
| <a id="allowunquotedkeys"></a> `allowUnquotedKeys?`       | `readonly` | `boolean`                       | -                                                                               |
| <a id="reviver-1"></a> `reviver?`                         | `readonly` | (`key`, `value`) => `any`       | -                                                                               |
| <a id="replacer-2"></a> `replacer?`                       | `readonly` | (`key`, `value`) => `any`       | -                                                                               |
| <a id="space-2"></a> `space?`                             | `readonly` | `string` \| `number`            | -                                                                               |

---

### ExcelProcessingOptions

#### Extends

- [`ProcessingOptions`](#processingoptions)

#### Properties

| Property                                        | Modifier   | Type                            | Inherited from                                                                  |
| ----------------------------------------------- | ---------- | ------------------------------- | ------------------------------------------------------------------------------- |
| <a id="autotrim-3"></a> `autoTrim?`             | `readonly` | `boolean`                       | [`ProcessingOptions`](#processingoptions).[`autoTrim`](#autotrim)               |
| <a id="skipemptylines-5"></a> `skipEmptyLines?` | `readonly` | `boolean`                       | [`ProcessingOptions`](#processingoptions).[`skipEmptyLines`](#skipemptylines-2) |
| <a id="errortolerant-3"></a> `errorTolerant?`   | `readonly` | `boolean`                       | [`ProcessingOptions`](#processingoptions).[`errorTolerant`](#errortolerant)     |
| <a id="maxrows-3"></a> `maxRows?`               | `readonly` | `number`                        | [`ProcessingOptions`](#processingoptions).[`maxRows`](#maxrows)                 |
| <a id="onerror-3"></a> `onError?`               | `readonly` | (`error`, `context?`) => `void` | [`ProcessingOptions`](#processingoptions).[`onError`](#onerror)                 |
| <a id="worksheetname-1"></a> `worksheetName?`   | `readonly` | `string`                        | -                                                                               |
| <a id="worksheetindex-1"></a> `worksheetIndex?` | `readonly` | `number`                        | -                                                                               |
| <a id="hasheader-3"></a> `hasHeader?`           | `readonly` | `boolean`                       | -                                                                               |
| <a id="dynamictyping-3"></a> `dynamicTyping?`   | `readonly` | `boolean`                       | -                                                                               |
| <a id="datenf-2"></a> `dateNF?`                 | `readonly` | `string`                        | -                                                                               |
| <a id="cellnf-1"></a> `cellNF?`                 | `readonly` | `boolean`                       | -                                                                               |
| <a id="defval-1"></a> `defval?`                 | `readonly` | `any`                           | -                                                                               |
| <a id="range-2"></a> `range?`                   | `readonly` | `string`                        | -                                                                               |
| <a id="header-2"></a> `header?`                 | `readonly` | `number`                        | -                                                                               |
| <a id="password-1"></a> `password?`             | `readonly` | `string`                        | -                                                                               |
| <a id="booksst"></a> `bookSST?`                 | `readonly` | `boolean`                       | -                                                                               |
| <a id="cellhtml-1"></a> `cellHTML?`             | `readonly` | `boolean`                       | -                                                                               |
| <a id="cellstyles-1"></a> `cellStyles?`         | `readonly` | `boolean`                       | -                                                                               |
| <a id="celldates-2"></a> `cellDates?`           | `readonly` | `boolean`                       | -                                                                               |
| <a id="sheetstubs-1"></a> `sheetStubs?`         | `readonly` | `boolean`                       | -                                                                               |
| <a id="blankrows"></a> `blankrows?`             | `readonly` | `boolean`                       | -                                                                               |
| <a id="bookvba-1"></a> `bookVBA?`               | `readonly` | `boolean`                       | -                                                                               |

---

### FormatDetectionResult

#### Properties

| Property                             | Modifier   | Type                                            |
| ------------------------------------ | ---------- | ----------------------------------------------- |
| <a id="format-2"></a> `format`       | `readonly` | `"csv"` \| `"json"` \| `"excel"` \| `"unknown"` |
| <a id="confidence"></a> `confidence` | `readonly` | `number`                                        |
| <a id="details"></a> `details?`      | `readonly` | `object`                                        |
| `details.delimiter?`                 | `readonly` | `string`                                        |
| `details.hasHeader?`                 | `readonly` | `boolean`                                       |
| `details.structure?`                 | `readonly` | `string`                                        |
| `details.worksheetNames?`            | `readonly` | `string`[]                                      |
| `details.worksheetCount?`            | `readonly` | `number`                                        |

---

### CSVFormatInfo

#### Properties

| Property                               | Modifier   | Type      |
| -------------------------------------- | ---------- | --------- |
| <a id="delimiter-3"></a> `delimiter`   | `readonly` | `string`  |
| <a id="quotechar-3"></a> `quoteChar`   | `readonly` | `string`  |
| <a id="hasheader-4"></a> `hasHeader`   | `readonly` | `boolean` |
| <a id="rowcount"></a> `rowCount`       | `readonly` | `number`  |
| <a id="columncount"></a> `columnCount` | `readonly` | `number`  |

---

### ExcelFormatInfo

#### Properties

| Property                                       | Modifier   | Type       |
| ---------------------------------------------- | ---------- | ---------- |
| <a id="worksheetnames-1"></a> `worksheetNames` | `readonly` | `string`[] |
| <a id="worksheetcount-1"></a> `worksheetCount` | `readonly` | `number`   |
| <a id="hasdata"></a> `hasData`                 | `readonly` | `boolean`  |

---

### CSVOperations

#### Properties

| Property                                     | Modifier   | Type                                                                                                                                                                                           |
| -------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="parsestring"></a> `parseString`       | `readonly` | \<`T`\>(`data`, `options?`) => [`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>                                                                                                              |
| <a id="parsefile"></a> `parseFile`           | `readonly` | \<`T`\>(`filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>\> |
| <a id="stringify"></a> `stringify`           | `readonly` | \<`T`\>(`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>                                                                                                                         |
| <a id="writefile"></a> `writeFile`           | `readonly` | \<`T`\>(`data`, `filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>      |
| <a id="validate"></a> `validate`             | `readonly` | `ValidateStringOperation`                                                                                                                                                                      |
| <a id="detectformat-1"></a> `detectFormat`   | `readonly` | (`data`) => [`DataResult`](#dataresult)\<[`CSVFormatInfo`](#csvformatinfo)\>                                                                                                                   |
| <a id="parsetoobjects"></a> `parseToObjects` | `readonly` | (`data`, `options?`) => [`DataResult`](#dataresult)\<`ParsedData`\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>\>\>      |
| <a id="parsetoarrays"></a> `parseToArrays`   | `readonly` | (`data`, `options?`) => [`DataResult`](#dataresult)\<`ParsedData`\<readonly `string`[]\>\>                                                                                                     |
| <a id="fromobjects"></a> `fromObjects`       | `readonly` | (`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>                                                                                                                                |
| <a id="fromarrays"></a> `fromArrays`         | `readonly` | (`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>                                                                                                                                |

---

### JSONOperations

#### Properties

| Property                                 | Modifier   | Type                                                                                                    |
| ---------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| <a id="parsestring-1"></a> `parseString` | `readonly` | [`ParseOperation`](#parseoperation)\<`any`, [`JSONProcessingOptions`](#jsonprocessingoptions)\>         |
| <a id="parsefile-1"></a> `parseFile`     | `readonly` | [`ParseFileOperation`](#parsefileoperation)\<`any`, [`JSONProcessingOptions`](#jsonprocessingoptions)\> |
| <a id="stringify-1"></a> `stringify`     | `readonly` | [`StringifyOperation`](#stringifyoperation)\<`any`, [`JSONProcessingOptions`](#jsonprocessingoptions)\> |
| <a id="writefile-1"></a> `writeFile`     | `readonly` | [`WriteFileOperation`](#writefileoperation)\<`any`, [`JSONProcessingOptions`](#jsonprocessingoptions)\> |
| <a id="validate-1"></a> `validate`       | `readonly` | `ValidateStringOperation`                                                                               |
| <a id="minify"></a> `minify`             | `readonly` | (`data`) => [`DataResult`](#dataresult)\<`string`\>                                                     |
| <a id="format-3"></a> `format`           | `readonly` | (`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>                                         |

---

### ExcelOperations

#### Properties

| Property                                                   | Modifier   | Type                                                                                                                                                                                             |
| ---------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="parsebuffer"></a> `parseBuffer`                     | `readonly` | (`buffer`, `options?`) => [`DataResult`](#dataresult)\<`any`[]\>                                                                                                                                 |
| <a id="parsefile-2"></a> `parseFile`                       | `readonly` | [`ParseFileOperation`](#parsefileoperation)\<`any`[], [`ExcelProcessingOptions`](#excelprocessingoptions)\>                                                                                      |
| <a id="parseworksheet"></a> `parseWorksheet`               | `readonly` | (`buffer`, `worksheetName`, `options?`) => [`DataResult`](#dataresult)\<`any`[]\>                                                                                                                |
| <a id="parseworksheetbyindex"></a> `parseWorksheetByIndex` | `readonly` | (`buffer`, `worksheetIndex`, `options?`) => [`DataResult`](#dataresult)\<`any`[]\>                                                                                                               |
| <a id="stringify-2"></a> `stringify`                       | `readonly` | (`data`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\<`ArrayBufferLike`\>\>\>    |
| <a id="writefile-2"></a> `writeFile`                       | `readonly` | [`WriteFileOperation`](#writefileoperation)\<`any`[], [`ExcelProcessingOptions`](#excelprocessingoptions)\>                                                                                      |
| <a id="validate-2"></a> `validate`                         | `readonly` | `ValidateBufferOperation`                                                                                                                                                                        |
| <a id="detectformat-2"></a> `detectFormat`                 | `readonly` | (`buffer`) => [`DataResult`](#dataresult)\<[`ExcelFormatInfo`](#excelformatinfo)\>                                                                                                               |
| <a id="parsetoobjects-1"></a> `parseToObjects`             | `readonly` | (`buffer`, `options?`) => [`DataResult`](#dataresult)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\>[]\>                        |
| <a id="parsetoarrays-1"></a> `parseToArrays`               | `readonly` | (`buffer`, `options?`) => [`DataResult`](#dataresult)\<`any`[][]\>                                                                                                                               |
| <a id="fromobjects-1"></a> `fromObjects`                   | `readonly` | (`objects`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\<`ArrayBufferLike`\>\>\> |
| <a id="fromarrays-1"></a> `fromArrays`                     | `readonly` | (`arrays`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\<`ArrayBufferLike`\>\>\>  |
| <a id="getworksheetnames"></a> `getWorksheetNames`         | `readonly` | (`buffer`) => [`DataResult`](#dataresult)\<`string`[]\>                                                                                                                                          |
| <a id="createworkbook"></a> `createWorkbook`               | `readonly` | (`worksheets`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\<`ArrayBufferLike`\>\>\>          |

## Type Aliases

### CreateConversionOperations()

> **CreateConversionOperations** = (`config?`) => [`ConversionOperations`](#conversionoperations)

#### Parameters

| Parameter | Type                                    |
| --------- | --------------------------------------- |
| `config?` | [`ConversionConfig`](#conversionconfig) |

#### Returns

[`ConversionOperations`](#conversionoperations)

---

### CSVConfigProvider()

> **CSVConfigProvider** = () => [`CSVConfig`](#csvconfig)

#### Returns

[`CSVConfig`](#csvconfig)

---

### CSVParseFunction()

> **CSVParseFunction** = \<`T`\>(`data`, `options?`) => [`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>

#### Type Parameters

| Type Parameter | Default type                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `T`            | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |

#### Parameters

| Parameter  | Type                                            |
| ---------- | ----------------------------------------------- |
| `data`     | `string`                                        |
| `options?` | [`CSVProcessingOptions`](#csvprocessingoptions) |

#### Returns

[`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>

---

### CSVParseFileFunction()

> **CSVParseFileFunction** = \<`T`\>(`filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>\>

#### Type Parameters

| Type Parameter | Default type                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `T`            | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |

#### Parameters

| Parameter  | Type                                            |
| ---------- | ----------------------------------------------- |
| `filePath` | `string`                                        |
| `options?` | [`CSVProcessingOptions`](#csvprocessingoptions) |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`ParsedData`\<`T`\>\>\>

---

### CSVStringifyFunction()

> **CSVStringifyFunction** = \<`T`\>(`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>

#### Type Parameters

| Type Parameter | Default type                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `T`            | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |

#### Parameters

| Parameter  | Type                                            |
| ---------- | ----------------------------------------------- |
| `data`     | readonly `T`[]                                  |
| `options?` | [`CSVProcessingOptions`](#csvprocessingoptions) |

#### Returns

[`DataResult`](#dataresult)\<`string`\>

---

### CSVWriteFileFunction()

> **CSVWriteFileFunction** = \<`T`\>(`data`, `filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

#### Type Parameters

| Type Parameter | Default type                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `T`            | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |

#### Parameters

| Parameter  | Type                                            |
| ---------- | ----------------------------------------------- |
| `data`     | readonly `T`[]                                  |
| `filePath` | `string`                                        |
| `options?` | [`CSVProcessingOptions`](#csvprocessingoptions) |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

---

### CSVValidateFunction()

> **CSVValidateFunction** = (`data`) => [`DataResult`](#dataresult)\<`boolean`\>

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `data`    | `string` |

#### Returns

[`DataResult`](#dataresult)\<`boolean`\>

---

### CSVDetectFormatFunction()

> **CSVDetectFormatFunction** = (`data`) => [`DataResult`](#dataresult)\<[`CSVFormatInfo`](#csvformatinfo)\>

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `data`    | `string` |

#### Returns

[`DataResult`](#dataresult)\<[`CSVFormatInfo`](#csvformatinfo)\>

---

### CreateCSVOperations()

> **CreateCSVOperations** = (`config?`) => [`CSVOperations`](#csvoperations)

#### Parameters

| Parameter | Type                      |
| --------- | ------------------------- |
| `config?` | [`CSVConfig`](#csvconfig) |

#### Returns

[`CSVOperations`](#csvoperations)

---

### CreateDetectionOperations()

> **CreateDetectionOperations** = (`config?`) => [`DetectionOperations`](#detectionoperations)

#### Parameters

| Parameter | Type                                  |
| --------- | ------------------------------------- |
| `config?` | [`DetectionConfig`](#detectionconfig) |

#### Returns

[`DetectionOperations`](#detectionoperations)

---

### ExcelConfigProvider()

> **ExcelConfigProvider** = () => [`ExcelConfig`](#excelconfig)

#### Returns

[`ExcelConfig`](#excelconfig)

---

### ExcelParseBufferFunction()

> **ExcelParseBufferFunction** = (`buffer`, `options?`) => [`DataResult`](#dataresult)\<`any`[]\>

#### Parameters

| Parameter  | Type                                                |
| ---------- | --------------------------------------------------- |
| `buffer`   | `Buffer`                                            |
| `options?` | [`ExcelProcessingOptions`](#excelprocessingoptions) |

#### Returns

[`DataResult`](#dataresult)\<`any`[]\>

---

### ExcelParseFileFunction()

> **ExcelParseFileFunction** = (`filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`any`[]\>\>

#### Parameters

| Parameter  | Type                                                |
| ---------- | --------------------------------------------------- |
| `filePath` | `string`                                            |
| `options?` | [`ExcelProcessingOptions`](#excelprocessingoptions) |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`any`[]\>\>

---

### ExcelStringifyFunction()

> **ExcelStringifyFunction** = (`data`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\>\>

#### Parameters

| Parameter  | Type                                                |
| ---------- | --------------------------------------------------- |
| `data`     | `any`[]                                             |
| `options?` | [`ExcelProcessingOptions`](#excelprocessingoptions) |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`Buffer`\>\>

---

### ExcelWriteFileFunction()

> **ExcelWriteFileFunction** = (`data`, `filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

#### Parameters

| Parameter  | Type                                                |
| ---------- | --------------------------------------------------- |
| `data`     | `any`[]                                             |
| `filePath` | `string`                                            |
| `options?` | [`ExcelProcessingOptions`](#excelprocessingoptions) |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

---

### ExcelValidateFunction()

> **ExcelValidateFunction** = (`buffer`) => [`DataResult`](#dataresult)\<`boolean`\>

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `buffer`  | `Buffer` |

#### Returns

[`DataResult`](#dataresult)\<`boolean`\>

---

### ExcelDetectFormatFunction()

> **ExcelDetectFormatFunction** = (`buffer`) => [`DataResult`](#dataresult)\<[`ExcelFormatInfo`](#excelformatinfo)\>

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `buffer`  | `Buffer` |

#### Returns

[`DataResult`](#dataresult)\<[`ExcelFormatInfo`](#excelformatinfo)\>

---

### CreateExcelOperations()

> **CreateExcelOperations** = (`config?`) => [`ExcelOperations`](#exceloperations)

#### Parameters

| Parameter | Type                          |
| --------- | ----------------------------- |
| `config?` | [`ExcelConfig`](#excelconfig) |

#### Returns

[`ExcelOperations`](#exceloperations)

---

### FormatResult\<T\>

> **FormatResult**\<`T`\> = [`Result`](https://github.com/supermacro/neverthrow#result)\<`T`, `CoreError`\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

---

### JSONConfigProvider()

> **JSONConfigProvider** = () => [`JSONConfig`](#jsonconfig)

#### Returns

[`JSONConfig`](#jsonconfig)

---

### JSONParseFunction()

> **JSONParseFunction** = (`data`, `options?`) => [`DataResult`](#dataresult)\<`any`\>

#### Parameters

| Parameter  | Type                                              |
| ---------- | ------------------------------------------------- |
| `data`     | `string`                                          |
| `options?` | [`JSONProcessingOptions`](#jsonprocessingoptions) |

#### Returns

[`DataResult`](#dataresult)\<`any`\>

---

### JSONParseFileFunction()

> **JSONParseFileFunction** = (`filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`any`\>\>

#### Parameters

| Parameter  | Type                                              |
| ---------- | ------------------------------------------------- |
| `filePath` | `string`                                          |
| `options?` | [`JSONProcessingOptions`](#jsonprocessingoptions) |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`any`\>\>

---

### JSONStringifyFunction()

> **JSONStringifyFunction** = (`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>

#### Parameters

| Parameter  | Type                                              |
| ---------- | ------------------------------------------------- |
| `data`     | `any`                                             |
| `options?` | [`JSONProcessingOptions`](#jsonprocessingoptions) |

#### Returns

[`DataResult`](#dataresult)\<`string`\>

---

### JSONWriteFileFunction()

> **JSONWriteFileFunction** = (`data`, `filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

#### Parameters

| Parameter  | Type                                              |
| ---------- | ------------------------------------------------- |
| `data`     | `any`                                             |
| `filePath` | `string`                                          |
| `options?` | [`JSONProcessingOptions`](#jsonprocessingoptions) |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

---

### JSONValidateFunction()

> **JSONValidateFunction** = (`data`) => [`DataResult`](#dataresult)\<`boolean`\>

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `data`    | `string` |

#### Returns

[`DataResult`](#dataresult)\<`boolean`\>

---

### JSONMinifyFunction()

> **JSONMinifyFunction** = (`data`) => [`DataResult`](#dataresult)\<`string`\>

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `data`    | `string` |

#### Returns

[`DataResult`](#dataresult)\<`string`\>

---

### JSONFormatFunction()

> **JSONFormatFunction** = (`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>

#### Parameters

| Parameter  | Type                                      |
| ---------- | ----------------------------------------- |
| `data`     | `string`                                  |
| `options?` | [`JSONFormatOptions`](#jsonformatoptions) |

#### Returns

[`DataResult`](#dataresult)\<`string`\>

---

### CreateJSONOperations()

> **CreateJSONOperations** = (`config?`) => [`JSONOperations`](#jsonoperations)

#### Parameters

| Parameter | Type                        |
| --------- | --------------------------- |
| `config?` | [`JSONConfig`](#jsonconfig) |

#### Returns

[`JSONOperations`](#jsonoperations)

---

### CreateMimeOperations()

> **CreateMimeOperations** = (`config?`) => [`MimeOperations`](#mimeoperations)

#### Parameters

| Parameter | Type                        |
| --------- | --------------------------- |
| `config?` | [`MimeConfig`](#mimeconfig) |

#### Returns

[`MimeOperations`](#mimeoperations)

---

### DataResult\<T\>

> **DataResult**\<`T`\> = [`Result`](https://github.com/supermacro/neverthrow#result)\<`T`, `CoreError`\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

---

### ParseOperation()\<T, O\>

> **ParseOperation**\<`T`, `O`\> = (`data`, `options?`) => [`DataResult`](#dataresult)\<`T`\>

#### Type Parameters

| Type Parameter | Default type                              |
| -------------- | ----------------------------------------- |
| `T`            | -                                         |
| `O`            | [`ProcessingOptions`](#processingoptions) |

#### Parameters

| Parameter  | Type     |
| ---------- | -------- |
| `data`     | `string` |
| `options?` | `O`      |

#### Returns

[`DataResult`](#dataresult)\<`T`\>

---

### ParseFileOperation()\<T, O\>

> **ParseFileOperation**\<`T`, `O`\> = (`filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`T`\>\>

#### Type Parameters

| Type Parameter | Default type                              |
| -------------- | ----------------------------------------- |
| `T`            | -                                         |
| `O`            | [`ProcessingOptions`](#processingoptions) |

#### Parameters

| Parameter  | Type     |
| ---------- | -------- |
| `filePath` | `string` |
| `options?` | `O`      |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`T`\>\>

---

### StringifyOperation()\<T, O\>

> **StringifyOperation**\<`T`, `O`\> = (`data`, `options?`) => [`DataResult`](#dataresult)\<`string`\>

#### Type Parameters

| Type Parameter | Default type                              |
| -------------- | ----------------------------------------- |
| `T`            | -                                         |
| `O`            | [`ProcessingOptions`](#processingoptions) |

#### Parameters

| Parameter  | Type |
| ---------- | ---- |
| `data`     | `T`  |
| `options?` | `O`  |

#### Returns

[`DataResult`](#dataresult)\<`string`\>

---

### WriteFileOperation()\<T, O\>

> **WriteFileOperation**\<`T`, `O`\> = (`data`, `filePath`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

#### Type Parameters

| Type Parameter | Default type                              |
| -------------- | ----------------------------------------- |
| `T`            | -                                         |
| `O`            | [`ProcessingOptions`](#processingoptions) |

#### Parameters

| Parameter  | Type     |
| ---------- | -------- |
| `data`     | `T`      |
| `filePath` | `string` |
| `options?` | `O`      |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`DataResult`](#dataresult)\<`void`\>\>

---

### ValidateOperation()

> **ValidateOperation** = (`data`) => [`DataResult`](#dataresult)\<`boolean`\>

#### Parameters

| Parameter | Type                 |
| --------- | -------------------- |
| `data`    | `string` \| `Buffer` |

#### Returns

[`DataResult`](#dataresult)\<`boolean`\>

## Variables

### createConversionOperations

> `const` **createConversionOperations**: [`CreateConversionOperations`](#createconversionoperations-1)

---

### CONVERSION_CATEGORIES

> `const` **CONVERSION_CATEGORIES**: `object`

#### Type declaration

| Name                                           | Type                                                                          |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| <a id="image_raster"></a> `IMAGE_RASTER`       | readonly \[`"jpg"`, `"jpeg"`, `"png"`, `"bmp"`, `"tiff"`, `"webp"`, `"gif"`\] |
| <a id="image_vector"></a> `IMAGE_VECTOR`       | readonly \[`"svg"`, `"eps"`, `"ai"`, `"pdf"`\]                                |
| <a id="video"></a> `VIDEO`                     | readonly \[`"mp4"`, `"avi"`, `"mov"`, `"wmv"`, `"flv"`, `"webm"`, `"mkv"`\]   |
| <a id="audio"></a> `AUDIO`                     | readonly \[`"mp3"`, `"wav"`, `"flac"`, `"aac"`, `"ogg"`, `"m4a"`\]            |
| <a id="document_text"></a> `DOCUMENT_TEXT`     | readonly \[`"txt"`, `"rtf"`, `"md"`, `"html"`, `"tex"`\]                      |
| <a id="document_office"></a> `DOCUMENT_OFFICE` | readonly \[`"doc"`, `"docx"`, `"odt"`, `"pdf"`\]                              |
| <a id="spreadsheet"></a> `SPREADSHEET`         | readonly \[`"xls"`, `"xlsx"`, `"ods"`, `"csv"`\]                              |
| <a id="presentation"></a> `PRESENTATION`       | readonly \[`"ppt"`, `"pptx"`, `"odp"`, `"pdf"`\]                              |
| <a id="archive"></a> `ARCHIVE`                 | readonly \[`"zip"`, `"rar"`, `"7z"`, `"tar"`, `"gz"`, `"bz2"`\]               |
| <a id="data"></a> `DATA`                       | readonly \[`"json"`, `"xml"`, `"yaml"`, `"toml"`, `"csv"`, `"tsv"`\]          |

---

### QUALITY_DEFINITIONS

> `const` **QUALITY_DEFINITIONS**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`ConversionQuality`, \{ `description`: `string`; `dataLoss`: `boolean`; `fidelity`: `number`; \}\>

---

### createCSVOperations

> `const` **createCSVOperations**: [`CreateCSVOperations`](#createcsvoperations-1)

---

### defaultCSVConfig

> `const` **defaultCSVConfig**: [`Required`](https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype)\<[`CSVConfig`](#csvconfig)\>

---

### createDetectionOperations

> `const` **createDetectionOperations**: [`CreateDetectionOperations`](#createdetectionoperations-1)

---

### createDataError()

> `const` **createDataError**: (`type`, `code`, `message`, `options?`) => `CoreError`

#### Parameters

| Parameter              | Type                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                 | `string`                                                                                                                                                                                                                                                                                                                     |
| `code`                 | `string`                                                                                                                                                                                                                                                                                                                     |
| `message`              | `string`                                                                                                                                                                                                                                                                                                                     |
| `options?`             | \{ `operation?`: `string`; `details?`: `string`; `cause?`: `unknown`; `context?`: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>; `recoverable?`: `boolean`; `severity?`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `suggestion?`: `string`; \} |
| `options.operation?`   | `string`                                                                                                                                                                                                                                                                                                                     |
| `options.details?`     | `string`                                                                                                                                                                                                                                                                                                                     |
| `options.cause?`       | `unknown`                                                                                                                                                                                                                                                                                                                    |
| `options.context?`     | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>                                                                                                                                                                                                           |
| `options.recoverable?` | `boolean`                                                                                                                                                                                                                                                                                                                    |
| `options.severity?`    | `"low"` \| `"medium"` \| `"high"` \| `"critical"`                                                                                                                                                                                                                                                                            |
| `options.suggestion?`  | `string`                                                                                                                                                                                                                                                                                                                     |

#### Returns

`CoreError`

---

### createExcelOperations

> `const` **createExcelOperations**: [`CreateExcelOperations`](#createexceloperations-1)

---

### defaultExcelConfig

> `const` **defaultExcelConfig**: [`Required`](https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype)\<[`Omit`](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)\<[`ExcelConfig`](#excelconfig), `"worksheetName"` \| `"range"`\>\> & [`Pick`](https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys)\<[`ExcelConfig`](#excelconfig), `"worksheetName"` \| `"range"`\>

---

### createJSONOperations

> `const` **createJSONOperations**: [`CreateJSONOperations`](#createjsonoperations-1)

---

### defaultJSONConfig

> `const` **defaultJSONConfig**: [`Required`](https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype)\<[`Omit`](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)\<[`JSONConfig`](#jsonconfig), `"reviver"` \| `"replacer"` \| `"space"`\>\> & [`Pick`](https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys)\<[`JSONConfig`](#jsonconfig), `"reviver"` \| `"replacer"` \| `"space"`\>

---

### createMimeOperations

> `const` **createMimeOperations**: [`CreateMimeOperations`](#createmimeoperations-1)

---

### COMMON_MIME_TYPES

> `const` **COMMON_MIME_TYPES**: `object`

#### Type declaration

| Name                               | Type                                                                          | Default value                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| <a id="jpeg"></a> `JPEG`           | `"image/jpeg"`                                                                | `'image/jpeg'`                                                                |
| <a id="png"></a> `PNG`             | `"image/png"`                                                                 | `'image/png'`                                                                 |
| <a id="gif"></a> `GIF`             | `"image/gif"`                                                                 | `'image/gif'`                                                                 |
| <a id="webp"></a> `WEBP`           | `"image/webp"`                                                                | `'image/webp'`                                                                |
| <a id="svg"></a> `SVG`             | `"image/svg+xml"`                                                             | `'image/svg+xml'`                                                             |
| <a id="bmp"></a> `BMP`             | `"image/bmp"`                                                                 | `'image/bmp'`                                                                 |
| <a id="ico"></a> `ICO`             | `"image/x-icon"`                                                              | `'image/x-icon'`                                                              |
| <a id="tiff"></a> `TIFF`           | `"image/tiff"`                                                                | `'image/tiff'`                                                                |
| <a id="pdf"></a> `PDF`             | `"application/pdf"`                                                           | `'application/pdf'`                                                           |
| <a id="doc"></a> `DOC`             | `"application/msword"`                                                        | `'application/msword'`                                                        |
| <a id="docx"></a> `DOCX`           | `"application/vnd.openxmlformats-officedocument.wordprocessingml.document"`   | `'application/vnd.openxmlformats-officedocument.wordprocessingml.document'`   |
| <a id="xls"></a> `XLS`             | `"application/vnd.ms-excel"`                                                  | `'application/vnd.ms-excel'`                                                  |
| <a id="xlsx"></a> `XLSX`           | `"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"`         | `'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'`         |
| <a id="ppt"></a> `PPT`             | `"application/vnd.ms-powerpoint"`                                             | `'application/vnd.ms-powerpoint'`                                             |
| <a id="pptx"></a> `PPTX`           | `"application/vnd.openxmlformats-officedocument.presentationml.presentation"` | `'application/vnd.openxmlformats-officedocument.presentationml.presentation'` |
| <a id="zip"></a> `ZIP`             | `"application/zip"`                                                           | `'application/zip'`                                                           |
| <a id="rar"></a> `RAR`             | `"application/vnd.rar"`                                                       | `'application/vnd.rar'`                                                       |
| <a id="tar"></a> `TAR`             | `"application/x-tar"`                                                         | `'application/x-tar'`                                                         |
| <a id="gzip"></a> `GZIP`           | `"application/gzip"`                                                          | `'application/gzip'`                                                          |
| <a id="sevenz"></a> `SEVENZ`       | `"application/x-7z-compressed"`                                               | `'application/x-7z-compressed'`                                               |
| <a id="mp3"></a> `MP3`             | `"audio/mpeg"`                                                                | `'audio/mpeg'`                                                                |
| <a id="wav"></a> `WAV`             | `"audio/wav"`                                                                 | `'audio/wav'`                                                                 |
| <a id="flac"></a> `FLAC`           | `"audio/flac"`                                                                | `'audio/flac'`                                                                |
| <a id="ogg"></a> `OGG`             | `"audio/ogg"`                                                                 | `'audio/ogg'`                                                                 |
| <a id="m4a"></a> `M4A`             | `"audio/mp4"`                                                                 | `'audio/mp4'`                                                                 |
| <a id="mp4"></a> `MP4`             | `"video/mp4"`                                                                 | `'video/mp4'`                                                                 |
| <a id="avi"></a> `AVI`             | `"video/x-msvideo"`                                                           | `'video/x-msvideo'`                                                           |
| <a id="mov"></a> `MOV`             | `"video/quicktime"`                                                           | `'video/quicktime'`                                                           |
| <a id="webm"></a> `WEBM`           | `"video/webm"`                                                                | `'video/webm'`                                                                |
| <a id="mkv"></a> `MKV`             | `"video/x-matroska"`                                                          | `'video/x-matroska'`                                                          |
| <a id="text"></a> `TEXT`           | `"text/plain"`                                                                | `'text/plain'`                                                                |
| <a id="html"></a> `HTML`           | `"text/html"`                                                                 | `'text/html'`                                                                 |
| <a id="css"></a> `CSS`             | `"text/css"`                                                                  | `'text/css'`                                                                  |
| <a id="js"></a> `JS`               | `"application/javascript"`                                                    | `'application/javascript'`                                                    |
| <a id="json"></a> `JSON`           | `"application/json"`                                                          | `'application/json'`                                                          |
| <a id="xml"></a> `XML`             | `"application/xml"`                                                           | `'application/xml'`                                                           |
| <a id="csv"></a> `CSV`             | `"text/csv"`                                                                  | `'text/csv'`                                                                  |
| <a id="yaml"></a> `YAML`           | `"application/x-yaml"`                                                        | `'application/x-yaml'`                                                        |
| <a id="binary"></a> `BINARY`       | `"application/octet-stream"`                                                  | `'application/octet-stream'`                                                  |
| <a id="form"></a> `FORM`           | `"application/x-www-form-urlencoded"`                                         | `'application/x-www-form-urlencoded'`                                         |
| <a id="multipart"></a> `MULTIPART` | `"multipart/form-data"`                                                       | `'multipart/form-data'`                                                       |

---

### MIME_TYPE_CATEGORIES

> `const` **MIME_TYPE_CATEGORIES**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`FileCategory`, readonly `string`[]\>

---

### data

> `const` **data**: [`UnifiedDataOperations`](#unifieddataoperations)

Default data operations instance with standard configuration

## Functions

### createCSVError()

> **createCSVError**(`message`, `options?`): `CoreError`

#### Parameters

| Parameter          | Type                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`          | `string`                                                                                                                                                                         |
| `options?`         | \{ `details?`: `string`; `cause?`: `unknown`; `context?`: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>; \} |
| `options.details?` | `string`                                                                                                                                                                         |
| `options.cause?`   | `unknown`                                                                                                                                                                        |
| `options.context?` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>                                                               |

#### Returns

`CoreError`

---

### createJSONError()

> **createJSONError**(`message`, `options?`): `CoreError`

#### Parameters

| Parameter          | Type                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`          | `string`                                                                                                                                                                         |
| `options?`         | \{ `details?`: `string`; `cause?`: `unknown`; `context?`: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>; \} |
| `options.details?` | `string`                                                                                                                                                                         |
| `options.cause?`   | `unknown`                                                                                                                                                                        |
| `options.context?` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>                                                               |

#### Returns

`CoreError`

---

### createExcelError()

> **createExcelError**(`message`, `options?`): `CoreError`

#### Parameters

| Parameter          | Type                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`          | `string`                                                                                                                                                                         |
| `options?`         | \{ `details?`: `string`; `cause?`: `unknown`; `context?`: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>; \} |
| `options.details?` | `string`                                                                                                                                                                         |
| `options.cause?`   | `unknown`                                                                                                                                                                        |
| `options.context?` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>                                                               |

#### Returns

`CoreError`

---

### createParsingError()

> **createParsingError**(`message`, `options?`): `CoreError`

#### Parameters

| Parameter          | Type                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`          | `string`                                                                                                                                                                         |
| `options?`         | \{ `details?`: `string`; `cause?`: `unknown`; `context?`: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>; \} |
| `options.details?` | `string`                                                                                                                                                                         |
| `options.cause?`   | `unknown`                                                                                                                                                                        |
| `options.context?` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>                                                               |

#### Returns

`CoreError`

---

### createValidationError()

> **createValidationError**(`message`, `options?`): `CoreError`

#### Parameters

| Parameter          | Type                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`          | `string`                                                                                                                                                                         |
| `options?`         | \{ `details?`: `string`; `cause?`: `unknown`; `context?`: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>; \} |
| `options.details?` | `string`                                                                                                                                                                         |
| `options.cause?`   | `unknown`                                                                                                                                                                        |
| `options.context?` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>                                                               |

#### Returns

`CoreError`

---

### createFormatDetectionError()

> **createFormatDetectionError**(`message`, `options?`): `CoreError`

#### Parameters

| Parameter          | Type                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`          | `string`                                                                                                                                                                         |
| `options?`         | \{ `details?`: `string`; `cause?`: `unknown`; `context?`: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>; \} |
| `options.details?` | `string`                                                                                                                                                                         |
| `options.cause?`   | `unknown`                                                                                                                                                                        |
| `options.context?` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>                                                               |

#### Returns

`CoreError`

---

### createConversionError()

> **createConversionError**(`message`, `options?`): `CoreError`

#### Parameters

| Parameter          | Type                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`          | `string`                                                                                                                                                                         |
| `options?`         | \{ `details?`: `string`; `cause?`: `unknown`; `context?`: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>; \} |
| `options.details?` | `string`                                                                                                                                                                         |
| `options.cause?`   | `unknown`                                                                                                                                                                        |
| `options.context?` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>                                                               |

#### Returns

`CoreError`

---

### mapNodeError()

> **mapNodeError**(`operation`, `path`, `error`): `CoreError`

#### Parameters

| Parameter   | Type      |
| ----------- | --------- |
| `operation` | `string`  |
| `path`      | `string`  |
| `error`     | `unknown` |

#### Returns

`CoreError`

---

### mapLibraryError()

> **mapLibraryError**(`library`, `operation`, `error`): `CoreError`

#### Parameters

| Parameter   | Type      |
| ----------- | --------- |
| `library`   | `string`  |
| `operation` | `string`  |
| `error`     | `unknown` |

#### Returns

`CoreError`

---

### mapValidationError()

> **mapValidationError**(`field`, `value`, `error`): `CoreError`

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `field`   | `string`  |
| `value`   | `unknown` |
| `error`   | `unknown` |

#### Returns

`CoreError`

---

### createUnifiedDataOperations()

> **createUnifiedDataOperations**(`config`): [`UnifiedDataOperations`](#unifieddataoperations)

#### Parameters

| Parameter | Type                                      |
| --------- | ----------------------------------------- |
| `config`  | [`UnifiedDataConfig`](#unifieddataconfig) |

#### Returns

[`UnifiedDataOperations`](#unifieddataoperations)
