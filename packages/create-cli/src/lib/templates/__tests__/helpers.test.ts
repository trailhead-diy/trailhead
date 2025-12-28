import { describe, it, expect, beforeAll } from 'vitest'
import Handlebars from 'handlebars'
import { createTemplateCompilerContext, initializeHandlebarsHelpers } from '../compiler.js'

describe('Handlebars Helpers', () => {
  beforeAll(() => {
    // Initialize helpers before tests
    const context = createTemplateCompilerContext()
    initializeHandlebarsHelpers(context)
  })

  describe('Comparison Helpers', () => {
    describe('eq', () => {
      it('should return true for equal values', () => {
        const template = Handlebars.compile('{{#if (eq a b)}}equal{{else}}not equal{{/if}}')
        expect(template({ a: 1, b: 1 })).toBe('equal')
        expect(template({ a: 'test', b: 'test' })).toBe('equal')
      })

      it('should return false for unequal values', () => {
        const template = Handlebars.compile('{{#if (eq a b)}}equal{{else}}not equal{{/if}}')
        expect(template({ a: 1, b: 2 })).toBe('not equal')
        expect(template({ a: 'foo', b: 'bar' })).toBe('not equal')
      })

      it('should use strict equality', () => {
        const template = Handlebars.compile('{{#if (eq a b)}}equal{{else}}not equal{{/if}}')
        expect(template({ a: 1, b: '1' })).toBe('not equal')
      })
    })

    describe('ne', () => {
      it('should return true for unequal values', () => {
        const template = Handlebars.compile('{{#if (ne a b)}}not equal{{else}}equal{{/if}}')
        expect(template({ a: 1, b: 2 })).toBe('not equal')
      })

      it('should return false for equal values', () => {
        const template = Handlebars.compile('{{#if (ne a b)}}not equal{{else}}equal{{/if}}')
        expect(template({ a: 1, b: 1 })).toBe('equal')
      })
    })

    describe('gt', () => {
      it('should return true when a > b', () => {
        const template = Handlebars.compile('{{#if (gt a b)}}greater{{else}}not greater{{/if}}')
        expect(template({ a: 5, b: 3 })).toBe('greater')
      })

      it('should return false when a <= b', () => {
        const template = Handlebars.compile('{{#if (gt a b)}}greater{{else}}not greater{{/if}}')
        expect(template({ a: 3, b: 5 })).toBe('not greater')
        expect(template({ a: 5, b: 5 })).toBe('not greater')
      })
    })

    describe('lt', () => {
      it('should return true when a < b', () => {
        const template = Handlebars.compile('{{#if (lt a b)}}less{{else}}not less{{/if}}')
        expect(template({ a: 3, b: 5 })).toBe('less')
      })

      it('should return false when a >= b', () => {
        const template = Handlebars.compile('{{#if (lt a b)}}less{{else}}not less{{/if}}')
        expect(template({ a: 5, b: 3 })).toBe('not less')
        expect(template({ a: 5, b: 5 })).toBe('not less')
      })
    })

    describe('includes', () => {
      it('should return true when array includes value', () => {
        const template = Handlebars.compile(
          '{{#if (includes arr val)}}found{{else}}not found{{/if}}'
        )
        expect(template({ arr: [1, 2, 3], val: 2 })).toBe('found')
        expect(template({ arr: ['a', 'b', 'c'], val: 'b' })).toBe('found')
      })

      it('should return false when array does not include value', () => {
        const template = Handlebars.compile(
          '{{#if (includes arr val)}}found{{else}}not found{{/if}}'
        )
        expect(template({ arr: [1, 2, 3], val: 5 })).toBe('not found')
      })

      it('should return false for non-array input', () => {
        const template = Handlebars.compile(
          '{{#if (includes arr val)}}found{{else}}not found{{/if}}'
        )
        expect(template({ arr: 'string', val: 's' })).toBe('not found')
      })
    })
  })

  describe('String Transformation Helpers', () => {
    describe('uppercase', () => {
      it('should convert string to uppercase', () => {
        const template = Handlebars.compile('{{uppercase name}}')
        expect(template({ name: 'hello' })).toBe('HELLO')
        expect(template({ name: 'Hello World' })).toBe('HELLO WORLD')
      })

      it('should return non-string values unchanged', () => {
        const template = Handlebars.compile('{{uppercase value}}')
        expect(template({ value: 123 })).toBe('123')
      })
    })

    describe('lowercase', () => {
      it('should convert string to lowercase', () => {
        const template = Handlebars.compile('{{lowercase name}}')
        expect(template({ name: 'HELLO' })).toBe('hello')
        expect(template({ name: 'Hello World' })).toBe('hello world')
      })

      it('should return non-string values unchanged', () => {
        const template = Handlebars.compile('{{lowercase value}}')
        expect(template({ value: 123 })).toBe('123')
      })
    })

    describe('capitalize', () => {
      it('should capitalize first letter', () => {
        const template = Handlebars.compile('{{capitalize name}}')
        expect(template({ name: 'hello' })).toBe('Hello')
        expect(template({ name: 'hello world' })).toBe('Hello world')
      })

      it('should return non-string values unchanged', () => {
        const template = Handlebars.compile('{{capitalize value}}')
        expect(template({ value: 123 })).toBe('123')
      })
    })

    describe('kebab', () => {
      it('should convert camelCase to kebab-case', () => {
        const template = Handlebars.compile('{{kebab name}}')
        expect(template({ name: 'myProjectName' })).toBe('my-project-name')
        // HelloWorld -> hello-world (leading dash stripped if starts with capital)
        expect(template({ name: 'HelloWorld' })).toBe('hello-world')
      })

      it('should handle already kebab-case strings', () => {
        const template = Handlebars.compile('{{kebab name}}')
        expect(template({ name: 'already-kebab' })).toBe('already-kebab')
      })

      it('should return non-string values unchanged', () => {
        const template = Handlebars.compile('{{kebab value}}')
        expect(template({ value: 123 })).toBe('123')
      })
    })

    describe('pascal', () => {
      it('should convert to PascalCase', () => {
        const template = Handlebars.compile('{{pascal name}}')
        expect(template({ name: 'my-project' })).toBe('MyProject')
        expect(template({ name: 'hello_world' })).toBe('HelloWorld')
        expect(template({ name: 'hello world' })).toBe('HelloWorld')
      })

      it('should return non-string values unchanged', () => {
        const template = Handlebars.compile('{{pascal value}}')
        expect(template({ value: 123 })).toBe('123')
      })
    })

    describe('camel', () => {
      it('should convert to camelCase', () => {
        const template = Handlebars.compile('{{camel name}}')
        expect(template({ name: 'my-project' })).toBe('myProject')
        expect(template({ name: 'hello_world' })).toBe('helloWorld')
        expect(template({ name: 'Hello World' })).toBe('helloWorld')
      })

      it('should return non-string values unchanged', () => {
        const template = Handlebars.compile('{{camel value}}')
        expect(template({ value: 123 })).toBe('123')
      })
    })
  })

  describe('Utility Helpers', () => {
    describe('json', () => {
      it('should stringify objects', () => {
        const template = Handlebars.compile('{{{json data}}}')
        const result = template({ data: { name: 'test', value: 42 } })
        expect(JSON.parse(result)).toEqual({ name: 'test', value: 42 })
      })

      it('should handle arrays', () => {
        const template = Handlebars.compile('{{{json arr}}}')
        const result = template({ arr: [1, 2, 3] })
        expect(JSON.parse(result)).toEqual([1, 2, 3])
      })

      it('should handle undefined gracefully', () => {
        const template = Handlebars.compile('{{{json data}}}')
        // undefined gets sanitized to empty string/object depending on context
        const result = template({ data: undefined })
        // Empty string is valid output for undefined values
        expect(result === '' || result === '{}').toBe(true)
      })
    })

    describe('date', () => {
      it('should return ISO date string with iso format', () => {
        const template = Handlebars.compile('{{date "iso"}}')
        const result = template({})
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      })

      it('should return year with year format', () => {
        const template = Handlebars.compile('{{date "year"}}')
        const result = template({})
        const currentYear = new Date().getFullYear().toString()
        expect(result).toBe(currentYear)
      })

      it('should return locale date string with no format', () => {
        const template = Handlebars.compile('{{date}}')
        const result = template({})
        // Should be a valid date string (not empty)
        expect(result.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Control Flow Helpers', () => {
    describe('if-eq', () => {
      it('should render fn block when values are equal', () => {
        const template = Handlebars.compile(
          '{{#if-eq status "active"}}Active{{else}}Inactive{{/if-eq}}'
        )
        expect(template({ status: 'active' })).toBe('Active')
      })

      it('should render inverse block when values are not equal', () => {
        const template = Handlebars.compile(
          '{{#if-eq status "active"}}Active{{else}}Inactive{{/if-eq}}'
        )
        expect(template({ status: 'pending' })).toBe('Inactive')
      })
    })

    describe('if-any', () => {
      it('should render fn block when any condition is truthy', () => {
        const template = Handlebars.compile('{{#if-any a b c}}at least one{{else}}none{{/if-any}}')
        expect(template({ a: false, b: true, c: false })).toBe('at least one')
        expect(template({ a: true, b: true, c: true })).toBe('at least one')
      })

      it('should render inverse block when all conditions are falsy', () => {
        const template = Handlebars.compile('{{#if-any a b c}}at least one{{else}}none{{/if-any}}')
        expect(template({ a: false, b: false, c: false })).toBe('none')
        expect(template({ a: 0, b: '', c: null })).toBe('none')
      })
    })

    describe('each-with-index', () => {
      it('should iterate with index', () => {
        const template = Handlebars.compile(
          '{{#each-with-index items}}{{index}}: {{name}}\n{{/each-with-index}}'
        )
        const result = template({
          items: [{ name: 'first' }, { name: 'second' }, { name: 'third' }],
        })
        expect(result).toBe('0: first\n1: second\n2: third\n')
      })

      it('should provide isFirst and isLast flags', () => {
        const template = Handlebars.compile(
          '{{#each-with-index items}}{{#if isFirst}}FIRST{{/if}}{{#if isLast}}LAST{{/if}}{{name}}|{{/each-with-index}}'
        )
        const result = template({
          items: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
        })
        expect(result).toBe('FIRSTa|b|LASTc|')
      })

      it('should return empty string for non-array input', () => {
        const template = Handlebars.compile(
          '{{#each-with-index items}}item{{else}}no items{{/each-with-index}}'
        )
        expect(template({ items: 'not an array' })).toBe('no items')
        expect(template({ items: {} })).toBe('no items')
      })

      it('should handle empty array', () => {
        const template = Handlebars.compile('{{#each-with-index items}}item{{/each-with-index}}')
        expect(template({ items: [] })).toBe('')
      })
    })
  })

  describe('Helper Initialization', () => {
    it('should not reinitialize helpers if already initialized', () => {
      const context = createTemplateCompilerContext()
      const initializedContext = initializeHandlebarsHelpers(context)
      expect(initializedContext.cache.initialized).toBe(true)

      // Second call should return same context state
      const secondContext = initializeHandlebarsHelpers(initializedContext)
      expect(secondContext).toBe(initializedContext)
    })
  })
})
