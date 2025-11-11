# @trailhead/validation

> Validation with Zod and Result types

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/trailhead-diy/trailhead/blob/main/LICENSE)

Result-based validation with Zod integration, pre-built validators, functional composition patterns, and comprehensive testing utilities.

## Installation

```bash
pnpm add @trailhead/validation
```

## Quick Example

```typescript
import { validate, createSchemaValidator, z } from '@trailhead/validation'

// Pre-built validators
const emailResult = validate.email('user@example.com')
const urlResult = validate.url('https://example.com')

// Schema validation with Zod
const userSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18),
})

const validateUser = createSchemaValidator(userSchema)
const result = validateUser({ name: 'John', email: 'john@example.com', age: 25 })

if (result.isOk()) {
  console.log('Valid user:', result.value)
}
```

## Key Features

- **Result-based** - Explicit error handling with Result types
- **Pre-built validators** - Common validators for email, URL, phone, etc.
- **Zod integration** - Full support for Zod schemas
- **Functional composition** - Compose validators with `allOf`, `anyOf`
- **Type-safe** - TypeScript type inference from schemas

## Documentation

- **[API Documentation](../../docs/@trailhead.validation.md)** - Complete API reference
- **[Form Validation Guide](../../docs/tutorials/form-validation-guide.md)** - Tutorial
- **[Create Custom Validators](../../docs/how-to/create-custom-validators.md)** - How-to guide

## License

MIT © [Esteban URL](https://github.com/esteban-url)
