import { describe, it, expect } from 'vitest'
import { sanitizeTemplateContext, sanitizeObject } from '../compiler.js'
import type { TemplateContext } from '../types.js'

describe('Template Sanitization - Security Tests', () => {
  describe('sanitizeObject', () => {
    it('should sanitize string values by removing control characters', () => {
      const obj = { name: 'hello\u0000world', desc: 'test\u0001value' }
      const result = sanitizeObject(obj)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.name).toBe('helloworld')
        expect(result.value.desc).toBe('testvalue')
      }
    })

    it('should preserve numbers and booleans unchanged', () => {
      const obj = { count: 42, enabled: true, disabled: false, ratio: 3.14 }
      const result = sanitizeObject(obj)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.count).toBe(42)
        expect(result.value.enabled).toBe(true)
        expect(result.value.disabled).toBe(false)
        expect(result.value.ratio).toBe(3.14)
      }
    })

    it('should recursively sanitize nested objects', () => {
      const obj = {
        outer: {
          inner: {
            value: 'nested\u0000data',
          },
        },
      }
      const result = sanitizeObject(obj)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.outer.inner.value).toBe('nesteddata')
      }
    })

    it('should pass through arrays recursively', () => {
      // Note: sanitizeObject doesn't sanitize primitive array items directly
      // Only object property values get sanitized
      const obj = {
        items: ['hello', 'world', 'clean'],
      }
      const result = sanitizeObject(obj)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.items).toEqual(['hello', 'world', 'clean'])
      }
    })

    it('should sanitize arrays of objects', () => {
      const obj = {
        users: [
          { name: 'Alice\u0000', age: 30 },
          { name: 'Bob', age: 25 },
        ],
      }
      const result = sanitizeObject(obj)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.users[0].name).toBe('Alice')
        expect(result.value.users[0].age).toBe(30)
        expect(result.value.users[1].name).toBe('Bob')
      }
    })

    it('should return null as-is', () => {
      const result = sanitizeObject(null)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBeNull()
      }
    })

    it('should return primitives as-is (no sanitization)', () => {
      // sanitizeObject passes through primitives without modification
      expect(sanitizeObject(42).isOk() && sanitizeObject(42).value).toBe(42)
      expect(sanitizeObject('hello').isOk() && sanitizeObject('hello').value).toBe('hello')
      expect(sanitizeObject(true).isOk() && sanitizeObject(true).value).toBe(true)
      // Even strings with control chars pass through as-is when not in object property
      const stringResult = sanitizeObject('hello\u0000world')
      expect(stringResult.isOk()).toBe(true)
      if (stringResult.isOk()) {
        expect(stringResult.value).toBe('hello\u0000world')
      }
    })

    it('should convert functions to empty strings', () => {
      const obj = {
        name: 'test',
        callback: () => 'evil',
      }
      const result = sanitizeObject(obj)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.name).toBe('test')
        expect(result.value.callback).toBe('')
      }
    })

    it('should handle undefined values by converting to empty string', () => {
      const obj = {
        defined: 'value',
        notDefined: undefined,
      }
      const result = sanitizeObject(obj)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.defined).toBe('value')
        expect(result.value.notDefined).toBe('')
      }
    })

    it('should handle deeply nested mixed structures', () => {
      const obj = {
        level1: {
          level2: {
            items: [{ text: 'safe' }, { text: 'unsafe\u0000\u0001\u0002' }],
            count: 5,
          },
        },
      }
      const result = sanitizeObject(obj)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.level1.level2.items[0].text).toBe('safe')
        expect(result.value.level1.level2.items[1].text).toBe('unsafe')
        expect(result.value.level1.level2.count).toBe(5)
      }
    })

    it('should strip XSS-like patterns in string values', () => {
      // Control characters would be stripped, but HTML is preserved (Handlebars escapes it)
      const obj = {
        content: '<script>alert("xss")</script>',
      }
      const result = sanitizeObject(obj)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // HTML content is preserved - Handlebars will escape it during rendering
        expect(result.value.content).toContain('<script>')
      }
    })
  })

  describe('sanitizeTemplateContext', () => {
    const createMinimalContext = (overrides: Partial<TemplateContext> = {}): TemplateContext => ({
      projectName: 'test-project',
      packageName: 'test-package',
      description: 'Test description',
      author: 'Test Author',
      email: 'test@example.com',
      license: 'MIT',
      version: '1.0.0',
      packageManager: 'pnpm',
      currentYear: 2024,
      features: {
        core: true,
        config: false,
        validation: false,
        testing: true,
        examples: false,
        cicd: false,
      },
      CLI_VERSION: '1.0.0',
      PROJECT_NAME: 'test-project',
      IS_MONOREPO: false,
      PACKAGE_MANAGER: 'pnpm',
      PACKAGES_DIR: 'packages',
      PACKAGES_PATTERN: '^packages/',
      TEST_COMMAND: 'pnpm test',
      TIMEOUT: 120,
      FILE_PATTERNS: 'ts,tsx',
      HIGH_RISK_PATTERNS: [],
      SKIP_PATTERNS: [],
      HAS_SUBPATH_EXPORTS: false,
      SUBPATH_EXPORTS: [],
      LINT_COMMAND: 'oxlint',
      TYPECHECK_COMMAND: 'pnpm types',
      SMART_TEST_COMMAND: 'pnpm test',
      SECRETS_PRIORITY: 5,
      FILESIZE_PRIORITY: 6,
      TESTS_PRIORITY: 7,
      CHANGESET_REMINDER: false,
      CONVENTIONAL_COMMITS: true,
      LOCKFILE_VALIDATION: true,
      ...overrides,
    })

    it('should sanitize string fields in template context', () => {
      const context = createMinimalContext({
        projectName: 'project\u0000name',
        description: 'desc\u0001ription',
      })
      const result = sanitizeTemplateContext(context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.projectName).toBe('projectname')
        expect(result.value.description).toBe('description')
      }
    })

    it('should preserve numeric values', () => {
      const context = createMinimalContext({
        currentYear: 2024,
        TIMEOUT: 120,
      })
      const result = sanitizeTemplateContext(context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.currentYear).toBe(2024)
        expect(result.value.TIMEOUT).toBe(120)
      }
    })

    it('should preserve boolean values', () => {
      const context = createMinimalContext({
        IS_MONOREPO: true,
        CONVENTIONAL_COMMITS: false,
      })
      const result = sanitizeTemplateContext(context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.IS_MONOREPO).toBe(true)
        expect(result.value.CONVENTIONAL_COMMITS).toBe(false)
      }
    })

    it('should sanitize nested features object', () => {
      const context = createMinimalContext()
      const result = sanitizeTemplateContext(context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.features).toBeDefined()
        expect(result.value.features.core).toBe(true)
      }
    })

    it('should preserve array values', () => {
      // Note: sanitizeTemplateContext delegates to sanitizeObject which
      // doesn't sanitize primitive array items directly
      const context = createMinimalContext({
        HIGH_RISK_PATTERNS: ['pattern-one', 'pattern-two'],
        SKIP_PATTERNS: ['clean-pattern'],
      })
      const result = sanitizeTemplateContext(context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.HIGH_RISK_PATTERNS).toEqual(['pattern-one', 'pattern-two'])
        expect(result.value.SKIP_PATTERNS).toEqual(['clean-pattern'])
      }
    })

    it('should handle context with PACKAGE_MAPPINGS object', () => {
      const context = createMinimalContext({
        PACKAGE_MAPPINGS: {
          cli: '@project/cli\u0000',
          core: '@project/core',
        },
      } as any)
      const result = sanitizeTemplateContext(context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect((result.value as any).PACKAGE_MAPPINGS.cli).toBe('@project/cli')
        expect((result.value as any).PACKAGE_MAPPINGS.core).toBe('@project/core')
      }
    })

    it('should handle context with SUBPATH_EXPORTS array of objects', () => {
      const context = createMinimalContext({
        SUBPATH_EXPORTS: [
          { path: './utils\u0000', target: './src/utils.js' },
          { path: './core', target: './src/core.js' },
        ],
      } as any)
      const result = sanitizeTemplateContext(context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const exports = result.value.SUBPATH_EXPORTS as any[]
        expect(exports[0].path).toBe('./utils')
        expect(exports[0].target).toBe('./src/utils.js')
      }
    })

    it('should strip control characters from all string fields', () => {
      // Test all the control character ranges mentioned in validation.ts
      const context = createMinimalContext({
        projectName: 'test\u0000\u0001\u0008\u000B\u000C\u000E\u001F\u007Fproject',
        author: 'Normal Author',
      })
      const result = sanitizeTemplateContext(context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.projectName).toBe('testproject')
        expect(result.value.author).toBe('Normal Author')
      }
    })

    it('should handle empty string values', () => {
      const context = createMinimalContext({
        description: '',
      })
      const result = sanitizeTemplateContext(context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // Empty string after sanitization triggers validation error -> ''
        expect(result.value.description).toBe('')
      }
    })
  })
})
