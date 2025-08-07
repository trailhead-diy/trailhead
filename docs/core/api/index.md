**@esteban-url/core**

---

# @trailhead/core

Foundation package for the Trailhead ecosystem providing unified Result types, enhanced error handling, and performance-optimized utilities.

## Features

- **Unified Result Types** - Single source of truth for all Result operations across the ecosystem
- **Enhanced Error Context** - Rich debugging information with operation context, timestamps, and severity levels
- **Performance-Optimized Type Guards** - Zero-overhead validation for critical paths
- **Functional Programming Utilities** - Composition helpers and Result-based functional patterns

## Installation

```bash
npm install @trailhead/core
```

## Usage

### Basic Result Operations

```typescript
import { ok, err, type Result } from '@trailhead/core'

const divide = (a: number, b: number): Result<number, Error> => {
  if (b === 0) {
    return err(new Error('Division by zero'))
  }
  return ok(a / b)
}

const result = divide(10, 2)
if (result.isOk()) {
  console.log('Result:', result.value) // 5
} else {
  console.error('Error:', result.error.message)
}
```

### Enhanced Error Creation

```typescript
import { createCoreError } from '@trailhead/core'

const error = createCoreError('VALIDATION_FAILED', 'Invalid input data', {
  component: 'UserService',
  operation: 'validateUser',
  severity: 'high',
  suggestion: 'Check that all required fields are provided',
  recoverable: true,
  context: { userId: '123', field: 'email' },
})
```

### Performance-Optimized Type Guards

```typescript
import { isDefined, isNonEmptyString, isObject } from '@trailhead/core'

// Fast null/undefined checks
if (isDefined(value)) {
  // value is guaranteed to be non-null/undefined
}

// Optimized string validation
if (isNonEmptyString(input)) {
  // input is guaranteed to be a non-empty string
}

// Efficient object validation
if (isObject(data)) {
  // data is guaranteed to be a record
}
```

### Functional Composition

```typescript
import { pipe, composeResult } from '@trailhead/core'

const processData = pipe(
  validateInput,
  composeResult(transformData, validateInput),
  composeResult(saveToDatabase, transformData)
)

const result = await processData(inputData)
```

## API Reference

### Result Types

- `Result<T, E>` - Core Result type (re-exported from neverthrow)
- `CoreResult<T>` - Result with CoreError
- `CoreResultAsync<T>` - Async Result with CoreError

### Error Handling

- `createCoreError(type, message, options)` - Create enhanced error with context
- `withContext(error, context)` - Add contextual information to existing error
- `chainError(error, cause)` - Chain errors for error propagation

### Type Guards

- `isDefined<T>(value)` - Check if value is not null/undefined
- `isNonEmptyString(value)` - Validate non-empty strings
- `isObject(value)` - Validate objects
- `isNonEmptyArray<T>(value)` - Validate non-empty arrays
- `hasErrorShape(value)` - Check if value has error structure

### Utilities

- `getErrorMessage(error)` - Extract human-readable message
- `isRecoverableError(error)` - Check if error is recoverable
- `getErrorType(error)` - Extract error type for pattern matching

## Breaking Changes in v1.0.0

1. **Enhanced CoreError Interface** - Added `component`, `operation`, `timestamp`, and `severity` fields
2. **Unified Result Imports** - All packages must import Result types from @trailhead/core
3. **Performance Type Guards** - New compile-time optimized validation functions

## Migration Guide

### From direct neverthrow imports:

```typescript
// Before
import { ok, err, type Result } from 'neverthrow'

// After
import { ok, err, type Result } from '@trailhead/core'
```

### Enhanced error creation:

```typescript
// Before
const error = { type: 'ERROR', message: 'Failed' }

// After
const error = createCoreError('ERROR', 'Failed', {
  component: 'MyComponent',
  operation: 'myOperation',
  severity: 'medium',
})
```

## Performance Notes

- Type guards are optimized for V8 and use minimal property access
- Compile-time validation reduces runtime overhead
- Enhanced error context is generated lazily to minimize performance impact

## License

MIT

## Interfaces

### CoreError

#### Properties

| Property                               | Modifier   | Type                                                                                                               |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| <a id="type"></a> `type`               | `readonly` | `string`                                                                                                           |
| <a id="code"></a> `code`               | `readonly` | `string`                                                                                                           |
| <a id="message"></a> `message`         | `readonly` | `string`                                                                                                           |
| <a id="details"></a> `details?`        | `readonly` | `string`                                                                                                           |
| <a id="cause"></a> `cause?`            | `readonly` | `unknown`                                                                                                          |
| <a id="suggestion"></a> `suggestion?`  | `readonly` | `string`                                                                                                           |
| <a id="recoverable"></a> `recoverable` | `readonly` | `boolean`                                                                                                          |
| <a id="context"></a> `context?`        | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |
| <a id="component"></a> `component`     | `readonly` | `string`                                                                                                           |
| <a id="operation"></a> `operation`     | `readonly` | `string`                                                                                                           |
| <a id="timestamp"></a> `timestamp`     | `readonly` | `Date`                                                                                                             |
| <a id="severity"></a> `severity`       | `readonly` | `"low"` \| `"medium"` \| `"high"` \| `"critical"`                                                                  |

---

### ErrorContext

#### Properties

| Property                             | Modifier   | Type                                                                                                               |
| ------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| <a id="operation-1"></a> `operation` | `readonly` | `string`                                                                                                           |
| <a id="component-1"></a> `component` | `readonly` | `string`                                                                                                           |
| <a id="timestamp-1"></a> `timestamp` | `readonly` | `Date`                                                                                                             |
| <a id="metadata"></a> `metadata?`    | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> |

## Type Aliases

### CoreResult\<T\>

> **CoreResult**\<`T`\> = [`Result`](https://github.com/supermacro/neverthrow#result)\<`T`, [`CoreError`](#coreerror)\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

---

### CoreResultAsync\<T\>

> **CoreResultAsync**\<`T`\> = [`ResultAsync`](https://github.com/supermacro/neverthrow#resultasync)\<`T`, [`CoreError`](#coreerror)\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

---

### IsValidInput\<T\>

> **IsValidInput**\<`T`\> = `T` _extends_ `string` ? `T` _extends_ `""` ? `false` : `true` : `T` _extends_ `unknown`[] ? `T` _extends_ \[\] ? `false` : `true` : `T` _extends_ `null` \| `undefined` ? `false` : `true`

Compile-time conditional validation
Uses TypeScript's conditional types for zero runtime overhead

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

## Variables

### createDataError()

> `const` **createDataError**: (`type`, `code`, `message`, `options?`) => [`CoreError`](#coreerror)

Common error factories for shared use across packages

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

[`CoreError`](#coreerror)

---

### createFileSystemError()

> `const` **createFileSystemError**: (`type`, `code`, `message`, `options?`) => [`CoreError`](#coreerror)

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

[`CoreError`](#coreerror)

---

### createValidationError()

> `const` **createValidationError**: (`type`, `code`, `message`, `options?`) => [`CoreError`](#coreerror)

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

[`CoreError`](#coreerror)

---

### createConfigError()

> `const` **createConfigError**: (`type`, `code`, `message`, `options?`) => [`CoreError`](#coreerror)

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

[`CoreError`](#coreerror)

---

### createGitError()

> `const` **createGitError**: (`type`, `code`, `message`, `options?`) => [`CoreError`](#coreerror)

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

[`CoreError`](#coreerror)

---

### createCliError()

> `const` **createCliError**: (`type`, `code`, `message`, `options?`) => [`CoreError`](#coreerror)

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

[`CoreError`](#coreerror)

---

### combine()

> `const` **combine**: \{\<`T`\>(`resultList`): `CombineResults`\<`T`\>; \<`T`\>(`resultList`): `CombineResults`\<`T`\>; \} = `Result.combine`

#### Call Signature

> \<`T`\>(`resultList`): `CombineResults`\<`T`\>

##### Type Parameters

| Type Parameter                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `T` _extends_ readonly \[[`Result`](https://github.com/supermacro/neverthrow#result)\<`unknown`, `unknown`\>, [`Result`](https://github.com/supermacro/neverthrow#result)\<`unknown`, `unknown`\>\] |

##### Parameters

| Parameter    | Type |
| ------------ | ---- |
| `resultList` | `T`  |

##### Returns

`CombineResults`\<`T`\>

#### Call Signature

> \<`T`\>(`resultList`): `CombineResults`\<`T`\>

##### Type Parameters

| Type Parameter                                                                                               |
| ------------------------------------------------------------------------------------------------------------ |
| `T` _extends_ readonly [`Result`](https://github.com/supermacro/neverthrow#result)\<`unknown`, `unknown`\>[] |

##### Parameters

| Parameter    | Type |
| ------------ | ---- |
| `resultList` | `T`  |

##### Returns

`CombineResults`\<`T`\>

---

### combineWithAllErrors()

> `const` **combineWithAllErrors**: \{\<`T`\>(`resultList`): `CombineResultsWithAllErrorsArray`\<`T`\>; \<`T`\>(`resultList`): `CombineResultsWithAllErrorsArray`\<`T`\>; \} = `Result.combineWithAllErrors`

#### Call Signature

> \<`T`\>(`resultList`): `CombineResultsWithAllErrorsArray`\<`T`\>

##### Type Parameters

| Type Parameter                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `T` _extends_ readonly \[[`Result`](https://github.com/supermacro/neverthrow#result)\<`unknown`, `unknown`\>, [`Result`](https://github.com/supermacro/neverthrow#result)\<`unknown`, `unknown`\>\] |

##### Parameters

| Parameter    | Type |
| ------------ | ---- |
| `resultList` | `T`  |

##### Returns

`CombineResultsWithAllErrorsArray`\<`T`\>

#### Call Signature

> \<`T`\>(`resultList`): `CombineResultsWithAllErrorsArray`\<`T`\>

##### Type Parameters

| Type Parameter                                                                                               |
| ------------------------------------------------------------------------------------------------------------ |
| `T` _extends_ readonly [`Result`](https://github.com/supermacro/neverthrow#result)\<`unknown`, `unknown`\>[] |

##### Parameters

| Parameter    | Type |
| ------------ | ---- |
| `resultList` | `T`  |

##### Returns

`CombineResultsWithAllErrorsArray`\<`T`\>

---

### success

> `const` **success**: `ChalkInstance` = `chalk.green`

Format success messages in green

---

### error

> `const` **error**: `ChalkInstance` = `chalk.red`

Format error messages in red

---

### warning

> `const` **warning**: `ChalkInstance` = `chalk.yellow`

Format warning messages in yellow

---

### info

> `const` **info**: `ChalkInstance` = `chalk.blue`

Format info messages in blue

---

### muted

> `const` **muted**: `ChalkInstance` = `chalk.gray`

Format muted/secondary text in gray

---

### bold

> `const` **bold**: `ChalkInstance` = `chalk.bold`

Format text in bold

---

### dim

> `const` **dim**: `ChalkInstance` = `chalk.dim`

Format text dimmed/faded

---

### italic

> `const` **italic**: `ChalkInstance` = `chalk.italic`

Format text in italic

---

### underline

> `const` **underline**: `ChalkInstance` = `chalk.underline`

Format text with underline

## Functions

### createCoreError()

> **createCoreError**(`type`, `code`, `message`, `options?`): [`CoreError`](#coreerror)

Foundation error factory - enhanced with strict type safety
BREAKING CHANGE: component, operation, and severity are now required

#### Parameters

| Parameter              | Type                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                 | `string`                                                                                                                                                                                                                                                                                                                                             |
| `code`                 | `string`                                                                                                                                                                                                                                                                                                                                             |
| `message`              | `string`                                                                                                                                                                                                                                                                                                                                             |
| `options?`             | \{ `component?`: `string`; `operation?`: `string`; `severity?`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `details?`: `string`; `cause?`: `unknown`; `suggestion?`: `string`; `recoverable?`: `boolean`; `context?`: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>; \} |
| `options.component?`   | `string`                                                                                                                                                                                                                                                                                                                                             |
| `options.operation?`   | `string`                                                                                                                                                                                                                                                                                                                                             |
| `options.severity?`    | `"low"` \| `"medium"` \| `"high"` \| `"critical"`                                                                                                                                                                                                                                                                                                    |
| `options.details?`     | `string`                                                                                                                                                                                                                                                                                                                                             |
| `options.cause?`       | `unknown`                                                                                                                                                                                                                                                                                                                                            |
| `options.suggestion?`  | `string`                                                                                                                                                                                                                                                                                                                                             |
| `options.recoverable?` | `boolean`                                                                                                                                                                                                                                                                                                                                            |
| `options.context?`     | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>                                                                                                                                                                                                                                   |

#### Returns

[`CoreError`](#coreerror)

---

### withContext()

> **withContext**\<`E`\>(`error`, `context`): `E`

Add context to any error
Updated to handle required fields properly

#### Type Parameters

| Type Parameter                          |
| --------------------------------------- |
| `E` _extends_ [`CoreError`](#coreerror) |

#### Parameters

| Parameter | Type                                                                                                                        |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `error`   | `E`                                                                                                                         |
| `context` | [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<[`ErrorContext`](#errorcontext)\> |

#### Returns

`E`

---

### chainError()

> **chainError**\<`E`\>(`error`, `cause`): `E`

Chain errors together for error propagation

#### Type Parameters

| Type Parameter                          |
| --------------------------------------- |
| `E` _extends_ [`CoreError`](#coreerror) |

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `error`   | `E`       |
| `cause`   | `unknown` |

#### Returns

`E`

---

### createErrorFactory()

> **createErrorFactory**(`component`, `defaultSeverity`): (`type`, `code`, `message`, `options?`) => [`CoreError`](#coreerror)

Creates a standardized error factory function for a specific domain
This eliminates the need for each package to define its own error creation patterns

#### Parameters

| Parameter         | Type                                              | Default value |
| ----------------- | ------------------------------------------------- | ------------- |
| `component`       | `string`                                          | `undefined`   |
| `defaultSeverity` | `"low"` \| `"medium"` \| `"high"` \| `"critical"` | `'medium'`    |

#### Returns

> (`type`, `code`, `message`, `options?`): [`CoreError`](#coreerror)

##### Parameters

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

##### Returns

[`CoreError`](#coreerror)

---

### mapNodeError()

> **mapNodeError**(`component`, `operation`, `path`, `error`): [`CoreError`](#coreerror)

Common error mapping utilities

#### Parameters

| Parameter   | Type      |
| ----------- | --------- |
| `component` | `string`  |
| `operation` | `string`  |
| `path`      | `string`  |
| `error`     | `unknown` |

#### Returns

[`CoreError`](#coreerror)

---

### mapLibraryError()

> **mapLibraryError**(`component`, `library`, `operation`, `error`): [`CoreError`](#coreerror)

#### Parameters

| Parameter   | Type      |
| ----------- | --------- |
| `component` | `string`  |
| `library`   | `string`  |
| `operation` | `string`  |
| `error`     | `unknown` |

#### Returns

[`CoreError`](#coreerror)

---

### mapValidationError()

> **mapValidationError**(`component`, `field`, `value`, `error`): [`CoreError`](#coreerror)

#### Parameters

| Parameter   | Type      |
| ----------- | --------- |
| `component` | `string`  |
| `field`     | `string`  |
| `value`     | `unknown` |
| `error`     | `unknown` |

#### Returns

[`CoreError`](#coreerror)

---

### getErrorMessage()

> **getErrorMessage**(`error`, `defaultMessage`): `string`

Extract a human-readable error message from any error type
Enhanced with proper type safety - no more 'as any'

#### Parameters

| Parameter        | Type      | Default value     |
| ---------------- | --------- | ----------------- |
| `error`          | `unknown` | `undefined`       |
| `defaultMessage` | `string`  | `'Unknown error'` |

#### Returns

`string`

---

### isRecoverableError()

> **isRecoverableError**(`error`): `boolean`

Check if an error is recoverable

#### Parameters

| Parameter            | Type                             |
| -------------------- | -------------------------------- |
| `error`              | \{ `recoverable?`: `boolean`; \} |
| `error.recoverable?` | `boolean`                        |

#### Returns

`boolean`

---

### getErrorType()

> **getErrorType**(`error`): `string`

Extract error type for pattern matching

#### Parameters

| Parameter     | Type                     |
| ------------- | ------------------------ |
| `error`       | \{ `type?`: `string`; \} |
| `error.type?` | `string`                 |

#### Returns

`string`

---

### getErrorCategory()

> **getErrorCategory**(`error`): `string`

Extract error category for categorization

#### Parameters

| Parameter         | Type                         |
| ----------------- | ---------------------------- |
| `error`           | \{ `category?`: `string`; \} |
| `error.category?` | `string`                     |

#### Returns

`string`

---

### isDefined()

> **isDefined**\<`T`\>(`value`): `value is T`

Fast type guard for checking if a value is defined (not null or undefined)
Optimized for hot paths where performance matters

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter | Type                         |
| --------- | ---------------------------- |
| `value`   | `undefined` \| `null` \| `T` |

#### Returns

`value is T`

---

### isNonEmptyString()

> **isNonEmptyString**(`value`): `value is string`

Zero-overhead string validation for production builds
Uses compile-time optimizations when possible

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is string`

---

### isObject()

> **isObject**(`value`): `value is Record<string, unknown>`

Performance-optimized object validation
Minimizes property access for better V8 optimization

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is Record<string, unknown>`

---

### isNonEmptyArray()

> **isNonEmptyArray**\<`T`\>(`value`): `value is T[]`

Fast array validation with optional length check
Optimized for frequent validation in data processing

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is T[]`

---

### hasErrorShape()

> **hasErrorShape**(`value`): `value is { type: string; message: string }`

Production-optimized error checking
Avoids object property access in critical paths

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `value`   | `unknown` |

#### Returns

`value is { type: string; message: string }`

---

### fromPromiseAsync()

> **fromPromiseAsync**\<`T`\>(`promise`, `errorHandler?`): [`ResultAsync`](https://github.com/supermacro/neverthrow#resultasync)\<`T`, [`CoreError`](#coreerror)\>

Convert a Promise to ResultAsync with foundation error handling

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter       | Type                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| `promise`       | [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`T`\> |
| `errorHandler?` | (`error`) => [`CoreError`](#coreerror)                                                                       |

#### Returns

[`ResultAsync`](https://github.com/supermacro/neverthrow#resultasync)\<`T`, [`CoreError`](#coreerror)\>

---

### fromThrowableAsync()

> **fromThrowableAsync**\<`T`, `Args`\>(`fn`, `errorHandler?`): (...`args`) => [`Result`](https://github.com/supermacro/neverthrow#result)\<`T`, [`CoreError`](#coreerror)\>

Convert a function that throws to a safe Result

#### Type Parameters

| Type Parameter                        |
| ------------------------------------- |
| `T`                                   |
| `Args` _extends_ readonly `unknown`[] |

#### Parameters

| Parameter       | Type                                   |
| --------------- | -------------------------------------- |
| `fn`            | (...`args`) => `T`                     |
| `errorHandler?` | (`error`) => [`CoreError`](#coreerror) |

#### Returns

> (...`args`): [`Result`](https://github.com/supermacro/neverthrow#result)\<`T`, [`CoreError`](#coreerror)\>

##### Parameters

| Parameter | Type   |
| --------- | ------ |
| ...`args` | `Args` |

##### Returns

[`Result`](https://github.com/supermacro/neverthrow#result)\<`T`, [`CoreError`](#coreerror)\>

---

### fromThrowableAsyncFunc()

> **fromThrowableAsyncFunc**\<`T`, `Args`\>(`fn`, `errorHandler?`): (...`args`) => [`ResultAsync`](https://github.com/supermacro/neverthrow#resultasync)\<`T`, [`CoreError`](#coreerror)\>

Convert an async function that throws to a safe ResultAsync

#### Type Parameters

| Type Parameter                        |
| ------------------------------------- |
| `T`                                   |
| `Args` _extends_ readonly `unknown`[] |

#### Parameters

| Parameter       | Type                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `fn`            | (...`args`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`T`\> |
| `errorHandler?` | (`error`) => [`CoreError`](#coreerror)                                                                                      |

#### Returns

> (...`args`): [`ResultAsync`](https://github.com/supermacro/neverthrow#resultasync)\<`T`, [`CoreError`](#coreerror)\>

##### Parameters

| Parameter | Type   |
| --------- | ------ |
| ...`args` | `Args` |

##### Returns

[`ResultAsync`](https://github.com/supermacro/neverthrow#resultasync)\<`T`, [`CoreError`](#coreerror)\>

---

### composeResult()

> **composeResult**\<`A`, `B`, `C`, `E`\>(`f`, `g`): (`a`) => [`Result`](https://github.com/supermacro/neverthrow#result)\<`C`, `E`\>

Compose functions that return Result types
Uses fp-ts patterns for consistency

#### Type Parameters

| Type Parameter |
| -------------- |
| `A`            |
| `B`            |
| `C`            |
| `E`            |

#### Parameters

| Parameter | Type                                                                             |
| --------- | -------------------------------------------------------------------------------- |
| `f`       | (`b`) => [`Result`](https://github.com/supermacro/neverthrow#result)\<`C`, `E`\> |
| `g`       | (`a`) => [`Result`](https://github.com/supermacro/neverthrow#result)\<`B`, `E`\> |

#### Returns

> (`a`): [`Result`](https://github.com/supermacro/neverthrow#result)\<`C`, `E`\>

##### Parameters

| Parameter | Type |
| --------- | ---- |
| `a`       | `A`  |

##### Returns

[`Result`](https://github.com/supermacro/neverthrow#result)\<`C`, `E`\>

---

### composeResultAsync()

> **composeResultAsync**\<`A`, `B`, `C`, `E`\>(`f`, `g`): (`a`) => [`ResultAsync`](https://github.com/supermacro/neverthrow#resultasync)\<`C`, `E`\>

Async composition for ResultAsync types

#### Type Parameters

| Type Parameter |
| -------------- |
| `A`            |
| `B`            |
| `C`            |
| `E`            |

#### Parameters

| Parameter | Type                                                                                       |
| --------- | ------------------------------------------------------------------------------------------ |
| `f`       | (`b`) => [`ResultAsync`](https://github.com/supermacro/neverthrow#resultasync)\<`C`, `E`\> |
| `g`       | (`a`) => [`ResultAsync`](https://github.com/supermacro/neverthrow#resultasync)\<`B`, `E`\> |

#### Returns

> (`a`): [`ResultAsync`](https://github.com/supermacro/neverthrow#resultasync)\<`C`, `E`\>

##### Parameters

| Parameter | Type |
| --------- | ---- |
| `a`       | `A`  |

##### Returns

[`ResultAsync`](https://github.com/supermacro/neverthrow#resultasync)\<`C`, `E`\>

---

### tap()

> **tap**\<`T`\>(`fn`): (`value`) => `T`

Tap function for side effects - foundation utility

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter | Type                |
| --------- | ------------------- |
| `fn`      | (`value`) => `void` |

#### Returns

> (`value`): `T`

##### Parameters

| Parameter | Type |
| --------- | ---- |
| `value`   | `T`  |

##### Returns

`T`
