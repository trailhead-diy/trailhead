---
type: explanation
title: 'Validator Composition Patterns'
description: 'Understanding the design and benefits of composable validation in @repo/validation'
related:
  - ../how-to/validate-data.md
  - /packages/cli/reference/core.md
  - /docs/explanation/functional-architecture
---

# Validator Composition Patterns

This document explains the design philosophy behind @repo/validation's composable validator system and how it enables flexible, reusable validation logic.

## Overview

The @repo/validation package is built around the principle of composability—small, focused validators that can be combined to create complex validation logic. This approach promotes code reuse, testability, and maintainability.

## Background

### The Problem with Monolithic Validation

Traditional validation approaches often result in large, monolithic validation functions:

```typescript
// Traditional approach - difficult to reuse and test
function validateUser(user: any): boolean {
  // Email validation logic
  if (!user.email || !user.email.includes('@')) {
    throw new Error('Invalid email')
  }

  // Password validation logic
  if (!user.password || user.password.length < 8) {
    throw new Error('Password too short')
  }

  if (!/[A-Z]/.test(user.password)) {
    throw new Error('Password must contain uppercase')
  }

  // Age validation logic
  if (user.age && (user.age < 13 || user.age > 120)) {
    throw new Error('Invalid age')
  }

  return true
}
```

### Problems with This Approach

1. **Poor Reusability** - Email validation logic can't be reused elsewhere
2. **Hard to Test** - Must test all validation logic together
3. **Rigid Error Handling** - Throws exceptions, making error handling unpredictable
4. **Complex Composition** - Difficult to combine with other validators
5. **Poor Type Safety** - No compile-time guarantees about validation

## Core Concepts

### Validator Function Type

All validators follow a consistent interface:

```typescript
type ValidatorFn<T, R = T> = (value: T) => ValidationResult<R>
type ValidationResult<T> = Result<T, ValidationError>
```

This consistency enables composition and predictable behavior.

### Pure Functions

Validators are pure functions with no side effects:

```typescript
// Pure validator - same input always produces same output
const validateEmail = (email: string): ValidationResult<string> => {
  if (!email || !email.includes('@')) {
    return err({ message: 'Invalid email format' })
  }
  return ok(email.toLowerCase())
}

// Can be safely reused anywhere
const result1 = validateEmail('USER@EXAMPLE.COM')
const result2 = validateEmail('USER@EXAMPLE.COM')
// result1 === result2 (same output for same input)
```

### Result-Based Error Handling

Validators return Result types instead of throwing exceptions:

```typescript
const result = validateEmail('invalid-email')
if (result.success) {
  console.log('Valid email:', result.value)
} else {
  console.error('Validation error:', result.error.message)
}
```

## Design Decisions

### Decision 1: Function Composition Over Inheritance

**Context**: Need flexible way to combine validation logic

**Options considered**:

1. Class-based validators with inheritance
2. Configuration-based validators
3. Function composition
4. Decorator pattern

**Decision**: Function composition with higher-order functions

**Trade-offs**:

- **Gained**: Flexibility, simplicity, functional programming benefits
- **Lost**: Familiar OOP patterns, some IDE tooling advantages

### Decision 2: Result Types Over Exceptions

**Context**: Need predictable error handling

**Decision**: Use Result types consistently across all validators

**Trade-offs**:

- **Gained**: Explicit error handling, composability, type safety
- **Lost**: Familiar exception patterns, some JavaScript conventions

### Decision 3: Currying for Configuration

**Context**: Validators need configuration while remaining composable

**Decision**: Use curried functions for configurable validators

```typescript
// Curried function allows configuration while maintaining composability
const validateStringLength =
  (min: number, max: number) =>
  (value: string): ValidationResult<string> => {
    if (value.length < min || value.length > max) {
      return err({ message: `Must be ${min}-${max} characters` })
    }
    return ok(value)
  }

// Usage - creates configured validator
const usernameValidator = validateStringLength(3, 20)
```

**Trade-offs**:

- **Gained**: Configuration flexibility, reusability, partial application
- **Lost**: Direct function calls, some complexity for beginners

## Composition Patterns

### Sequential Composition (composeValidators)

Chain validators where each operates on the output of the previous:

```typescript
const passwordValidator = composeValidators(
  validateRequired(), // Ensure not empty
  validateStringLength(8, 50), // Check length
  validatePasswordStrength(), // Check complexity
  normalizePassword() // Transform to standard format
)

// Equivalent to:
const passwordValidator = (password: string) => {
  const step1 = validateRequired()(password)
  if (!step1.success) return step1

  const step2 = validateStringLength(8, 50)(step1.value)
  if (!step2.success) return step2

  const step3 = validatePasswordStrength()(step2.value)
  if (!step3.success) return step3

  return normalizePassword()(step3.value)
}
```

### Parallel Composition (allOf)

All validators must pass:

```typescript
const strongPasswordValidator = allOf(
  validateStringLength(8, 50),
  validateHasUppercase(),
  validateHasLowercase(),
  validateHasNumber(),
  validateHasSpecialChar()
)

// All conditions must be met
const result = strongPasswordValidator('MyPassword123!')
```

### Alternative Composition (anyOf)

At least one validator must pass:

```typescript
const contactValidator = anyOf(validateEmail(), validatePhoneNumber(), validateSocialMediaHandle())

// Any valid contact method is accepted
const result1 = contactValidator('user@example.com') // ✅ Email
const result2 = contactValidator('+1-555-123-4567') // ✅ Phone
const result3 = contactValidator('@username') // ✅ Social
const result4 = contactValidator('invalid') // ❌ None match
```

### Object Composition

Validate object properties with different validators:

```typescript
const userValidator = validate.object({
  email: composeValidators(validateRequired(), validateEmail()),
  password: strongPasswordValidator,
  age: validate.numberRange(13, 120),
  profile: validate.object({
    name: validateStringLength(1, 100),
    bio: validateStringLength(0, 500),
  }),
})
```

### Array Composition

Apply validators to array elements:

```typescript
// Validate array of emails
const emailListValidator = validate.array(validateEmail())

// Validate array of complex objects
const userListValidator = validate.array(userValidator)

// Validate with array-level constraints
const tagListValidator = composeValidators(
  validate.array(validateStringLength(1, 50)), // Each tag 1-50 chars
  validateArrayLength(1, 10), // 1-10 tags total
  validateUniqueArray() // No duplicates
)
```

## Advanced Composition Patterns

### Conditional Validation

Validators that change behavior based on input:

```typescript
const conditionalValidator = (value: any): ValidationResult<any> => {
  if (typeof value === 'string') {
    return validateStringLength(1, 100)(value)
  } else if (typeof value === 'number') {
    return validateNumberRange(0, 1000)(value)
  } else {
    return err({ message: 'Must be string or number' })
  }
}
```

### Context-Aware Validation

Validators that use external context:

```typescript
const createUniqueEmailValidator = (existingEmails: string[]) =>
  composeValidators(validateEmail(), (email: string): ValidationResult<string> => {
    if (existingEmails.includes(email.toLowerCase())) {
      return err({ message: 'Email already registered' })
    }
    return ok(email)
  })

// Usage
const existingEmails = ['admin@example.com', 'user@example.com']
const uniqueEmailValidator = createUniqueEmailValidator(existingEmails)
```

### Async Composition

Compose async validators:

```typescript
const asyncEmailValidator = composeAsyncValidators(
  validateEmail(), // Sync validation first
  checkEmailDeliverability(), // Async: DNS/MX record check
  checkEmailNotBlacklisted() // Async: Check against blacklist
)

const result = await asyncEmailValidator('user@example.com')
```

### Transform Composition

Validators that transform data during validation:

```typescript
const normalizeAndValidateEmail = composeValidators(
  validateRequired(),
  (email: string) => ok(email.toLowerCase().trim()), // Transform
  validateEmail(), // Validate
  (email: string) => ok(email.toLowerCase()) // Final transform
)

const result = normalizeAndValidateEmail('  USER@EXAMPLE.COM  ')
// result.value === 'user@example.com'
```

## Implementation Patterns

### Higher-Order Validators

Create validators that generate other validators:

```typescript
// Create validator factory
const createRangeValidator =
  <T>(min: T, max: T, compare: (a: T, b: T) => number) =>
  (value: T): ValidationResult<T> => {
    if (compare(value, min) < 0 || compare(value, max) > 0) {
      return err({ message: `Must be between ${min} and ${max}` })
    }
    return ok(value)
  }

// Use factory to create specific validators
const numberRangeValidator = createRangeValidator(0, 100, (a, b) => a - b)
const dateRangeValidator = createRangeValidator(
  new Date('2020-01-01'),
  new Date('2030-12-31'),
  (a, b) => a.getTime() - b.getTime()
)
```

### Validator Pipelines

Build complex validation pipelines:

```typescript
const userRegistrationPipeline = createPipeline([
  // Step 1: Basic validation
  validate.object({
    email: validateEmail(),
    password: strongPasswordValidator,
    name: validateStringLength(1, 100),
  }),

  // Step 2: Business logic validation
  async (userData) => {
    const emailExists = await checkEmailExists(userData.email)
    if (emailExists) {
      return err({ message: 'Email already registered' })
    }
    return ok(userData)
  },

  // Step 3: Data transformation
  (userData) =>
    ok({
      ...userData,
      email: userData.email.toLowerCase(),
      createdAt: new Date(),
      id: generateUserId(),
    }),
])

const result = await userRegistrationPipeline.execute(formData)
```

### Memoized Validators

Cache validation results for expensive operations:

```typescript
const memoizeValidator = <T, R>(validator: ValidatorFn<T, R>): ValidatorFn<T, R> => {
  const cache = new Map<string, ValidationResult<R>>()

  return (value: T): ValidationResult<R> => {
    const key = JSON.stringify(value)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = validator(value)
    cache.set(key, result)
    return result
  }
}

// Use for expensive validations
const expensiveValidator = memoizeValidator(
  composeValidators(
    validateComplexBusinessRules(),
    validateAgainstExternalAPI(),
    validateWithHeavyComputation()
  )
)
```

## Error Composition Patterns

### Error Aggregation

Collect multiple validation errors:

```typescript
const aggregateValidator =
  <T>(validators: ValidatorFn<T, T>[]) =>
  (value: T): ValidationResult<T> => {
    const errors: ValidationError[] = []
    let hasSuccess = false
    let successValue: T = value

    for (const validator of validators) {
      const result = validator(value)
      if (result.success) {
        hasSuccess = true
        successValue = result.value
      } else {
        errors.push(result.error)
      }
    }

    if (errors.length === 0) {
      return ok(successValue)
    }

    return err({
      message: 'Multiple validation errors',
      issues: errors.map((e) => ({ path: [], message: e.message })),
    })
  }
```

### Error Context Enhancement

Add context to validation errors:

```typescript
const withFieldContext =
  <T>(fieldName: string, validator: ValidatorFn<T, T>) =>
  (value: T): ValidationResult<T> => {
    const result = validator(value)
    if (!result.success) {
      return err({
        ...result.error,
        field: fieldName,
        path: [fieldName, ...(result.error.path || [])],
      })
    }
    return result
  }

// Usage
const userValidator = validate.object({
  email: withFieldContext('email', validateEmail()),
  age: withFieldContext('age', validate.numberRange(13, 120)),
})
```

### Error Recovery

Validators that can recover from certain errors:

```typescript
const withFallback =
  <T>(primaryValidator: ValidatorFn<T, T>, fallbackValidator: ValidatorFn<T, T>) =>
  (value: T): ValidationResult<T> => {
    const primaryResult = primaryValidator(value)
    if (primaryResult.success) {
      return primaryResult
    }

    console.warn(`Primary validation failed, trying fallback: ${primaryResult.error.message}`)
    return fallbackValidator(value)
  }

// Example: Try strict validation, fallback to lenient
const flexibleEmailValidator = withFallback(validateStrictEmail(), validateLenientEmail())
```

## Performance Considerations

### Lazy Evaluation

Validators that stop at first error:

```typescript
const lazyAllOf =
  <T>(...validators: ValidatorFn<T, T>[]) =>
  (value: T): ValidationResult<T> => {
    for (const validator of validators) {
      const result = validator(value)
      if (!result.success) {
        return result // Stop at first error
      }
      value = result.value // Use transformed value
    }
    return ok(value)
  }
```

### Parallel Validation

Run independent validators in parallel:

```typescript
const parallelValidation = async <T>(
  value: T,
  validators: Array<(value: T) => Promise<ValidationResult<T>>>
): Promise<ValidationResult<T[]>> => {
  const results = await Promise.all(validators.map((validator) => validator(value)))

  const errors = results.filter((r) => !r.success)
  if (errors.length > 0) {
    return err({
      message: 'Parallel validation failed',
      issues: errors.map((e) => ({ path: [], message: e.error.message })),
    })
  }

  return ok(results.map((r) => r.value))
}
```

### Short-Circuit Optimization

Optimize validator chains:

```typescript
// Cheap validations first, expensive ones last
const optimizedUserValidator = composeValidators(
  validateRequired(), // Very fast
  validateStringLength(1, 100), // Fast
  validateEmail(), // Medium
  checkEmailDeliverability(), // Slow - network call
  checkEmailAgainstSpamDatabase() // Very slow - external API
)
```

## Testing Composition

### Unit Testing Individual Validators

```typescript
describe('email validator', () => {
  it('accepts valid emails', () => {
    const result = validateEmail()('user@example.com')
    expect(result.success).toBe(true)
    expect(result.value).toBe('user@example.com')
  })

  it('rejects invalid emails', () => {
    const result = validateEmail()('invalid-email')
    expect(result.success).toBe(false)
    expect(result.error.message).toContain('email')
  })
})
```

### Testing Composed Validators

```typescript
describe('user validator', () => {
  const userValidator = validate.object({
    email: validateEmail(),
    age: validate.numberRange(13, 120),
  })

  it('validates complete user', () => {
    const result = userValidator({
      email: 'user@example.com',
      age: 25,
    })
    expect(result.success).toBe(true)
  })

  it('reports field-specific errors', () => {
    const result = userValidator({
      email: 'invalid',
      age: 5,
    })
    expect(result.success).toBe(false)
    expect(result.error.issues).toHaveLength(2)
  })
})
```

### Property-Based Testing

```typescript
import { fc } from 'fast-check'

describe('string length validator', () => {
  it('accepts strings within range', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 5, maxLength: 10 }), (str) => {
        const result = validateStringLength(5, 10)(str)
        expect(result.success).toBe(true)
        expect(result.value).toBe(str)
      })
    )
  })

  it('rejects strings outside range', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string({ maxLength: 4 }), fc.string({ minLength: 11 })), (str) => {
        const result = validateStringLength(5, 10)(str)
        expect(result.success).toBe(false)
      })
    )
  })
})
```

## Future Considerations

### Schema Integration

Tight integration with schema validation:

```typescript
// Future: Generate validators from schemas
const userSchema = z.object({
  email: z.string().email(),
  age: z.number().min(13).max(120),
})

const userValidator = createValidatorFromSchema(userSchema)
```

### Performance Optimization

Advanced optimization techniques:

```typescript
// Future: Compile validators to optimized functions
const optimizedValidator = compileValidator(
  composeValidators(validateRequired(), validateEmail(), validateUnique(emailDatabase))
)
```

### IDE Integration

Better development experience:

```typescript
// Future: IDE plugins could suggest validator compositions
const suggestedValidator = suggest(
  'email field for user registration' // AI suggests appropriate validators
)
```

---

The composition patterns in @repo/validation provide a powerful foundation for building flexible, reusable validation logic. By following functional programming principles and leveraging Result types, these patterns enable developers to create complex validation rules from simple, testable building blocks.
