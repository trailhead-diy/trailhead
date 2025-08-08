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

- [Tutorials](./docs/README.md)
  - [Form Validation Guide](../../docs/tutorials/form-validation-guide.md)
- [How-to Guides](./docs/how-to/validate-data.md)
  - [Create Custom Validators](../../docs/how-to/create-custom-validators.md)
- [Explanations](./docs/explanation/composition-patterns.md)
  - [Result Types Pattern](../../docs/explanation/result-types-pattern.md)
  - [Functional Architecture](../../docs/explanation/functional-architecture.md)
- **[API Documentation](../../docs/reference/api/validation.md)** - Complete API reference with examples and type information

## License

MIT © [Esteban URL](https://github.com/esteban-url)
