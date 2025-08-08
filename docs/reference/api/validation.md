---
type: reference
sidebar: true
---

[**Trailhead API Documentation v1.0.0**](README.md)

---

[Trailhead API Documentation](README.md) / @esteban-url/validation

# @esteban-url/validation

## Interfaces

### ValidationConfig

#### Properties

##### abortEarly?

> `readonly` `optional` **abortEarly**: `boolean`

##### allowUnknown?

> `readonly` `optional` **allowUnknown**: `boolean`

##### stripUnknown?

> `readonly` `optional` **stripUnknown**: `boolean`

---

### ValidationError

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

#### Extends

- [`CoreError`](@esteban-url.cli.md#coreerror)

#### Properties

##### cause?

> `readonly` `optional` **cause**: `unknown`

Original error that caused this error

###### Inherited from

[`CoreError`](@esteban-url.cli.md#coreerror).[`cause`](@esteban-url.cli.md#cause)

##### code

> `readonly` **code**: `string`

Unique error code for programmatic handling (e.g., 'INVALID_INPUT', 'TIMEOUT')

###### Inherited from

[`CoreError`](@esteban-url.cli.md#coreerror).[`code`](@esteban-url.cli.md#code)

##### component

> `readonly` **component**: `string`

Component where the error occurred

###### Inherited from

[`CoreError`](@esteban-url.cli.md#coreerror).[`component`](@esteban-url.cli.md#component)

##### constraints?

> `readonly` `optional` **constraints**: `Record`\<`string`, `unknown`\>

##### context?

> `readonly` `optional` **context**: `Record`\<`string`, `unknown`\>

Additional context data for debugging

###### Inherited from

[`CoreError`](@esteban-url.cli.md#coreerror).[`context`](@esteban-url.cli.md#context)

##### details?

> `readonly` `optional` **details**: `string`

Additional error details for debugging

###### Inherited from

[`CoreError`](@esteban-url.cli.md#coreerror).[`details`](@esteban-url.cli.md#details)

##### field?

> `readonly` `optional` **field**: `string`

##### message

> `readonly` **message**: `string`

Human-readable error message

###### Inherited from

[`CoreError`](@esteban-url.cli.md#coreerror).[`message`](@esteban-url.cli.md#message)

##### operation

> `readonly` **operation**: `string`

Operation that was being performed when error occurred

###### Inherited from

[`CoreError`](@esteban-url.cli.md#coreerror).[`operation`](@esteban-url.cli.md#operation)

##### recoverable

> `readonly` **recoverable**: `boolean`

Whether the error is recoverable through retry or user action

###### Inherited from

[`CoreError`](@esteban-url.cli.md#coreerror).[`recoverable`](@esteban-url.cli.md#recoverable)

##### severity

> `readonly` **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Error severity level for prioritization

###### Inherited from

[`CoreError`](@esteban-url.cli.md#coreerror).[`severity`](@esteban-url.cli.md#severity)

##### suggestion?

> `readonly` `optional` **suggestion**: `string`

Helpful suggestion for error recovery

###### Inherited from

[`CoreError`](@esteban-url.cli.md#coreerror).[`suggestion`](@esteban-url.cli.md#suggestion)

##### timestamp

> `readonly` **timestamp**: `Date`

When the error occurred

###### Inherited from

[`CoreError`](@esteban-url.cli.md#coreerror).[`timestamp`](@esteban-url.cli.md#timestamp)

##### type

> `readonly` **type**: `"VALIDATION_ERROR"`

Error type for categorization (e.g., 'ValidationError', 'NetworkError')

###### Overrides

[`CoreError`](@esteban-url.cli.md#coreerror).[`type`](@esteban-url.cli.md#type-1)

##### value?

> `readonly` `optional` **value**: `unknown`

## Type Aliases

### AsyncValidatorFn()\<T, R\>

> **AsyncValidatorFn**\<`T`, `R`\> = (`value`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ValidationResult`](#validationresult)\<`R`\>\>

#### Type Parameters

##### T

`T`

##### R

`R` = `T`

#### Parameters

##### value

`T`

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ValidationResult`](#validationresult)\<`R`\>\>

---

### SchemaRegistryKey

> **SchemaRegistryKey** = keyof _typeof_ [`schemaRegistry`](#schemaregistry)

---

### SchemaValidator\<T\>

> **SchemaValidator**\<`T`\> = `object`

#### Type Parameters

##### T

`T`

#### Properties

##### schema

> `readonly` **schema**: `z.ZodType`\<`T`\>

##### validate

> `readonly` **validate**: [`ValidatorFn`](#validatorfn)\<`unknown`, `T`\>

---

### ValidationResult\<T\>

> **ValidationResult**\<`T`\> = `Result`\<`T`, [`ValidationError`](#validationerror)\>

#### Type Parameters

##### T

`T`

---

### ValidatorFn()\<T, R\>

> **ValidatorFn**\<`T`, `R`\> = (`value`) => [`ValidationResult`](#validationresult)\<`R`\>

#### Type Parameters

##### T

`T`

##### R

`R` = `T`

#### Parameters

##### value

`T`

#### Returns

[`ValidationResult`](#validationresult)\<`R`\>

## Variables

### defaultValidationConfig

> `const` **defaultValidationConfig**: [`ValidationConfig`](#validationconfig)

---

### schemaRegistry

> `const` **schemaRegistry**: `object`

Schema registry for dynamic schema lookup

#### Type declaration

##### array()

> `readonly` **array**: \<`T`\>(`itemSchema`, `options`) => `ZodArray`\<`ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\> = `arraySchema`

Array validation schema with length constraints

###### Type Parameters

###### T

`T`

###### Parameters

###### itemSchema

`ZodType`\<`T`\>

###### options

###### fieldName?

`string`

###### maxLength?

`number`

###### minLength?

`number`

###### unique?

`boolean`

###### Returns

`ZodArray`\<`ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\>

##### author()

> `readonly` **author**: () => `ZodObject`\<\{ `email`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `url`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\> = `authorSchema`

Author information schema for project generation

###### Returns

`ZodObject`\<\{ `email`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `url`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>

##### date()

> `readonly` **date**: (`options`) => `ZodPipe`\<`ZodString`, `ZodTransform`\<`Date`, `string`\>\> \| `ZodPipe`\<`ZodUnion`\<readonly \[`ZodString`, `ZodString`, `ZodDate`\]\>, `ZodTransform`\<`Date`, `string` \| `Date`\>\> = `dateSchema`

Date validation schema with multiple format support

###### Parameters

###### options

###### allowFuture?

`boolean`

###### allowPast?

`boolean`

###### format?

`"iso"` \| `"date-only"` \| `"any"`

###### Returns

`ZodPipe`\<`ZodString`, `ZodTransform`\<`Date`, `string`\>\> \| `ZodPipe`\<`ZodUnion`\<readonly \[`ZodString`, `ZodString`, `ZodDate`\]\>, `ZodTransform`\<`Date`, `string` \| `Date`\>\>

##### email()

> `readonly` **email**: () => `ZodString` = `emailSchema`

Email validation schema with consistent error messaging

Creates a Zod schema for email validation with RFC 5321 compliance,
including length limits and user-friendly error messages.

###### Returns

`ZodString`

Zod email schema

###### Example

```typescript
// Direct schema usage
const schema = emailSchema()
const result = schema.safeParse('user@example.com')

// In a user registration form
const userSchema = z.object({
  email: emailSchema(),
  password: passwordSchema(),
})

// With custom validator
const emailValidator = createValidator(emailSchema())
const validation = emailValidator('invalid.email')
if (validation.isErr()) {
  console.log(validation.error.message)
}
```

##### filePath()

> `readonly` **filePath**: (`options`) => `ZodString` = `filePathSchema`

File path validation schema with security checks

###### Parameters

###### options

###### allowAbsolute?

`boolean`

###### allowTraversal?

`boolean`

###### baseDir?

`string`

###### Returns

`ZodString`

##### nonEmptyString()

> `readonly` **nonEmptyString**: (`fieldName`) => `ZodString` = `nonEmptyStringSchema`

Non-empty string schema

###### Parameters

###### fieldName

`string` = `'Value'`

###### Returns

`ZodString`

##### packageManager()

> `readonly` **packageManager**: () => `ZodEnum`\<\{ `npm`: `"npm"`; `pnpm`: `"pnpm"`; `yarn`: `"yarn"`; \}\> = `packageManagerSchema`

Package manager validation schema

###### Returns

`ZodEnum`\<\{ `npm`: `"npm"`; `pnpm`: `"pnpm"`; `yarn`: `"yarn"`; \}\>

##### phone()

> `readonly` **phone**: () => `ZodString` = `phoneSchema`

Phone number validation schema with international support

###### Returns

`ZodString`

##### port()

> `readonly` **port**: () => `ZodNumber` = `portSchema`

Port number validation schema

###### Returns

`ZodNumber`

##### positiveInteger()

> `readonly` **positiveInteger**: (`fieldName`) => `ZodNumber` = `positiveIntegerSchema`

Positive integer schema

###### Parameters

###### fieldName

`string` = `'Value'`

###### Returns

`ZodNumber`

##### projectName()

> `readonly` **projectName**: () => `ZodString` = `projectNameSchema`

Project name validation schema with npm package name rules

Validates project names according to npm package naming conventions:
lowercase letters, numbers, hyphens, starting with letter, max 214 chars.

###### Returns

`ZodString`

Zod schema for project name validation

###### Example

```typescript
// Validate CLI project name
const schema = projectNameSchema()

// Valid names
schema.safeParse('my-awesome-cli').success // true
schema.safeParse('cli-tool-2024').success // true

// Invalid names
schema.safeParse('MyProject').success // false (uppercase)
schema.safeParse('_private').success // false (starts with underscore)
schema.safeParse('@scoped/package').success // false (contains @/)

// In project configuration
const configSchema = z.object({
  name: projectNameSchema(),
  version: semverSchema(),
  description: nonEmptyStringSchema('Description'),
})
```

##### stringLength()

> `readonly` **stringLength**: (`min`, `max?`, `fieldName`) => `ZodString` = `stringLengthSchema`

String length validation with configurable min/max

###### Parameters

###### min

`number` = `1`

###### max?

`number`

###### fieldName?

`string` = `'Value'`

###### Returns

`ZodString`

##### trimmedString()

> `readonly` **trimmedString**: (`fieldName`) => `ZodPipe`\<`ZodString`, `ZodTransform`\<`string`, `string`\>\> = `trimmedStringSchema`

Trimmed string schema that normalizes whitespace

###### Parameters

###### fieldName

`string` = `'Value'`

###### Returns

`ZodPipe`\<`ZodString`, `ZodTransform`\<`string`, `string`\>\>

##### url()

> `readonly` **url**: (`options`) => `ZodString` = `urlSchema`

URL validation schema with protocol requirements

###### Parameters

###### options

###### requireHttps?

`boolean`

###### Returns

`ZodString`

---

### validate

> `const` **validate**: `object`

#### Type declaration

##### array()

> **array**: \<`T`, `_R`\>(`validator`) => [`ValidatorFn`](#validatorfn)\<`T`[], `T`[]\>

###### Type Parameters

###### T

`T`

###### \_R

`_R` = `T`

###### Parameters

###### validator

(`value`) => `any`

###### Returns

[`ValidatorFn`](#validatorfn)\<`T`[], `T`[]\>

##### currency

> **currency**: [`ValidatorFn`](#validatorfn)\<`number`\>

##### date

> **date**: [`ValidatorFn`](#validatorfn)\<`string`, `Date`\>

##### email

> **email**: [`ValidatorFn`](#validatorfn)\<`string`\>

##### numberRange()

> **numberRange**: (`min?`, `max?`) => [`ValidatorFn`](#validatorfn)\<`number`\>

###### Parameters

###### min?

`number`

###### max?

`number`

###### Returns

[`ValidatorFn`](#validatorfn)\<`number`\>

##### object()

> **object**: \<`_T`\>(`validators`) => [`ValidatorFn`](#validatorfn)\<`Record`\<`string`, `any`\>\>

###### Type Parameters

###### \_T

`_T` _extends_ `Record`\<`string`, `any`\>

###### Parameters

###### validators

`any`

###### Returns

[`ValidatorFn`](#validatorfn)\<`Record`\<`string`, `any`\>\>

##### phoneNumber

> **phoneNumber**: [`ValidatorFn`](#validatorfn)\<`string`\>

##### required

> **required**: [`ValidatorFn`](#validatorfn)\<`any`, `any`\>

##### stringLength()

> **stringLength**: (`min`, `max?`) => [`ValidatorFn`](#validatorfn)\<`string`\>

###### Parameters

###### min

`number`

###### max?

`number`

###### Returns

[`ValidatorFn`](#validatorfn)\<`string`\>

##### url

> **url**: [`ValidatorFn`](#validatorfn)\<`string`\>

---

### validationPresets

> `const` **validationPresets**: `object`

Common validation presets for frequent use cases

#### Type declaration

##### array()

> **array**: \<`T`\>(`itemSchema`, `options?`) => [`ValidatorFn`](#validatorfn)\<`unknown`, `T`[]\>

###### Type Parameters

###### T

`T`

###### Parameters

###### itemSchema

`ZodType`\<`T`\>

###### options?

###### fieldName?

`string`

###### maxLength?

`number`

###### minLength?

`number`

###### unique?

`boolean`

###### Returns

[`ValidatorFn`](#validatorfn)\<`unknown`, `T`[]\>

##### date()

> **date**: (`options?`) => [`ValidatorFn`](#validatorfn)\<`unknown`, `Date`\>

###### Parameters

###### options?

###### allowFuture?

`boolean`

###### allowPast?

`boolean`

###### format?

`"iso"` \| `"date-only"` \| `"any"`

###### Returns

[`ValidatorFn`](#validatorfn)\<`unknown`, `Date`\>

##### email()

> **email**: () => [`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>

###### Returns

[`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>

##### filePath()

> **filePath**: (`options?`) => [`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>

###### Parameters

###### options?

###### allowAbsolute?

`boolean`

###### allowTraversal?

`boolean`

###### baseDir?

`string`

###### Returns

[`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>

##### packageManager()

> **packageManager**: () => [`ValidatorFn`](#validatorfn)\<`unknown`, `"npm"` \| `"yarn"` \| `"pnpm"`\>

###### Returns

[`ValidatorFn`](#validatorfn)\<`unknown`, `"npm"` \| `"yarn"` \| `"pnpm"`\>

##### phone()

> **phone**: () => [`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>

###### Returns

[`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>

##### port()

> **port**: () => [`ValidatorFn`](#validatorfn)\<`unknown`, `number`\>

###### Returns

[`ValidatorFn`](#validatorfn)\<`unknown`, `number`\>

##### positiveInteger()

> **positiveInteger**: (`fieldName?`) => [`ValidatorFn`](#validatorfn)\<`unknown`, `number`\>

###### Parameters

###### fieldName?

`string`

###### Returns

[`ValidatorFn`](#validatorfn)\<`unknown`, `number`\>

##### projectName()

> **projectName**: () => [`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>

###### Returns

[`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>

##### url()

> **url**: (`requireHttps`) => [`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>

###### Parameters

###### requireHttps

`boolean` = `false`

###### Returns

[`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>

## Functions

### allOf()

> **allOf**\<`T`\>(...`validators`): [`ValidatorFn`](#validatorfn)\<`T`\>

#### Type Parameters

##### T

`T`

#### Parameters

##### validators

...[`ValidatorFn`](#validatorfn)\<`T`\>[]

#### Returns

[`ValidatorFn`](#validatorfn)\<`T`\>

---

### anyOf()

> **anyOf**\<`T`\>(...`validators`): [`ValidatorFn`](#validatorfn)\<`T`\>

#### Type Parameters

##### T

`T`

#### Parameters

##### validators

...[`ValidatorFn`](#validatorfn)\<`T`\>[]

#### Returns

[`ValidatorFn`](#validatorfn)\<`T`\>

---

### arraySchema()

> **arraySchema**\<`T`\>(`itemSchema`, `options`): `ZodArray`\<`ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\>

Array validation schema with length constraints

#### Type Parameters

##### T

`T`

#### Parameters

##### itemSchema

`ZodType`\<`T`\>

##### options

###### fieldName?

`string`

###### maxLength?

`number`

###### minLength?

`number`

###### unique?

`boolean`

#### Returns

`ZodArray`\<`ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\>

---

### authorSchema()

> **authorSchema**(): `ZodObject`\<\{ `email`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `url`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>

Author information schema for project generation

#### Returns

`ZodObject`\<\{ `email`: `ZodOptional`\<`ZodString`\>; `name`: `ZodString`; `url`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>

---

### composeValidators()

> **composeValidators**\<`T`, `R1`, `R2`\>(`first`, `second`): [`ValidatorFn`](#validatorfn)\<`T`, `R2`\>

#### Type Parameters

##### T

`T`

##### R1

`R1`

##### R2

`R2`

#### Parameters

##### first

[`ValidatorFn`](#validatorfn)\<`T`, `R1`\>

##### second

[`ValidatorFn`](#validatorfn)\<`R1`, `R2`\>

#### Returns

[`ValidatorFn`](#validatorfn)\<`T`, `R2`\>

---

### conditionalSchema()

> **conditionalSchema**\<`T`\>(`conditionField`, `conditionValue`, `thenSchema`, `elseSchema?`): `ZodObject`\<\{\[`key`: `string`\]: `ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\> \| `ZodLiteral`\<`any`\>; `value`: `ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>; \}, `$strip`\> \| `ZodUnion`\<readonly \[`ZodObject`\<\{\[`key`: `string`\]: `ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\> \| `ZodLiteral`\<`any`\>; `value`: `ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>; \}, `$strip`\>, `ZodObject`\<\{\[`key`: `string`\]: `ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\> \| `ZodAny`; `value`: `ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>; \}, `$strip`\>\]\>

Create conditional schema based on another field
Note: Simplified implementation to avoid complex TypeScript issues

#### Type Parameters

##### T

`T`

#### Parameters

##### conditionField

`string`

##### conditionValue

`any`

##### thenSchema

`ZodType`\<`T`\>

##### elseSchema?

`ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>

#### Returns

`ZodObject`\<\{\[`key`: `string`\]: `ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\> \| `ZodLiteral`\<`any`\>; `value`: `ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>; \}, `$strip`\> \| `ZodUnion`\<readonly \[`ZodObject`\<\{\[`key`: `string`\]: `ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\> \| `ZodLiteral`\<`any`\>; `value`: `ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>; \}, `$strip`\>, `ZodObject`\<\{\[`key`: `string`\]: `ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\> \| `ZodAny`; `value`: `ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>; \}, `$strip`\>\]\>

---

### createInvalidTypeError()

> **createInvalidTypeError**(`field`, `expectedType`, `actualValue`): [`ValidationError`](#validationerror)

#### Parameters

##### field

`string`

##### expectedType

`string`

##### actualValue

`unknown`

#### Returns

[`ValidationError`](#validationerror)

---

### createRequiredFieldError()

> **createRequiredFieldError**(`field`): [`ValidationError`](#validationerror)

#### Parameters

##### field

`string`

#### Returns

[`ValidationError`](#validationerror)

---

### createSchemaValidator()

> **createSchemaValidator**\<`T`\>(`schema`, `config?`): [`ValidatorFn`](#validatorfn)\<`unknown`, `T`\>

Create a validator function from a schema

#### Type Parameters

##### T

`T`

#### Parameters

##### schema

`ZodType`\<`T`\>

##### config?

[`ValidationConfig`](#validationconfig)

#### Returns

[`ValidatorFn`](#validatorfn)\<`unknown`, `T`\>

---

### createValidationError()

> **createValidationError**(`message`, `options?`): [`ValidationError`](#validationerror)

#### Parameters

##### message

`string`

##### options?

###### cause?

`unknown`

###### constraints?

`Record`\<`string`, `unknown`\>

###### context?

`Record`\<`string`, `unknown`\>

###### field?

`string`

###### suggestion?

`string`

###### value?

`unknown`

#### Returns

[`ValidationError`](#validationerror)

---

### createValidator()

> **createValidator**\<`T`, `R`\>(`schema`, `_config`): [`ValidatorFn`](#validatorfn)\<`T`, `R`\>

#### Type Parameters

##### T

`T`

##### R

`R` = `T`

#### Parameters

##### schema

`ZodType`\<`R`\>

##### \_config

[`ValidationConfig`](#validationconfig) = `defaultValidationConfig`

#### Returns

[`ValidatorFn`](#validatorfn)\<`T`, `R`\>

---

### dateSchema()

> **dateSchema**(`options`): `ZodPipe`\<`ZodString`, `ZodTransform`\<`Date`, `string`\>\> \| `ZodPipe`\<`ZodUnion`\<readonly \[`ZodString`, `ZodString`, `ZodDate`\]\>, `ZodTransform`\<`Date`, `string` \| `Date`\>\>

Date validation schema with multiple format support

#### Parameters

##### options

###### allowFuture?

`boolean`

###### allowPast?

`boolean`

###### format?

`"iso"` \| `"date-only"` \| `"any"`

#### Returns

`ZodPipe`\<`ZodString`, `ZodTransform`\<`Date`, `string`\>\> \| `ZodPipe`\<`ZodUnion`\<readonly \[`ZodString`, `ZodString`, `ZodDate`\]\>, `ZodTransform`\<`Date`, `string` \| `Date`\>\>

---

### emailSchema()

> **emailSchema**(): `ZodString`

Email validation schema with consistent error messaging

Creates a Zod schema for email validation with RFC 5321 compliance,
including length limits and user-friendly error messages.

#### Returns

`ZodString`

Zod email schema

#### Example

```typescript
// Direct schema usage
const schema = emailSchema()
const result = schema.safeParse('user@example.com')

// In a user registration form
const userSchema = z.object({
  email: emailSchema(),
  password: passwordSchema(),
})

// With custom validator
const emailValidator = createValidator(emailSchema())
const validation = emailValidator('invalid.email')
if (validation.isErr()) {
  console.log(validation.error.message)
}
```

---

### filePathSchema()

> **filePathSchema**(`options`): `ZodString`

File path validation schema with security checks

#### Parameters

##### options

###### allowAbsolute?

`boolean`

###### allowTraversal?

`boolean`

###### baseDir?

`string`

#### Returns

`ZodString`

---

### mergeSchemas()

> **mergeSchemas**\<`T`, `U`\>(`schemaA`, `schemaB`): `ZodObject`\<\{ \[k in string \| number \| symbol\]: ((keyof T & keyof U) extends never ? T & U : \{ \[K in string \| number \| symbol as K extends keyof U ? never : K\]: T\[K\] \} & \{ \[K in string \| number \| symbol\]: U\[K\] \})\[k\] \}, `$strip`\>

Merge multiple object schemas

#### Type Parameters

##### T

`T` _extends_ [`Readonly`](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)\<\{\[`k`: `string`\]: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>; \}\>

##### U

`U` _extends_ [`Readonly`](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)\<\{\[`k`: `string`\]: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>; \}\>

#### Parameters

##### schemaA

`ZodObject`\<`T`\>

##### schemaB

`ZodObject`\<`U`\>

#### Returns

`ZodObject`\<\{ \[k in string \| number \| symbol\]: ((keyof T & keyof U) extends never ? T & U : \{ \[K in string \| number \| symbol as K extends keyof U ? never : K\]: T\[K\] \} & \{ \[K in string \| number \| symbol\]: U\[K\] \})\[k\] \}, `$strip`\>

---

### nonEmptyStringSchema()

> **nonEmptyStringSchema**(`fieldName`): `ZodString`

Non-empty string schema

#### Parameters

##### fieldName

`string` = `'Value'`

#### Returns

`ZodString`

---

### optionalSchema()

> **optionalSchema**\<`T`\>(`schema`): `ZodOptional`\<`ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\>

Create a schema with optional fields

#### Type Parameters

##### T

`T`

#### Parameters

##### schema

`ZodType`\<`T`\>

#### Returns

`ZodOptional`\<`ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\>

---

### packageManagerSchema()

> **packageManagerSchema**(): `ZodEnum`\<\{ `npm`: `"npm"`; `pnpm`: `"pnpm"`; `yarn`: `"yarn"`; \}\>

Package manager validation schema

#### Returns

`ZodEnum`\<\{ `npm`: `"npm"`; `pnpm`: `"pnpm"`; `yarn`: `"yarn"`; \}\>

---

### phoneSchema()

> **phoneSchema**(): `ZodString`

Phone number validation schema with international support

#### Returns

`ZodString`

---

### portSchema()

> **portSchema**(): `ZodNumber`

Port number validation schema

#### Returns

`ZodNumber`

---

### positiveIntegerSchema()

> **positiveIntegerSchema**(`fieldName`): `ZodNumber`

Positive integer schema

#### Parameters

##### fieldName

`string` = `'Value'`

#### Returns

`ZodNumber`

---

### projectNameSchema()

> **projectNameSchema**(): `ZodString`

Project name validation schema with npm package name rules

Validates project names according to npm package naming conventions:
lowercase letters, numbers, hyphens, starting with letter, max 214 chars.

#### Returns

`ZodString`

Zod schema for project name validation

#### Example

```typescript
// Validate CLI project name
const schema = projectNameSchema()

// Valid names
schema.safeParse('my-awesome-cli').success // true
schema.safeParse('cli-tool-2024').success // true

// Invalid names
schema.safeParse('MyProject').success // false (uppercase)
schema.safeParse('_private').success // false (starts with underscore)
schema.safeParse('@scoped/package').success // false (contains @/)

// In project configuration
const configSchema = z.object({
  name: projectNameSchema(),
  version: semverSchema(),
  description: nonEmptyStringSchema('Description'),
})
```

---

### stringLengthSchema()

> **stringLengthSchema**(`min`, `max?`, `fieldName?`): `ZodString`

String length validation with configurable min/max

#### Parameters

##### min

`number` = `1`

##### max?

`number`

##### fieldName?

`string` = `'Value'`

#### Returns

`ZodString`

---

### trimmedStringSchema()

> **trimmedStringSchema**(`fieldName`): `ZodPipe`\<`ZodString`, `ZodTransform`\<`string`, `string`\>\>

Trimmed string schema that normalizes whitespace

#### Parameters

##### fieldName

`string` = `'Value'`

#### Returns

`ZodPipe`\<`ZodString`, `ZodTransform`\<`string`, `string`\>\>

---

### urlSchema()

> **urlSchema**(`options`): `ZodString`

URL validation schema with protocol requirements

#### Parameters

##### options

###### requireHttps?

`boolean`

#### Returns

`ZodString`

---

### validateArray()

> **validateArray**\<`T`, `R`\>(`validator`, `_config`): [`ValidatorFn`](#validatorfn)\<`T`[], `R`[]\>

#### Type Parameters

##### T

`T`

##### R

`R` = `T`

#### Parameters

##### validator

[`ValidatorFn`](#validatorfn)\<`T`, `R`\>

##### \_config

[`ValidationConfig`](#validationconfig) = `defaultValidationConfig`

#### Returns

[`ValidatorFn`](#validatorfn)\<`T`[], `R`[]\>

---

### validateCurrency()

> **validateCurrency**(`_config`): [`ValidatorFn`](#validatorfn)\<`number`\>

#### Parameters

##### \_config

[`ValidationConfig`](#validationconfig) = `defaultValidationConfig`

#### Returns

[`ValidatorFn`](#validatorfn)\<`number`\>

---

### validateDate()

> **validateDate**(`_config`): [`ValidatorFn`](#validatorfn)\<`string`, `Date`\>

#### Parameters

##### \_config

[`ValidationConfig`](#validationconfig) = `defaultValidationConfig`

#### Returns

[`ValidatorFn`](#validatorfn)\<`string`, `Date`\>

---

### validateEmail()

> **validateEmail**(`_config`): [`ValidatorFn`](#validatorfn)\<`string`\>

Creates an email validator function with configurable validation rules.

Validates email addresses according to standard RFC 5322 format
with user-friendly error messages and suggestions.

#### Parameters

##### \_config

[`ValidationConfig`](#validationconfig) = `defaultValidationConfig`

Optional validation configuration

#### Returns

[`ValidatorFn`](#validatorfn)\<`string`\>

Email validator function

#### Example

```typescript
const emailValidator = validateEmail()

// Valid email
const result = emailValidator('user@example.com')
if (result.isOk()) {
  console.log('Valid email:', result.value)
}

// Invalid email
const result2 = emailValidator('invalid-email')
if (result2.isErr()) {
  console.log(result2.error.message) // "Invalid email format..."
  console.log(result2.error.suggestion) // "Provide a valid email address..."
}

// Empty email
const result3 = emailValidator('')
if (result3.isErr()) {
  console.log(result3.error.message) // "Email is required"
}
```

---

### validateNumberRange()

> **validateNumberRange**(`min?`, `max?`, `_config?`): [`ValidatorFn`](#validatorfn)\<`number`\>

#### Parameters

##### min?

`number`

##### max?

`number`

##### \_config?

[`ValidationConfig`](#validationconfig) = `defaultValidationConfig`

#### Returns

[`ValidatorFn`](#validatorfn)\<`number`\>

---

### validateObject()

> **validateObject**\<`T`\>(`validators`, `_config`): [`ValidatorFn`](#validatorfn)\<`T`\>

#### Type Parameters

##### T

`T` _extends_ `Record`\<`string`, `any`\>

#### Parameters

##### validators

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`{ [K in keyof T]: ValidatorFn<T[K]> }`\>

##### \_config

[`ValidationConfig`](#validationconfig) = `defaultValidationConfig`

#### Returns

[`ValidatorFn`](#validatorfn)\<`T`\>

---

### validatePhoneNumber()

> **validatePhoneNumber**(`_config`): [`ValidatorFn`](#validatorfn)\<`string`\>

#### Parameters

##### \_config

[`ValidationConfig`](#validationconfig) = `defaultValidationConfig`

#### Returns

[`ValidatorFn`](#validatorfn)\<`string`\>

---

### validateRequired()

> **validateRequired**\<`T`\>(`_config`): [`ValidatorFn`](#validatorfn)\<`undefined` \| `null` \| `T`, `T`\>

#### Type Parameters

##### T

`T`

#### Parameters

##### \_config

[`ValidationConfig`](#validationconfig) = `defaultValidationConfig`

#### Returns

[`ValidatorFn`](#validatorfn)\<`undefined` \| `null` \| `T`, `T`\>

---

### validateStringLength()

> **validateStringLength**(`min`, `max?`, `_config?`): [`ValidatorFn`](#validatorfn)\<`string`\>

#### Parameters

##### min

`number`

##### max?

`number`

##### \_config?

[`ValidationConfig`](#validationconfig) = `defaultValidationConfig`

#### Returns

[`ValidatorFn`](#validatorfn)\<`string`\>

---

### validateUrl()

> **validateUrl**(`_config`): [`ValidatorFn`](#validatorfn)\<`string`\>

Creates a URL validator function with configurable validation rules.

Validates URLs to ensure they have proper protocol and format,
supporting both HTTP and HTTPS URLs with user-friendly error messages.

#### Parameters

##### \_config

[`ValidationConfig`](#validationconfig) = `defaultValidationConfig`

Optional validation configuration

#### Returns

[`ValidatorFn`](#validatorfn)\<`string`\>

URL validator function

#### Example

```typescript
const urlValidator = validateUrl()

// Valid URLs
urlValidator('https://example.com').isOk() // true
urlValidator('http://sub.example.com/path').isOk() // true
urlValidator('https://example.com:8080').isOk() // true

// Invalid URLs
const result = urlValidator('example.com') // Missing protocol
if (result.isErr()) {
  console.log(result.error.message) // "Invalid URL format..."
}

// Use in form validation
const websiteField = document.querySelector('#website')
const validation = urlValidator(websiteField.value)
if (validation.isErr()) {
  showError(validation.error.message)
}
```

---

### withDefault()

> **withDefault**\<`T`\>(`schema`, `defaultValue`): `ZodDefault`\<`ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\>

Create a schema with default value

#### Type Parameters

##### T

`T`

#### Parameters

##### schema

`ZodType`\<`T`\>

##### defaultValue

`T`

#### Returns

`ZodDefault`\<`ZodType`\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\>

---

### zodErrorToValidationError()

> **zodErrorToValidationError**(`error`, `options?`): [`ValidationError`](#validationerror)

#### Parameters

##### error

`ZodError`

##### options?

###### field?

`string`

#### Returns

[`ValidationError`](#validationerror)
