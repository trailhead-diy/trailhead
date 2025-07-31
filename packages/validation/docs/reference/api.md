---
type: reference
title: 'Validation Package API Reference'
description: 'Complete API reference for validation operations with built-in validators, schema composition, and Result-based error handling'
related:
  - /docs/reference/core-api
  - /packages/validation/docs/explanation/functional-architecture/composition-patterns.md
  - /packages/validation/docs/how-to/contributing/validate-data.md
---

# Validation Package API Reference

Complete API reference for `@esteban-url/validation` package providing data validation with Result-based error handling and schema composition.

## Core Types

### `ValidationResult<T>`

Result type for validation operations.

```typescript
type ValidationResult<T> = Result<T, ValidationError>
```

### `ValidationError`

Specialized error type for validation operations.

```typescript
interface ValidationError extends CoreError {
  readonly type: 'ValidationError'
  readonly field?: string
  readonly value?: unknown
  readonly expected?: string
  readonly issues?: ValidationIssue[]
}
```

### `ValidatorFn<T>`

Function type for synchronous validators.

```typescript
type ValidatorFn<T> = (value: unknown) => ValidationResult<T>
```

### `AsyncValidatorFn<T>`

Function type for asynchronous validators.

```typescript
type AsyncValidatorFn<T> = (value: unknown) => Promise<ValidationResult<T>>
```

### `SchemaValidator<T>`

Function type for schema-based validators.

```typescript
type SchemaValidator<T> = (value: unknown) => ValidationResult<T>
```

### `ValidationConfig`

Configuration for validation operations.

```typescript
interface ValidationConfig {
  readonly strict?: boolean
  readonly coerce?: boolean
  readonly stripUnknown?: boolean
  readonly abortEarly?: boolean
  readonly context?: Record<string, unknown>
}
```

## Main API

### `validate`

Pre-configured validation functions.

```typescript
const validate: {
  email: ValidatorFn<string>
  url: ValidatorFn<string>
  phoneNumber: ValidatorFn<string>
  stringLength: (min: number, max?: number) => ValidatorFn<string>
  numberRange: (min?: number, max?: number) => ValidatorFn<number>
  required: ValidatorFn<any>
  currency: ValidatorFn<string>
  date: ValidatorFn<Date>
  array: <T>(validator: ValidatorFn<T>) => ValidatorFn<T[]>
  object: <T>(validators: ObjectValidators<T>) => ValidatorFn<T>
}
```

**Usage**:

```typescript
import { validate } from '@esteban-url/validation'

const result = validate.email('user@example.com')
```

## Core Validators

### `validateEmail()`

Creates an email validator.

```typescript
function validateEmail(config?: ValidationConfig): ValidatorFn<string>
```

**Returns**: Function that validates email addresses

**Usage**:

```typescript
const emailValidator = validateEmail()
const result = emailValidator('user@example.com')
```

### `validateUrl()`

Creates a URL validator.

```typescript
function validateUrl(config?: ValidationConfig): ValidatorFn<string>
```

**Returns**: Function that validates URLs

### `validatePhoneNumber()`

Creates a phone number validator.

```typescript
function validatePhoneNumber(config?: ValidationConfig): ValidatorFn<string>
```

**Returns**: Function that validates phone numbers

### `validateStringLength()`

Creates a string length validator.

```typescript
function validateStringLength(
  min: number,
  max?: number,
  config?: ValidationConfig
): ValidatorFn<string>
```

**Parameters**:

- `min` - Minimum length
- `max` - Maximum length (optional)
- `config` - Validation configuration

**Returns**: Function that validates string length

### `validateNumberRange()`

Creates a number range validator.

```typescript
function validateNumberRange(
  min?: number,
  max?: number,
  config?: ValidationConfig
): ValidatorFn<number>
```

**Parameters**:

- `min` - Minimum value (optional)
- `max` - Maximum value (optional)
- `config` - Validation configuration

**Returns**: Function that validates number range

### `validateRequired()`

Creates a required field validator.

```typescript
function validateRequired<T>(config?: ValidationConfig): ValidatorFn<T>
```

**Returns**: Function that validates required fields

### `validateCurrency()`

Creates a currency validator.

```typescript
function validateCurrency(config?: ValidationConfig): ValidatorFn<string>
```

**Returns**: Function that validates currency format

### `validateDate()`

Creates a date validator.

```typescript
function validateDate(config?: ValidationConfig): ValidatorFn<Date>
```

**Returns**: Function that validates dates

### `validateArray()`

Creates an array validator.

```typescript
function validateArray<T>(
  itemValidator: ValidatorFn<T>,
  config?: ValidationConfig
): ValidatorFn<T[]>
```

**Parameters**:

- `itemValidator` - Validator for array items
- `config` - Validation configuration

**Returns**: Function that validates arrays

### `validateObject()`

Creates an object validator.

```typescript
function validateObject<T extends Record<string, any>>(
  validators: ObjectValidators<T>,
  config?: ValidationConfig
): ValidatorFn<T>
```

**Parameters**:

- `validators` - Object with field validators
- `config` - Validation configuration

**Returns**: Function that validates objects

## Validator Composition

### `composeValidators()`

Composes multiple validators into one.

```typescript
function composeValidators<T>(...validators: ValidatorFn<T>[]): ValidatorFn<T>
```

**Parameters**:

- `validators` - Array of validators to compose

**Returns**: Composed validator function

**Usage**:

```typescript
const validator = composeValidators(
  validateRequired(),
  validateStringLength(3, 50),
  validateEmail()
)
```

### `anyOf()`

Creates a validator that passes if any validator passes.

```typescript
function anyOf<T>(...validators: ValidatorFn<T>[]): ValidatorFn<T>
```

**Parameters**:

- `validators` - Array of validators

**Returns**: Validator that passes if any validator passes

### `allOf()`

Creates a validator that passes only if all validators pass.

```typescript
function allOf<T>(...validators: ValidatorFn<T>[]): ValidatorFn<T>
```

**Parameters**:

- `validators` - Array of validators

**Returns**: Validator that passes only if all validators pass

### `createValidator()`

Creates a custom validator function.

```typescript
function createValidator<T>(
  predicate: (value: unknown) => boolean,
  errorMessage: string,
  config?: ValidationConfig
): ValidatorFn<T>
```

**Parameters**:

- `predicate` - Function that tests the value
- `errorMessage` - Error message for validation failure
- `config` - Validation configuration

**Returns**: Custom validator function

## Schema Validation

### Pre-built Schemas

#### `emailSchema`

Zod schema for email validation.

```typescript
const emailSchema: z.ZodString
```

#### `urlSchema`

Zod schema for URL validation.

```typescript
const urlSchema: z.ZodString
```

#### `phoneSchema`

Zod schema for phone number validation.

```typescript
const phoneSchema: z.ZodString
```

#### `stringLengthSchema()`

Creates a string length schema.

```typescript
function stringLengthSchema(min: number, max?: number): z.ZodString
```

#### `nonEmptyStringSchema`

Schema for non-empty strings.

```typescript
const nonEmptyStringSchema: z.ZodString
```

#### `trimmedStringSchema`

Schema that trims whitespace from strings.

```typescript
const trimmedStringSchema: z.ZodString
```

#### `projectNameSchema`

Schema for project names.

```typescript
const projectNameSchema: z.ZodString
```

#### `packageManagerSchema`

Schema for package manager names.

```typescript
const packageManagerSchema: z.ZodEnum<['npm', 'yarn', 'pnpm']>
```

#### `filePathSchema`

Schema for file paths.

```typescript
const filePathSchema: z.ZodString
```

#### `authorSchema`

Schema for author information.

```typescript
const authorSchema: z.ZodObject<{
  name: z.ZodString
  email: z.ZodOptional<z.ZodString>
  url: z.ZodOptional<z.ZodString>
}>
```

#### `portSchema`

Schema for port numbers.

```typescript
const portSchema: z.ZodNumber
```

#### `positiveIntegerSchema`

Schema for positive integers.

```typescript
const positiveIntegerSchema: z.ZodNumber
```

#### `dateSchema`

Schema for dates.

```typescript
const dateSchema: z.ZodDate
```

#### `arraySchema()`

Creates an array schema.

```typescript
function arraySchema<T>(itemSchema: z.ZodType<T>): z.ZodArray<z.ZodType<T>>
```

### Schema Composition

#### `optionalSchema()`

Makes a schema optional.

```typescript
function optionalSchema<T>(schema: z.ZodType<T>): z.ZodOptional<z.ZodType<T>>
```

#### `withDefault()`

Adds a default value to a schema.

```typescript
function withDefault<T>(schema: z.ZodType<T>, defaultValue: T): z.ZodDefault<z.ZodType<T>>
```

#### `mergeSchemas()`

Merges multiple object schemas.

```typescript
function mergeSchemas<T, U>(schema1: z.ZodObject<T>, schema2: z.ZodObject<U>): z.ZodObject<T & U>
```

#### `conditionalSchema()`

Creates a conditional schema.

```typescript
function conditionalSchema<T>(
  condition: (value: unknown) => boolean,
  trueSchema: z.ZodType<T>,
  falseSchema: z.ZodType<T>
): z.ZodType<T>
```

### Schema Utilities

#### `createSchemaValidator()`

Creates a validator from a Zod schema.

```typescript
function createSchemaValidator<T>(
  schema: z.ZodType<T>,
  config?: ValidationConfig
): SchemaValidator<T>
```

**Parameters**:

- `schema` - Zod schema
- `config` - Validation configuration

**Returns**: Schema validator function

#### `validationPresets`

Pre-configured validation presets.

```typescript
const validationPresets: {
  strict: ValidationConfig
  permissive: ValidationConfig
  coercive: ValidationConfig
}
```

#### `schemaRegistry`

Registry for storing and retrieving schemas.

```typescript
const schemaRegistry: {
  register: <T>(key: string, schema: z.ZodType<T>) => void
  get: <T>(key: string) => z.ZodType<T> | undefined
  has: (key: string) => boolean
  keys: () => string[]
}
```

## Error Factories

### `createValidationError()`

Creates validation-specific errors.

```typescript
function createValidationError(
  field: string,
  value: unknown,
  message: string,
  options?: {
    expected?: string
    details?: string
    cause?: unknown
  }
): ValidationError
```

### `createRequiredFieldError()`

Creates required field errors.

```typescript
function createRequiredFieldError(field: string): ValidationError
```

### `createInvalidTypeError()`

Creates invalid type errors.

```typescript
function createInvalidTypeError(field: string, value: unknown, expected: string): ValidationError
```

### `zodErrorToValidationError()`

Converts Zod errors to ValidationError format.

```typescript
function zodErrorToValidationError(zodError: z.ZodError, field?: string): ValidationError
```

## Configuration

### `defaultValidationConfig`

Default configuration for validation operations.

```typescript
const defaultValidationConfig: ValidationConfig
```

## Usage Examples

### Basic Validation

```typescript
import { validate } from '@esteban-url/validation'

// Email validation
const emailResult = validate.email('user@example.com')
if (emailResult.isOk()) {
  console.log('Valid email:', emailResult.value)
}

// String length validation
const lengthValidator = validate.stringLength(3, 50)
const lengthResult = lengthValidator('Hello')

// Number range validation
const rangeValidator = validate.numberRange(1, 100)
const rangeResult = rangeValidator(42)
```

### Object Validation

```typescript
import { validate } from '@esteban-url/validation'

const userValidator = validate.object({
  email: validate.email,
  age: validate.numberRange(18, 120),
  name: validate.stringLength(2, 50),
})

const result = userValidator({
  email: 'user@example.com',
  age: 25,
  name: 'John Doe',
})
```

### Array Validation

```typescript
import { validate } from '@esteban-url/validation'

const emailListValidator = validate.array(validate.email)
const result = emailListValidator(['user1@example.com', 'user2@example.com'])
```

### Schema-based Validation

```typescript
import { emailSchema, createSchemaValidator } from '@esteban-url/validation'

const emailValidator = createSchemaValidator(emailSchema)
const result = emailValidator('user@example.com')
```

### Custom Validators

```typescript
import { createValidator } from '@esteban-url/validation'

const evenNumberValidator = createValidator<number>(
  (value) => typeof value === 'number' && value % 2 === 0,
  'Value must be an even number'
)

const result = evenNumberValidator(42)
```

### Validator Composition

```typescript
import {
  composeValidators,
  validateRequired,
  validateStringLength,
  validateEmail,
} from '@esteban-url/validation'

const emailValidator = composeValidators(
  validateRequired(),
  validateStringLength(5, 100),
  validateEmail()
)

const result = emailValidator('user@example.com')
```

### Complex Schema

```typescript
import { z, createSchemaValidator } from '@esteban-url/validation'

const userSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().min(18).max(120),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark']),
      notifications: z.boolean(),
    })
    .optional(),
})

const validateUser = createSchemaValidator(userSchema)
const result = validateUser({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
})
```

### Error Handling

```typescript
import { validate, createValidationError } from '@esteban-url/validation'

const result = validate.email('invalid-email')
if (result.isErr()) {
  const error = result.error
  console.error(`Validation failed: ${error.message}`)
  console.error(`Field: ${error.field}`)
  console.error(`Value: ${error.value}`)
  console.error(`Expected: ${error.expected}`)
}
```

### Schema Registry

```typescript
import { schemaRegistry, createSchemaValidator, z } from '@esteban-url/validation'

// Register schema
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
})
schemaRegistry.register('user', userSchema)

// Use registered schema
const registeredSchema = schemaRegistry.get('user')
if (registeredSchema) {
  const validator = createSchemaValidator(registeredSchema)
  const result = validator({ name: 'John', email: 'john@example.com' })
}
```

### Async Validation

```typescript
import { createValidator, ValidationResult } from '@esteban-url/validation'

const asyncEmailValidator = async (value: unknown): Promise<ValidationResult<string>> => {
  const emailResult = validate.email(value)
  if (emailResult.isErr()) {
    return emailResult
  }

  // Simulate async check (e.g., database lookup)
  const exists = await checkEmailExists(emailResult.value)
  if (exists) {
    return err(createValidationError('email', value, 'Email already exists'))
  }

  return ok(emailResult.value)
}
```

## Related APIs

- [Core API Reference](/docs/reference/core-api) - Base Result types and error handling
- [Data API](/packages/data/docs/reference/api) - Data processing operations
- [FileSystem API](/packages/fs/docs/reference/api) - File operations
