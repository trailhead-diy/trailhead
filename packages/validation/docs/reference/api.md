---
type: reference
title: 'Validation Package API Reference'
description: 'Complete API reference for validation operations with built-in validators, schema composition, and Result-based error handling'
related:
  - /docs/reference/core-api
  - /packages/validation/docs/explanation/composition-patterns.md
  - /packages/validation/docs/how-to/validate-data.md
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
  readonly type: 'VALIDATION_ERROR'
  readonly field?: string
  readonly value?: unknown
  readonly constraints?: Record<string, unknown>
}
```

### `ValidatorFn<T, R>`

Function type for synchronous validators.

```typescript
type ValidatorFn<T, R = T> = (value: T) => ValidationResult<R>
```

### `AsyncValidatorFn<T, R>`

Function type for asynchronous validators.

```typescript
type AsyncValidatorFn<T, R = T> = (value: T) => Promise<ValidationResult<R>>
```

### `SchemaValidator<T>`

Schema validator type with integrated schema and validate function.

```typescript
type SchemaValidator<T> = {
  readonly schema: z.ZodType<T>
  readonly validate: ValidatorFn<unknown, T>
}

### `ValidationConfig`

Configuration for validation operations.

```typescript
interface ValidationConfig {
  readonly abortEarly?: boolean
  readonly stripUnknown?: boolean
  readonly allowUnknown?: boolean
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
  currency: ValidatorFn<number>
  date: ValidatorFn<string, Date>
  array: <T>(validator: (value: T) => any) => ValidatorFn<T[], T[]>
  object: <T extends Record<string, any>>(validators: any) => ValidatorFn<T>
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
function validateCurrency(config?: ValidationConfig): ValidatorFn<number>
```

**Returns**: Function that validates currency values (positive numbers with max 2 decimal places)

### `validateDate()`

Creates a date validator.

```typescript
function validateDate(config?: ValidationConfig): ValidatorFn<string, Date>
```

**Returns**: Function that validates date strings and returns Date objects

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

Composes two validators in sequence.

```typescript
function composeValidators<T, R1, R2>(
  first: ValidatorFn<T, R1>,
  second: ValidatorFn<R1, R2>
): ValidatorFn<T, R2>
```

**Parameters**:

- `first` - First validator in the chain
- `second` - Second validator that processes the result of the first

**Returns**: Composed validator function

**Usage**:

```typescript
const validator = composeValidators(
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

- `validators` - Array of validators to try

**Returns**: Validator that passes if any validator passes

**Usage**:

```typescript
const flexibleValidator = anyOf(
  validateEmail(),
  validatePhoneNumber()
)
```

### `allOf()`

Creates a validator that passes only if all validators pass.

```typescript
function allOf<T>(...validators: ValidatorFn<T>[]): ValidatorFn<T>
```

**Parameters**:

- `validators` - Array of validators that all must pass

**Returns**: Validator that passes only if all validators pass

**Usage**:

```typescript
const strictValidator = allOf(
  validateRequired(),
  validateStringLength(8, 50),
  validateEmail()
)
```

### `createValidator()`

Creates a validator function from a Zod schema.

```typescript
function createValidator<T, R = T>(
  schema: z.ZodType<R>,
  config?: ValidationConfig
): ValidatorFn<T, R>
```

**Parameters**:

- `schema` - Zod schema to use for validation
- `config` - Validation configuration

**Returns**: Validator function that uses the schema

**Usage**:

```typescript
const userValidator = createValidator(
  z.object({
    name: z.string().min(2),
    email: z.string().email()
  })
)
```

## Schema Validation

### Pre-built Schemas

#### `emailSchema()`

Creates a Zod schema for email validation.

```typescript
function emailSchema(): z.ZodString
```

#### `urlSchema()`

Creates a Zod schema for URL validation.

```typescript
function urlSchema(options?: { requireHttps?: boolean }): z.ZodString
```

#### `phoneSchema()`

Creates a Zod schema for phone number validation.

```typescript
function phoneSchema(): z.ZodString
```

#### `stringLengthSchema()`

Creates a string length schema.

```typescript
function stringLengthSchema(min: number = 1, max?: number, fieldName: string = 'Value'): z.ZodString
```

#### `nonEmptyStringSchema()`

Creates a schema for non-empty strings.

```typescript
function nonEmptyStringSchema(fieldName: string = 'Value'): z.ZodString
```

#### `trimmedStringSchema()`

Creates a schema that trims whitespace from strings.

```typescript
function trimmedStringSchema(fieldName: string = 'Value'): z.ZodString
```

#### `projectNameSchema()`

Creates a schema for project names.

```typescript
function projectNameSchema(): z.ZodString
```

#### `packageManagerSchema()`

Creates a schema for package manager names.

```typescript
function packageManagerSchema(): z.ZodEnum<['npm', 'yarn', 'pnpm']>
```

#### `filePathSchema()`

Creates a schema for file paths.

```typescript
function filePathSchema(options?: {
  allowAbsolute?: boolean
  allowTraversal?: boolean
  baseDir?: string
}): z.ZodString
```

#### `authorSchema()`

Creates a schema for author information.

```typescript
function authorSchema(): z.ZodObject<{
  name: z.ZodString
  email: z.ZodOptional<z.ZodString>
  url: z.ZodOptional<z.ZodString>
}>
```

#### `portSchema()`

Creates a schema for port numbers.

```typescript
function portSchema(): z.ZodNumber
```

#### `positiveIntegerSchema()`

Creates a schema for positive integers.

```typescript
function positiveIntegerSchema(fieldName: string = 'Value'): z.ZodNumber
```

#### `dateSchema()`

Creates a schema for dates.

```typescript
function dateSchema(options?: {
  allowFuture?: boolean
  allowPast?: boolean
  format?: 'iso' | 'date-only' | 'any'
}): z.ZodDate
```

#### `arraySchema()`

Creates an array schema.

```typescript
function arraySchema<T>(
  itemSchema: z.ZodSchema<T>,
  options?: {
    minLength?: number
    maxLength?: number
    unique?: boolean
    fieldName?: string
  }
): z.ZodArray<z.ZodSchema<T>>
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
  email: () => ValidatorFn<unknown, string>
  url: (requireHttps?: boolean) => ValidatorFn<unknown, string>
  phone: () => ValidatorFn<unknown, string>
  projectName: () => ValidatorFn<unknown, string>
  packageManager: () => ValidatorFn<unknown, 'npm' | 'yarn' | 'pnpm'>
  filePath: (options?: Parameters<typeof filePathSchema>[0]) => ValidatorFn<unknown, string>
  port: () => ValidatorFn<unknown, number>
  positiveInteger: (fieldName?: string) => ValidatorFn<unknown, number>
  date: (options?: Parameters<typeof dateSchema>[0]) => ValidatorFn<unknown, Date>
  array: <T>(itemSchema: z.ZodSchema<T>, options?: Parameters<typeof arraySchema>[1]) => ValidatorFn<unknown, T[]>
}
```

#### `schemaRegistry`

Registry for looking up schema factories.

```typescript
const schemaRegistry: {
  email: typeof emailSchema
  url: typeof urlSchema
  phone: typeof phoneSchema
  projectName: typeof projectNameSchema
  packageManager: typeof packageManagerSchema
  filePath: typeof filePathSchema
  author: typeof authorSchema
  port: typeof portSchema
  positiveInteger: typeof positiveIntegerSchema
  date: typeof dateSchema
  array: typeof arraySchema
  stringLength: typeof stringLengthSchema
  nonEmptyString: typeof nonEmptyStringSchema
  trimmedString: typeof trimmedStringSchema
}

export type SchemaRegistryKey = keyof typeof schemaRegistry
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
function createInvalidTypeError(
  field: string,
  expectedType: string,
  actualValue: unknown
): ValidationError
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
import { createValidator, z } from '@esteban-url/validation'

const evenNumberValidator = createValidator(
  z.number().refine((value) => value % 2 === 0, {
    message: 'Value must be an even number'
  })
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
import { schemaRegistry, createSchemaValidator } from '@esteban-url/validation'

// Access schema factory functions
const emailSchemaFactory = schemaRegistry.email
const userSchemaFactory = schemaRegistry.author

// Create validators from schema factories
const emailValidator = createSchemaValidator(emailSchemaFactory())
const userValidator = createSchemaValidator(userSchemaFactory())

// Use validators
const emailResult = emailValidator('user@example.com')
const userResult = userValidator({
  name: 'John Doe',
  email: 'john@example.com'
})
```

### Async Validation

```typescript
import { validate, createValidationError, ValidationResult, ok, err } from '@esteban-url/validation'

const asyncEmailValidator = async (value: string): Promise<ValidationResult<string>> => {
  const emailResult = validate.email(value)
  if (emailResult.isErr()) {
    return emailResult
  }

  // Simulate async check (e.g., database lookup)
  const exists = await checkEmailExists(emailResult.value)
  if (exists) {
    return err(createValidationError('Email already exists', {
      field: 'email',
      value,
      suggestion: 'Use a different email address'
    }))
  }

  return ok(emailResult.value)
}

// Usage
const result = await asyncEmailValidator('user@example.com')
```

## Related APIs

- [Core API Reference](/docs/reference/core-api.md)- Base Result types and error handling
- [Data API](/packages/data/docs/reference/api.md)- Data processing operations
- [FileSystem API](/packages/fs/docs/reference/api.md)- File operations
