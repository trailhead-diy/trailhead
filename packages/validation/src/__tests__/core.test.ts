import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validateUrl,
  validatePhoneNumber,
  validateStringLength,
  validateNumberRange,
  validateRequired,
  validateCurrency,
  validateDate,
  validateArray,
  validateObject,
  composeValidators,
  anyOf,
  allOf,
  createValidator,
  createSchemaValidator,
} from '../core.js'
import { z } from 'zod'

describe('Validation Core Operations', () => {
  describe('createValidator', () => {
    it('should create validator from Zod schema', () => {
      const stringValidator = createValidator(z.string())

      const result1 = stringValidator('hello')
      expect(result1.isOk()).toBe(true)
      if (result1.isOk()) {
        expect(result1.value).toBe('hello')
      }

      const result2 = stringValidator(123)
      expect(result2.isErr()).toBe(true)
      if (result2.isErr()) {
        expect(result2.error.type).toBe('VALIDATION_ERROR')
      }
    })
  })

  describe('createSchemaValidator', () => {
    it('should create schema validator object', () => {
      const emailSchema = z.string().email()
      const emailValidator = createSchemaValidator(emailSchema)

      expect(emailValidator.schema).toBe(emailSchema)
      expect(typeof emailValidator.validate).toBe('function')

      const result = emailValidator.validate('test@example.com')
      expect(result.isOk()).toBe(true)
    })
  })

  describe('validateEmail', () => {
    const emailValidator = validateEmail()

    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.com',
        'test123@test-domain.com',
      ]

      validEmails.forEach((email) => {
        const result = emailValidator(email)
        expect(result.isOk()).toBe(true)
        if (result.isOk()) {
          expect(result.value).toBe(email)
        }
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        '   ',
        'invalid',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
      ]

      invalidEmails.forEach((email) => {
        const result = emailValidator(email)
        expect(result.isErr()).toBe(true)
        if (result.isErr()) {
          expect(result.error.type).toBe('VALIDATION_ERROR')
        }
      })
    })

    it('should handle empty strings', () => {
      const result = emailValidator('')
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Email is required')
      }
    })
  })

  describe('validateUrl', () => {
    const urlValidator = validateUrl()

    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://test.org',
        'https://www.domain.co.uk/path?query=value',
        'ftp://files.example.com',
      ]

      validUrls.forEach((url) => {
        const result = urlValidator(url)
        expect(result.isOk()).toBe(true)
        if (result.isOk()) {
          expect(result.value).toBe(url)
        }
      })
    })

    it('should reject invalid URLs', () => {
      const invalidUrls = ['', '   ', 'not-a-url', 'example.com', 'ht tp://invalid.com', 'https://']

      invalidUrls.forEach((url) => {
        const result = urlValidator(url)
        expect(result.isErr()).toBe(true)
        if (result.isErr()) {
          expect(result.error.type).toBe('VALIDATION_ERROR')
        }
      })
    })
  })

  describe('validatePhoneNumber', () => {
    const phoneValidator = validatePhoneNumber()

    it('should validate correct phone numbers', () => {
      const validPhones = [
        '1234567890',
        '(123) 456-7890',
        '123-456-7890',
        '123.456.7890',
        '(123)456-7890',
      ]

      validPhones.forEach((phone) => {
        const result = phoneValidator(phone)
        expect(result.isOk()).toBe(true)
        if (result.isOk()) {
          expect(result.value).toBe(phone)
        }
      })
    })

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '',
        '   ',
        '123',
        '12345',
        'abc-def-ghij',
        '123-456-78901',
        '(123) 456-78901',
      ]

      invalidPhones.forEach((phone) => {
        const result = phoneValidator(phone)
        expect(result.isErr()).toBe(true)
        if (result.isErr()) {
          expect(result.error.type).toBe('VALIDATION_ERROR')
        }
      })
    })
  })

  describe('validateStringLength', () => {
    it('should validate string with minimum length', () => {
      const validator = validateStringLength(5)

      const result1 = validator('hello')
      expect(result1.isOk()).toBe(true)

      const result2 = validator('hi')
      expect(result2.isErr()).toBe(true)
    })

    it('should validate string with min and max length', () => {
      const validator = validateStringLength(3, 10)

      const result1 = validator('hello')
      expect(result1.isOk()).toBe(true)

      const result2 = validator('hi')
      expect(result2.isErr()).toBe(true)

      const result3 = validator('this is too long')
      expect(result3.isErr()).toBe(true)
    })
  })

  describe('validateNumberRange', () => {
    it('should validate number with minimum', () => {
      const validator = validateNumberRange(0)

      const result1 = validator(5)
      expect(result1.isOk()).toBe(true)

      const result2 = validator(-1)
      expect(result2.isErr()).toBe(true)
    })

    it('should validate number with min and max', () => {
      const validator = validateNumberRange(0, 100)

      const result1 = validator(50)
      expect(result1.isOk()).toBe(true)

      const result2 = validator(-1)
      expect(result2.isErr()).toBe(true)

      const result3 = validator(101)
      expect(result3.isErr()).toBe(true)
    })
  })

  describe('validateRequired', () => {
    const requiredValidator = validateRequired()

    it('should accept valid values', () => {
      const validValues = ['hello', 123, true, [], {}]

      validValues.forEach((value) => {
        const result = requiredValidator(value)
        expect(result.isOk()).toBe(true)
        if (result.isOk()) {
          expect(result.value).toBe(value)
        }
      })
    })

    it('should reject null, undefined, and empty string', () => {
      const invalidValues = [null, undefined, '']

      invalidValues.forEach((value) => {
        const result = requiredValidator(value)
        expect(result.isErr()).toBe(true)
        if (result.isErr()) {
          expect(result.error.type).toBe('VALIDATION_ERROR')
        }
      })
    })
  })

  describe('validateCurrency', () => {
    const currencyValidator = validateCurrency()

    it('should validate valid currency amounts', () => {
      const validAmounts = [0, 10, 99.99, 100.5, 1234.12]

      validAmounts.forEach((amount) => {
        const result = currencyValidator(amount)
        expect(result.isOk()).toBe(true)
        if (result.isOk()) {
          expect(result.value).toBe(amount)
        }
      })
    })

    it('should reject invalid currency amounts', () => {
      const invalidAmounts = [-1, 99.999, 100.123]

      invalidAmounts.forEach((amount) => {
        const result = currencyValidator(amount)
        expect(result.isErr()).toBe(true)
        if (result.isErr()) {
          expect(result.error.type).toBe('VALIDATION_ERROR')
        }
      })
    })
  })

  describe('validateDate', () => {
    const dateValidator = validateDate()

    it('should validate valid date strings', () => {
      const validDates = ['2023-12-25', '2023-01-01T00:00:00Z', '2023-06-15T14:30:00.000Z']

      validDates.forEach((dateString) => {
        const result = dateValidator(dateString)
        expect(result.isOk()).toBe(true)
        if (result.isOk()) {
          expect(result.value).toBeInstanceOf(Date)
        }
      })
    })

    it('should reject invalid date strings', () => {
      const invalidDates = [
        '',
        '   ',
        'invalid-date',
        '2023/12/25',
        '25-12-2023',
        '2023-13-01',
        '2023-02-30',
      ]

      invalidDates.forEach((dateString) => {
        const result = dateValidator(dateString)
        expect(result.isErr()).toBe(true)
        if (result.isErr()) {
          expect(result.error.type).toBe('VALIDATION_ERROR')
        }
      })
    })
  })

  describe('validateArray', () => {
    it('should validate array of strings', () => {
      const stringValidator = validateStringLength(1, 10)
      const arrayValidator = validateArray(stringValidator)

      const result1 = arrayValidator(['hello', 'world'])
      expect(result1.isOk()).toBe(true)
      if (result1.isOk()) {
        expect(result1.value).toEqual(['hello', 'world'])
      }

      const result2 = arrayValidator(['', 'world'])
      expect(result2.isErr()).toBe(true)
      if (result2.isErr()) {
        expect(result2.error.message).toContain('Item at index 0')
      }
    })

    it('should validate array of numbers', () => {
      const numberValidator = validateNumberRange(0, 100)
      const arrayValidator = validateArray(numberValidator)

      const result1 = arrayValidator([10, 20, 30])
      expect(result1.isOk()).toBe(true)

      const result2 = arrayValidator([10, -5, 30])
      expect(result2.isErr()).toBe(true)
      if (result2.isErr()) {
        expect(result2.error.message).toContain('Item at index 1')
      }
    })
  })

  describe('validateObject', () => {
    it('should validate object with field validators', () => {
      const emailValidator = validateEmail()
      const ageValidator = validateNumberRange(0, 120)

      const objectValidator = validateObject({
        email: emailValidator,
        age: ageValidator,
      })

      const result1 = objectValidator({
        email: 'test@example.com',
        age: 25,
        extra: 'ignored',
      })
      expect(result1.isOk()).toBe(true)

      const result2 = objectValidator({
        email: 'invalid-email',
        age: 25,
      })
      expect(result2.isErr()).toBe(true)
      if (result2.isErr()) {
        expect(result2.error.message).toContain('Field email')
      }
    })
  })

  describe('composeValidators', () => {
    it('should compose two validators', () => {
      const stringValidator = validateRequired<string>()
      const lengthValidator = validateStringLength(5, 20)

      const composedValidator = composeValidators(stringValidator, lengthValidator)

      const result1 = composedValidator('hello world')
      expect(result1.isOk()).toBe(true)

      const result2 = composedValidator('hi')
      expect(result2.isErr()).toBe(true)

      const result3 = composedValidator('')
      expect(result3.isErr()).toBe(true)
    })
  })

  describe('anyOf', () => {
    it('should pass if any validator succeeds', () => {
      const emailValidator = validateEmail()
      const phoneValidator = validatePhoneNumber()

      const contactValidator = anyOf(emailValidator, phoneValidator)

      const result1 = contactValidator('test@example.com')
      expect(result1.isOk()).toBe(true)

      const result2 = contactValidator('1234567890')
      expect(result2.isOk()).toBe(true)

      const result3 = contactValidator('invalid')
      expect(result3.isErr()).toBe(true)
      if (result3.isErr()) {
        expect(result3.error.message).toContain('All validations failed')
      }
    })
  })

  describe('allOf', () => {
    it('should pass only if all validators succeed', () => {
      const requiredValidator = validateRequired<string>()
      const lengthValidator = validateStringLength(5, 20)

      const strictValidator = allOf(requiredValidator, lengthValidator)

      const result1 = strictValidator('hello world')
      expect(result1.isOk()).toBe(true)

      const result2 = strictValidator('hi')
      expect(result2.isErr()).toBe(true)

      const result3 = strictValidator('')
      expect(result3.isErr()).toBe(true)
    })
  })
})
