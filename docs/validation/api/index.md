**@esteban-url/validation**

---

# @repo/validation

> Validation with Zod and Result types

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/esteban-url/trailhead/blob/main/LICENSE)

## Features

- Result-based validation with explicit error handling
- Pre-built validators for common use cases
- Zod schema integration
- Functional composition patterns
- TypeScript type inference
- Testing utilities

## Installation

```bash
pnpm add @repo/validation
# or
npm install @repo/validation
```

## Quick Start

```typescript
import { validate } from '@repo/validation'

// Basic validators
const emailResult = validate.email('user@example.com')
const urlResult = validate.url('https://example.com')
const phoneResult = validate.phoneNumber('+1-555-123-4567')

// Schema validation
import { z, createSchemaValidator } from '@repo/validation'

const userSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18),
})

const validateUser = createSchemaValidator(userSchema)
const result = validateUser({ name: 'John', email: 'john@example.com', age: 25 })
```

## API Reference

### Pre-built Validators

```typescript
import { validate } from '@repo/validation'

// Basic validators
validate.email(value)
validate.url(value)
validate.phoneNumber(value)
validate.required(value)
validate.currency(value)
validate.date(value)

// Factory validators
validate.stringLength(min, max?)
validate.numberRange(min?, max?)
validate.array(itemValidator)
validate.object(shape)
```

### Schema Operations

```typescript
import { createSchemaValidator, createValidator, z } from '@repo/validation'

// Create validator from schema
const validateUser = createSchemaValidator(userSchema)

// Compose validators
import { composeValidators, allOf, anyOf } from '@repo/validation'

const validator = composeValidators(...validators)
const all = allOf([...validators])
const any = anyOf([...validators])
```

### Pre-built Schemas

```typescript
import {
  emailSchema,
  urlSchema,
  phoneSchema,
  projectNameSchema,
  portSchema,
  positiveIntegerSchema,
  nonEmptyStringSchema,
  trimmedStringSchema,
  dateSchema,
  authorSchema,
} from '@repo/validation'
```

### Testing

```typescript
import {
  createMockValidator,
  expectValidationSuccess,
  expectValidationError,
} from '@repo/validation/testing'

const mockValidator = createMockValidator<string>({
  'valid@test.com': ok('valid@test.com'),
  'invalid@test.com': err(createValidationError('Blacklisted')),
})

// Test helpers
expectValidationSuccess(result)
expectValidationError(result, { field: 'email' })
```

## Related Packages

- **@repo/core** - Result types and functional utilities
- **@repo/fs** - File system operations
- **@repo/data** - Data processing and format conversion

## Documentation

- [Tutorials](_media/README.md)
  - [Form Validation Guide](_media/form-validation-guide.md)
- [How-to Guides](_media/validate-data.md)
  - [Create Custom Validators](_media/create-custom-validators.md)
- [Explanations](_media/composition-patterns.md)
  - [Result Types Pattern](_media/result-types-pattern.md)
  - [Functional Architecture](_media/functional-architecture.md)
- [API Reference](_media/api.md)

## License

MIT © [Esteban URL](https://github.com/esteban-url)

## Interfaces

### ValidationError

#### Extends

- `CoreError`

#### Properties

| Property                                | Modifier   | Type                                                                                                               | Overrides        | Inherited from          |
| --------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ | ---------------- | ----------------------- |
| <a id="code"></a> `code`                | `readonly` | `string`                                                                                                           | -                | `CoreError.code`        |
| <a id="message"></a> `message`          | `readonly` | `string`                                                                                                           | -                | `CoreError.message`     |
| <a id="details"></a> `details?`         | `readonly` | `string`                                                                                                           | -                | `CoreError.details`     |
| <a id="cause"></a> `cause?`             | `readonly` | `unknown`                                                                                                          | -                | `CoreError.cause`       |
| <a id="suggestion"></a> `suggestion?`   | `readonly` | `string`                                                                                                           | -                | `CoreError.suggestion`  |
| <a id="recoverable"></a> `recoverable`  | `readonly` | `boolean`                                                                                                          | -                | `CoreError.recoverable` |
| <a id="context"></a> `context?`         | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> | -                | `CoreError.context`     |
| <a id="component"></a> `component`      | `readonly` | `string`                                                                                                           | -                | `CoreError.component`   |
| <a id="operation"></a> `operation`      | `readonly` | `string`                                                                                                           | -                | `CoreError.operation`   |
| <a id="timestamp"></a> `timestamp`      | `readonly` | `Date`                                                                                                             | -                | `CoreError.timestamp`   |
| <a id="severity"></a> `severity`        | `readonly` | `"low"` \| `"medium"` \| `"high"` \| `"critical"`                                                                  | -                | `CoreError.severity`    |
| <a id="type"></a> `type`                | `readonly` | `"VALIDATION_ERROR"`                                                                                               | `CoreError.type` | -                       |
| <a id="field"></a> `field?`             | `readonly` | `string`                                                                                                           | -                | -                       |
| <a id="value"></a> `value?`             | `readonly` | `unknown`                                                                                                          | -                | -                       |
| <a id="constraints"></a> `constraints?` | `readonly` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\> | -                | -                       |

---

### ValidationConfig

#### Properties

| Property                                  | Modifier   | Type      |
| ----------------------------------------- | ---------- | --------- |
| <a id="abortearly"></a> `abortEarly?`     | `readonly` | `boolean` |
| <a id="stripunknown"></a> `stripUnknown?` | `readonly` | `boolean` |
| <a id="allowunknown"></a> `allowUnknown?` | `readonly` | `boolean` |

## Type Aliases

### SchemaRegistryKey

> **SchemaRegistryKey** = keyof _typeof_ [`schemaRegistry`](#schemaregistry)

---

### ValidationResult\<T\>

> **ValidationResult**\<`T`\> = [`Result`](https://github.com/supermacro/neverthrow#result)\<`T`, [`ValidationError`](#validationerror)\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

---

### ValidatorFn()\<T, R\>

> **ValidatorFn**\<`T`, `R`\> = (`value`) => [`ValidationResult`](#validationresult)\<`R`\>

#### Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `T`            | -            |
| `R`            | `T`          |

#### Parameters

| Parameter | Type |
| --------- | ---- |
| `value`   | `T`  |

#### Returns

[`ValidationResult`](#validationresult)\<`R`\>

---

### AsyncValidatorFn()\<T, R\>

> **AsyncValidatorFn**\<`T`, `R`\> = (`value`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ValidationResult`](#validationresult)\<`R`\>\>

#### Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `T`            | -            |
| `R`            | `T`          |

#### Parameters

| Parameter | Type |
| --------- | ---- |
| `value`   | `T`  |

#### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`ValidationResult`](#validationresult)\<`R`\>\>

---

### SchemaValidator\<T\>

> **SchemaValidator**\<`T`\> = `object`

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Properties

##### schema

> `readonly` **schema**: [`z.ZodType`](https://zod.dev/?id=basic-usage)\<`T`\>

##### validate

> `readonly` **validate**: [`ValidatorFn`](#validatorfn)\<`unknown`, `T`\>

## Variables

### defaultValidationConfig

> `const` **defaultValidationConfig**: [`ValidationConfig`](#validationconfig)

---

### validate

> `const` **validate**: `object`

#### Type declaration

| Name                                       | Type                                                                                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="email"></a> `email`                 | [`ValidatorFn`](#validatorfn)\<`string`\>                                                                                                                                 |
| <a id="url"></a> `url`                     | [`ValidatorFn`](#validatorfn)\<`string`\>                                                                                                                                 |
| <a id="phonenumber"></a> `phoneNumber`     | [`ValidatorFn`](#validatorfn)\<`string`\>                                                                                                                                 |
| <a id="stringlength"></a> `stringLength()` | (`min`, `max?`) => [`ValidatorFn`](#validatorfn)\<`string`\>                                                                                                              |
| <a id="numberrange"></a> `numberRange()`   | (`min?`, `max?`) => [`ValidatorFn`](#validatorfn)\<`number`\>                                                                                                             |
| <a id="required"></a> `required`           | [`ValidatorFn`](#validatorfn)\<`any`, `any`\>                                                                                                                             |
| <a id="currency"></a> `currency`           | [`ValidatorFn`](#validatorfn)\<`number`\>                                                                                                                                 |
| <a id="date"></a> `date`                   | [`ValidatorFn`](#validatorfn)\<`string`, `Date`\>                                                                                                                         |
| <a id="array"></a> `array()`               | \<`T`, `_R`\>(`validator`) => [`ValidatorFn`](#validatorfn)\<`T`[], `T`[]\>                                                                                               |
| <a id="object"></a> `object()`             | \<`_T`\>(`validators`) => [`ValidatorFn`](#validatorfn)\<[`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\>\> |

---

### validationPresets

> `const` **validationPresets**: `object`

Common validation presets for frequent use cases

#### Type declaration

| Name                                             | Type                                                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| <a id="email-1"></a> `email()`                   | () => [`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>                             |
| <a id="url-1"></a> `url()`                       | (`requireHttps`) => [`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>               |
| <a id="phone"></a> `phone()`                     | () => [`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>                             |
| <a id="projectname"></a> `projectName()`         | () => [`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>                             |
| <a id="packagemanager"></a> `packageManager()`   | () => [`ValidatorFn`](#validatorfn)\<`unknown`, `"npm"` \| `"yarn"` \| `"pnpm"`\>      |
| <a id="filepath"></a> `filePath()`               | (`options?`) => [`ValidatorFn`](#validatorfn)\<`unknown`, `string`\>                   |
| <a id="port"></a> `port()`                       | () => [`ValidatorFn`](#validatorfn)\<`unknown`, `number`\>                             |
| <a id="positiveinteger"></a> `positiveInteger()` | (`fieldName?`) => [`ValidatorFn`](#validatorfn)\<`unknown`, `number`\>                 |
| <a id="date-1"></a> `date()`                     | (`options?`) => [`ValidatorFn`](#validatorfn)\<`unknown`, `Date`\>                     |
| <a id="array-1"></a> `array()`                   | \<`T`\>(`itemSchema`, `options?`) => [`ValidatorFn`](#validatorfn)\<`unknown`, `T`[]\> |

---

### schemaRegistry

> `const` **schemaRegistry**: `object`

Schema registry for dynamic schema lookup

#### Type declaration

| Name                                               | Type                                                                                                                                                                                                     | Default value           |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| <a id="email-2"></a> `email()`                     | () => `ZodString`                                                                                                                                                                                        | `emailSchema`           |
| <a id="url-2"></a> `url()`                         | (`options`) => `ZodString`                                                                                                                                                                               | `urlSchema`             |
| <a id="phone-1"></a> `phone()`                     | () => `ZodString`                                                                                                                                                                                        | `phoneSchema`           |
| <a id="projectname-1"></a> `projectName()`         | () => `ZodString`                                                                                                                                                                                        | `projectNameSchema`     |
| <a id="packagemanager-1"></a> `packageManager()`   | () => `ZodEnum`\<\{ `npm`: `"npm"`; `yarn`: `"yarn"`; `pnpm`: `"pnpm"`; \}\>                                                                                                                             | `packageManagerSchema`  |
| <a id="filepath-1"></a> `filePath()`               | (`options`) => `ZodString`                                                                                                                                                                               | `filePathSchema`        |
| <a id="author"></a> `author()`                     | () => `ZodObject`\<\{ `name`: `ZodString`; `email`: `ZodOptional`\<`ZodString`\>; `url`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>                                                                    | `authorSchema`          |
| <a id="port-1"></a> `port()`                       | () => `ZodNumber`                                                                                                                                                                                        | `portSchema`            |
| <a id="positiveinteger-1"></a> `positiveInteger()` | (`fieldName`) => `ZodNumber`                                                                                                                                                                             | `positiveIntegerSchema` |
| <a id="date-2"></a> `date()`                       | (`options`) => `ZodPipe`\<`ZodString`, `ZodTransform`\<`Date`, `string`\>\> \| `ZodPipe`\<`ZodUnion`\<readonly \[`ZodString`, `ZodString`, `ZodDate`\]\>, `ZodTransform`\<`Date`, `string` \| `Date`\>\> | `dateSchema`            |
| <a id="array-2"></a> `array()`                     | \<`T`\>(`itemSchema`, `options`) => `ZodArray`\<[`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\>                                                  | `arraySchema`           |
| <a id="stringlength-1"></a> `stringLength()`       | (`min`, `max?`, `fieldName`) => `ZodString`                                                                                                                                                              | `stringLengthSchema`    |
| <a id="nonemptystring"></a> `nonEmptyString()`     | (`fieldName`) => `ZodString`                                                                                                                                                                             | `nonEmptyStringSchema`  |
| <a id="trimmedstring"></a> `trimmedString()`       | (`fieldName`) => `ZodPipe`\<`ZodString`, `ZodTransform`\<`string`, `string`\>\>                                                                                                                          | `trimmedStringSchema`   |

## Functions

### createValidator()

> **createValidator**\<`T`, `R`\>(`schema`, `_config`): [`ValidatorFn`](#validatorfn)\<`T`, `R`\>

#### Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `T`            | -            |
| `R`            | `T`          |

#### Parameters

| Parameter | Type                                                | Default value             |
| --------- | --------------------------------------------------- | ------------------------- |
| `schema`  | [`ZodType`](https://zod.dev/?id=basic-usage)\<`R`\> | `undefined`               |
| `_config` | [`ValidationConfig`](#validationconfig)             | `defaultValidationConfig` |

#### Returns

[`ValidatorFn`](#validatorfn)\<`T`, `R`\>

---

### validateEmail()

> **validateEmail**(`_config`): [`ValidatorFn`](#validatorfn)\<`string`\>

#### Parameters

| Parameter | Type                                    | Default value             |
| --------- | --------------------------------------- | ------------------------- |
| `_config` | [`ValidationConfig`](#validationconfig) | `defaultValidationConfig` |

#### Returns

[`ValidatorFn`](#validatorfn)\<`string`\>

---

### validateUrl()

> **validateUrl**(`_config`): [`ValidatorFn`](#validatorfn)\<`string`\>

#### Parameters

| Parameter | Type                                    | Default value             |
| --------- | --------------------------------------- | ------------------------- |
| `_config` | [`ValidationConfig`](#validationconfig) | `defaultValidationConfig` |

#### Returns

[`ValidatorFn`](#validatorfn)\<`string`\>

---

### validatePhoneNumber()

> **validatePhoneNumber**(`_config`): [`ValidatorFn`](#validatorfn)\<`string`\>

#### Parameters

| Parameter | Type                                    | Default value             |
| --------- | --------------------------------------- | ------------------------- |
| `_config` | [`ValidationConfig`](#validationconfig) | `defaultValidationConfig` |

#### Returns

[`ValidatorFn`](#validatorfn)\<`string`\>

---

### validateStringLength()

> **validateStringLength**(`min`, `max?`, `_config?`): [`ValidatorFn`](#validatorfn)\<`string`\>

#### Parameters

| Parameter  | Type                                    | Default value             |
| ---------- | --------------------------------------- | ------------------------- |
| `min`      | `number`                                | `undefined`               |
| `max?`     | `number`                                | `undefined`               |
| `_config?` | [`ValidationConfig`](#validationconfig) | `defaultValidationConfig` |

#### Returns

[`ValidatorFn`](#validatorfn)\<`string`\>

---

### validateNumberRange()

> **validateNumberRange**(`min?`, `max?`, `_config?`): [`ValidatorFn`](#validatorfn)\<`number`\>

#### Parameters

| Parameter  | Type                                    | Default value             |
| ---------- | --------------------------------------- | ------------------------- |
| `min?`     | `number`                                | `undefined`               |
| `max?`     | `number`                                | `undefined`               |
| `_config?` | [`ValidationConfig`](#validationconfig) | `defaultValidationConfig` |

#### Returns

[`ValidatorFn`](#validatorfn)\<`number`\>

---

### validateRequired()

> **validateRequired**\<`T`\>(`_config`): [`ValidatorFn`](#validatorfn)\<`undefined` \| `null` \| `T`, `T`\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter | Type                                    | Default value             |
| --------- | --------------------------------------- | ------------------------- |
| `_config` | [`ValidationConfig`](#validationconfig) | `defaultValidationConfig` |

#### Returns

[`ValidatorFn`](#validatorfn)\<`undefined` \| `null` \| `T`, `T`\>

---

### validateCurrency()

> **validateCurrency**(`_config`): [`ValidatorFn`](#validatorfn)\<`number`\>

#### Parameters

| Parameter | Type                                    | Default value             |
| --------- | --------------------------------------- | ------------------------- |
| `_config` | [`ValidationConfig`](#validationconfig) | `defaultValidationConfig` |

#### Returns

[`ValidatorFn`](#validatorfn)\<`number`\>

---

### validateDate()

> **validateDate**(`_config`): [`ValidatorFn`](#validatorfn)\<`string`, `Date`\>

#### Parameters

| Parameter | Type                                    | Default value             |
| --------- | --------------------------------------- | ------------------------- |
| `_config` | [`ValidationConfig`](#validationconfig) | `defaultValidationConfig` |

#### Returns

[`ValidatorFn`](#validatorfn)\<`string`, `Date`\>

---

### validateArray()

> **validateArray**\<`T`, `R`\>(`validator`, `_config`): [`ValidatorFn`](#validatorfn)\<`T`[], `R`[]\>

#### Type Parameters

| Type Parameter | Default type |
| -------------- | ------------ |
| `T`            | -            |
| `R`            | `T`          |

#### Parameters

| Parameter   | Type                                      | Default value             |
| ----------- | ----------------------------------------- | ------------------------- |
| `validator` | [`ValidatorFn`](#validatorfn)\<`T`, `R`\> | `undefined`               |
| `_config`   | [`ValidationConfig`](#validationconfig)   | `defaultValidationConfig` |

#### Returns

[`ValidatorFn`](#validatorfn)\<`T`[], `R`[]\>

---

### validateObject()

> **validateObject**\<`T`\>(`validators`, `_config`): [`ValidatorFn`](#validatorfn)\<`T`\>

#### Type Parameters

| Type Parameter                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------- |
| `T` _extends_ [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\> |

#### Parameters

| Parameter    | Type                                                                                                                                | Default value             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `validators` | [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`{ [K in keyof T]: ValidatorFn<T[K]> }`\> | `undefined`               |
| `_config`    | [`ValidationConfig`](#validationconfig)                                                                                             | `defaultValidationConfig` |

#### Returns

[`ValidatorFn`](#validatorfn)\<`T`\>

---

### composeValidators()

> **composeValidators**\<`T`, `R1`, `R2`\>(`first`, `second`): [`ValidatorFn`](#validatorfn)\<`T`, `R2`\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |
| `R1`           |
| `R2`           |

#### Parameters

| Parameter | Type                                        |
| --------- | ------------------------------------------- |
| `first`   | [`ValidatorFn`](#validatorfn)\<`T`, `R1`\>  |
| `second`  | [`ValidatorFn`](#validatorfn)\<`R1`, `R2`\> |

#### Returns

[`ValidatorFn`](#validatorfn)\<`T`, `R2`\>

---

### anyOf()

> **anyOf**\<`T`\>(...`validators`): [`ValidatorFn`](#validatorfn)\<`T`\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter       | Type                                   |
| --------------- | -------------------------------------- |
| ...`validators` | [`ValidatorFn`](#validatorfn)\<`T`\>[] |

#### Returns

[`ValidatorFn`](#validatorfn)\<`T`\>

---

### allOf()

> **allOf**\<`T`\>(...`validators`): [`ValidatorFn`](#validatorfn)\<`T`\>

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter       | Type                                   |
| --------------- | -------------------------------------- |
| ...`validators` | [`ValidatorFn`](#validatorfn)\<`T`\>[] |

#### Returns

[`ValidatorFn`](#validatorfn)\<`T`\>

---

### createValidationError()

> **createValidationError**(`message`, `options?`): [`ValidationError`](#validationerror)

#### Parameters

| Parameter              | Type                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`              | `string`                                                                                                                                                                                                                                                                                                                                                         |
| `options?`             | \{ `field?`: `string`; `value?`: `unknown`; `constraints?`: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>; `cause?`: `unknown`; `suggestion?`: `string`; `context?`: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>; \} |
| `options.field?`       | `string`                                                                                                                                                                                                                                                                                                                                                         |
| `options.value?`       | `unknown`                                                                                                                                                                                                                                                                                                                                                        |
| `options.constraints?` | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>                                                                                                                                                                                                                                               |
| `options.cause?`       | `unknown`                                                                                                                                                                                                                                                                                                                                                        |
| `options.suggestion?`  | `string`                                                                                                                                                                                                                                                                                                                                                         |
| `options.context?`     | [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `unknown`\>                                                                                                                                                                                                                                               |

#### Returns

[`ValidationError`](#validationerror)

---

### createRequiredFieldError()

> **createRequiredFieldError**(`field`): [`ValidationError`](#validationerror)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `field`   | `string` |

#### Returns

[`ValidationError`](#validationerror)

---

### createInvalidTypeError()

> **createInvalidTypeError**(`field`, `expectedType`, `actualValue`): [`ValidationError`](#validationerror)

#### Parameters

| Parameter      | Type      |
| -------------- | --------- |
| `field`        | `string`  |
| `expectedType` | `string`  |
| `actualValue`  | `unknown` |

#### Returns

[`ValidationError`](#validationerror)

---

### zodErrorToValidationError()

> **zodErrorToValidationError**(`error`, `options?`): [`ValidationError`](#validationerror)

#### Parameters

| Parameter        | Type                                             |
| ---------------- | ------------------------------------------------ |
| `error`          | [`ZodError`](https://zod.dev/?id=error-handling) |
| `options?`       | \{ `field?`: `string`; \}                        |
| `options.field?` | `string`                                         |

#### Returns

[`ValidationError`](#validationerror)

---

### emailSchema()

> **emailSchema**(): `ZodString`

Email validation schema with consistent error messaging

#### Returns

`ZodString`

---

### urlSchema()

> **urlSchema**(`options`): `ZodString`

URL validation schema with protocol requirements

#### Parameters

| Parameter               | Type                              |
| ----------------------- | --------------------------------- |
| `options`               | \{ `requireHttps?`: `boolean`; \} |
| `options.requireHttps?` | `boolean`                         |

#### Returns

`ZodString`

---

### phoneSchema()

> **phoneSchema**(): `ZodString`

Phone number validation schema with international support

#### Returns

`ZodString`

---

### stringLengthSchema()

> **stringLengthSchema**(`min`, `max?`, `fieldName?`): `ZodString`

String length validation with configurable min/max

#### Parameters

| Parameter    | Type     | Default value |
| ------------ | -------- | ------------- |
| `min`        | `number` | `1`           |
| `max?`       | `number` | `undefined`   |
| `fieldName?` | `string` | `'Value'`     |

#### Returns

`ZodString`

---

### nonEmptyStringSchema()

> **nonEmptyStringSchema**(`fieldName`): `ZodString`

Non-empty string schema

#### Parameters

| Parameter   | Type     | Default value |
| ----------- | -------- | ------------- |
| `fieldName` | `string` | `'Value'`     |

#### Returns

`ZodString`

---

### trimmedStringSchema()

> **trimmedStringSchema**(`fieldName`): `ZodPipe`\<`ZodString`, `ZodTransform`\<`string`, `string`\>\>

Trimmed string schema that normalizes whitespace

#### Parameters

| Parameter   | Type     | Default value |
| ----------- | -------- | ------------- |
| `fieldName` | `string` | `'Value'`     |

#### Returns

`ZodPipe`\<`ZodString`, `ZodTransform`\<`string`, `string`\>\>

---

### projectNameSchema()

> **projectNameSchema**(): `ZodString`

Project name validation schema with npm package name rules

#### Returns

`ZodString`

---

### packageManagerSchema()

> **packageManagerSchema**(): `ZodEnum`\<\{ `npm`: `"npm"`; `yarn`: `"yarn"`; `pnpm`: `"pnpm"`; \}\>

Package manager validation schema

#### Returns

`ZodEnum`\<\{ `npm`: `"npm"`; `yarn`: `"yarn"`; `pnpm`: `"pnpm"`; \}\>

---

### filePathSchema()

> **filePathSchema**(`options`): `ZodString`

File path validation schema with security checks

#### Parameters

| Parameter                 | Type                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `options`                 | \{ `allowAbsolute?`: `boolean`; `allowTraversal?`: `boolean`; `baseDir?`: `string`; \} |
| `options.allowAbsolute?`  | `boolean`                                                                              |
| `options.allowTraversal?` | `boolean`                                                                              |
| `options.baseDir?`        | `string`                                                                               |

#### Returns

`ZodString`

---

### authorSchema()

> **authorSchema**(): `ZodObject`\<\{ `name`: `ZodString`; `email`: `ZodOptional`\<`ZodString`\>; `url`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>

Author information schema for project generation

#### Returns

`ZodObject`\<\{ `name`: `ZodString`; `email`: `ZodOptional`\<`ZodString`\>; `url`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>

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

| Parameter   | Type     | Default value |
| ----------- | -------- | ------------- |
| `fieldName` | `string` | `'Value'`     |

#### Returns

`ZodNumber`

---

### dateSchema()

> **dateSchema**(`options`): `ZodPipe`\<`ZodString`, `ZodTransform`\<`Date`, `string`\>\> \| `ZodPipe`\<`ZodUnion`\<readonly \[`ZodString`, `ZodString`, `ZodDate`\]\>, `ZodTransform`\<`Date`, `string` \| `Date`\>\>

Date validation schema with multiple format support

#### Parameters

| Parameter              | Type                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `options`              | \{ `allowFuture?`: `boolean`; `allowPast?`: `boolean`; `format?`: `"any"` \| `"iso"` \| `"date-only"`; \} |
| `options.allowFuture?` | `boolean`                                                                                                 |
| `options.allowPast?`   | `boolean`                                                                                                 |
| `options.format?`      | `"any"` \| `"iso"` \| `"date-only"`                                                                       |

#### Returns

`ZodPipe`\<`ZodString`, `ZodTransform`\<`Date`, `string`\>\> \| `ZodPipe`\<`ZodUnion`\<readonly \[`ZodString`, `ZodString`, `ZodDate`\]\>, `ZodTransform`\<`Date`, `string` \| `Date`\>\>

---

### arraySchema()

> **arraySchema**\<`T`\>(`itemSchema`, `options`): `ZodArray`\<[`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\>

Array validation schema with length constraints

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter            | Type                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `itemSchema`         | [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`\>                                                 |
| `options`            | \{ `minLength?`: `number`; `maxLength?`: `number`; `unique?`: `boolean`; `fieldName?`: `string`; \} |
| `options.minLength?` | `number`                                                                                            |
| `options.maxLength?` | `number`                                                                                            |
| `options.unique?`    | `boolean`                                                                                           |
| `options.fieldName?` | `string`                                                                                            |

#### Returns

`ZodArray`\<[`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\>

---

### optionalSchema()

> **optionalSchema**\<`T`\>(`schema`): `ZodOptional`\<[`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\>

Create a schema with optional fields

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter | Type                                                |
| --------- | --------------------------------------------------- |
| `schema`  | [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`\> |

#### Returns

`ZodOptional`\<[`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\>

---

### withDefault()

> **withDefault**\<`T`\>(`schema`, `defaultValue`): `ZodDefault`\<[`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\>

Create a schema with default value

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter      | Type                                                |
| -------------- | --------------------------------------------------- |
| `schema`       | [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`\> |
| `defaultValue` | `T`                                                 |

#### Returns

`ZodDefault`\<[`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>\>

---

### mergeSchemas()

> **mergeSchemas**\<`T`, `U`\>(`schemaA`, `schemaB`): `ZodObject`\<\{ \[k in string \| number \| symbol\]: ((keyof T & keyof U) extends never ? T & U : \{ \[K in string \| number \| symbol as K extends keyof U ? never : K\]: T\[K\] \} & \{ \[K in string \| number \| symbol\]: U\[K\] \})\[k\] \}, `$strip`\>

Merge multiple object schemas

#### Type Parameters

| Type Parameter                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `T` _extends_ [`Readonly`](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)\<\{\[`k`: `string`\]: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>; \}\> |
| `U` _extends_ [`Readonly`](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype)\<\{\[`k`: `string`\]: `$ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\>; \}\> |

#### Parameters

| Parameter | Type               |
| --------- | ------------------ |
| `schemaA` | `ZodObject`\<`T`\> |
| `schemaB` | `ZodObject`\<`U`\> |

#### Returns

`ZodObject`\<\{ \[k in string \| number \| symbol\]: ((keyof T & keyof U) extends never ? T & U : \{ \[K in string \| number \| symbol as K extends keyof U ? never : K\]: T\[K\] \} & \{ \[K in string \| number \| symbol\]: U\[K\] \})\[k\] \}, `$strip`\>

---

### conditionalSchema()

> **conditionalSchema**\<`T`\>(`conditionField`, `conditionValue`, `thenSchema`, `elseSchema?`): `ZodObject`\<\{\[`key`: `string`\]: [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\> \| `ZodLiteral`\<`any`\>; `value`: [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>; \}, `$strip`\> \| `ZodUnion`\<readonly \[`ZodObject`\<\{\[`key`: `string`\]: [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\> \| `ZodLiteral`\<`any`\>; `value`: [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>; \}, `$strip`\>, `ZodObject`\<\{\[`key`: `string`\]: `ZodAny` \| [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>; `value`: [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>; \}, `$strip`\>\]\>

Create conditional schema based on another field
Note: Simplified implementation to avoid complex TypeScript issues

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter        | Type                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `conditionField` | `string`                                                                                              |
| `conditionValue` | `any`                                                                                                 |
| `thenSchema`     | [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`\>                                                   |
| `elseSchema?`    | [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\> |

#### Returns

`ZodObject`\<\{\[`key`: `string`\]: [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\> \| `ZodLiteral`\<`any`\>; `value`: [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>; \}, `$strip`\> \| `ZodUnion`\<readonly \[`ZodObject`\<\{\[`key`: `string`\]: [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\> \| `ZodLiteral`\<`any`\>; `value`: [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>; \}, `$strip`\>, `ZodObject`\<\{\[`key`: `string`\]: `ZodAny` \| [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>; `value`: [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`, `unknown`, `$ZodTypeInternals`\<`T`, `unknown`\>\>; \}, `$strip`\>\]\>

---

### createSchemaValidator()

> **createSchemaValidator**\<`T`\>(`schema`, `config?`): [`ValidatorFn`](#validatorfn)\<`unknown`, `T`\>

Create a validator function from a schema

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter | Type                                                |
| --------- | --------------------------------------------------- |
| `schema`  | [`ZodType`](https://zod.dev/?id=basic-usage)\<`T`\> |
| `config?` | [`ValidationConfig`](#validationconfig)             |

#### Returns

[`ValidatorFn`](#validatorfn)\<`unknown`, `T`\>
