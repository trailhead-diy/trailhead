---
type: reference
sidebar: true
example: 0
---

[**Trailhead API Documentation v1.0.0**](README.md)

---

[Trailhead API Documentation](README.md) / @trailhead/fs

# @trailhead/fs

## Interfaces

### CopyOptions

Options for copy operations.

#### Example

```typescript
// Copy a file
await fs.copy('source.txt', 'dest.txt', { overwrite: true })

// Copy a directory recursively
await fs.copy('src/', 'dist/', { recursive: true, overwrite: true })
```

#### Properties

##### overwrite?

> `readonly` `optional` **overwrite**: `boolean`

Whether to overwrite existing files (defaults to true)

##### recursive?

> `readonly` `optional` **recursive**: `boolean`

Whether to copy directories recursively

---

### FileStats

File statistics information returned by stat operations.

#### Example

```typescript
const stats = await fs.stat('file.txt')
if (stats.isOk()) {
  console.log(`Size: ${stats.value.size} bytes`)
  console.log(`Is file: ${stats.value.isFile}`)
  console.log(`Modified: ${stats.value.mtime}`)
}
```

#### Properties

##### atime

> `readonly` **atime**: `Date`

Last access time

##### ctime

> `readonly` **ctime**: `Date`

Creation time

##### isDirectory

> `readonly` **isDirectory**: `boolean`

Whether the path points to a directory

##### isFile

> `readonly` **isFile**: `boolean`

Whether the path points to a regular file

##### isSymbolicLink

> `readonly` **isSymbolicLink**: `boolean`

Whether the path points to a symbolic link

##### mtime

> `readonly` **mtime**: `Date`

Last modification time

##### name?

> `readonly` `optional` **name**: `string`

Optional file name

##### size

> `readonly` **size**: `number`

Size of the file in bytes

---

### FileSystemError

Structured error type for all filesystem operations.
Extends CoreError with filesystem-specific context.

#### Example

```typescript
const result = await fs.readFile('missing.txt')
if (result.isErr()) {
  const error = result.error
  console.log(`Operation: ${error.operation}`)
  console.log(`Path: ${error.path}`)
  console.log(`Code: ${error.code}`) // e.g., 'ENOENT'
  console.log(`Suggestion: ${error.suggestion}`)
}
```

#### Extends

- [`CoreError`](@trailhead.cli.md#coreerror)

#### Properties

##### cause?

> `readonly` `optional` **cause**: `unknown`

Original error that caused this error

###### Inherited from

[`CoreError`](@trailhead.cli.md#coreerror).[`cause`](@trailhead.cli.md#cause)

##### code

> `readonly` **code**: `string`

System error code (e.g., 'ENOENT', 'EACCES', 'EEXIST')

###### Overrides

[`CoreError`](@trailhead.cli.md#coreerror).[`code`](@trailhead.cli.md#code)

##### component

> `readonly` **component**: `"filesystem"`

Component identifier

###### Overrides

[`CoreError`](@trailhead.cli.md#coreerror).[`component`](@trailhead.cli.md#component)

##### context?

> `readonly` `optional` **context**: `Record`\<`string`, `unknown`\>

Additional context data for debugging

###### Inherited from

[`CoreError`](@trailhead.cli.md#coreerror).[`context`](@trailhead.cli.md#context)

##### details?

> `readonly` `optional` **details**: `string`

Additional error details for debugging

###### Inherited from

[`CoreError`](@trailhead.cli.md#coreerror).[`details`](@trailhead.cli.md#details)

##### message

> `readonly` **message**: `string`

Human-readable error message

###### Inherited from

[`CoreError`](@trailhead.cli.md#coreerror).[`message`](@trailhead.cli.md#message)

##### operation

> `readonly` **operation**: `string`

Operation that failed (e.g., 'Read file', 'Create directory')

###### Overrides

[`CoreError`](@trailhead.cli.md#coreerror).[`operation`](@trailhead.cli.md#operation)

##### path?

> `readonly` `optional` **path**: `string`

File or directory path that caused the error

##### recoverable

> `readonly` **recoverable**: `boolean`

Whether the error is recoverable (e.g., retry might succeed)

###### Overrides

[`CoreError`](@trailhead.cli.md#coreerror).[`recoverable`](@trailhead.cli.md#recoverable)

##### severity

> `readonly` **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Error severity level

###### Overrides

[`CoreError`](@trailhead.cli.md#coreerror).[`severity`](@trailhead.cli.md#severity)

##### suggestion?

> `readonly` `optional` **suggestion**: `string`

Helpful suggestion for error recovery

###### Inherited from

[`CoreError`](@trailhead.cli.md#coreerror).[`suggestion`](@trailhead.cli.md#suggestion)

##### timestamp

> `readonly` **timestamp**: `Date`

When the error occurred

###### Overrides

[`CoreError`](@trailhead.cli.md#coreerror).[`timestamp`](@trailhead.cli.md#timestamp)

##### type

> `readonly` **type**: `"FILESYSTEM_ERROR"`

Error type identifier

###### Overrides

[`CoreError`](@trailhead.cli.md#coreerror).[`type`](@trailhead.cli.md#type-1)

---

### FSConfig

Configuration options for filesystem operations.
Used with factory functions to create customized filesystem operations.

#### Example

```typescript
import { readFile, writeJson, FSConfig } from '@trailhead/fs'

const config: FSConfig = {
  encoding: 'utf16le',
  jsonSpaces: 4,
}

const customRead = readFile(config)
const customWriteJson = writeJson(config)
```

#### Properties

##### defaultMode?

> `readonly` `optional` **defaultMode**: `number`

Default file access mode for permission checks

##### encoding?

> `readonly` `optional` **encoding**: `BufferEncoding`

Text encoding for read/write operations (defaults to 'utf8')

##### jsonSpaces?

> `readonly` `optional` **jsonSpaces**: `number`

Number of spaces for JSON formatting (defaults to 2)

---

### MkdirOptions

Options for directory creation.

#### Example

```typescript
// Create nested directories
await fs.mkdir('path/to/nested/dir', { recursive: true })
```

#### Properties

##### recursive?

> `readonly` `optional` **recursive**: `boolean`

Whether to create parent directories if they don't exist

---

### MoveOptions

Options for move/rename operations.

#### Example

```typescript
// Move with overwrite protection
const result = await fs.move('old.txt', 'new.txt', { overwrite: false })
if (result.isErr() && result.error.code === 'EEXIST') {
  console.log('Destination already exists')
}
```

#### Properties

##### overwrite?

> `readonly` `optional` **overwrite**: `boolean`

Whether to overwrite existing destination (defaults to true)

---

### RmOptions

Options for remove operations.

#### Example

```typescript
// Remove directory and all contents
await fs.remove('temp/', { recursive: true, force: true })

// Remove file only if it exists
await fs.remove('maybe-exists.txt', { force: true })
```

#### Properties

##### force?

> `readonly` `optional` **force**: `boolean`

Whether to ignore non-existent files/directories (no error)

##### recursive?

> `readonly` `optional` **recursive**: `boolean`

Whether to remove directories and their contents recursively

## Type Aliases

### CopyOp()

> **CopyOp** = (`src`, `dest`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Function type for copying files or directories.

#### Parameters

##### src

`string`

Source path

##### dest

`string`

Destination path

##### options?

[`CopyOptions`](#copyoptions)

Copy options

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Promise resolving to void or error

---

### ExistsOp()

> **ExistsOp** = (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`boolean`\>\>

Function type for checking if a path exists.

#### Parameters

##### path

`string`

Path to check

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`boolean`\>\>

Promise resolving to boolean existence or error

---

### FSResult\<T\>

> **FSResult**\<`T`\> = `Result`\<`T`, [`FileSystemError`](#filesystemerror)\>

Result type for all filesystem operations.
Wraps success values or FileSystemError for explicit error handling.

#### Type Parameters

##### T

`T`

The type of the success value

#### Example

```typescript
function processFile(path: string): FSResult<string> {
  const result = await fs.readFile(path)
  if (result.isErr()) {
    return err(result.error)
  }
  return ok(result.value.toUpperCase())
}
```

---

### MkdirOp()

> **MkdirOp** = (`path`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Function type for creating directories.

#### Parameters

##### path

`string`

Directory path to create

##### options?

[`MkdirOptions`](#mkdiroptions)

Creation options

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Promise resolving to void or error

---

### MoveOp()

> **MoveOp** = (`src`, `dest`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Function type for moving/renaming files or directories.

#### Parameters

##### src

`string`

Source path

##### dest

`string`

Destination path

##### options?

[`MoveOptions`](#moveoptions)

Move options

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Promise resolving to void or error

---

### ReadDirOp()

> **ReadDirOp** = (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`string`[]\>\>

Function type for reading directory contents.

#### Parameters

##### path

`string`

Directory path to read

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`string`[]\>\>

Promise resolving to array of entry names or error

---

### ReadFileOp()

> **ReadFileOp** = (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`string`\>\>

Function type for reading file contents as string.

#### Parameters

##### path

`string`

File path to read

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`string`\>\>

Promise resolving to file contents or error

---

### ReadJsonOp()

> **ReadJsonOp** = \<`T`\>(`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`T`\>\>

Function type for reading and parsing JSON files.

#### Type Parameters

##### T

`T` = `any`

The expected type of the parsed JSON

#### Parameters

##### path

`string`

JSON file path

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`T`\>\>

Promise resolving to parsed data or error

---

### RemoveOp()

> **RemoveOp** = (`path`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Function type for removing files or directories.

#### Parameters

##### path

`string`

Path to remove

##### options?

[`RmOptions`](#rmoptions)

Remove options

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Promise resolving to void or error

---

### StatOp()

> **StatOp** = (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<[`FileStats`](#filestats)\>\>

Function type for getting file/directory statistics.

#### Parameters

##### path

`string`

Path to stat

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<[`FileStats`](#filestats)\>\>

Promise resolving to FileStats or error

---

### WriteFileOp()

> **WriteFileOp** = (`path`, `content`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Function type for writing string content to a file.

#### Parameters

##### path

`string`

File path to write to

##### content

`string`

String content to write

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Promise resolving to void or error

---

### WriteJsonOp()

> **WriteJsonOp** = \<`T`\>(`path`, `data`, `options?`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Function type for writing data as JSON.

#### Type Parameters

##### T

`T` = `any`

The type of data to serialize

#### Parameters

##### path

`string`

File path to write to

##### data

`T`

Data to serialize as JSON

##### options?

JSON formatting options

###### spaces?

`number`

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Promise resolving to void or error

## Variables

### defaultFSConfig

> `const` **defaultFSConfig**: [`FSConfig`](#fsconfig)

Default configuration for filesystem operations.
Used when no custom configuration is provided.

#### Example

```typescript
import { defaultFSConfig, readFile } from '@trailhead/fs'

// Use defaults
const reader = readFile() // uses defaultFSConfig

// Override specific options
const customReader = readFile({ ...defaultFSConfig, encoding: 'latin1' })
```

---

### fs

> `const` **fs**: `object`

Pre-configured filesystem operations using default configuration.
Provides a drop-in replacement for common filesystem operations with Result-based error handling.

All operations return Result\<T, FileSystemError\> for safe error handling without exceptions.

#### Type declaration

##### copy

> **copy**: [`CopyOp`](#copyop)

##### copyIfExists()

> **copyIfExists**: (`src`, `dest`, `options`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`boolean`\>\>

###### Parameters

###### src

`string`

###### dest

`string`

###### options

[`CopyOptions`](#copyoptions) = `{}`

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`boolean`\>\>

##### emptyDir()

> **emptyDir**: (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

###### Parameters

###### path

`string`

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

##### ensureDir()

> **ensureDir**: (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

###### Parameters

###### path

`string`

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

##### exists

> **exists**: [`ExistsOp`](#existsop)

##### findFiles

> **findFiles**: [`FindFilesOp`](#)

##### mkdir

> **mkdir**: [`MkdirOp`](#mkdirop)

##### move

> **move**: [`MoveOp`](#moveop)

##### outputFile()

> **outputFile**: (`path`, `content`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

###### Parameters

###### path

`string`

###### content

`string`

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

##### readDir

> **readDir**: [`ReadDirOp`](#readdirop)

##### readFile

> **readFile**: [`ReadFileOp`](#readfileop)

##### readIfExists()

> **readIfExists**: (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`null` \| `string`\>\>

###### Parameters

###### path

`string`

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`null` \| `string`\>\>

##### readJson

> **readJson**: [`ReadJsonOp`](#readjsonop)

##### remove

> **remove**: [`RemoveOp`](#removeop)

##### stat

> **stat**: [`StatOp`](#statop)

##### writeFile

> **writeFile**: [`WriteFileOp`](#writefileop)

##### writeJson

> **writeJson**: [`WriteJsonOp`](#writejsonop)

#### Example

```typescript
import { fs } from '@trailhead/fs'

// Read a file
const content = await fs.readFile('data.txt')
if (content.isOk()) {
  console.log(content.value)
}

// Write JSON with proper error handling
const data = { name: 'test', version: '1.0.0' }
const result = await fs.writeJson('package.json', data)
if (result.isErr()) {
  console.error(`Failed to write: ${result.error.message}`)
}

// Check if file exists
const exists = await fs.exists('config.json')
if (exists.isOk() && exists.value) {
  const config = await fs.readJson('config.json')
}
```

---

### isWindows

> `const` **isWindows**: `boolean`

Whether the current platform is Windows.
Used for platform-specific path handling.

#### Example

```typescript
if (isWindows) {
  console.log('Running on Windows')
  // Use Windows-specific paths
}
```

---

### pathAssertions

> `const` **pathAssertions**: `object`

Assertion helpers for cross-platform path testing.
Normalizes paths for consistent comparisons across platforms.

#### Type declaration

##### hasCorrectSeparators()

> **hasCorrectSeparators**(`path`): `boolean`

Asserts that a path uses correct separators.
On Windows, allows backslashes. On POSIX, ensures no backslashes.

###### Parameters

###### path

`string`

Path to check

###### Returns

`boolean`

True if separators are correct for platform

###### Example

```typescript
// On POSIX
hasCorrectSeparators('/app/src') // true
hasCorrectSeparators('\\app\\src') // false

// On Windows
hasCorrectSeparators('C:\\app\\src') // true
```

##### pathContains()

> **pathContains**(`actualPath`, `expectedSegment`): `boolean`

Asserts that a path contains a specific segment.
Normalizes both paths to POSIX format for comparison.

###### Parameters

###### actualPath

`string`

Path to check

###### expectedSegment

`string`

Segment that should be present

###### Returns

`boolean`

True if path contains segment

###### Example

```typescript
pathContains('C:\\app\\src\\index.ts', 'src')
// Returns: true (works cross-platform)
```

##### pathsEqual()

> **pathsEqual**(`path1`, `path2`): `boolean`

Asserts that two paths are equivalent.
Handles platform differences in separators.

###### Parameters

###### path1

`string`

First path

###### path2

`string`

Second path

###### Returns

`boolean`

True if paths are equivalent

###### Example

```typescript
pathsEqual('/app/src', '/app/src/')
// Returns: true (trailing slash ignored)

pathsEqual('C:\\app', 'C:/app')
// Returns: true (separator differences)
```

#### Example

```typescript
// In tests
expect(pathAssertions.pathsEqual(actualPath, expectedPath)).toBe(true)
expect(pathAssertions.pathContains(fullPath, 'components')).toBe(true)
expect(pathAssertions.hasCorrectSeparators(generatedPath)).toBe(true)
```

---

### pathMatchers

> `const` **pathMatchers**: `object`

Path matchers for testing and filtering.
Provides curried functions for common path matching operations.

#### Type declaration

##### contains()

> **contains**: (`substring`) => (`path`) => `boolean`

Creates a matcher that checks if path contains substring.

###### Parameters

###### substring

`string`

Substring to find

###### Returns

Matcher function

> (`path`): `boolean`

###### Parameters

###### path

`string`

###### Returns

`boolean`

###### Example

```typescript
const isTest = pathMatchers.contains('test')
isTest('src/utils.test.ts') // true
```

##### endsWith()

> **endsWith**: (`suffix`) => (`path`) => `boolean`

Creates a matcher that checks if path ends with suffix.

###### Parameters

###### suffix

`string`

Suffix to match

###### Returns

Matcher function

> (`path`): `boolean`

###### Parameters

###### path

`string`

###### Returns

`boolean`

###### Example

```typescript
const isConfig = pathMatchers.endsWith('.config.js')
isConfig('app.config.js') // true
```

##### hasExtension()

> **hasExtension**: (`extension`) => (`path`) => `boolean`

Creates a matcher that checks file extension.

###### Parameters

###### extension

`string`

Extension to match (with dot)

###### Returns

Matcher function

> (`path`): `boolean`

###### Parameters

###### path

`string`

###### Returns

`boolean`

###### Example

```typescript
const isTypeScript = pathMatchers.hasExtension('.ts')
isTypeScript('app.ts') // true
```

##### inDirectory()

> **inDirectory**: (`directory`) => (`path`) => `boolean`

Creates a matcher that checks parent directory.

###### Parameters

###### directory

`string`

Expected parent directory

###### Returns

Matcher function

> (`path`): `boolean`

###### Parameters

###### path

`string`

###### Returns

`boolean`

###### Example

```typescript
const inComponents = pathMatchers.inDirectory('components')
inComponents('components/Button.tsx') // true
```

##### isChildOf()

> **isChildOf**: (`directory`) => (`path`) => `boolean`

Creates a matcher that checks if path is child of directory.

###### Parameters

###### directory

`string`

Parent directory to check

###### Returns

Matcher function

> (`path`): `boolean`

###### Parameters

###### path

`string`

###### Returns

`boolean`

###### Example

```typescript
const inProject = pathMatchers.isChildOf('/project')
inProject('/project/src/index.ts') // true
inProject('/other/file.ts') // false
```

##### startsWith()

> **startsWith**: (`prefix`) => (`path`) => `boolean`

Creates a matcher that checks if path starts with prefix.

###### Parameters

###### prefix

`string`

Prefix to match

###### Returns

Matcher function

> (`path`): `boolean`

###### Parameters

###### path

`string`

###### Returns

`boolean`

###### Example

```typescript
const isInSrc = pathMatchers.startsWith('/app/src')
isInSrc('/app/src/index.ts') // true
```

#### Example

```typescript
const files = ['/app/src/index.ts', '/app/test/index.test.ts']

// Filter TypeScript files
const tsFiles = files.filter(pathMatchers.hasExtension('.ts'))

// Find test files
const testFiles = files.filter(pathMatchers.contains('test'))

// Check if in specific directory
const srcFiles = files.filter(pathMatchers.inDirectory('/app/src'))
```

---

### pathSep

> `const` **pathSep**: "\\" \| `"/"` = `sep`

The platform-specific path separator.
'\\' on Windows, '/' on POSIX systems.

#### Example

```typescript
const path = `dir${pathSep}file.txt`
// Windows: 'dir\file.txt'
// POSIX: 'dir/file.txt'
```

---

### testPaths

> `const` **testPaths**: `object`

Environment-specific path constants for testing.
Provides platform-aware test paths and separators.

#### Type declaration

##### fixtures

> **fixtures**: `string`

Test fixtures directory

##### mockComponents

> **mockComponents**: `string`

Mock components directory (platform-specific)

##### mockNodeModules

> **mockNodeModules**: `string`

Mock node_modules directory (platform-specific)

##### mockProject

> **mockProject**: `string`

Mock project root (platform-specific)

##### output

> **output**: `string`

Test output directory

##### posixSeparator

> **posixSeparator**: `string` = `'/'`

POSIX path separator (always '/')

##### separator

> **separator**: "\\" \| `"/"` = `sep`

Platform path separator

##### temp

> **temp**: `string`

Temporary directory for test files

##### windowsSeparator

> **windowsSeparator**: `string` = `'\\'`

Windows path separator (always '\\')

#### Example

```typescript
// Use in tests
const tempFile = joinPaths(testPaths.temp, 'data.json')

// Platform-specific mocks
const projectPath = testPaths.mockProject
// Windows: 'C:\\test\\project'
// POSIX: '/test/project'

// Separator testing
const path = `dir${testPaths.separator}file`
// Correct separator for current platform
```

## Functions

### applySortingWithStats()

> **applySortingWithStats**(`entries`, `basePath`, `sortOptions`, `statFn`, `operationName`, `preserveFullPaths`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`string`[]\>

Apply sorting with stats and error handling - shared utility for readDir/findFiles

#### Parameters

##### entries

`string`[]

##### basePath

`string`

##### sortOptions

[`SortOptions`](#)

##### statFn

(`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<\{ `error?`: [`FileSystemError`](#filesystemerror); `value?`: [`FileStats`](#filestats); `isErr`: `boolean`; \}\>

##### operationName

`string`

##### preserveFullPaths

`boolean` = `false`

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`string`[]\>

---

### copy()

> **copy**(`_config`): [`CopyOp`](#copyop)

Creates a copy function with the specified configuration.
Can copy files or directories with optional recursion and overwrite control.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

[`CopyOp`](#copyop)

Configured copy function

#### Example

```typescript
const copier = copy()

// Copy a file
await copier('source.txt', 'backup.txt')

// Copy directory recursively
await copier('src/', 'dist/', { recursive: true })

// Prevent overwrite
const result = await copier('important.txt', 'existing.txt', { overwrite: false })
if (result.isErr()) {
  console.log('Destination already exists')
}
```

---

### copyIfExists()

> **copyIfExists**(`_config`): (`src`, `dest`, `options`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`boolean`\>\>

Creates a conditional copier that only copies if source exists.
Returns true if copied, false if source doesn't exist.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

Configured conditional copier function

> (`src`, `dest`, `options`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`boolean`\>\>

##### Parameters

###### src

`string`

###### dest

`string`

###### options

[`CopyOptions`](#copyoptions) = `{}`

##### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`boolean`\>\>

#### Example

```typescript
const copier = copyIfExists()

// Copy optional template
const result = await copier('template.default', 'config.json')
if (result.isOk()) {
  if (result.value) {
    console.log('Template copied')
  } else {
    console.log('No template found, using defaults')
  }
}
```

---

### createAbsolutePath()

> **createAbsolutePath**(...`segments`): `string`

Creates absolute paths from current working directory.
Resolves relative segments to absolute paths.

#### Parameters

##### segments

...`string`[]

Path segments (relative or absolute)

#### Returns

`string`

Absolute path resolved from CWD

#### Example

```typescript
createAbsolutePath('src', 'index.ts')
// Returns: '/current/working/dir/src/index.ts'

createAbsolutePath('..', 'parent-file.txt')
// Returns: '/current/working/parent-file.txt'
```

---

### createFileSystemError()

> **createFileSystemError**(`operation`, `message`, `options?`): [`FileSystemError`](#filesystemerror)

Creates a structured FileSystemError with comprehensive context.
Used for custom error scenarios not covered by system errors.

#### Parameters

##### operation

`string`

The filesystem operation that failed

##### message

`string`

Human-readable error message

##### options?

Additional error context and metadata

###### cause?

`unknown`

###### code?

`string`

###### context?

`Record`\<`string`, `unknown`\>

###### path?

`string`

###### recoverable?

`boolean`

###### severity?

`"low"` \| `"medium"` \| `"high"` \| `"critical"`

###### suggestion?

`string`

#### Returns

[`FileSystemError`](#filesystemerror)

Structured FileSystemError

#### Example

```typescript
// Custom validation error
if (!isValidPath(path)) {
  return err(
    createFileSystemError('Validate path', 'Invalid characters in path', {
      path,
      code: 'INVALID_PATH',
      suggestion: 'Remove special characters from the path',
      recoverable: true,
    })
  )
}

// Permission check failure
return err(
  createFileSystemError('Check permissions', 'Insufficient permissions', {
    path: '/etc/passwd',
    code: 'EPERM',
    severity: 'critical',
    recoverable: false,
  })
)
```

---

### createPath()

> **createPath**(...`segments`): `string`

Creates a platform-agnostic path from segments.
Joins segments with proper separators for the current platform.

#### Parameters

##### segments

...`string`[]

Path segments to join

#### Returns

`string`

Joined path with platform-specific separators

#### Example

```typescript
createPath('src', 'components', 'Button.tsx')
// Windows: 'src\\components\\Button.tsx'
// POSIX: 'src/components/Button.tsx'

createPath('/root', 'dir', '..', 'file.txt')
// Returns: '/root/file.txt' (normalized)
```

---

### createPathRegex()

> **createPathRegex**(`pathPattern`): `RegExp`

Creates platform-specific regex patterns for path matching.
Handles wildcards and cross-platform separator differences.

#### Parameters

##### pathPattern

`string`

Pattern with optional wildcards (\*)

#### Returns

`RegExp`

RegExp that matches paths on any platform

#### Example

```typescript
const pattern = createPathRegex('src/*' + '/index.ts')
pattern.test('src/components/index.ts') // true
pattern.test('src\\utils\\index.ts') // true (Windows)

const exact = createPathRegex('config/app.json')
exact.test('config/app.json') // true
exact.test('config\\app.json') // true (Windows)
```

---

### createProjectStructure()

> **createProjectStructure**(`projectName`): `object`

Creates a mock project structure for testing.
Generates common project paths with proper separators.

#### Parameters

##### projectName

`string`

Name of the project directory

#### Returns

`object`

Object with common project paths

##### dist

> **dist**: `string`

##### gitignore

> **gitignore**: `string`

##### indexTest

> **indexTest**: `string`

##### indexTs

> **indexTs**: `string`

##### nodeModules

> **nodeModules**: `string`

##### packageJson

> **packageJson**: `string`

##### readme

> **readme**: `string`

##### root

> **root**: `string` = `base`

##### src

> **src**: `string`

##### tests

> **tests**: `string`

##### tsconfig

> **tsconfig**: `string`

#### Example

```typescript
const project = createProjectStructure('my-app')

console.log(project.src) // 'my-app/src'
console.log(project.packageJson) // 'my-app/package.json'
console.log(project.indexTs) // 'my-app/src/index.ts'

// Use in tests
const mockFs = {
  [project.packageJson]: JSON.stringify({ name: 'my-app' }),
  [project.indexTs]: 'export default {}',
}
```

---

### createRelativePath()

> **createRelativePath**(`from`, `to`): `string`

Creates relative paths that work on all platforms.
Calculates the relative path from one location to another.

#### Parameters

##### from

`string`

Starting directory path

##### to

`string`

Target path

#### Returns

`string`

Relative path from 'from' to 'to'

#### Example

```typescript
createRelativePath('/app/src', '/app/dist/output.js')
// Returns: '../dist/output.js'

createRelativePath('/app/src/utils', '/app/src/utils/helper.js')
// Returns: 'helper.js'

createRelativePath('/app', '/app')
// Returns: '.' (same directory)
```

---

### createTempPath()

> **createTempPath**(`prefix`, `timestamp`): `string`

Creates a temporary directory path for testing.
Generates unique paths to avoid conflicts in parallel tests.

#### Parameters

##### prefix

`string` = `'test'`

Prefix for the temp directory name

##### timestamp

`number` = `...`

Timestamp for uniqueness (defaults to current time)

#### Returns

`string`

Unique temporary directory path

#### Example

```typescript
createTempPath('test')
// Returns: '/tmp/trailhead-tests/test-1234567890-abc123'

createTempPath('integration')
// Returns: '/tmp/trailhead-tests/integration-1234567890-def456'

// Custom timestamp for reproducible tests
createTempPath('snapshot', 1000000)
// Returns: '/tmp/trailhead-tests/snapshot-1000000-xyz789'
```

---

### createTestConfig()

> **createTestConfig**(`overrides`): `object`

Utility for creating platform-agnostic test configurations.
Normalizes all paths to ensure cross-platform compatibility.

#### Parameters

##### overrides

`Record`\<`string`, `any`\> = `{}`

Configuration properties to override

#### Returns

`object`

Normalized test configuration

##### componentsDir

> **componentsDir**: `string`

##### outputDir

> **outputDir**: `string`

##### projectRoot

> **projectRoot**: `string`

##### tempDir

> **tempDir**: `string`

#### Example

```typescript
// Default config
const config = createTestConfig()
// All paths normalized for current platform

// Custom config
const customConfig = createTestConfig({
  projectRoot: '/custom/path',
  tempDir: '/custom/temp',
})

// Use in tests
const testFile = joinPaths(config.outputDir, 'result.json')
```

---

### createTestPath()

> **createTestPath**(...`segments`): `string`

Creates normalized, cross-platform paths for testing.
Ensures consistent path creation in test environments.

#### Parameters

##### segments

...`string`[]

Path segments to join

#### Returns

`string`

Normalized test path

#### Example

```typescript
const testFile = createTestPath('fixtures', 'data', 'test.json')
// Consistent path regardless of platform

const tempFile = createTestPath(getTempDir(), 'test-' + Date.now())
// Creates unique temp file path for testing
```

---

### emptyDir()

> **emptyDir**(`_config`): (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Creates a directory emptier function that removes all contents.
Removes all files and subdirectories but keeps the directory itself.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

Configured directory emptier function

> (`path`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

##### Parameters

###### path

`string`

##### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

#### Example

```typescript
const emptier = emptyDir()

// Clear temporary directory
await emptier('temp')

// Clear build output
await emptier('dist')

// Directory must exist
const result = await emptier('non-existent')
if (result.isErr()) {
  console.log('Directory not found')
}
```

---

### enrichWithStats()

> **enrichWithStats**(`dirPath`, `entries`, `statFn`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FileStats`](#filestats)[]\>

Enrich file names with stats for sorting
Uses parallel stat calls for better performance

#### Parameters

##### dirPath

`string`

##### entries

`string`[]

##### statFn

(`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FileStats`](#filestats)\>

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FileStats`](#filestats)[]\>

---

### ensureDir()

> **ensureDir**(`_config`): (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Creates a directory ensurer function that creates directories recursively.
Convenience wrapper around mkdir with recursive option always enabled.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

Configured directory ensurer function

> (`path`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

##### Parameters

###### path

`string`

##### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

#### Example

```typescript
const ensurer = ensureDir()

// Creates all parent directories if needed
await ensurer('path/to/nested/directory')

// Safe to call multiple times
await ensurer('logs') // Creates if missing
await ensurer('logs') // No error if exists
```

---

### exists()

> **exists**(`_config`): [`ExistsOp`](#existsop)

Creates an existence checker function with the specified configuration.
Checks if a file or directory exists and is accessible.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

[`ExistsOp`](#existsop)

Configured existence checker function

#### Example

```typescript
const checker = exists()
const result = await checker('package.json')
if (result.isOk() && result.value) {
  console.log('File exists')
}

// Check with specific permissions
const writeChecker = exists({ defaultMode: constants.W_OK })
const canWrite = await writeChecker('file.txt')
```

---

### findFiles()

> **findFiles**(`_config`): [`FindFilesOp`](#)

Creates a file finder function using glob patterns.
Searches for files matching patterns with optional filtering.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

[`FindFilesOp`](#)

Configured file finder function

#### Example

```typescript
const finder = findFiles()

// Find all TypeScript files
const tsFiles = await finder('**' + '/*.ts')

// Find with options
const srcFiles = await finder('**' + '/*.js', {
  cwd: 'src',
  ignore: ['**' + '/*.test.js', 'node_modules/**'],
})

// Multiple patterns
const assets = await finder('**' + '/*.{png,jpg,svg}')
```

---

### getBaseName()

> **getBaseName**(`path`, `ext?`): `string`

Gets the base name of a path.
Returns the last portion of a path, optionally removing extension.

#### Parameters

##### path

`string`

File or directory path

##### ext?

`string`

Optional extension to remove

#### Returns

`string`

Base name of the path

#### Example

```typescript
getBaseName('/app/src/index.ts')
// Returns: 'index.ts'

getBaseName('/app/src/index.ts', '.ts')
// Returns: 'index'

getBaseName('/app/src/')
// Returns: 'src'
```

---

### getDirectoryName()

> **getDirectoryName**(`path`): `string`

Gets the directory name of a path.
Returns the parent directory of the given path.

#### Parameters

##### path

`string`

File or directory path

#### Returns

`string`

Parent directory path

#### Example

```typescript
getDirectoryName('/app/src/index.ts')
// Returns: '/app/src'

getDirectoryName('file.txt')
// Returns: '.'

getDirectoryName('/app/src/')
// Returns: '/app'
```

---

### getExtension()

> **getExtension**(`path`): `string`

Gets the extension of a path.
Returns the extension including the leading dot.

#### Parameters

##### path

`string`

File path

#### Returns

`string`

Extension with dot, or empty string

#### Example

```typescript
getExtension('file.txt')
// Returns: '.txt'

getExtension('archive.tar.gz')
// Returns: '.gz'

getExtension('README')
// Returns: ''
```

---

### getTempDir()

> **getTempDir**(): `string`

Gets the system temporary directory.
Returns the platform-specific temp directory path.

#### Returns

`string`

System temporary directory path

#### Example

```typescript
getTempDir()
// Linux/Mac: '/tmp'
// Windows: 'C:\\Users\\Name\\AppData\\Local\\Temp'

// Create temp file
const tempFile = joinPaths(getTempDir(), 'my-app-temp.txt')
```

---

### isAbsolutePath()

> **isAbsolutePath**(`path`): `boolean`

Checks if a path is absolute.
Returns true for paths starting from root.

#### Parameters

##### path

`string`

Path to check

#### Returns

`boolean`

True if path is absolute

#### Example

```typescript
isAbsolutePath('/usr/local/bin')
// Returns: true (POSIX)

isAbsolutePath('C:\\Windows')
// Returns: true (Windows)

isAbsolutePath('./relative/path')
// Returns: false
```

---

### isAllowedPath()

> **isAllowedPath**(`path`, `allowedDirs`): `boolean`

Validates that a path is within allowed directories.
Useful for restricting file access to specific locations.

#### Parameters

##### path

`string`

Path to check

##### allowedDirs

`string`[]

Array of allowed directory prefixes

#### Returns

`boolean`

True if path starts with any allowed directory

#### Example

```typescript
const allowed = ['/app/uploads', '/app/public']

isAllowedPath('/app/uploads/image.jpg', allowed)
// Returns: true

isAllowedPath('/app/private/secret.key', allowed)
// Returns: false
```

---

### isRelativePath()

> **isRelativePath**(`path`): `boolean`

Checks if a path is relative.
Returns true for paths not starting from root.

#### Parameters

##### path

`string`

Path to check

#### Returns

`boolean`

True if path is relative

#### Example

```typescript
isRelativePath('./src/index.ts')
// Returns: true

isRelativePath('../parent/file.txt')
// Returns: true

isRelativePath('/absolute/path')
// Returns: false
```

---

### isSafePath()

> **isSafePath**(`path`, `baseDir`): `boolean`

Validates that a path is safe (no directory traversal).
Prevents access outside the specified base directory.

#### Parameters

##### path

`string`

Path to validate (relative or absolute)

##### baseDir

`string`

Base directory to contain the path

#### Returns

`boolean`

True if path stays within baseDir

#### Example

```typescript
isSafePath('subdir/file.txt', '/app')
// Returns: true (safe)

isSafePath('../../../etc/passwd', '/app')
// Returns: false (traversal attempt)

isSafePath('/other/path', '/app')
// Returns: false (outside base)
```

---

### isValidName()

> **isValidName**(`path`): `boolean`

Validates that a path follows naming conventions.
Checks for alphanumeric characters, dots, underscores, and hyphens.

#### Parameters

##### path

`string`

Path to validate

#### Returns

`boolean`

True if filename follows conventions

#### Example

```typescript
isValidName('file-name_123.txt')
// Returns: true

isValidName('file name with spaces.txt')
// Returns: false

isValidName('../../etc/passwd')
// Returns: false (only checks basename 'passwd')
```

---

### joinPaths()

> **joinPaths**(...`paths`): `string`

Joins path segments with proper separators.
Alias for Node.js path.join with consistent naming.

#### Parameters

##### paths

...`string`[]

Path segments to join

#### Returns

`string`

Joined path

#### Example

```typescript
joinPaths('dir', 'subdir', 'file.txt')
// Returns: 'dir/subdir/file.txt' (POSIX)
// Returns: 'dir\\subdir\\file.txt' (Windows)
```

---

### mapNodeError()

> **mapNodeError**(`operation`, `path`, `error`): [`FileSystemError`](#filesystemerror)

Maps Node.js system errors to structured FileSystemError instances.
Provides user-friendly messages and recovery suggestions for common errors.

#### Parameters

##### operation

`string`

The filesystem operation that failed

##### path

`string`

The file/directory path involved in the error

##### error

`any`

The original Node.js error object

#### Returns

[`FileSystemError`](#filesystemerror)

Structured FileSystemError with context

#### Example

```typescript
try {
  await fs.readFile(path)
} catch (error) {
  // Maps ENOENT to user-friendly error
  return err(mapNodeError('Read file', path, error))
  // Returns: {
  //   message: "Read file failed: File or directory '/path' does not exist",
  //   code: 'ENOENT',
  //   suggestion: 'Check if the path is correct and the file exists',
  //   recoverable: true
  // }
}
```

#### Remarks

Handles common Node.js error codes:

- ENOENT: File/directory not found
- EEXIST: File/directory already exists
- EACCES: Permission denied
- EISDIR: Expected file but found directory
- ENOTDIR: Expected directory but found file
- EMFILE: Too many open files
- ENOSPC: No space left on device

---

### mkdir()

> **mkdir**(`_config`): [`MkdirOp`](#mkdirop)

Creates a directory creator function with the specified configuration.
Can create single directories or nested directory structures.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

[`MkdirOp`](#mkdirop)

Configured directory creator function

#### Throws

DIRECTORY_EXISTS - When directory already exists (non-recursive mode)

#### Throws

PERMISSION_DENIED - When parent directory is not writable

#### Throws

INVALID_PATH - When path contains invalid characters

#### Example

```typescript
const creator = mkdir()

// Create single directory
await creator('temp')

// Create nested directories
await creator('path/to/nested/dir', { recursive: true })

// Error handling
const result = await creator('existing-dir')
if (result.isErr() && result.error.code === 'DIRECTORY_EXISTS') {
  console.log('Directory already exists')
}
```

---

### move()

> **move**(`_config`): [`MoveOp`](#moveop)

Creates a move/rename function with the specified configuration.
Moves or renames files and directories with optional overwrite protection.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

[`MoveOp`](#moveop)

Configured move function

#### Example

```typescript
const mover = move()

// Rename a file
await mover('old-name.txt', 'new-name.txt')

// Move to different directory
await mover('downloads/file.pdf', 'documents/file.pdf')

// Prevent accidental overwrite
const result = await mover('temp.txt', 'important.txt', { overwrite: false })
if (result.isErr() && result.error.code === 'EEXIST') {
  console.log('Would overwrite existing file')
}
```

---

### needsFileStats()

> **needsFileStats**(`sortOptions?`): `boolean`

Check if a sort field requires file stats

#### Parameters

##### sortOptions?

[`SortOptions`](#)

#### Returns

`boolean`

---

### normalizeMockPath()

> **normalizeMockPath**(`path`): `string`

Normalizes file paths for cross-platform mock filesystem.
Converts all paths to POSIX format for consistent mocking.

#### Parameters

##### path

`string`

Path from any platform

#### Returns

`string`

Normalized POSIX path for mocking

#### Example

```typescript
normalizeMockPath('C:\\test\\file.txt')
// Returns: 'C:/test/file.txt'

// Use in mock filesystem
const mockFs = {
  [normalizeMockPath(path)]: 'content',
}
```

---

### normalizePath()

> **normalizePath**(`path`): `string`

Normalizes path separators for cross-platform compatibility.
Converts mixed separators to platform-specific ones.

#### Parameters

##### path

`string`

Path with potentially mixed separators

#### Returns

`string`

Normalized path with consistent separators

#### Example

```typescript
normalizePath('foo/bar\\baz')
// Windows: 'foo\\bar\\baz'
// POSIX: 'foo/bar/baz'

normalizePath('./foo/../bar')
// Returns: 'bar' (normalized)
```

---

### outputFile()

> **outputFile**(`_config`): (`path`, `content`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

Creates a file output function that ensures parent directories exist.
Combines directory creation and file writing in a single operation.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

Configured file output function

> (`path`, `content`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

##### Parameters

###### path

`string`

###### content

`string`

##### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`void`\>\>

#### Example

```typescript
const outputter = outputFile()

// Write to nested path (creates directories as needed)
await outputter('output/reports/2024/summary.txt', 'Report content')

// Replaces existing file
await outputter('dist/index.html', htmlContent)
```

---

### readDir()

> **readDir**(`_config`): [`ReadDirOp`](#readdirop)

Creates a directory reader function with the specified configuration.
Returns an array of entry names (files and subdirectories).

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

[`ReadDirOp`](#readdirop)

Configured directory reader function

#### Example

```typescript
const reader = readDir()
const result = await reader('src')
if (result.isOk()) {
  console.log('Directory contents:', result.value)
  // ['index.ts', 'utils', 'tests']
}
```

---

### readFile()

> **readFile**(`_config`): [`ReadFileOp`](#readfileop)

Creates a file reader function with the specified configuration.
Returns file contents as string with the configured encoding.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

[`ReadFileOp`](#readfileop)

Configured file reader function

#### Throws

FILE_NOT_FOUND - When file does not exist

#### Throws

PERMISSION_DENIED - When file cannot be accessed due to permissions

#### Throws

READ_ERROR - When file cannot be read due to I/O errors

#### Example

```typescript
// Using default configuration
const reader = readFile()
const result = await reader('config.json')

// Using custom encoding
const utf16Reader = readFile({ encoding: 'utf16le' })
const result = await utf16Reader('unicode.txt')

// Error handling with specific error codes
const result = await reader('missing.txt')
if (result.isErr()) {
  switch (result.error.code) {
    case 'FILE_NOT_FOUND':
      console.error('File does not exist')
      break
    case 'PERMISSION_DENIED':
      console.error('Cannot access file')
      break
    default:
      console.error(`Failed: ${result.error.message}`)
  }
}
```

---

### readIfExists()

> **readIfExists**(`_config`): (`path`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`null` \| `string`\>\>

Creates a conditional reader that returns null if file doesn't exist.
Useful for optional configuration files or fallback scenarios.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

Configured conditional reader function

> (`path`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`null` \| `string`\>\>

##### Parameters

###### path

`string`

##### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`FSResult`](#fsresult)\<`null` \| `string`\>\>

#### Example

```typescript
const reader = readIfExists()

// Read optional config
const config = await reader('.env.local')
if (config.isOk()) {
  if (config.value === null) {
    console.log('Using default config')
  } else {
    console.log('Loaded local config')
  }
}
```

---

### readJson()

> **readJson**(`_config`): [`ReadJsonOp`](#readjsonop)

Creates a JSON reader function with the specified configuration.
Reads and parses JSON files with type safety.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

[`ReadJsonOp`](#readjsonop)

Configured JSON reader function

#### Example

```typescript
const reader = readJson()

// Read with type inference
interface Config {
  name: string
  version: string
}
const result = await reader<Config>('package.json')
if (result.isOk()) {
  console.log(`${result.value.name} v${result.value.version}`)
}

// Handle parse errors
const result = await reader('invalid.json')
if (result.isErr() && result.error.code === 'JSON_PARSE_ERROR') {
  console.log('Invalid JSON format')
}
```

---

### remove()

> **remove**(`_config`): [`RemoveOp`](#removeop)

Creates a remove function with the specified configuration.
Removes files or directories with optional recursive deletion.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

[`RemoveOp`](#removeop)

Configured remove function

#### Example

```typescript
const remover = remove()

// Remove a file
await remover('temp.txt')

// Remove directory and contents
await remover('temp-dir/', { recursive: true })

// Remove if exists (no error if missing)
await remover('maybe-exists.txt', { force: true })
```

---

### resolvePath()

> **resolvePath**(`path`, `base?`): `string`

Resolves a path to an absolute path.
Can resolve relative to a base directory or CWD.

#### Parameters

##### path

`string`

Path to resolve (relative or absolute)

##### base?

`string`

Optional base directory for resolution

#### Returns

`string`

Absolute resolved path

#### Example

```typescript
resolvePath('file.txt')
// Resolves relative to CWD

resolvePath('../config.json', '/app/src')
// Returns: '/app/config.json'

resolvePath('/absolute/path')
// Returns: '/absolute/path' (unchanged)
```

---

### safeJoin()

> **safeJoin**(...`segments`): `string`

Safe path joining that handles mixed separator inputs.
Normalizes each segment before joining to prevent issues.

#### Parameters

##### segments

...`string`[]

Path segments with potentially mixed separators

#### Returns

`string`

Safely joined and normalized path

#### Example

```typescript
safeJoin('dir/sub', 'more\\nested', 'file.txt')
// Handles mixed separators correctly

safeJoin('/root/', '/absolute/', 'file')
// Returns: '/root/absolute/file' (handles double slashes)
```

---

### safeRelative()

> **safeRelative**(`from`, `to`): `string`

Safe relative path calculation with fallback.
Alias for createRelativePath with error handling.

#### Parameters

##### from

`string`

Starting directory path

##### to

`string`

Target path

#### Returns

`string`

Relative path or original 'to' path on error

#### Example

```typescript
safeRelative('/src', '/src/components/Button.tsx')
// Returns: 'components/Button.tsx'
```

---

### sortFileEntries()

> **sortFileEntries**\<`T`\>(`entries`, `options?`): `T`[]

Sort file entries based on the provided options

#### Type Parameters

##### T

`T` _extends_ `string` \| [`FileStats`](#filestats)

#### Parameters

##### entries

`T`[]

##### options?

[`SortOptions`](#)

#### Returns

`T`[]

---

### stat()

> **stat**(`_config`): [`StatOp`](#statop)

Creates a stat function to get file/directory information.
Returns standardized FileStats with size, type, and modification time.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

[`StatOp`](#statop)

Configured stat function

#### Example

```typescript
const statter = stat()
const result = await statter('package.json')
if (result.isOk()) {
  const { size, isFile, mtime } = result.value
  console.log(`File size: ${size} bytes`)
  console.log(`Last modified: ${mtime}`)
}
```

---

### toBackslashes()

> **toBackslashes**(`path`): `string`

Converts a path to use backslashes.
Useful for Windows-specific testing scenarios.

#### Parameters

##### path

`string`

Path with any separators

#### Returns

`string`

Path with backslashes only

#### Example

```typescript
toBackslashes('/usr/local/bin')
// Returns: '\\usr\\local\\bin'

toBackslashes('mixed/path\\to\\file')
// Returns: 'mixed\\path\\to\\file'
```

---

### toForwardSlashes()

> **toForwardSlashes**(`path`): `string`

Converts a path to use forward slashes.
Useful for consistent string comparisons and URLs.

#### Parameters

##### path

`string`

Path with any separators

#### Returns

`string`

Path with forward slashes only

#### Example

```typescript
toForwardSlashes('C:\\Users\\Name\\file.txt')
// Returns: 'C:/Users/Name/file.txt'

toForwardSlashes('mixed\\path/to/file')
// Returns: 'mixed/path/to/file'
```

---

### toPosixPath()

> **toPosixPath**(`path`): `string`

Converts Windows paths to POSIX format.
Ensures consistent string comparisons across platforms.

#### Parameters

##### path

`string`

Path with Windows separators

#### Returns

`string`

Path with POSIX separators

#### Example

```typescript
toPosixPath('C:\\Users\\Name\\Documents')
// Returns: 'C:/Users/Name/Documents'

// Useful for assertions
expect(toPosixPath(actualPath)).toBe('/expected/path')
```

---

### toWindowsPath()

> **toWindowsPath**(`path`): `string`

Converts POSIX paths to Windows format.
Useful for Windows-specific testing and mocking.

#### Parameters

##### path

`string`

Path with POSIX separators

#### Returns

`string`

Path with Windows separators

#### Example

```typescript
toWindowsPath('/home/user/documents')
// Returns: '\\home\\user\\documents'

// Mock Windows paths in tests
const winPath = toWindowsPath('/test/path')
```

---

### writeFile()

> **writeFile**(`_config`): [`WriteFileOp`](#writefileop)

Creates a file writer function with the specified configuration.
Writes string content to a file with the configured encoding.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

[`WriteFileOp`](#writefileop)

Configured file writer function

#### Throws

PERMISSION_DENIED - When directory is not writable

#### Throws

NO_SPACE - When disk is full

#### Throws

WRITE_ERROR - When write operation fails

#### Throws

DIRECTORY_NOT_FOUND - When parent directory doesn't exist

#### Example

```typescript
const writer = writeFile()
const result = await writer('output.txt', 'Hello, world!')
if (result.isOk()) {
  console.log('File written successfully')
}

// Custom encoding
const utf16Writer = writeFile({ encoding: 'utf16le' })
await utf16Writer('unicode.txt', '日本語')

// Error handling
const result = await writer('/restricted/file.txt', 'data')
if (result.isErr()) {
  if (result.error.code === 'PERMISSION_DENIED') {
    console.error('Cannot write to restricted directory')
  }
}
```

---

### writeJson()

> **writeJson**(`_config`): [`WriteJsonOp`](#writejsonop)

Creates a JSON writer function with the specified configuration.
Serializes data to JSON and writes to file, creating parent directories as needed.

#### Parameters

##### \_config

[`FSConfig`](#fsconfig) = `defaultFSConfig`

Optional filesystem configuration

#### Returns

[`WriteJsonOp`](#writejsonop)

Configured JSON writer function

#### Example

```typescript
const writer = writeJson()

// Write with default formatting (2 spaces)
const data = { name: 'my-app', version: '1.0.0' }
await writer('package.json', data)

// Write with custom formatting
await writer('config.json', data, { spaces: 4 })

// Parent directories created automatically
await writer('deep/nested/data.json', data)
```
