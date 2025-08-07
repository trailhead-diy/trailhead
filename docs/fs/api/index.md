**@esteban-url/fs**

---

# @repo/fs

> Filesystem operations with Result-based error handling

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/esteban-url/trailhead/blob/main/LICENSE)

## Features

- Result-based error handling for all operations
- Complete filesystem coverage (read, write, copy, move, remove)
- Built-in JSON support
- Mock filesystem for testing
- Path manipulation utilities
- Full TypeScript support

## Installation

```bash
pnpm add @repo/fs
# or
npm install @repo/fs
```

## Quick Start

```typescript
import { fs } from '@repo/fs'

// Read a file
const result = await fs.readFile('./config.json')
if (result.isOk()) {
  console.log('File contents:', result.value)
}

// Write a file
await fs.writeFile('./output.txt', 'Hello, World!')

// JSON operations
const config = await fs.readJson('./config.json')
await fs.writeJson('./data.json', { name: 'My App' })

// Directory operations
await fs.ensureDir('./logs/2024')
await fs.copy('./source', './destination')
await fs.move('./old.txt', './new.txt')
```

## API Reference

### Core Operations

```typescript
import { fs } from '@repo/fs'

// File operations
await fs.readFile(path)
await fs.writeFile(path, content)
await fs.exists(path)
await fs.stat(path)

// Directory operations
await fs.mkdir(path, options?)
await fs.readDir(path)
await fs.ensureDir(path)
await fs.emptyDir(path)

// File management
await fs.copy(src, dest, options?)
await fs.move(src, dest, options?)
await fs.remove(path, options?)

// JSON operations
await fs.readJson(path)
await fs.writeJson(path, data, options?)

// Utilities
await fs.outputFile(path, content)
await fs.findFiles(pattern, options?)
```

### Path Utilities

```typescript
import { join, resolve, dirname, basename, extname, isAbsolute } from '@repo/fs/utils'

const fullPath = join('src', 'components', 'Button.tsx')
const absPath = resolve('./config.json')
const dir = dirname('/path/to/file.txt')
const name = basename('/path/to/file.txt')
const ext = extname('script.ts')
const isAbs = isAbsolute('/home/user')
```

### Testing

```typescript
import { createMockFS } from '@repo/fs/testing'

const mockFS = createMockFS({
  '/app/config.json': '{"name": "test"}',
  '/app/data/': null, // directory
})

// Use mockFS exactly like fs
const result = await mockFS.readJson('/app/config.json')
```

## Related Packages

- **@repo/core** - Result types and functional utilities
- **@repo/data** - Data processing and format conversion
- **@repo/validation** - Data validation

## Documentation

- [Tutorials](_media/README.md)
  - [File Operations Basics](_media/file-operations-basics.md)
- [How-to Guides](_media/file-operations.md)
  - [Perform Atomic File Operations](_media/perform-atomic-file-operations.md)
- [Explanations](_media/result-patterns.md)
  - [Result Types Pattern](_media/result-types-pattern.md)
  - [Functional Architecture](_media/functional-architecture.md)
- [API Reference](_media/api.md)

## License

MIT © [Esteban URL](https://github.com/esteban-url)

## Interfaces

### FileStats

#### Properties

| Property                                     | Modifier   | Type      |
| -------------------------------------------- | ---------- | --------- |
| <a id="size"></a> `size`                     | `readonly` | `number`  |
| <a id="isfile"></a> `isFile`                 | `readonly` | `boolean` |
| <a id="isdirectory"></a> `isDirectory`       | `readonly` | `boolean` |
| <a id="issymboliclink"></a> `isSymbolicLink` | `readonly` | `boolean` |
| <a id="mtime"></a> `mtime`                   | `readonly` | `Date`    |

---

### FileSystemError

#### Extends

- `CoreError`

#### Properties

| Property                               | Modifier   | Type                                                                                                               | Overrides               | Inherited from         |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------- | ---------------------- |
| <a id="message"></a> `message`         | `readonly` | `string`                                                                                                           | -                       | `CoreError.message`    |
| <a id="details"></a> `details?`        | `readonly` | `string`                                                                                                           | -                       | `CoreError.details`    |
| <a id="cause"></a> `cause?`            | `readonly` | `unknown`                                                                                                          | -                       | `CoreError.cause`      |
| <a id="suggestion"></a> `suggestion?`  | `readonly` | `string`                                                                                                           | -                       | `CoreError.suggestion` |
| <a id="context"></a> `context?`        | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> | -                       | `CoreError.context`    |
| <a id="type"></a> `type`               | `readonly` | `"FILESYSTEM_ERROR"`                                                                                               | `CoreError.type`        | -                      |
| <a id="code"></a> `code`               | `readonly` | `string`                                                                                                           | `CoreError.code`        | -                      |
| <a id="path"></a> `path?`              | `readonly` | `string`                                                                                                           | -                       | -                      |
| <a id="component"></a> `component`     | `readonly` | `"filesystem"`                                                                                                     | `CoreError.component`   | -                      |
| <a id="operation"></a> `operation`     | `readonly` | `string`                                                                                                           | `CoreError.operation`   | -                      |
| <a id="severity"></a> `severity`       | `readonly` | `"low"` \| `"medium"` \| `"high"` \| `"critical"`                                                                  | `CoreError.severity`    | -                      |
| <a id="recoverable"></a> `recoverable` | `readonly` | `boolean`                                                                                                          | `CoreError.recoverable` | -                      |
| <a id="timestamp"></a> `timestamp`     | `readonly` | `Date`                                                                                                             | `CoreError.timestamp`   | -                      |

---

### CopyOptions

#### Properties

| Property                            | Modifier   | Type      |
| ----------------------------------- | ---------- | --------- |
| <a id="overwrite"></a> `overwrite?` | `readonly` | `boolean` |
| <a id="recursive"></a> `recursive?` | `readonly` | `boolean` |

---

### MoveOptions

#### Properties

| Property                              | Modifier   | Type      |
| ------------------------------------- | ---------- | --------- |
| <a id="overwrite-1"></a> `overwrite?` | `readonly` | `boolean` |

---

### MkdirOptions

#### Properties

| Property                              | Modifier   | Type      |
| ------------------------------------- | ---------- | --------- |
| <a id="recursive-1"></a> `recursive?` | `readonly` | `boolean` |

---

### RmOptions

#### Properties

| Property                              | Modifier   | Type      |
| ------------------------------------- | ---------- | --------- |
| <a id="recursive-2"></a> `recursive?` | `readonly` | `boolean` |
| <a id="force"></a> `force?`           | `readonly` | `boolean` |

---

### FSConfig

#### Properties

| Property                                | Modifier   | Type             |
| --------------------------------------- | ---------- | ---------------- |
| <a id="encoding"></a> `encoding?`       | `readonly` | `BufferEncoding` |
| <a id="defaultmode"></a> `defaultMode?` | `readonly` | `number`         |
| <a id="jsonspaces"></a> `jsonSpaces?`   | `readonly` | `number`         |

## Type Aliases

### FSResult\<T\>

> **FSResult**\<`T`\> = [`Result`](https://github.com/supermacro/neverthrow#result)\<`T`, [`FileSystemError`](#filesystemerror)\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

---

### ReadFileOp()

> **ReadFileOp** = (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`string`\>\>

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`string`\>\>

---

### WriteFileOp()

> **WriteFileOp** = (`path`, `content`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |
| `content` | `string` |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

---

### ExistsOp()

> **ExistsOp** = (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`boolean`\>\>

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`boolean`\>\>

---

### StatOp()

> **StatOp** = (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<[`FileStats`](#filestats)\>\>

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<[`FileStats`](#filestats)\>\>

---

### MkdirOp()

> **MkdirOp** = (`path`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

#### Parameters

| Parameter  | Type                            |
| ---------- | ------------------------------- |
| `path`     | `string`                        |
| `options?` | [`MkdirOptions`](#mkdiroptions) |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

---

### ReadDirOp()

> **ReadDirOp** = (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`string`[]\>\>

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`string`[]\>\>

---

### CopyOp()

> **CopyOp** = (`src`, `dest`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

#### Parameters

| Parameter  | Type                          |
| ---------- | ----------------------------- |
| `src`      | `string`                      |
| `dest`     | `string`                      |
| `options?` | [`CopyOptions`](#copyoptions) |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

---

### MoveOp()

> **MoveOp** = (`src`, `dest`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

#### Parameters

| Parameter  | Type                          |
| ---------- | ----------------------------- |
| `src`      | `string`                      |
| `dest`     | `string`                      |
| `options?` | [`MoveOptions`](#moveoptions) |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

---

### RemoveOp()

> **RemoveOp** = (`path`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

#### Parameters

| Parameter  | Type                      |
| ---------- | ------------------------- |
| `path`     | `string`                  |
| `options?` | [`RmOptions`](#rmoptions) |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

---

### ReadJsonOp()

> **ReadJsonOp** = \<`T`\>(`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`T`\>\>

#### Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `T`            | `any`        |

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`T`\>\>

---

### WriteJsonOp()

> **WriteJsonOp** = \<`T`\>(`path`, `data`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

#### Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `T`            | `any`        |

#### Parameters

| Parameter         | Type                       |
| ----------------- | -------------------------- |
| `path`            | `string`                   |
| `data`            | `T`                        |
| `options?`        | \{ `spaces?`: `number`; \} |
| `options.spaces?` | `number`                   |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

## Variables

### defaultFSConfig

> `const` **defaultFSConfig**: [`FSConfig`](#fsconfig)

---

### fs

> `const` **fs**: `object`

#### Type declaration

| Name                                         | Type                                                                                                                                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="readfile-3"></a> `readFile`           | [`ReadFileOp`](#readfileop)                                                                                                                                                 |
| <a id="writefile-3"></a> `writeFile`         | [`WriteFileOp`](#writefileop)                                                                                                                                               |
| <a id="exists-3"></a> `exists`               | [`ExistsOp`](#existsop)                                                                                                                                                     |
| <a id="stat-3"></a> `stat`                   | [`StatOp`](#statop)                                                                                                                                                         |
| <a id="mkdir-3"></a> `mkdir`                 | [`MkdirOp`](#mkdirop)                                                                                                                                                       |
| <a id="readdir-3"></a> `readDir`             | [`ReadDirOp`](#readdirop)                                                                                                                                                   |
| <a id="copy-3"></a> `copy`                   | [`CopyOp`](#copyop)                                                                                                                                                         |
| <a id="move-3"></a> `move`                   | [`MoveOp`](#moveop)                                                                                                                                                         |
| <a id="remove-3"></a> `remove`               | [`RemoveOp`](#removeop)                                                                                                                                                     |
| <a id="readjson-3"></a> `readJson`           | [`ReadJsonOp`](#readjsonop)                                                                                                                                                 |
| <a id="writejson-3"></a> `writeJson`         | [`WriteJsonOp`](#writejsonop)                                                                                                                                               |
| <a id="ensuredir-3"></a> `ensureDir()`       | (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>                      |
| <a id="outputfile-3"></a> `outputFile()`     | (`path`, `content`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>           |
| <a id="emptydir-3"></a> `emptyDir()`         | (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>                      |
| <a id="findfiles-3"></a> `findFiles()`       | (`pattern`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`string`[]\>\>   |
| <a id="readifexists-3"></a> `readIfExists()` | (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`null` \| `string`\>\>          |
| <a id="copyifexists-3"></a> `copyIfExists()` | (`src`, `dest`, `options`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`boolean`\>\> |

---

### isWindows

> `const` **isWindows**: `boolean`

---

### pathSep

> `const` **pathSep**: "\\" \| `"/"` = `sep`

---

### pathMatchers

> `const` **pathMatchers**: `object`

Path matchers for testing and filtering

#### Type declaration

| Name                                       | Type                                   |
| ------------------------------------------ | -------------------------------------- |
| <a id="endswith"></a> `endsWith()`         | (`suffix`) => (`path`) => `boolean`    |
| <a id="startswith"></a> `startsWith()`     | (`prefix`) => (`path`) => `boolean`    |
| <a id="contains"></a> `contains()`         | (`substring`) => (`path`) => `boolean` |
| <a id="hasextension"></a> `hasExtension()` | (`extension`) => (`path`) => `boolean` |
| <a id="indirectory"></a> `inDirectory()`   | (`directory`) => (`path`) => `boolean` |
| <a id="ischildof"></a> `isChildOf()`       | (`directory`) => (`path`) => `boolean` |

---

### pathAssertions

> `const` **pathAssertions**: `object`

Assertion helpers for cross-platform path testing

#### Type declaration

| Name                     | Type                                           | Description                                     |
| ------------------------ | ---------------------------------------------- | ----------------------------------------------- |
| `pathContains()`         | (`actualPath`, `expectedSegment`) => `boolean` | Asserts that a path contains a specific segment |
| `pathsEqual()`           | (`path1`, `path2`) => `boolean`                | Asserts that two paths are equivalent           |
| `hasCorrectSeparators()` | (`path`) => `boolean`                          | Asserts that a path uses correct separators     |

---

### testPaths

> `const` **testPaths**: `object`

Environment-specific path constants for testing

#### Type declaration

| Name                                             | Type          | Default value |
| ------------------------------------------------ | ------------- | ------------- |
| <a id="temp"></a> `temp`                         | `string`      | -             |
| <a id="fixtures"></a> `fixtures`                 | `string`      | -             |
| <a id="output"></a> `output`                     | `string`      | -             |
| <a id="mockproject"></a> `mockProject`           | `string`      | -             |
| <a id="mockcomponents"></a> `mockComponents`     | `string`      | -             |
| <a id="mocknodemodules"></a> `mockNodeModules`   | `string`      | -             |
| <a id="separator"></a> `separator`               | "\\" \| `"/"` | `sep`         |
| <a id="posixseparator"></a> `posixSeparator`     | `string`      | `'/'`         |
| <a id="windowsseparator"></a> `windowsSeparator` | `string`      | '\\'          |

## Functions

### readFile()

> **readFile**(`_config`): [`ReadFileOp`](#readfileop)

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

[`ReadFileOp`](#readfileop)

---

### writeFile()

> **writeFile**(`_config`): [`WriteFileOp`](#writefileop)

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

[`WriteFileOp`](#writefileop)

---

### exists()

> **exists**(`_config`): [`ExistsOp`](#existsop)

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

[`ExistsOp`](#existsop)

---

### stat()

> **stat**(`_config`): [`StatOp`](#statop)

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

[`StatOp`](#statop)

---

### mkdir()

> **mkdir**(`_config`): [`MkdirOp`](#mkdirop)

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

[`MkdirOp`](#mkdirop)

---

### readDir()

> **readDir**(`_config`): [`ReadDirOp`](#readdirop)

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

[`ReadDirOp`](#readdirop)

---

### copy()

> **copy**(`_config`): [`CopyOp`](#copyop)

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

[`CopyOp`](#copyop)

---

### move()

> **move**(`_config`): [`MoveOp`](#moveop)

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

[`MoveOp`](#moveop)

---

### remove()

> **remove**(`_config`): [`RemoveOp`](#removeop)

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

[`RemoveOp`](#removeop)

---

### readJson()

> **readJson**(`_config`): [`ReadJsonOp`](#readjsonop)

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

[`ReadJsonOp`](#readjsonop)

---

### writeJson()

> **writeJson**(`_config`): [`WriteJsonOp`](#writejsonop)

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

[`WriteJsonOp`](#writejsonop)

---

### ensureDir()

> **ensureDir**(`_config`): (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

> (`path`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

##### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

##### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

---

### outputFile()

> **outputFile**(`_config`): (`path`, `content`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

> (`path`, `content`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

##### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |
| `content` | `string` |

##### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

---

### emptyDir()

> **emptyDir**(`_config`): (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

> (`path`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

##### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

##### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

---

### findFiles()

> **findFiles**(`_config`): (`pattern`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`string`[]\>\>

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

> (`pattern`, `options?`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`string`[]\>\>

##### Parameters

| Parameter         | Type                                           |
| ----------------- | ---------------------------------------------- |
| `pattern`         | `string`                                       |
| `options?`        | \{ `cwd?`: `string`; `ignore?`: `string`[]; \} |
| `options.cwd?`    | `string`                                       |
| `options.ignore?` | `string`[]                                     |

##### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`string`[]\>\>

---

### readIfExists()

> **readIfExists**(`_config`): (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`null` \| `string`\>\>

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

> (`path`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`null` \| `string`\>\>

##### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

##### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`null` \| `string`\>\>

---

### copyIfExists()

> **copyIfExists**(`_config`): (`src`, `dest`, `options`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`boolean`\>\>

#### Parameters

| Parameter | Type                    | Default value     |
| --------- | ----------------------- | ----------------- |
| `_config` | [`FSConfig`](#fsconfig) | `defaultFSConfig` |

#### Returns

> (`src`, `dest`, `options`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`boolean`\>\>

##### Parameters

| Parameter | Type                          |
| --------- | ----------------------------- |
| `src`     | `string`                      |
| `dest`    | `string`                      |
| `options` | [`CopyOptions`](#copyoptions) |

##### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`boolean`\>\>

---

### createFileSystemError()

> **createFileSystemError**(`operation`, `message`, `options?`): [`FileSystemError`](#filesystemerror)

#### Parameters

| Parameter              | Type                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operation`            | `string`                                                                                                                                                                                                                                                                                                             |
| `message`              | `string`                                                                                                                                                                                                                                                                                                             |
| `options?`             | \{ `path?`: `string`; `code?`: `string`; `cause?`: `unknown`; `suggestion?`: `string`; `recoverable?`: `boolean`; `severity?`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `context?`: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>; \} |
| `options.path?`        | `string`                                                                                                                                                                                                                                                                                                             |
| `options.code?`        | `string`                                                                                                                                                                                                                                                                                                             |
| `options.cause?`       | `unknown`                                                                                                                                                                                                                                                                                                            |
| `options.suggestion?`  | `string`                                                                                                                                                                                                                                                                                                             |
| `options.recoverable?` | `boolean`                                                                                                                                                                                                                                                                                                            |
| `options.severity?`    | `"low"` \| `"medium"` \| `"high"` \| `"critical"`                                                                                                                                                                                                                                                                    |
| `options.context?`     | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>                                                                                                                                                                                                   |

#### Returns

[`FileSystemError`](#filesystemerror)

---

### mapNodeError()

> **mapNodeError**(`operation`, `path`, `error`): [`FileSystemError`](#filesystemerror)

#### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `operation` | `string` |
| `path`      | `string` |
| `error`     | `any`    |

#### Returns

[`FileSystemError`](#filesystemerror)

---

### normalizePath()

> **normalizePath**(`path`): `string`

Normalizes path separators for cross-platform compatibility

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

`string`

---

### createPath()

> **createPath**(...`segments`): `string`

Creates a platform-agnostic path for consistent usage

#### Parameters

| Parameter     | Type       |
| ------------- | ---------- |
| ...`segments` | `string`[] |

#### Returns

`string`

---

### createTestPath()

> **createTestPath**(...`segments`): `string`

Creates normalized, cross-platform paths for testing

#### Parameters

| Parameter     | Type       |
| ------------- | ---------- |
| ...`segments` | `string`[] |

#### Returns

`string`

---

### createAbsolutePath()

> **createAbsolutePath**(...`segments`): `string`

Creates absolute paths from current working directory

#### Parameters

| Parameter     | Type       |
| ------------- | ---------- |
| ...`segments` | `string`[] |

#### Returns

`string`

---

### joinPaths()

> **joinPaths**(...`paths`): `string`

Joins path segments with proper separators

#### Parameters

| Parameter  | Type       |
| ---------- | ---------- |
| ...`paths` | `string`[] |

#### Returns

`string`

---

### safeJoin()

> **safeJoin**(...`segments`): `string`

Safe path joining that handles mixed separator inputs

#### Parameters

| Parameter     | Type       |
| ------------- | ---------- |
| ...`segments` | `string`[] |

#### Returns

`string`

---

### resolvePath()

> **resolvePath**(`path`, `base?`): `string`

Resolves a path to an absolute path

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |
| `base?`   | `string` |

#### Returns

`string`

---

### createRelativePath()

> **createRelativePath**(`from`, `to`): `string`

Creates relative paths that work on all platforms

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `from`    | `string` |
| `to`      | `string` |

#### Returns

`string`

---

### safeRelative()

> **safeRelative**(`from`, `to`): `string`

Safe relative path calculation with fallback

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `from`    | `string` |
| `to`      | `string` |

#### Returns

`string`

---

### getDirectoryName()

> **getDirectoryName**(`path`): `string`

Gets the directory name of a path

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

`string`

---

### getBaseName()

> **getBaseName**(`path`, `ext?`): `string`

Gets the base name of a path

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |
| `ext?`    | `string` |

#### Returns

`string`

---

### getExtension()

> **getExtension**(`path`): `string`

Gets the extension of a path

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

`string`

---

### isAbsolutePath()

> **isAbsolutePath**(`path`): `boolean`

Checks if a path is absolute

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

`boolean`

---

### isRelativePath()

> **isRelativePath**(`path`): `boolean`

Checks if a path is relative

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

`boolean`

---

### toForwardSlashes()

> **toForwardSlashes**(`path`): `string`

Converts a path to use forward slashes (for consistent testing)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

`string`

---

### toBackslashes()

> **toBackslashes**(`path`): `string`

Converts a path to use backslashes (for Windows testing)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

`string`

---

### toPosixPath()

> **toPosixPath**(`path`): `string`

Converts Windows paths to POSIX for consistent string comparisons

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

`string`

---

### toWindowsPath()

> **toWindowsPath**(`path`): `string`

Converts POSIX paths to Windows format for Windows-specific testing

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

`string`

---

### normalizeMockPath()

> **normalizeMockPath**(`path`): `string`

Normalizes file paths for cross-platform mock filesystem

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

`string`

---

### getTempDir()

> **getTempDir**(): `string`

Gets the system temporary directory

#### Returns

`string`

---

### createTempPath()

> **createTempPath**(`prefix`, `timestamp`): `string`

Creates a temporary directory path for testing

#### Parameters

| Parameter   | Type     | Default value |
| ----------- | -------- | ------------- |
| `prefix`    | `string` | `'test'`      |
| `timestamp` | `number` | `...`         |

#### Returns

`string`

---

### isSafePath()

> **isSafePath**(`path`, `baseDir`): `boolean`

Validates that a path is safe (no directory traversal)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |
| `baseDir` | `string` |

#### Returns

`boolean`

---

### isValidName()

> **isValidName**(`path`): `boolean`

Validates that a path follows naming conventions

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `path`    | `string` |

#### Returns

`boolean`

---

### isAllowedPath()

> **isAllowedPath**(`path`, `allowedDirs`): `boolean`

Validates that a path is within allowed directories

#### Parameters

| Parameter     | Type       |
| ------------- | ---------- |
| `path`        | `string`   |
| `allowedDirs` | `string`[] |

#### Returns

`boolean`

---

### createPathRegex()

> **createPathRegex**(`pathPattern`): `RegExp`

Creates platform-specific regex patterns for path matching

#### Parameters

| Parameter     | Type     |
| ------------- | -------- |
| `pathPattern` | `string` |

#### Returns

`RegExp`

---

### createProjectStructure()

> **createProjectStructure**(`projectName`): `object`

Creates a mock project structure for testing

#### Parameters

| Parameter     | Type     |
| ------------- | -------- |
| `projectName` | `string` |

#### Returns

`object`

| Name          | Type     | Default value |
| ------------- | -------- | ------------- |
| `root`        | `string` | `base`        |
| `src`         | `string` | -             |
| `tests`       | `string` | -             |
| `dist`        | `string` | -             |
| `nodeModules` | `string` | -             |
| `packageJson` | `string` | -             |
| `tsconfig`    | `string` | -             |
| `readme`      | `string` | -             |
| `gitignore`   | `string` | -             |
| `indexTs`     | `string` | -             |
| `indexTest`   | `string` | -             |

---

### createTestConfig()

> **createTestConfig**(`overrides`): `object`

Utility for creating platform-agnostic test configurations

#### Parameters

| Parameter   | Type                                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| `overrides` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\> |

#### Returns

`object`

| Name            | Type     |
| --------------- | -------- |
| `projectRoot`   | `string` |
| `componentsDir` | `string` |
| `tempDir`       | `string` |
| `outputDir`     | `string` |
