---
type: tutorial
title: 'Form Validation Guide'
description: 'Learn to implement robust form validation using functional patterns and Result types with @repo/validation'
prerequisites:
  - TypeScript knowledge
  - Basic understanding of Result types
  - Familiarity with form handling
related:
  - /packages/validation/docs/reference/api.md
  - /docs/how-to/create-custom-validators.md
  - /docs/explanation/result-types-pattern.md
---

# Tutorial: Form Validation with @repo/validation

Learn how to implement robust form validation using functional patterns and Result types. This tutorial covers schema definition, error handling, and integration with UI frameworks.

## What You'll Learn

- Defining validation schemas with Zod
- Creating reusable validators
- Handling validation errors functionally
- Building type-safe forms

## Prerequisites

- TypeScript knowledge
- Basic understanding of Result types
- Familiarity with form handling

## Step 1: Setup

Install the validation package:

```bash
pnpm add @repo/validation @repo/core zod
```

Create a new file `form-validation.ts` for this tutorial.

## Step 2: Define Your Schema

Start by defining a schema for a user registration form:

```typescript
import { z, createSchemaValidator, emailSchema } from '@repo/validation'

// Define the form schema
const registrationSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, _ and -'),

    email: emailSchema,

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[0-9]/, 'Password must contain a number'),

    confirmPassword: z.string(),

    age: z
      .number()
      .int('Age must be a whole number')
      .min(18, 'Must be at least 18 years old')
      .max(120, 'Invalid age'),

    agreeToTerms: z.boolean().refine((val) => val === true, 'You must agree to the terms'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// Create the validator
const validateRegistration = createSchemaValidator(registrationSchema)
```

## Step 3: Create Form Handler

Build a form handler that processes and validates input:

```typescript
// Type inference from schema
type RegistrationForm = z.infer<typeof registrationSchema>

// Pure function to extract field errors
const extractFieldErrors = (issues: any[]) => {
  const errors: Record<string, string> = {}

  for (const issue of issues) {
    const field = issue.path.join('.')
    if (!errors[field]) {
      errors[field] = issue.message
    }
  }

  return errors
}

// Form handler function
const handleRegistration = (formData: unknown) => {
  const result = validateRegistration(formData)

  if (result.isErr()) {
    return {
      success: false,
      errors: extractFieldErrors(result.error.issues || []),
      message: 'Please fix the errors below',
    }
  }

  return {
    success: true,
    data: result.value,
    message: 'Registration successful!',
  }
}
```

## Step 4: Field-Level Validation

Create individual field validators for real-time validation:

```typescript
import { validate, createValidator } from '@repo/validation'

// Username validator
const validateUsername = createValidator(registrationSchema.shape.username)

// Email validator (using pre-built)
const validateEmail = validate.email

// Password strength validator
const validatePassword = createValidator(registrationSchema.shape.password)

// Real-time field validation
const validateField = (field: keyof RegistrationForm, value: any) => {
  switch (field) {
    case 'username':
      return validateUsername(value)
    case 'email':
      return validateEmail(value)
    case 'password':
      return validatePassword(value)
    default:
      return ok(value)
  }
}
```

## Step 5: Build a React Form Component

Integrate validation with a React form:

```typescript
import { useState } from 'react'

function RegistrationForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    agreeToTerms: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Handle field blur for validation
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })

    const result = validateField(
      field as keyof RegistrationForm,
      formData[field as keyof typeof formData]
    )

    if (result.isErr()) {
      setErrors({ ...errors, [field]: result.error.message })
    } else {
      const { [field]: _, ...rest } = errors
      setErrors(rest)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Convert age to number
    const dataToValidate = {
      ...formData,
      age: parseInt(formData.age, 10)
    }

    const result = handleRegistration(dataToValidate)

    if (!result.success) {
      setErrors(result.errors)
      setTouched(Object.keys(result.errors).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      ))
    } else {
      console.log('Success!', result.data)
      // Handle successful registration
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields here */}
    </form>
  )
}
```

## Step 6: Custom Validation Logic

Add custom validation for specific business rules:

```typescript
import { ok, err, createValidationError } from '@repo/validation'
import type { ValidationResult } from '@repo/validation'

// Check if username is available (async validation)
const checkUsernameAvailable = async (username: string): Promise<ValidationResult<string>> => {
  // First validate format
  const formatResult = validateUsername(username)
  if (formatResult.isErr()) return formatResult

  // Simulate API call
  const unavailableUsernames = ['admin', 'root', 'test']
  const isAvailable = !unavailableUsernames.includes(username.toLowerCase())

  return isAvailable
    ? ok(username)
    : err(
        createValidationError('Username is already taken', {
          field: 'username',
          suggestion: 'Try adding numbers or underscores',
        })
      )
}

// Compose validators
const validateUniqueUsername = async (username: string) => {
  const formatResult = validateUsername(username)
  if (formatResult.isErr()) return formatResult

  return checkUsernameAvailable(username)
}
```

## Step 7: Form State Management

Create a custom hook for form state:

```typescript
import { useReducer } from 'react'

type FormState = {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
}

type FormAction =
  | { type: 'SET_VALUE'; field: string; value: any }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'SET_TOUCHED'; field: string }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_VALUE':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
      }
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error },
      }
    case 'CLEAR_ERROR':
      const { [action.field]: _, ...errors } = state.errors
      return { ...state, errors }
    case 'SET_TOUCHED':
      return {
        ...state,
        touched: { ...state.touched, [action.field]: true },
      }
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting }
    case 'SET_ERRORS':
      return { ...state, errors: action.errors }
    default:
      return state
  }
}

function useForm<T>(schema: z.ZodType<T>, onSubmit: (data: T) => void) {
  const [state, dispatch] = useReducer(formReducer, {
    values: {},
    errors: {},
    touched: {},
    isSubmitting: false,
  })

  const validator = createSchemaValidator(schema)

  const setValue = (field: string, value: any) => {
    dispatch({ type: 'SET_VALUE', field, value })
  }

  const validateField = (field: string) => {
    // Implementation here
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true })

    const result = validator(state.values)

    if (result.isErr()) {
      dispatch({
        type: 'SET_ERRORS',
        errors: extractFieldErrors(result.error.issues || []),
      })
    } else {
      await onSubmit(result.value)
    }

    dispatch({ type: 'SET_SUBMITTING', isSubmitting: false })
  }

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    setValue,
    validateField,
    handleSubmit,
  }
}
```

## Testing Your Validation

Write tests for your validation logic:

```typescript
import { describe, it, expect } from 'vitest'

describe('Registration Validation', () => {
  it('validates correct registration data', () => {
    const validData = {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      age: 25,
      agreeToTerms: true,
    }

    const result = validateRegistration(validData)
    expect(result.isOk()).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const invalidData = {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'SecurePass123',
      confirmPassword: 'DifferentPass123',
      age: 25,
      agreeToTerms: true,
    }

    const result = validateRegistration(invalidData)
    expect(result.isErr()).toBe(true)

    const errors = extractFieldErrors(result.error.issues || [])
    expect(errors.confirmPassword).toBe("Passwords don't match")
  })
})
```

## Best Practices

1. **Define schemas upfront** - Clear validation rules improve UX
2. **Validate on blur** - Provide immediate feedback
3. **Show errors after touch** - Don't show errors on pristine fields
4. **Use descriptive messages** - Help users fix issues
5. **Handle async validation** - Show loading states for API checks
6. **Test edge cases** - Ensure validation catches all invalid inputs

## Next Steps

- Add internationalization to error messages
- Implement multi-step form validation
- Create custom validation components
- Add accessibility features

## Related Resources

- [How to Create Custom Validators](/docs/how-to/create-custom-validators.md)
- [@repo/validation API Reference](/packages/validation/docs/reference/api.md)
- [Validation Best Practices](/docs/explanation/validation-patterns.md)
