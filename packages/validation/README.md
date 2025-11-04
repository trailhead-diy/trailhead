# @trailhead/validation

> Validation with Zod and Result types

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/trailhead-diy/trailhead/blob/main/LICENSE)

## Features

- Result-based validation with explicit error handling
- Pre-built validators for common use cases
- Zod schema integration
- Functional composition patterns
- TypeScript type inference
- Testing utilities

## Installation

```bash
pnpm add @trailhead/validation
# or
npm install @trailhead/validation
```

## Quick Start

```typescript
import { validate } from '@trailhead/validation'

// Basic validators
const emailResult = validate.email('user@example.com')
const urlResult = validate.url('https://example.com')
const phoneResult = validate.phoneNumber('+1-555-123-4567')

// Schema validation
import { z, createSchemaValidator } from '@trailhead/validation'

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
import { validate } from '@trailhead/validation'

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
import { createSchemaValidator, createValidator, z } from '@trailhead/validation'

// Create validator from schema
const validateUser = createSchemaValidator(userSchema)

// Compose validators
import { composeValidators, allOf, anyOf } from '@trailhead/validation'

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
} from '@trailhead/validation'
```

### Testing

```typescript
import {
  createMockValidator,
  assertValidationSuccess,
  assertValidationFailure,
} from '@trailhead/validation/testing'

// Create mock validator
const mockValidator = createMockValidator()

// Assert validation results
assertValidationSuccess(result) // Throws if validation failed
assertValidationFailure(result) // Throws if validation succeeded
```

## Related Packages

- **@trailhead/core** - Result types and functional utilities
- **@trailhead/fs** - File system operations
- **@trailhead/data** - Data processing and format conversion

## Documentation

- [Tutorials](./docs/README.md)
  - [Form Validation Guide](../../docs/tutorials/form-validation-guide.md)
- [How-to Guides](./docs/how-to/validate-data.md)
  - [Create Custom Validators](../../docs/how-to/create-custom-validators.md)
- [Explanations](./docs/explanation/composition-patterns.md)
  - [Result Types Pattern](../../docs/explanation/result-types-pattern.md)
  - [Functional Architecture](../../docs/explanation/functional-architecture.md)
- **[API Documentation](../../docs/@trailhead.validation.md)** - Complete API reference with examples and type information

## License

MIT © [Esteban URL](https://github.com/esteban-url)
