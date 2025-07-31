# How to Create Custom Validators

Build custom validation logic using @repo/validation's functional patterns.

## Basic Custom Validator

```typescript
import { ok, err, createValidationError } from '@repo/validation'
import type { ValidationResult, ValidatorFn } from '@repo/validation'

// Simple validator function
const validateUsername: ValidatorFn<string> = (value: string): ValidationResult<string> => {
  if (value.length < 3) {
    return err(createValidationError('Username too short', {
      field: 'username',
      value,
      suggestion: 'Use at least 3 characters'
    }))
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    return err(createValidationError('Invalid username format', {
      field: 'username',
      value,
      suggestion: 'Use only letters, numbers, underscores, and hyphens'
    }))
  }
  
  return ok(value.toLowerCase())
}
```

## Parameterized Validators

Create validators with configurable options:

```typescript
const createRangeValidator = (min: number, max: number): ValidatorFn<number> => {
  return (value: number): ValidationResult<number> => {
    if (value < min) {
      return err(createValidationError(`Value must be at least ${min}`, {
        field: 'value',
        value,
        code: 'MIN_VALUE'
      }))
    }
    
    if (value > max) {
      return err(createValidationError(`Value must be at most ${max}`, {
        field: 'value',
        value,
        code: 'MAX_VALUE'
      }))
    }
    
    return ok(value)
  }
}

// Usage
const validateAge = createRangeValidator(18, 120)
const validatePercentage = createRangeValidator(0, 100)
```

## Async Validators

Validate against external data sources:

```typescript
type AsyncValidatorFn<T> = (value: T) => Promise<ValidationResult<T>>

const createUniqueValidator = <T>(
  checkExists: (value: T) => Promise<boolean>,
  errorMessage: string
): AsyncValidatorFn<T> => {
  return async (value: T): Promise<ValidationResult<T>> => {
    const exists = await checkExists(value)
    
    return exists
      ? err(createValidationError(errorMessage, { value }))
      : ok(value)
  }
}

// Usage
const validateUniqueEmail = createUniqueValidator(
  async (email: string) => {
    // Check database
    return db.users.exists({ email })
  },
  'Email already registered'
)
```

## Composing Validators

Combine multiple validators:

```typescript
import { composeValidators, validate } from '@repo/validation'

// Password validator with multiple rules
const validatePassword = composeValidators(
  validate.stringLength(8, 100),
  (value: string) => {
    if (!/[A-Z]/.test(value)) {
      return err(createValidationError('Must contain uppercase letter'))
    }
    return ok(value)
  },
  (value: string) => {
    if (!/[a-z]/.test(value)) {
      return err(createValidationError('Must contain lowercase letter'))
    }
    return ok(value)
  },
  (value: string) => {
    if (!/[0-9]/.test(value)) {
      return err(createValidationError('Must contain number'))
    }
    return ok(value)
  },
  (value: string) => {
    if (!/[^A-Za-z0-9]/.test(value)) {
      return err(createValidationError('Must contain special character'))
    }
    return ok(value)
  }
)
```

## Conditional Validators

Apply validation based on conditions:

```typescript
const createConditionalValidator = <T>(
  condition: (value: T) => boolean,
  validator: ValidatorFn<T>,
  fallback?: ValidatorFn<T>
): ValidatorFn<T> => {
  return (value: T): ValidationResult<T> => {
    if (condition(value)) {
      return validator(value)
    }
    return fallback ? fallback(value) : ok(value)
  }
}

// Example: Different validation for different user types
const validateUserData = createConditionalValidator(
  (data: any) => data.type === 'business',
  (data: any) => {
    if (!data.companyName) {
      return err(createValidationError('Company name required for business users'))
    }
    return ok(data)
  },
  (data: any) => {
    if (!data.firstName || !data.lastName) {
      return err(createValidationError('Full name required for individual users'))
    }
    return ok(data)
  }
)
```

## Array Validators

Validate arrays with custom rules:

```typescript
const createArrayValidator = <T>(
  itemValidator: ValidatorFn<T>,
  options?: {
    minLength?: number
    maxLength?: number
    unique?: boolean
  }
): ValidatorFn<T[]> => {
  return (values: T[]): ValidationResult<T[]> => {
    // Check length constraints
    if (options?.minLength && values.length < options.minLength) {
      return err(createValidationError(
        `Array must have at least ${options.minLength} items`
      ))
    }
    
    if (options?.maxLength && values.length > options.maxLength) {
      return err(createValidationError(
        `Array must have at most ${options.maxLength} items`
      ))
    }
    
    // Check uniqueness
    if (options?.unique) {
      const seen = new Set()
      for (const value of values) {
        const key = JSON.stringify(value)
        if (seen.has(key)) {
          return err(createValidationError('Array must contain unique values'))
        }
        seen.add(key)
      }
    }
    
    // Validate each item
    const validatedItems: T[] = []
    for (let i = 0; i < values.length; i++) {
      const result = itemValidator(values[i])
      if (result.isErr()) {
        return err(createValidationError(
          `Invalid item at index ${i}: ${result.error.message}`,
          { index: i, value: values[i] }
        ))
      }
      validatedItems.push(result.value)
    }
    
    return ok(validatedItems)
  }
}

// Usage
const validateTags = createArrayValidator(
  validate.stringLength(2, 20),
  { minLength: 1, maxLength: 5, unique: true }
)
```

## Transform Validators

Validate and transform in one step:

```typescript
const createTransformValidator = <T, R>(
  validator: ValidatorFn<T>,
  transformer: (value: T) => R
): ValidatorFn<T, R> => {
  return (value: T): ValidationResult<R> => {
    const result = validator(value)
    return result.isErr() 
      ? result 
      : ok(transformer(result.value))
  }
}

// Example: Validate and normalize email
const validateAndNormalizeEmail = createTransformValidator(
  validate.email,
  (email: string) => email.toLowerCase().trim()
)

// Example: Parse and validate number
const validateNumberString = createTransformValidator(
  (value: string) => {
    const num = parseFloat(value)
    return isNaN(num)
      ? err(createValidationError('Invalid number'))
      : ok(value)
  },
  (value: string) => parseFloat(value)
)
```

## Schema-Based Custom Validators

Create validators from Zod schemas:

```typescript
import { z, createValidator } from '@repo/validation'

// Custom schema with refinements
const phoneNumberSchema = z.string().refine(
  (val) => /^\+?[1-9]\d{1,14}$/.test(val),
  {
    message: 'Invalid international phone number',
    path: ['phoneNumber']
  }
)

const validatePhoneNumber = createValidator(phoneNumberSchema)

// Complex object validator
const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/)
}).refine(
  (data) => {
    // Custom cross-field validation
    if (data.state === 'CA' && !data.zip.startsWith('9')) {
      return false
    }
    return true
  },
  {
    message: 'California ZIP codes must start with 9',
    path: ['zip']
  }
)

const validateAddress = createValidator(addressSchema)
```

## Testing Custom Validators

```typescript
import { describe, it, expect } from 'vitest'
import { expectValidationSuccess, expectValidationError } from '@repo/validation/testing'

describe('Custom Validators', () => {
  describe('validateUsername', () => {
    it('accepts valid usernames', () => {
      const result = validateUsername('john_doe')
      expectValidationSuccess(result)
      expect(result.value).toBe('john_doe')
    })
    
    it('rejects short usernames', () => {
      const result = validateUsername('ab')
      expectValidationError(result, {
        message: /too short/i,
        field: 'username'
      })
    })
    
    it('rejects invalid characters', () => {
      const result = validateUsername('john@doe')
      expectValidationError(result, {
        message: /invalid.*format/i,
        suggestion: /letters.*numbers/i
      })
    })
  })
})
```

## Best Practices

1. **Return helpful errors** - Include field names and suggestions
2. **Keep validators pure** - No side effects in sync validators
3. **Compose simple validators** - Build complex from simple
4. **Type your validators** - Use TypeScript generics
5. **Test edge cases** - Empty strings, nulls, edge values
6. **Document behavior** - Especially for complex validators

## Related Resources

- [Form Validation Tutorial](/docs/tutorials/form-validation-guide.md)
- [@repo/validation API Reference](/packages/validation/docs/reference/api.md)
- [Validation Patterns](/docs/explanation/validation-patterns.md)