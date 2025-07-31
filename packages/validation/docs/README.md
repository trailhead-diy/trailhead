---
type: explanation
title: '@repo/validation Documentation Hub'
description: 'Functional validation with Zod integration and Result-based error handling'
related:
  - /packages/validation/docs/how-to/validate-data.md
  - /packages/validation/docs/explanation/composition-patterns.md
  - /packages/validation/docs/reference/api.md
---

# @repo/validation Documentation

Functional validation library with Zod integration, providing both simple validators and schema-based validation through Result types.

## Core Principles

- **Result-based errors** - Explicit error handling without exceptions
- **Functional composition** - Validators compose naturally through function composition
- **Zod integration** - Leverage Zod's powerful schema system
- **Type safety** - Full TypeScript support with type inference

## Documentation Structure

### Getting Started

- [Validate Data](/packages/validation/docs/how-to/validate-data) - Common validation tasks

### API Reference

Complete API documentation is available in the shared documentation:

- [Validation API Reference](/packages/validation/docs/reference/api) - Complete function and type definitions

### Understanding the Design

- [Composition Patterns](/packages/validation/docs/explanation/composition-patterns) - Validator composition design

## Key Features

### 1. Simple Validators

```typescript
import { validate } from '@repo/validation'

// Built-in validators with sensible defaults
const emailResult = validate.email('user@example.com')
if (emailResult.success) {
  console.log('Valid email:', emailResult.value)
}

const lengthResult = validate.stringLength(3, 20)('username')
if (!lengthResult.success) {
  console.error('Validation failed:', lengthResult.error.message)
}
```

### 2. Schema-Based Validation

```typescript
import { createValidator, z } from '@repo/validation'

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().positive().optional(),
  roles: z.array(z.string()),
})

const validateUser = createValidator(userSchema)

const result = validateUser({
  name: 'John Doe',
  email: 'john@example.com',
  roles: ['user', 'admin'],
})

if (result.success) {
  console.log('Valid user:', result.value)
}
```

### 3. Validator Composition

```typescript
import {
  composeValidators,
  validateRequired,
  validateStringLength,
  validateEmail,
} from '@repo/validation'

// Chain validators together
const emailValidator = composeValidators(
  validateRequired(),
  validateStringLength(5, 100),
  validateEmail()
)

const result = emailValidator('user@example.com')
```

### 4. Pre-built Schemas

```typescript
import { emailSchema, urlSchema, projectNameSchema, portSchema } from '@repo/validation'

// Use pre-built schemas directly with Zod
const configSchema = z.object({
  host: urlSchema,
  port: portSchema,
  adminEmail: emailSchema,
  projectName: projectNameSchema,
})
```

## Quick Examples

### Basic Form Validation

```typescript
import { validate } from '@repo/validation'

async function validateRegistrationForm(formData: any) {
  const errors = []

  // Validate email
  const emailResult = validate.email(formData.email)
  if (!emailResult.success) {
    errors.push({ field: 'email', message: emailResult.error.message })
  }

  // Validate password length
  const passwordResult = validate.stringLength(8, 50)(formData.password)
  if (!passwordResult.success) {
    errors.push({ field: 'password', message: passwordResult.error.message })
  }

  // Validate age range
  if (formData.age) {
    const ageResult = validate.numberRange(13, 120)(formData.age)
    if (!ageResult.success) {
      errors.push({ field: 'age', message: ageResult.error.message })
    }
  }

  if (errors.length > 0) {
    return err({ code: 'VALIDATION_ERROR', message: 'Form validation failed', errors })
  }

  return ok({
    email: emailResult.value,
    password: formData.password,
    age: formData.age,
  })
}
```

### Configuration Validation

```typescript
import { createValidator, z } from '@repo/validation'

const configSchema = z.object({
  server: z.object({
    port: z.number().min(1).max(65535),
    host: z.string().min(1),
    ssl: z.boolean().optional().default(false),
  }),
  database: z.object({
    url: z.string().url(),
    poolSize: z.number().positive().default(10),
    timeout: z.number().positive().default(5000),
  }),
  features: z.object({
    logging: z.boolean().default(true),
    metrics: z.boolean().default(false),
    debug: z.boolean().default(false),
  }),
})

const validateConfig = createValidator(configSchema)

async function loadConfig(configPath: string) {
  const configData = await fs.readJson(configPath)
  if (!configData.success) {
    return configData
  }

  const validationResult = validateConfig(configData.value)
  if (!validationResult.success) {
    return err(new Error(`Invalid configuration: ${validationResult.error.message}`))
  }

  return ok(validationResult.value)
}
```

### Array and Object Validation

```typescript
import { validate } from '@repo/validation'

// Validate array of emails
const emailListValidator = validate.array(validate.email)
const emailsResult = emailListValidator([
  'user1@example.com',
  'user2@example.com',
  'invalid-email', // This will cause validation to fail
])

// Validate complex object
const userValidator = validate.object({
  profile: validate.object({
    name: validate.stringLength(1, 100),
    email: validate.email,
    age: validate.numberRange(13, 120),
  }),
  preferences: validate.object({
    theme: validate.required, // Just require presence
    notifications: validate.required,
  }),
  tags: validate.array(validate.stringLength(1, 50)),
})

const userData = {
  profile: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  },
  preferences: {
    theme: 'dark',
    notifications: true,
  },
  tags: ['developer', 'typescript', 'node.js'],
}

const userResult = userValidator(userData)
```

## Supported Validators

| Category        | Validators                                | Use Case                   |
| --------------- | ----------------------------------------- | -------------------------- |
| **Basic**       | `required`, `email`, `url`, `phoneNumber` | Essential field validation |
| **Strings**     | `stringLength`, `trimmed`, `nonEmpty`     | Text input validation      |
| **Numbers**     | `numberRange`, `positiveInteger`, `port`  | Numeric validation         |
| **Dates**       | `date`, `dateSchema`                      | Date and time validation   |
| **Special**     | `currency`, `projectName`, `filePath`     | Domain-specific validation |
| **Composition** | `array`, `object`, `composeValidators`    | Complex data structures    |

## Error Handling

The library provides detailed error information:

```typescript
const result = validate.email('invalid-email')
if (!result.success) {
  console.error('Validation error:', {
    message: result.error.message,
    field: result.error.field,
    value: result.error.value,
    issues: result.error.issues, // Detailed Zod issues if available
  })
}
```

## Next Steps

1. Start with [Validate Data](/packages/validation/docs/how-to/validate-data) for common validation tasks
2. Review the [Validation API Reference](/packages/validation/docs/reference/api) for detailed documentation
3. Understand [Composition Patterns](/packages/validation/docs/explanation/composition-patterns) for advanced usage

## Integration Examples

### With Express.js Middleware

```typescript
import { createValidator, z } from '@repo/validation'
import { Request, Response, NextFunction } from 'express'

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().positive().optional(),
})

const validateCreateUser = createValidator(createUserSchema)

function validateBody(validator: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validator(req.body)

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        message: result.error.message,
        issues: result.error.issues,
      })
    }

    req.body = result.value // Use validated data
    next()
  }
}

// Usage
app.post('/users', validateBody(validateCreateUser), (req, res) => {
  // req.body is now type-safe and validated
  const user = req.body
  console.log('Creating user:', user.name, user.email)
  res.json({ success: true, user })
})
```

### With CLI Applications

```typescript
import { createCommand } from '@esteban-url/cli/command'
import { validate } from '@repo/validation'

const createProjectCommand = createCommand({
  name: 'create',
  description: 'Create a new project',
  options: [
    { name: 'name', type: 'string', required: true },
    { name: 'port', type: 'number', default: 3000 },
    { name: 'email', type: 'string' },
  ],
  action: async (options, context) => {
    // Validate project name
    const nameResult = validate.stringLength(3, 50)(options.name)
    if (!nameResult.success) {
      context.logger.error(`Invalid project name: ${nameResult.error.message}`)
      return nameResult
    }

    // Validate port
    const portResult = validate.numberRange(1, 65535)(options.port)
    if (!portResult.success) {
      context.logger.error(`Invalid port: ${portResult.error.message}`)
      return portResult
    }

    // Validate email if provided
    if (options.email) {
      const emailResult = validate.email(options.email)
      if (!emailResult.success) {
        context.logger.error(`Invalid email: ${emailResult.error.message}`)
        return emailResult
      }
    }

    // All validation passed, create project
    context.logger.success(`Creating project: ${nameResult.value}`)
    return ok({ projectName: nameResult.value, port: portResult.value })
  },
})
```

### With Data Processing

```typescript
import { data } from '@repo/data'
import { createValidator, z } from '@repo/validation'

const csvRowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.coerce.number().positive(),
  department: z.enum(['engineering', 'marketing', 'sales']),
})

const validateCsvRow = createValidator(csvRowSchema)

async function processEmployeeData(csvPath: string) {
  // Parse CSV data
  const parseResult = await data.parseAuto(csvPath)
  if (!parseResult.success) {
    return parseResult
  }

  const validRows = []
  const invalidRows = []

  // Validate each row
  for (const [index, row] of parseResult.value.entries()) {
    const validationResult = validateCsvRow(row)

    if (validationResult.success) {
      validRows.push(validationResult.value)
    } else {
      invalidRows.push({
        row: index + 1,
        data: row,
        errors: validationResult.error.issues || [{ message: validationResult.error.message }],
      })
    }
  }

  if (invalidRows.length > 0) {
    console.warn(`Found ${invalidRows.length} invalid rows:`)
    invalidRows.forEach(({ row, errors }) => {
      console.warn(`  Row ${row}: ${errors.map((e) => e.message).join(', ')}`)
    })
  }

  return ok({
    total: parseResult.value.length,
    valid: validRows.length,
    invalid: invalidRows.length,
    validData: validRows,
    invalidData: invalidRows,
  })
}
```

### With Form Libraries

```typescript
import { validate } from '@repo/validation'

// React Hook Form integration example
function useValidatedForm() {
  const validators = {
    email: validate.email,
    password: validate.stringLength(8, 50),
    confirmPassword: (value: string, formData: any) => {
      if (value !== formData.password) {
        return err({ message: 'Passwords do not match' })
      }
      return ok(value)
    },
    age: validate.numberRange(13, 120),
  }

  const validateField = (fieldName: string, value: any, formData?: any) => {
    const validator = validators[fieldName]
    if (!validator) return ok(value)

    return validator(value, formData)
  }

  const validateForm = (formData: any) => {
    const errors = {}

    for (const [field, value] of Object.entries(formData)) {
      const result = validateField(field, value, formData)
      if (!result.success) {
        errors[field] = result.error.message
      }
    }

    return Object.keys(errors).length === 0 ? ok(formData) : err(errors)
  }

  return { validateField, validateForm }
}
```

## Contributing

See the [Contributing Guide](/docs/how-to/contributing) for development setup and guidelines.

## License

MIT - See [LICENSE](https://github.com/esteban-url/trailhead/blob/main/LICENSE)
