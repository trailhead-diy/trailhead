---
type: how-to
title: 'Validate Data'
description: 'Validate user input, configuration, and data structures using functional validators and schemas'
prerequisites:
  - 'Understanding of Result types'
  - 'Basic TypeScript knowledge'
  - 'Familiarity with data validation concepts'
related:
  - /docs/reference/validation-api.md
  - /docs/how-to/apply-functional-patterns
  - ../explanation/composition-patterns.md
---

# Validate Data

This guide shows you how to validate different types of data using functional validators and schema-based validation with Result types.

## Basic Field Validation

### Validate Email Addresses

```typescript
import { validate } from '@repo/validation'

function validateEmailField(email: string) {
  const result = validate.email(email)
  if (!result.success) {
    console.error('Invalid email:', result.error.message)
    return result
  }

  console.log('Valid email:', result.value)
  return result
}

// Examples
validateEmailField('user@example.com') // ✅ Valid
validateEmailField('invalid-email') // ❌ Invalid format
validateEmailField('') // ❌ Required
```

### Validate String Length

```typescript
import { validate } from '@repo/validation'

// Create length validator
const usernameValidator = validate.stringLength(3, 20)

function validateUsername(username: string) {
  const result = usernameValidator(username)
  if (!result.success) {
    console.error('Invalid username:', result.error.message)
    return result
  }

  return result
}

// Examples
validateUsername('john_doe') // ✅ Valid
validateUsername('ab') // ❌ Too short
validateUsername('a'.repeat(25)) // ❌ Too long
```

### Validate Number Ranges

```typescript
import { validate } from '@repo/validation'

// Create range validators
const ageValidator = validate.numberRange(13, 120)
const portValidator = validate.numberRange(1, 65535)

function validateUserAge(age: number) {
  const result = ageValidator(age)
  if (!result.success) {
    console.error('Invalid age:', result.error.message)
    return result
  }

  return result
}

// Examples
validateUserAge(25) // ✅ Valid
validateUserAge(5) // ❌ Too young
validateUserAge(150) // ❌ Too old
```

### Validate Required Fields

```typescript
import { validate } from '@repo/validation'

function validateRequiredField(value: any) {
  const result = validate.required(value)
  if (!result.success) {
    console.error('Field is required:', result.error.message)
    return result
  }

  return result
}

// Examples
validateRequiredField('some value') // ✅ Valid
validateRequiredField('') // ❌ Empty string
validateRequiredField(null) // ❌ Null
validateRequiredField(undefined) // ❌ Undefined
```

## Validate Complex Objects

### User Registration Form

```typescript
import { validate } from '@repo/validation'

interface RegistrationData {
  email: string
  password: string
  confirmPassword: string
  age?: number
  terms: boolean
}

async function validateRegistration(data: RegistrationData) {
  const errors: Array<{ field: string; message: string }> = []

  // Validate email
  const emailResult = validate.email(data.email)
  if (!emailResult.success) {
    errors.push({ field: 'email', message: emailResult.error.message })
  }

  // Validate password length
  const passwordResult = validate.stringLength(8, 50)(data.password)
  if (!passwordResult.success) {
    errors.push({ field: 'password', message: passwordResult.error.message })
  }

  // Validate password confirmation
  if (data.password !== data.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' })
  }

  // Validate age (optional)
  if (data.age !== undefined) {
    const ageResult = validate.numberRange(13, 120)(data.age)
    if (!ageResult.success) {
      errors.push({ field: 'age', message: ageResult.error.message })
    }
  }

  // Validate terms acceptance
  if (!data.terms) {
    errors.push({ field: 'terms', message: 'You must accept the terms of service' })
  }

  if (errors.length > 0) {
    return err({
      code: 'VALIDATION_ERROR',
      message: 'Registration validation failed',
      errors,
    })
  }

  return ok({
    email: emailResult.value,
    password: data.password,
    age: data.age,
    terms: data.terms,
  })
}
```

### Configuration Validation

```typescript
import { validate } from '@repo/validation'

interface ServerConfig {
  host: string
  port: number
  ssl: boolean
  database: {
    url: string
    poolSize: number
  }
  features: string[]
}

function validateServerConfig(config: any) {
  const errors: Array<{ field: string; message: string }> = []

  // Validate host
  const hostResult = validate.required(config.host)
  if (!hostResult.success) {
    errors.push({ field: 'host', message: 'Host is required' })
  }

  // Validate port
  const portResult = validate.numberRange(1, 65535)(config.port)
  if (!portResult.success) {
    errors.push({ field: 'port', message: portResult.error.message })
  }

  // Validate database URL
  if (config.database) {
    const dbUrlResult = validate.url(config.database.url)
    if (!dbUrlResult.success) {
      errors.push({ field: 'database.url', message: dbUrlResult.error.message })
    }

    const poolSizeResult = validate.numberRange(1, 100)(config.database.poolSize)
    if (!poolSizeResult.success) {
      errors.push({ field: 'database.poolSize', message: poolSizeResult.error.message })
    }
  } else {
    errors.push({ field: 'database', message: 'Database configuration is required' })
  }

  // Validate features array
  if (Array.isArray(config.features)) {
    const featuresResult = validate.array(validate.stringLength(1, 50))(config.features)
    if (!featuresResult.success) {
      errors.push({ field: 'features', message: featuresResult.error.message })
    }
  }

  if (errors.length > 0) {
    return err({
      code: 'CONFIG_VALIDATION_ERROR',
      message: 'Configuration validation failed',
      errors,
    })
  }

  return ok(config as ServerConfig)
}
```

## Schema-Based Validation

### Define Validation Schemas

```typescript
import { createValidator, z } from '@repo/validation'

// User profile schema
const userProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(13).max(120).optional(),
  avatar: z.string().url().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    notifications: z.boolean().default(true),
    language: z.string().length(2).default('en'),
  }),
  tags: z.array(z.string().min(1).max(50)).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
})

const validateUserProfile = createValidator(userProfileSchema)
```

### Validate with Schemas

```typescript
async function processUserProfile(profileData: any) {
  const validationResult = validateUserProfile(profileData)

  if (!validationResult.success) {
    console.error('Profile validation failed:')

    // Log specific validation issues
    if (validationResult.error.issues) {
      validationResult.error.issues.forEach((issue) => {
        console.error(`  ${issue.path.join('.')}: ${issue.message}`)
      })
    } else {
      console.error(`  ${validationResult.error.message}`)
    }

    return validationResult
  }

  const profile = validationResult.value
  console.log(`Processing profile for ${profile.name} (${profile.email})`)

  return ok(profile)
}

// Example usage
const profileResult = await processUserProfile({
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  preferences: {
    theme: 'dark',
    notifications: false,
  },
  tags: ['developer', 'typescript'],
  createdAt: new Date(),
  updatedAt: new Date(),
})
```

### API Request Validation

```typescript
import { createValidator, z } from '@repo/validation'

// API endpoint schemas
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(10000),
  tags: z.array(z.string().min(1).max(50)).max(10),
  publishedAt: z.date().optional(),
  featured: z.boolean().default(false),
})

const updatePostSchema = createPostSchema.partial().extend({
  id: z.string().uuid(),
})

const validateCreatePost = createValidator(createPostSchema)
const validateUpdatePost = createValidator(updatePostSchema)

// Express middleware example
function validateRequestBody(validator: any) {
  return (req: any, res: any, next: any) => {
    const result = validator(req.body)

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        message: result.error.message,
        issues: result.error.issues || [],
      })
    }

    req.validatedBody = result.value
    next()
  }
}

// Usage in routes
// app.post('/posts', validateRequestBody(validateCreatePost), createPostHandler)
// app.put('/posts/:id', validateRequestBody(validateUpdatePost), updatePostHandler)
```

## Validate Arrays and Collections

### Validate Array of Simple Values

```typescript
import { validate } from '@repo/validation'

// Validate array of emails
const emailListValidator = validate.array(validate.email)

function validateEmailList(emails: string[]) {
  const result = emailListValidator(emails)
  if (!result.success) {
    console.error('Email list validation failed:', result.error.message)
    return result
  }

  console.log(`Validated ${result.value.length} email addresses`)
  return result
}

// Example
const emails = [
  'user1@example.com',
  'user2@example.com',
  'invalid-email', // This will cause validation to fail
]

validateEmailList(emails)
```

### Validate Array of Objects

```typescript
import { createValidator, z } from '@repo/validation'

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
})

const contactListSchema = z.array(contactSchema).min(1).max(100)
const validateContactList = createValidator(contactListSchema)

function processContactList(contacts: any[]) {
  const result = validateContactList(contacts)
  if (!result.success) {
    console.error('Contact list validation failed:')

    // Show detailed errors for each contact
    if (result.error.issues) {
      result.error.issues.forEach((issue) => {
        const contactIndex = issue.path[0]
        const field = issue.path.slice(1).join('.')
        console.error(`  Contact ${contactIndex} - ${field}: ${issue.message}`)
      })
    }

    return result
  }

  console.log(`Processing ${result.value.length} contacts`)
  return result
}
```

### Batch Validation with Partial Success

```typescript
import { validate } from '@repo/validation'

interface ValidationBatchResult<T> {
  successful: T[]
  failed: Array<{ index: number; item: any; error: string }>
  total: number
}

function validateBatch<T>(
  items: any[],
  validator: (item: any) => Result<T>
): Result<ValidationBatchResult<T>> {
  const successful: T[] = []
  const failed: Array<{ index: number; item: any; error: string }> = []

  items.forEach((item, index) => {
    const result = validator(item)
    if (result.success) {
      successful.push(result.value)
    } else {
      failed.push({
        index,
        item,
        error: result.error.message,
      })
    }
  })

  return ok({
    successful,
    failed,
    total: items.length,
  })
}

// Example: Validate batch of user registrations
const registrations = [
  { email: 'user1@example.com', age: 25 },
  { email: 'invalid', age: 25 }, // Invalid email
  { email: 'user3@example.com', age: 5 }, // Invalid age
]

const userValidator = validate.object({
  email: validate.email,
  age: validate.numberRange(13, 120),
})

const batchResult = validateBatch(registrations, userValidator)
if (batchResult.success) {
  const { successful, failed, total } = batchResult.value
  console.log(`Validated ${successful.length}/${total} registrations`)

  if (failed.length > 0) {
    console.log('Failed validations:')
    failed.forEach(({ index, error }) => {
      console.log(`  Item ${index}: ${error}`)
    })
  }
}
```

## Conditional and Dynamic Validation

### Conditional Field Validation

```typescript
import { createValidator, z } from '@repo/validation'

// Schema with conditional validation
const paymentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('credit_card'),
    cardNumber: z.string().length(16),
    expiryMonth: z.number().min(1).max(12),
    expiryYear: z.number().min(new Date().getFullYear()),
    cvv: z.string().length(3),
  }),
  z.object({
    type: z.literal('paypal'),
    paypalEmail: z.string().email(),
  }),
  z.object({
    type: z.literal('bank_transfer'),
    accountNumber: z.string().min(8).max(20),
    routingNumber: z.string().length(9),
  }),
])

const validatePayment = createValidator(paymentSchema)

function processPayment(paymentData: any) {
  const result = validatePayment(paymentData)
  if (!result.success) {
    console.error('Payment validation failed:', result.error.message)
    return result
  }

  const payment = result.value
  console.log(`Processing ${payment.type} payment`)

  // Type-safe access to payment-specific fields
  switch (payment.type) {
    case 'credit_card':
      console.log(`Card ending in ${payment.cardNumber.slice(-4)}`)
      break
    case 'paypal':
      console.log(`PayPal account: ${payment.paypalEmail}`)
      break
    case 'bank_transfer':
      console.log(`Bank account: ${payment.accountNumber}`)
      break
  }

  return result
}
```

### Runtime Schema Generation

```typescript
import { z } from '@repo/validation'

function createDynamicSchema(fields: Array<{ name: string; type: string; required: boolean }>) {
  const schemaFields: Record<string, z.ZodTypeAny> = {}

  fields.forEach((field) => {
    let schema: z.ZodTypeAny

    switch (field.type) {
      case 'email':
        schema = z.string().email()
        break
      case 'url':
        schema = z.string().url()
        break
      case 'number':
        schema = z.number()
        break
      case 'date':
        schema = z.date()
        break
      default:
        schema = z.string()
    }

    if (!field.required) {
      schema = schema.optional()
    }

    schemaFields[field.name] = schema
  })

  return z.object(schemaFields)
}

// Example: Generate schema from configuration
const formFields = [
  { name: 'name', type: 'string', required: true },
  { name: 'email', type: 'email', required: true },
  { name: 'website', type: 'url', required: false },
  { name: 'age', type: 'number', required: false },
]

const dynamicSchema = createDynamicSchema(formFields)
const validateDynamicForm = createValidator(dynamicSchema)

const formData = {
  name: 'John Doe',
  email: 'john@example.com',
  website: 'https://johndoe.com',
}

const result = validateDynamicForm(formData)
```

## Validator Composition

### Chain Multiple Validators

```typescript
import { composeValidators, validateRequired, validateStringLength } from '@repo/validation'

// Create composed validator
const usernameValidator = composeValidators(
  validateRequired(),
  validateStringLength(3, 20),
  (username: string) => {
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return err({ message: 'Username can only contain letters, numbers, and underscores' })
    }
    return ok(username.toLowerCase())
  }
)

function validateUsername(username: string) {
  const result = usernameValidator(username)
  if (!result.success) {
    console.error('Username validation failed:', result.error.message)
    return result
  }

  console.log('Valid username:', result.value)
  return result
}
```

### Alternative Validation (anyOf)

```typescript
import { anyOf, validateEmail, validatePhoneNumber } from '@repo/validation'

// Accept either email or phone number
const contactValidator = anyOf(validateEmail(), validatePhoneNumber())

function validateContactInfo(contact: string) {
  const result = contactValidator(contact)
  if (!result.success) {
    console.error('Must provide either valid email or phone number')
    return result
  }

  console.log('Valid contact info:', result.value)
  return result
}

// Examples
validateContactInfo('user@example.com') // ✅ Valid email
validateContactInfo('+1-555-123-4567') // ✅ Valid phone
validateContactInfo('invalid-contact') // ❌ Neither email nor phone
```

### Combined Validation (allOf)

```typescript
import { allOf, validateStringLength } from '@repo/validation'

// Password must meet multiple criteria
const passwordValidator = allOf(
  validateStringLength(8, 50),
  (password: string) => {
    if (!/[A-Z]/.test(password)) {
      return err({ message: 'Password must contain at least one uppercase letter' })
    }
    return ok(password)
  },
  (password: string) => {
    if (!/[a-z]/.test(password)) {
      return err({ message: 'Password must contain at least one lowercase letter' })
    }
    return ok(password)
  },
  (password: string) => {
    if (!/\d/.test(password)) {
      return err({ message: 'Password must contain at least one number' })
    }
    return ok(password)
  },
  (password: string) => {
    if (!/[!@#$%^&*]/.test(password)) {
      return err({ message: 'Password must contain at least one special character' })
    }
    return ok(password)
  }
)

function validateStrongPassword(password: string) {
  const result = passwordValidator(password)
  if (!result.success) {
    console.error('Password validation failed:', result.error.message)
    return result
  }

  console.log('Strong password validated')
  return result
}
```

## Custom Validators

### Create Domain-Specific Validators

```typescript
import { ok, err } from '@repo/validation'
import type { ValidationResult } from '@repo/validation'

// Custom credit card validator
function validateCreditCard(cardNumber: string): ValidationResult<string> {
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '')

  // Check length
  if (cleaned.length < 13 || cleaned.length > 19) {
    return err({ message: 'Credit card number must be 13-19 digits' })
  }

  // Check if all digits
  if (!/^\d+$/.test(cleaned)) {
    return err({ message: 'Credit card number must contain only digits' })
  }

  // Luhn algorithm validation
  if (!isValidLuhn(cleaned)) {
    return err({ message: 'Invalid credit card number' })
  }

  return ok(cleaned)
}

function isValidLuhn(number: string): boolean {
  let sum = 0
  let isEven = false

  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i])

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

// Custom IP address validator
function validateIPAddress(ip: string): ValidationResult<string> {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/

  if (!ipv4Regex.test(ip)) {
    return err({ message: 'Invalid IP address format' })
  }

  const parts = ip.split('.')
  for (const part of parts) {
    const num = parseInt(part)
    if (num < 0 || num > 255) {
      return err({ message: 'IP address octets must be between 0 and 255' })
    }
  }

  return ok(ip)
}
```

### Async Validators

```typescript
import { fs } from '@repo/fs'
import type { ValidationResult } from '@repo/validation'

// Async validator to check if file exists
async function validateFileExists(filePath: string): Promise<ValidationResult<string>> {
  const existsResult = await fs.exists(filePath)

  if (!existsResult.success) {
    return err({ message: `Cannot verify file existence: ${existsResult.error.message}` })
  }

  if (!existsResult.value) {
    return err({ message: `File does not exist: ${filePath}` })
  }

  return ok(filePath)
}

// Async validator to check if email is already registered
async function validateUniqueEmail(email: string): Promise<ValidationResult<string>> {
  // Simulate database check
  const existingUsers = await getUsersByEmail(email)

  if (existingUsers.length > 0) {
    return err({ message: 'Email address is already registered' })
  }

  return ok(email)
}

// Compose async validators
async function validateRegistrationEmail(email: string): Promise<ValidationResult<string>> {
  // First validate format
  const formatResult = validate.email(email)
  if (!formatResult.success) {
    return formatResult
  }

  // Then check uniqueness
  const uniqueResult = await validateUniqueEmail(formatResult.value)
  return uniqueResult
}
```

## Error Handling and Recovery

### Collect All Validation Errors

```typescript
import { validate } from '@repo/validation'

interface ValidationErrors {
  [field: string]: string[]
}

function validateFormWithAllErrors(formData: any): Result<any, ValidationErrors> {
  const errors: ValidationErrors = {}

  // Validate each field, collecting all errors
  const nameResult = validate.stringLength(1, 100)(formData.name)
  if (!nameResult.success) {
    errors.name = [nameResult.error.message]
  }

  const emailResult = validate.email(formData.email)
  if (!emailResult.success) {
    errors.email = [emailResult.error.message]
  }

  const ageResult = validate.numberRange(13, 120)(formData.age)
  if (!ageResult.success) {
    errors.age = [ageResult.error.message]
  }

  // Additional password validation with multiple possible errors
  const passwordErrors = []
  if (!formData.password || formData.password.length < 8) {
    passwordErrors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(formData.password)) {
    passwordErrors.push('Password must contain an uppercase letter')
  }
  if (!/\d/.test(formData.password)) {
    passwordErrors.push('Password must contain a number')
  }
  if (passwordErrors.length > 0) {
    errors.password = passwordErrors
  }

  if (Object.keys(errors).length > 0) {
    return err(errors)
  }

  return ok({
    name: nameResult.value,
    email: emailResult.value,
    age: ageResult.value,
    password: formData.password,
  })
}
```

### Provide User-Friendly Error Messages

```typescript
function formatValidationErrors(errors: ValidationErrors): string[] {
  const messages = []

  if (errors.name) {
    messages.push(`Name: ${errors.name.join(', ')}`)
  }
  if (errors.email) {
    messages.push(`Email: ${errors.email.join(', ')}`)
  }
  if (errors.password) {
    messages.push(`Password: ${errors.password.join(', ')}`)
  }

  return messages
}

// Usage in UI
const validationResult = validateFormWithAllErrors(formData)
if (!validationResult.success) {
  const errorMessages = formatValidationErrors(validationResult.error)
  displayErrors(errorMessages)
}
```

### Graceful Degradation

```typescript
function validateWithDefaults(data: any) {
  const result = {
    name: data.name || 'Anonymous',
    email: '',
    age: null,
    preferences: {
      theme: 'light',
      notifications: true,
    },
  }

  // Validate email, fallback to empty if invalid
  const emailResult = validate.email(data.email)
  if (emailResult.success) {
    result.email = emailResult.value
  } else {
    console.warn('Invalid email provided, using empty value')
  }

  // Validate age, fallback to null if invalid
  if (data.age !== undefined) {
    const ageResult = validate.numberRange(13, 120)(data.age)
    if (ageResult.success) {
      result.age = ageResult.value
    } else {
      console.warn('Invalid age provided, using null')
    }
  }

  return ok(result)
}
```

## Integration Patterns

### Express.js Middleware

```typescript
import { createValidator, z } from '@repo/validation'
import type { Request, Response, NextFunction } from 'express'

function createValidationMiddleware(schema: z.ZodSchema) {
  const validator = createValidator(schema)

  return (req: Request, res: Response, next: NextFunction) => {
    const result = validator(req.body)

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        message: result.error.message,
        issues: result.error.issues || [],
      })
    }

    // Add validated data to request
    req.body = result.value
    next()
  }
}

// Usage
const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
})

app.post('/users', createValidationMiddleware(createUserSchema), (req, res) => {
  // req.body is now validated and type-safe
  const user = req.body
  res.json({ success: true, user })
})
```

### CLI Input Validation

```typescript
import { createCommand } from '@esteban-url/cli/command'
import { validate } from '@repo/validation'

const deployCommand = createCommand({
  name: 'deploy',
  description: 'Deploy application',
  options: [
    { name: 'environment', type: 'string', required: true },
    { name: 'version', type: 'string' },
    { name: 'dry-run', type: 'boolean', default: false },
  ],
  action: async (options, context) => {
    // Validate environment
    const validEnvironments = ['development', 'staging', 'production']
    if (!validEnvironments.includes(options.environment)) {
      context.logger.error(`Invalid environment. Must be one of: ${validEnvironments.join(', ')}`)
      return err(new Error('Invalid environment'))
    }

    // Validate version format if provided
    if (options.version) {
      const versionResult = validate.stringLength(1, 20)(options.version)
      if (!versionResult.success) {
        context.logger.error(`Invalid version: ${versionResult.error.message}`)
        return versionResult
      }
    }

    context.logger.info(`Deploying to ${options.environment}`)
    if (options.version) {
      context.logger.info(`Version: ${options.version}`)
    }
    if (options['dry-run']) {
      context.logger.info('Dry run mode - no actual deployment')
    }

    return ok({ environment: options.environment, version: options.version })
  },
})
```

## Next Steps

- Review [Validation API Reference](/docs/reference/validation-api.md) for detailed function documentation
- Learn about [Composition Patterns](/packages/validation/explanation/composition-patterns) for advanced validator composition
- Explore [Functional Patterns](/docs/how-to/apply-functional-patterns) for Result type usage
