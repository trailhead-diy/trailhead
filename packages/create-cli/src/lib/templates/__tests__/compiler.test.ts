import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { join } from 'path'
import { tmpdir } from 'os'
import { mkdtemp, rm, writeFile, utimes } from 'fs/promises'
import {
  createTemplateCompilerContext,
  getCachedTemplate,
  cacheTemplate,
  clearTemplateCache,
  getTemplateCacheStats,
  cleanupTemplateCache,
  initializeHandlebarsHelpers,
  sanitizeTemplateContext,
  sanitizeObject,
} from '../compiler.js'
import Handlebars from 'handlebars'

describe('Template Compiler', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'template-compiler-test-'))
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('createTemplateCompilerContext', () => {
    it('should create context with default options', () => {
      const context = createTemplateCompilerContext()

      expect(context.options.enableCache).toBe(true)
      expect(context.options.maxCacheSize).toBe(100)
      expect(context.options.strict).toBe(true)
      expect(context.options.escapeHtml).toBe(true)
      expect(context.cache.entries.size).toBe(0)
      expect(context.cache.initialized).toBe(false)
    })

    it('should merge custom options with defaults', () => {
      const context = createTemplateCompilerContext({
        enableCache: false,
        maxCacheSize: 50,
      })

      expect(context.options.enableCache).toBe(false)
      expect(context.options.maxCacheSize).toBe(50)
      expect(context.options.strict).toBe(true) // Default
    })
  })

  describe('getCachedTemplate', () => {
    it('should return null when cache is disabled', async () => {
      const context = createTemplateCompilerContext({ enableCache: false })

      const result = await getCachedTemplate('/some/path.hbs', context)

      expect(result.isOk()).toBe(true)
      expect(result.value).toBeNull()
    })

    it('should return null for uncached template', async () => {
      const context = createTemplateCompilerContext()

      const result = await getCachedTemplate('/uncached/template.hbs', context)

      expect(result.isOk()).toBe(true)
      expect(result.value).toBeNull()
    })

    it('should return cached template when valid', async () => {
      // Create a real template file
      const templatePath = join(tempDir, 'cached-template.hbs')
      await writeFile(templatePath, 'Hello {{name}}!')

      const context = createTemplateCompilerContext()
      const template = Handlebars.compile('Hello {{name}}!')

      // Cache the template
      const cachedContext = await cacheTemplate(templatePath, template, context)

      // Retrieve from cache
      const result = await getCachedTemplate(templatePath, cachedContext)

      expect(result.isOk()).toBe(true)
      expect(result.value).toBeDefined()
      expect(typeof result.value).toBe('function')
    })

    it('should invalidate cache when file mtime changes', async () => {
      // Create a real template file
      const templatePath = join(tempDir, 'mtime-test.hbs')
      await writeFile(templatePath, 'Version 1')

      const context = createTemplateCompilerContext()
      const template = Handlebars.compile('Version 1')

      // Cache the template
      const cachedContext = await cacheTemplate(templatePath, template, context)

      // Verify it's cached
      const result1 = await getCachedTemplate(templatePath, cachedContext)
      expect(result1.isOk()).toBe(true)
      expect(result1.value).not.toBeNull()

      // Update the file (change mtime)
      const newTime = new Date(Date.now() + 1000)
      await utimes(templatePath, newTime, newTime)

      // Should invalidate cache due to mtime change
      const result2 = await getCachedTemplate(templatePath, cachedContext)
      expect(result2.isOk()).toBe(true)
      expect(result2.value).toBeNull() // Cache invalidated
    })

    it('should return null when cached file no longer exists', async () => {
      const templatePath = join(tempDir, 'deleted-template.hbs')
      await writeFile(templatePath, 'Will be deleted')

      const context = createTemplateCompilerContext()
      const template = Handlebars.compile('Will be deleted')
      const cachedContext = await cacheTemplate(templatePath, template, context)

      // Delete the file
      await rm(templatePath)

      // Should return null since file doesn't exist
      const result = await getCachedTemplate(templatePath, cachedContext)
      expect(result.isOk()).toBe(true)
      expect(result.value).toBeNull()
    })
  })

  describe('cacheTemplate', () => {
    it('should not cache when caching is disabled', async () => {
      const context = createTemplateCompilerContext({ enableCache: false })
      const template = Handlebars.compile('Test')
      const templatePath = join(tempDir, 'no-cache.hbs')
      await writeFile(templatePath, 'Test')

      const updatedContext = await cacheTemplate(templatePath, template, context)

      expect(updatedContext.cache.entries.size).toBe(0)
    })

    it('should cache template with mtime and hash', async () => {
      const templatePath = join(tempDir, 'to-cache.hbs')
      await writeFile(templatePath, 'Template content')

      const context = createTemplateCompilerContext()
      const template = Handlebars.compile('Template content')

      const updatedContext = await cacheTemplate(templatePath, template, context)

      expect(updatedContext.cache.entries.size).toBe(1)
      const entry = updatedContext.cache.entries.get(templatePath)
      expect(entry).toBeDefined()
      expect(entry!.mtime).toBeGreaterThan(0)
      expect(entry!.hash).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex
    })

    it('should evict oldest entry when cache is full', async () => {
      const context = createTemplateCompilerContext({ maxCacheSize: 2 })

      // Create 3 templates
      const paths = ['t1.hbs', 't2.hbs', 't3.hbs'].map((f) => join(tempDir, f))
      for (const p of paths) {
        await writeFile(p, `Template ${p}`)
      }

      let currentContext = context

      // Cache first 2
      currentContext = await cacheTemplate(paths[0], Handlebars.compile('1'), currentContext)
      currentContext = await cacheTemplate(paths[1], Handlebars.compile('2'), currentContext)
      expect(currentContext.cache.entries.size).toBe(2)

      // Cache 3rd (should evict first)
      currentContext = await cacheTemplate(paths[2], Handlebars.compile('3'), currentContext)
      expect(currentContext.cache.entries.size).toBe(2)
      expect(currentContext.cache.entries.has(paths[0])).toBe(false)
      expect(currentContext.cache.entries.has(paths[2])).toBe(true)
    })
  })

  describe('clearTemplateCache', () => {
    it('should clear all cache entries', async () => {
      const templatePath = join(tempDir, 'clear-test.hbs')
      await writeFile(templatePath, 'Content')

      let context = createTemplateCompilerContext()
      context = await cacheTemplate(templatePath, Handlebars.compile('Content'), context)
      expect(context.cache.entries.size).toBe(1)

      const clearedContext = clearTemplateCache(context)

      expect(clearedContext.cache.entries.size).toBe(0)
      expect(clearedContext.options).toEqual(context.options) // Options preserved
    })
  })

  describe('getTemplateCacheStats', () => {
    it('should return cache statistics', async () => {
      const paths = ['stat1.hbs', 'stat2.hbs'].map((f) => join(tempDir, f))
      for (const p of paths) {
        await writeFile(p, `Content ${p}`)
      }

      let context = createTemplateCompilerContext()
      for (const p of paths) {
        context = await cacheTemplate(p, Handlebars.compile('Content'), context)
      }

      const stats = getTemplateCacheStats(context)

      expect(stats.size).toBe(2)
      expect(stats.entries).toContain(paths[0])
      expect(stats.entries).toContain(paths[1])
    })
  })

  describe('cleanupTemplateCache', () => {
    it('should keep only specified number of entries', async () => {
      const paths = ['c1.hbs', 'c2.hbs', 'c3.hbs', 'c4.hbs'].map((f) => join(tempDir, f))
      for (const p of paths) {
        await writeFile(p, `Content ${p}`)
      }

      let context = createTemplateCompilerContext({ maxCacheSize: 10 })
      for (const p of paths) {
        context = await cacheTemplate(p, Handlebars.compile('Content'), context)
      }
      expect(context.cache.entries.size).toBe(4)

      const cleanedContext = cleanupTemplateCache(context, 2)

      expect(cleanedContext.cache.entries.size).toBe(2)
      // Should keep the last 2 entries
      expect(cleanedContext.cache.entries.has(paths[2])).toBe(true)
      expect(cleanedContext.cache.entries.has(paths[3])).toBe(true)
    })

    it('should not modify cache if under limit', async () => {
      let context = createTemplateCompilerContext()
      const templatePath = join(tempDir, 'no-cleanup.hbs')
      await writeFile(templatePath, 'Content')
      context = await cacheTemplate(templatePath, Handlebars.compile('Content'), context)

      const cleanedContext = cleanupTemplateCache(context, 10)

      expect(cleanedContext.cache.entries.size).toBe(1)
    })
  })

  describe('initializeHandlebarsHelpers', () => {
    it('should mark context as initialized', () => {
      const context = createTemplateCompilerContext()
      expect(context.cache.initialized).toBe(false)

      const initializedContext = initializeHandlebarsHelpers(context)

      expect(initializedContext.cache.initialized).toBe(true)
    })

    it('should not reinitialize if already initialized', () => {
      const context = createTemplateCompilerContext()
      const initializedContext = initializeHandlebarsHelpers(context)
      const reinitializedContext = initializeHandlebarsHelpers(initializedContext)

      expect(reinitializedContext).toBe(initializedContext)
    })
  })

  describe('sanitizeTemplateContext', () => {
    it('should sanitize string values', () => {
      const context = { name: 'test-project', version: '1.0.0' }

      const result = sanitizeTemplateContext(context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.name).toBe('test-project')
        expect(result.value.version).toBe('1.0.0')
      }
    })

    it('should preserve numbers and booleans', () => {
      const context = { count: 42, enabled: true, ratio: 3.14 }

      const result = sanitizeTemplateContext(context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.count).toBe(42)
        expect(result.value.enabled).toBe(true)
        expect(result.value.ratio).toBe(3.14)
      }
    })

    it('should handle nested objects', () => {
      const context = {
        project: {
          name: 'nested-test',
          config: {
            debug: true,
          },
        },
      }

      const result = sanitizeTemplateContext(context)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.project.name).toBe('nested-test')
        expect(result.value.project.config.debug).toBe(true)
      }
    })
  })

  describe('sanitizeObject', () => {
    it('should handle null and primitives', () => {
      expect(sanitizeObject(null).value).toBeNull()
      expect(sanitizeObject(42).value).toBe(42)
      expect(sanitizeObject(true).value).toBe(true)
    })

    it('should sanitize arrays', () => {
      const result = sanitizeObject(['item1', 'item2'])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(['item1', 'item2'])
      }
    })

    it('should sanitize nested arrays', () => {
      const result = sanitizeObject([{ name: 'first' }, { name: 'second' }])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value[0].name).toBe('first')
        expect(result.value[1].name).toBe('second')
      }
    })
  })
})
