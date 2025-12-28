[**Trailhead API Documentation v0.1.0**](README.md)

---

[Trailhead API Documentation](README.md) / @trailhead/core

# @trailhead/core

Foundation package for the Trailhead System providing Result-based error handling.

This package exports functional programming utilities centered around the Result type pattern,
enabling explicit error handling without exceptions. Built on top of neverthrow.

## Example

```typescript
import { ok, err, Result } from '@trailhead/core'

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err('Division by zero')
  return ok(a / b)
}

const result = divide(10, 2)
if (result.isOk()) {
  console.log('Result:', result.value) // 5
}
```

## Since

0.1.0

## Interfaces

### CoreError

Foundation error interface providing comprehensive error information.
All errors in the Trailhead ecosystem should implement this interface.

#### Example

```typescript
const error: CoreError = {
  type: 'ValidationError',
  code: 'INVALID_INPUT',
  message: 'Username must be at least 3 characters',
  component: 'user-service',
  operation: 'validateUsername',
  timestamp: new Date(),
  severity: 'medium',
  recoverable: true,
  suggestion: 'Please provide a longer username',
}
```

#### Since

0.1.0

#### Properties

##### cause?

> `readonly` `optional` **cause**: `unknown`

Original error that caused this error

##### code

> `readonly` **code**: `string`

Unique error code for programmatic handling (e.g., 'INVALID_INPUT', 'TIMEOUT')

##### component

> `readonly` **component**: `string`

Component where the error occurred

##### context?

> `readonly` `optional` **context**: `Record`\<`string`, `unknown`\>

Additional context data for debugging

##### details?

> `readonly` `optional` **details**: `string`

Additional error details for debugging

##### message

> `readonly` **message**: `string`

Human-readable error message

##### operation

> `readonly` **operation**: `string`

Operation that was being performed when error occurred

##### recoverable

> `readonly` **recoverable**: `boolean`

Whether the error is recoverable through retry or user action

##### severity

> `readonly` **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Error severity level for prioritization

##### suggestion?

> `readonly` `optional` **suggestion**: `string`

Helpful suggestion for error recovery

##### timestamp

> `readonly` **timestamp**: `Date`

When the error occurred

##### type

> `readonly` **type**: `string`

Error type for categorization (e.g., 'ValidationError', 'NetworkError')

---

### ErrorContext

Error context for enhanced debugging information.
Used to add contextual information when propagating errors.

#### Example

```typescript
const context: ErrorContext = {
  operation: 'saveUser',
  component: 'user-repository',
  timestamp: new Date(),
  metadata: { userId: '123', attempt: 1 },
}
```

#### Properties

##### component

> `readonly` **component**: `string`

The component performing the operation

##### metadata?

> `readonly` `optional` **metadata**: `Record`\<`string`, `unknown`\>

Additional metadata about the operation

##### operation

> `readonly` **operation**: `string`

The operation being performed

##### timestamp

> `readonly` **timestamp**: `Date`

When the operation was performed

## Type Aliases

### CoreResult

> **CoreResult**\<`T`\> = `Result`\<`T`, [`CoreError`](#coreerror)\>

Convenience type alias for Result with CoreError as the error type.
This is the standard return type for all Trailhead operations.

#### Type Parameters

##### T

`T`

The success value type

#### Example

```typescript
function readConfig(): CoreResult<Config> {
  // Returns either Ok<Config> or Err<CoreError>
}
```

---

### CoreResultAsync

> **CoreResultAsync**\<`T`\> = `ResultAsync`\<`T`, [`CoreError`](#coreerror)\>

Convenience type alias for async Result with CoreError as the error type.
Use this for all asynchronous operations in Trailhead.

#### Type Parameters

##### T

`T`

The success value type

#### Example

```typescript
function fetchUser(id: string): CoreResultAsync<User> {
  // Returns ResultAsync that resolves to either Ok<User> or Err<CoreError>
}
```

---

### IsValidInput

> **IsValidInput**\<`T`\> = `T` _extends_ `string` ? `T` _extends_ `""` ? `false` : `true` : `T` _extends_ `unknown`[] ? `T` _extends_ \[\] ? `false` : `true` : `T` _extends_ `null` \| `undefined` ? `false` : `true`

Compile-time type for validating input at the type level.
Returns true/false at compile time based on input type validity.

#### Type Parameters

##### T

`T`

The type to validate

#### Example

```typescript
type Valid1 = IsValidInput<'hello'> // true
type Valid2 = IsValidInput<''> // false
type Valid3 = IsValidInput<[1, 2, 3]> // true
type Valid4 = IsValidInput<[]> // false
type Valid5 = IsValidInput<null> // false
```

## Variables

### combine()

> `const` **combine**: \{\<`T`\>(`resultList`): `CombineResults`\<`T`\>; \<`T`\>(`resultList`): `CombineResults`\<`T`\>; \} = `Result.combine`

Combine multiple Results into a single Result.
If all Results are Ok, returns Ok with array of values.
If any Result is Err, returns the first Err.

#### Call Signature

> \<`T`\>(`resultList`): `CombineResults`\<`T`\>

##### Type Parameters

###### T

`T` _extends_ readonly \[`Result`\<`unknown`, `unknown`\>, `Result`\<`unknown`, `unknown`\>\]

##### Parameters

###### resultList

`T`

##### Returns

`CombineResults`\<`T`\>

#### Call Signature

> \<`T`\>(`resultList`): `CombineResults`\<`T`\>

##### Type Parameters

###### T

`T` _extends_ readonly `Result`\<`unknown`, `unknown`\>[]

##### Parameters

###### resultList

`T`

##### Returns

`CombineResults`\<`T`\>

#### Example

```typescript
const results = [ok(1), ok(2), ok(3)]
const combined = combine(results) // Ok([1, 2, 3])
```

---

### combineWithAllErrors()

> `const` **combineWithAllErrors**: \{\<`T`\>(`resultList`): `CombineResultsWithAllErrorsArray`\<`T`\>; \<`T`\>(`resultList`): `CombineResultsWithAllErrorsArray`\<`T`\>; \} = `Result.combineWithAllErrors`

Combine multiple Results, collecting all errors.
If all Results are Ok, returns Ok with array of values.
If any Result is Err, returns Err with array of all errors.

#### Call Signature

> \<`T`\>(`resultList`): `CombineResultsWithAllErrorsArray`\<`T`\>

##### Type Parameters

###### T

`T` _extends_ readonly \[`Result`\<`unknown`, `unknown`\>, `Result`\<`unknown`, `unknown`\>\]

##### Parameters

###### resultList

`T`

##### Returns

`CombineResultsWithAllErrorsArray`\<`T`\>

#### Call Signature

> \<`T`\>(`resultList`): `CombineResultsWithAllErrorsArray`\<`T`\>

##### Type Parameters

###### T

`T` _extends_ readonly `Result`\<`unknown`, `unknown`\>[]

##### Parameters

###### resultList

`T`

##### Returns

`CombineResultsWithAllErrorsArray`\<`T`\>

#### Example

```typescript
const results = [ok(1), err('error1'), err('error2')]
const combined = combineWithAllErrors(results) // Err(['error1', 'error2'])
```

---

### createCliError()

> `const` **createCliError**: (`type`, `code`, `message`, `options?`) => [`CoreError`](#coreerror)

Pre-configured error factory for CLI-related errors.

#### Parameters

##### type

`string`

##### code

`string`

##### message

`string`

##### options?

###### cause?

`unknown`

###### context?

`Record`\<`string`, `unknown`\>

###### details?

`string`

###### operation?

`string`

###### recoverable?

`boolean`

###### severity?

`"low"` \| `"medium"` \| `"high"` \| `"critical"`

###### suggestion?

`string`

#### Returns

[`CoreError`](#coreerror)

#### Example

```typescript
const error = createCliError(
  'ArgumentError',
  'MISSING_REQUIRED_ARG',
  'Required argument --file not provided'
)
```

---

### createConfigError()

> `const` **createConfigError**: (`type`, `code`, `message`, `options?`) => [`CoreError`](#coreerror)

Pre-configured error factory for configuration errors.

#### Parameters

##### type

`string`

##### code

`string`

##### message

`string`

##### options?

###### cause?

`unknown`

###### context?

`Record`\<`string`, `unknown`\>

###### details?

`string`

###### operation?

`string`

###### recoverable?

`boolean`

###### severity?

`"low"` \| `"medium"` \| `"high"` \| `"critical"`

###### suggestion?

`string`

#### Returns

[`CoreError`](#coreerror)

#### Example

```typescript
const error = createConfigError('ConfigError', 'MISSING_REQUIRED', 'API key not configured')
```

---

### createDataError()

> `const` **createDataError**: (`type`, `code`, `message`, `options?`) => [`CoreError`](#coreerror)

Pre-configured error factory for data-related errors.

#### Parameters

##### type

`string`

##### code

`string`

##### message

`string`

##### options?

###### cause?

`unknown`

###### context?

`Record`\<`string`, `unknown`\>

###### details?

`string`

###### operation?

`string`

###### recoverable?

`boolean`

###### severity?

`"low"` \| `"medium"` \| `"high"` \| `"critical"`

###### suggestion?

`string`

#### Returns

[`CoreError`](#coreerror)

#### Example

```typescript
const error = createDataError('ParseError', 'INVALID_JSON', 'Failed to parse JSON')
```

---

### createFileSystemError()

> `const` **createFileSystemError**: (`type`, `code`, `message`, `options?`) => [`CoreError`](#coreerror)

Pre-configured error factory for filesystem operations.
Default severity is 'high' as filesystem errors often impact functionality.

#### Parameters

##### type

`string`

##### code

`string`

##### message

`string`

##### options?

###### cause?

`unknown`

###### context?

`Record`\<`string`, `unknown`\>

###### details?

`string`

###### operation?

`string`

###### recoverable?

`boolean`

###### severity?

`"low"` \| `"medium"` \| `"high"` \| `"critical"`

###### suggestion?

`string`

#### Returns

[`CoreError`](#coreerror)

#### Example

```typescript
const error = createFileSystemError('ReadError', 'FILE_NOT_FOUND', 'Config file missing')
```

---

### createGitError()

> `const` **createGitError**: (`type`, `code`, `message`, `options?`) => [`CoreError`](#coreerror)

Pre-configured error factory for git operations.

#### Parameters

##### type

`string`

##### code

`string`

##### message

`string`

##### options?

###### cause?

`unknown`

###### context?

`Record`\<`string`, `unknown`\>

###### details?

`string`

###### operation?

`string`

###### recoverable?

`boolean`

###### severity?

`"low"` \| `"medium"` \| `"high"` \| `"critical"`

###### suggestion?

`string`

#### Returns

[`CoreError`](#coreerror)

#### Example

```typescript
const error = createGitError('GitError', 'UNCOMMITTED_CHANGES', 'Working directory not clean')
```

---

### createValidationError()

> `const` **createValidationError**: (`type`, `code`, `message`, `options?`) => [`CoreError`](#coreerror)

Pre-configured error factory for validation errors.

#### Parameters

##### type

`string`

##### code

`string`

##### message

`string`

##### options?

###### cause?

`unknown`

###### context?

`Record`\<`string`, `unknown`\>

###### details?

`string`

###### operation?

`string`

###### recoverable?

`boolean`

###### severity?

`"low"` \| `"medium"` \| `"high"` \| `"critical"`

###### suggestion?

`string`

#### Returns

[`CoreError`](#coreerror)

#### Example

```typescript
const error = createValidationError('ValidationError', 'INVALID_FORMAT', 'Invalid email format')
```

## Functions

### chainError()

> **chainError**\<`E`\>(`error`, `cause`): `E`

Chain errors together to maintain error causality.
Use this when an error causes another error.

#### Type Parameters

##### E

`E` _extends_ [`CoreError`](#coreerror)

Error type extending CoreError

#### Parameters

##### error

`E`

The new error

##### cause

`unknown`

The original error that caused this error

#### Returns

`E`

Error with cause attached

#### Example

```typescript
const dbError = createCoreError('DatabaseError', 'CONNECTION_FAILED', 'Cannot connect')
const serviceError = createCoreError('ServiceError', 'USER_FETCH_FAILED', 'Cannot fetch user')

// Chain errors to maintain causality
const chainedError = chainError(serviceError, dbError)
// Now serviceError.cause contains dbError
```

---

### composeResult()

> **composeResult**\<`A`, `B`, `C`, `E`\>(`f`, `g`): (`a`) => `Result`\<`C`, `E`\>

Compose two functions that return Result types.
If the first function returns an error, it short-circuits.

#### Type Parameters

##### A

`A`

Input type

##### B

`B`

Intermediate type

##### C

`C`

Output type

##### E

`E`

Error type

#### Parameters

##### f

(`b`) => `Result`\<`C`, `E`\>

Second function to apply

##### g

(`a`) => `Result`\<`B`, `E`\>

First function to apply

#### Returns

Composed function that returns a Result

> (`a`): `Result`\<`C`, `E`\>

##### Parameters

###### a

`A`

##### Returns

`Result`\<`C`, `E`\>

#### Example

```typescript
const parseNumber = (s: string): Result<number, string> =>
  isNaN(+s) ? err('Not a number') : ok(+s)

const doubleNumber = (n: number): Result<number, string> =>
  n > 1000 ? err('Too large') : ok(n * 2)

const parseAndDouble = composeResult(doubleNumber, parseNumber)

parseAndDouble('5') // Ok(10)
parseAndDouble('abc') // Err('Not a number')
parseAndDouble('600') // Err('Too large')
```

---

### composeResultAsync()

> **composeResultAsync**\<`A`, `B`, `C`, `E`\>(`f`, `g`): (`a`) => `ResultAsync`\<`C`, `E`\>

Compose two async functions that return ResultAsync types.
Handles asynchronous operations with proper error propagation.

#### Type Parameters

##### A

`A`

Input type

##### B

`B`

Intermediate type

##### C

`C`

Output type

##### E

`E`

Error type

#### Parameters

##### f

(`b`) => `ResultAsync`\<`C`, `E`\>

Second async function to apply

##### g

(`a`) => `ResultAsync`\<`B`, `E`\>

First async function to apply

#### Returns

Composed function that returns a ResultAsync

> (`a`): `ResultAsync`\<`C`, `E`\>

##### Parameters

###### a

`A`

##### Returns

`ResultAsync`\<`C`, `E`\>

#### Example

```typescript
const fetchUser = (id: string): ResultAsync<User, string> =>
  fromPromise(api.getUser(id), (e) => 'Failed to fetch user')

const fetchPosts = (user: User): ResultAsync<Post[], string> =>
  fromPromise(api.getUserPosts(user.id), (e) => 'Failed to fetch posts')

const fetchUserPosts = composeResultAsync(fetchPosts, fetchUser)

const posts = await fetchUserPosts('123')
```

---

### createCoreError()

> **createCoreError**(`type`, `code`, `message`, `options?`): [`CoreError`](#coreerror)

Create a CoreError with all required fields.
This is the primary way to create errors in the Trailhead ecosystem.

#### Parameters

##### type

`string`

Error type for categorization (e.g., 'ValidationError')

##### code

`string`

Unique error code (e.g., 'INVALID_INPUT')

##### message

`string`

Human-readable error message

##### options?

Additional error properties

###### cause?

`unknown`

###### component?

`string`

Component where error occurred

###### context?

`Record`\<`string`, `unknown`\>

###### details?

`string`

###### operation?

`string`

Operation being performed

###### recoverable?

`boolean`

Whether error is recoverable

###### severity?

`"low"` \| `"medium"` \| `"high"` \| `"critical"`

Error severity level

###### suggestion?

`string`

#### Returns

[`CoreError`](#coreerror)

Fully formed CoreError object

#### Default

```ts
options.component - 'unknown'
```

#### Default

```ts
options.operation - 'unknown'
```

#### Default

```ts
options.severity - 'medium'
```

#### Default

```ts
options.recoverable - false
```

#### Example

```typescript
const error = createCoreError('ValidationError', 'INVALID_EMAIL', 'Email address is not valid', {
  component: 'user-service',
  operation: 'validateEmail',
  severity: 'medium',
  details: 'Email must contain @ symbol',
  suggestion: 'Please enter a valid email address',
  recoverable: true,
})
```

---

### createErrorFactory()

> **createErrorFactory**(`component`, `defaultSeverity`): (`type`, `code`, `message`, `options?`) => [`CoreError`](#coreerror)

Create a domain-specific error factory with preset defaults.
This ensures consistent error creation across a component or module.

#### Parameters

##### component

`string`

The component name to use for all errors

##### defaultSeverity

Default severity level if not specified

`"low"` | `"medium"` | `"high"` | `"critical"`

#### Returns

Error factory function for the component

> (`type`, `code`, `message`, `options?`): [`CoreError`](#coreerror)

##### Parameters

###### type

`string`

###### code

`string`

###### message

`string`

###### options?

###### cause?

`unknown`

###### context?

`Record`\<`string`, `unknown`\>

###### details?

`string`

###### operation?

`string`

###### recoverable?

`boolean`

###### severity?

`"low"` \| `"medium"` \| `"high"` \| `"critical"`

###### suggestion?

`string`

##### Returns

[`CoreError`](#coreerror)

#### Default

```ts
defaultSeverity - 'medium'
```

#### Example

```typescript
// In user-service.ts
const createUserError = createErrorFactory('user-service', 'medium')

// Use throughout the service
const validationError = createUserError(
  'ValidationError',
  'INVALID_USERNAME',
  'Username contains invalid characters',
  { operation: 'validateUsername', recoverable: true }
)
```

---

### fromPromiseAsync()

> **fromPromiseAsync**\<`T`\>(`promise`, `errorHandler?`): `ResultAsync`\<`T`, [`CoreError`](#coreerror)\>

Convert a Promise to ResultAsync with automatic error handling.
This is the primary way to integrate async operations with Result types.

#### Type Parameters

##### T

`T`

The type of the successful value

#### Parameters

##### promise

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`T`\>

Promise to convert

##### errorHandler?

(`error`) => [`CoreError`](#coreerror)

Optional function to transform errors to CoreError

#### Returns

`ResultAsync`\<`T`, [`CoreError`](#coreerror)\>

ResultAsync that will resolve to Ok or Err

#### Example

```typescript
// Basic usage
const result = await fromPromise(fetch('/api/user'), (error) =>
  createCoreError('NetworkError', 'FETCH_FAILED', error.message)
)

// With default error handler
const data = await fromPromise(readFile('config.json'))

// Chain with other operations
const user = await fromPromise(fetchUser(id))
  .andThen((user) => fromPromise(enrichUser(user)))
  .map((user) => user.name)
```

---

### fromThrowableAsync()

> **fromThrowableAsync**\<`T`, `Args`\>(`fn`, `errorHandler?`): (...`args`) => `Result`\<`T`, [`CoreError`](#coreerror)\>

Convert a function that might throw to a safe Result-returning function.
Wraps synchronous functions to catch exceptions.

#### Type Parameters

##### T

`T`

Return type of the function

##### Args

`Args` _extends_ readonly `unknown`[]

Arguments tuple type

#### Parameters

##### fn

(...`args`) => `T`

Function that might throw

##### errorHandler?

(`error`) => [`CoreError`](#coreerror)

Optional error transformer

#### Returns

Safe function that returns Result instead of throwing

> (...`args`): `Result`\<`T`, [`CoreError`](#coreerror)\>

##### Parameters

###### args

...`Args`

##### Returns

`Result`\<`T`, [`CoreError`](#coreerror)\>

#### Example

```typescript
// Unsafe function that throws
const parseJSON = (text: string) => JSON.parse(text)

// Make it safe
const safeParseJSON = fromThrowable(parseJSON, (error) =>
  createCoreError('ParseError', 'INVALID_JSON', error.message)
)

const result = safeParseJSON('{"valid": true}') // Ok({valid: true})
const error = safeParseJSON('invalid json') // Err(CoreError)
```

---

### fromThrowableAsyncFunc()

> **fromThrowableAsyncFunc**\<`T`, `Args`\>(`fn`, `errorHandler?`): (...`args`) => `ResultAsync`\<`T`, [`CoreError`](#coreerror)\>

Convert an async function that might throw to a safe ResultAsync-returning function.
This is essential for wrapping third-party async APIs.

#### Type Parameters

##### T

`T`

Return type of the async function

##### Args

`Args` _extends_ readonly `unknown`[]

Arguments tuple type

#### Parameters

##### fn

(...`args`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`T`\>

Async function that might throw

##### errorHandler?

(`error`) => [`CoreError`](#coreerror)

Optional error transformer

#### Returns

Safe async function that returns ResultAsync

> (...`args`): `ResultAsync`\<`T`, [`CoreError`](#coreerror)\>

##### Parameters

###### args

...`Args`

##### Returns

`ResultAsync`\<`T`, [`CoreError`](#coreerror)\>

#### Example

```typescript
// Unsafe async function
const fetchData = async (url: string) => {
  const response = await fetch(url)
  return response.json()
}

// Make it safe
const safeFetchData = fromThrowableAsync(fetchData, (error) =>
  createCoreError('FetchError', 'REQUEST_FAILED', error.message)
)

// Use it
const result = await safeFetchData('https://api.example.com/data')
if (result.isOk()) {
  console.log('Data:', result.value)
} else {
  console.error('Error:', result.error.message)
}
```

---

### getErrorCategory()

> **getErrorCategory**(`error`): `string`

Extract error category for high-level error grouping.

#### Parameters

##### error

Error object with optional category property

###### category?

`string`

#### Returns

`string`

Error category string or 'unknown' if not specified

#### Example

```typescript
const error = { category: 'validation', type: 'InvalidInput' }
const category = getErrorCategory(error) // 'validation'
```

---

### getErrorMessage()

> **getErrorMessage**(`error`, `defaultMessage`): `string`

Extract a human-readable error message from any error type.
Safely handles various error formats including Error objects, strings, and custom error types.

#### Parameters

##### error

`unknown`

The error to extract message from

##### defaultMessage

`string` = `'Unknown error'`

Message to use if extraction fails

#### Returns

`string`

Human-readable error message

#### Default

```ts
defaultMessage - 'Unknown error'
```

#### Example

```typescript
getErrorMessage(new Error('Failed')) // 'Failed'
getErrorMessage('String error') // 'String error'
getErrorMessage({ message: 'Custom' }) // 'Custom'
getErrorMessage(null) // 'Unknown error'
```

---

### getErrorType()

> **getErrorType**(`error`): `string`

Extract error type for pattern matching and error categorization.

#### Parameters

##### error

Error object with optional type property

###### type?

`string`

#### Returns

`string`

Error type string or 'unknown' if not specified

#### Example

```typescript
const error = { type: 'ValidationError', message: 'Invalid input' }
switch (getErrorType(error)) {
  case 'ValidationError':
    // Handle validation error
    break
  case 'NetworkError':
    // Handle network error
    break
}
```

---

### hasErrorShape()

> **hasErrorShape**(`value`): `value is { message: string; type: string }`

Type guard for checking if a value has the minimal error shape.
Useful for handling errors from external libraries.

#### Parameters

##### value

`unknown`

Value to check

#### Returns

`value is { message: string; type: string }`

Type predicate indicating if value has error shape

#### Example

```typescript
try {
  someOperation()
} catch (error) {
  if (hasErrorShape(error)) {
    console.error(`${error.type}: ${error.message}`)
  } else {
    console.error('Unknown error:', error)
  }
}
```

---

### isDefined()

> **isDefined**\<`T`\>(`value`): `value is T`

Type guard for checking if a value is defined (not null or undefined).
Use this to narrow types and handle optional values safely.

#### Type Parameters

##### T

`T`

The expected type when defined

#### Parameters

##### value

Value to check

`T` | `null` | `undefined`

#### Returns

`value is T`

Type predicate indicating if value is defined

#### Example

```typescript
const value: string | undefined = getUserInput()
if (isDefined(value)) {
  // TypeScript knows value is string here
  console.log(value.toUpperCase())
}
```

---

### isNonEmptyArray()

> **isNonEmptyArray**\<`T`\>(`value`): `value is T[]`

Type guard for non-empty array validation.
Ensures the value is an array with at least one element.

#### Type Parameters

##### T

`T`

The array element type

#### Parameters

##### value

`unknown`

Value to check

#### Returns

`value is T[]`

Type predicate indicating if value is a non-empty array

#### Example

```typescript
const items: unknown = getItems()
if (isNonEmptyArray<string>(items)) {
  // TypeScript knows items is string[] with length > 0
  const first = items[0] // Safe access
}
```

---

### isNonEmptyString()

> **isNonEmptyString**(`value`): `value is string`

Type guard for non-empty string validation.
Checks both type and length in a single operation.

#### Parameters

##### value

`unknown`

Value to check

#### Returns

`value is string`

Type predicate indicating if value is a non-empty string

#### Example

```typescript
const input: unknown = getUserInput()
if (isNonEmptyString(input)) {
  // TypeScript knows input is string here
  processString(input)
} else {
  return err('Input must be a non-empty string')
}
```

---

### isObject()

> **isObject**(`value`): `value is Record<string, unknown>`

Type guard for object validation (excludes arrays and null).
Use this to safely access object properties.

#### Parameters

##### value

`unknown`

Value to check

#### Returns

`value is Record<string, unknown>`

Type predicate indicating if value is a plain object

#### Example

```typescript
const data: unknown = JSON.parse(input)
if (isObject(data)) {
  // Safe to access properties
  const name = data.name
}
```

---

### isRecoverableError()

> **isRecoverableError**(`error`): `boolean`

Check if an error is recoverable through retry or user action.

#### Parameters

##### error

Error object with optional recoverable property

###### recoverable?

`boolean`

#### Returns

`boolean`

true if the error is marked as recoverable

#### Example

```typescript
const error = { recoverable: true, message: 'Network timeout' }
if (isRecoverableError(error)) {
  // Retry the operation
}
```

---

### mapLibraryError()

> **mapLibraryError**(`component`, `library`, `operation`, `error`): [`CoreError`](#coreerror)

Map third-party library errors to CoreError format.
Use this when wrapping external library calls.

#### Parameters

##### component

`string`

Component using the library

##### library

`string`

Library name (e.g., 'axios', 'prisma')

##### operation

`string`

Operation being performed

##### error

`unknown`

The library error

#### Returns

[`CoreError`](#coreerror)

Standardized CoreError

#### Example

```typescript
try {
  await axios.get(url)
} catch (error) {
  return err(mapLibraryError('api-client', 'axios', 'fetchData', error))
}
```

---

### mapNodeError()

> **mapNodeError**(`component`, `operation`, `path`, `error`): [`CoreError`](#coreerror)

Map Node.js errors to CoreError format.
Handles common Node.js error patterns like ENOENT, EACCES, etc.

#### Parameters

##### component

`string`

Component where error occurred

##### operation

`string`

Operation being performed

##### path

`string`

File/resource path involved

##### error

`unknown`

The Node.js error

#### Returns

[`CoreError`](#coreerror)

Standardized CoreError

#### Example

```typescript
try {
  await fs.readFile(path)
} catch (error) {
  return err(mapNodeError('config-loader', 'readConfig', path, error))
}
```

---

### mapValidationError()

> **mapValidationError**(`component`, `field`, `value`, `error`): [`CoreError`](#coreerror)

Map validation errors to CoreError format.
Provides consistent validation error structure.

#### Parameters

##### component

`string`

Component performing validation

##### field

`string`

Field being validated

##### value

`unknown`

Value that failed validation

##### error

`unknown`

The validation error

#### Returns

[`CoreError`](#coreerror)

Standardized CoreError

#### Example

```typescript
const result = validateEmail(email)
if (result.isErr()) {
  return err(mapValidationError('user-service', 'email', email, result.error))
}
```

---

### tap()

> **tap**\<`T`\>(`fn`): (`value`) => `T`

Execute a side effect without affecting the value flow.
Useful for logging, debugging, or triggering external effects.

#### Type Parameters

##### T

`T`

The type of value

#### Parameters

##### fn

(`value`) => `void`

Side effect function to execute

#### Returns

Function that executes side effect and returns original value

> (`value`): `T`

##### Parameters

###### value

`T`

##### Returns

`T`

#### Example

```typescript
const result = pipe(
  userData,
  tap((data) => console.log('Processing user:', data.id)),
  transformUser,
  tap((user) => analytics.track('user.transformed', { id: user.id })),
  saveUser
)
```

---

### withContext()

> **withContext**\<`E`\>(`error`, `context`): `E`

Add or update context information on an existing error.
Useful for adding context as errors propagate up the call stack.

#### Type Parameters

##### E

`E` _extends_ [`CoreError`](#coreerror)

Error type extending CoreError

#### Parameters

##### error

`E`

The error to add context to

##### context

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<[`ErrorContext`](#errorcontext)\>

Context information to add/update

#### Returns

`E`

Error with updated context

#### Example

```typescript
const originalError = createCoreError('DatabaseError', 'CONNECTION_FAILED', 'Cannot connect')

// Add context as error propagates
const contextualError = withContext(originalError, {
  component: 'user-repository',
  operation: 'findUserById',
  metadata: { userId: '123', attempt: 1 },
})
```
