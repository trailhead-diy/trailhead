import { fs } from '@esteban-url/fs'
import { createHash } from 'crypto'
import Handlebars from 'handlebars'
import { ok, err } from '@esteban-url/core'
import type { Result, CoreError } from '@esteban-url/core'
import { sanitizeText } from '../config/validation.js'
import type { TemplateContext } from './types.js'
import { createTemplateCompilerError, ERROR_CODES } from '../core/errors.js'

/**
 * Cache entry structure for compiled Handlebars templates
 *
 * @internal
 */
export interface TemplateCacheEntry {
  /** Compiled Handlebars template function */
  readonly template: HandlebarsTemplateDelegate
  /** File modification time for cache invalidation */
  readonly mtime: number
  /** SHA-256 hash of template content for integrity verification */
  readonly hash: string
}

/**
 * Template cache state
 *
 * @internal
 */
export interface TemplateCacheState {
  readonly entries: Map<string, TemplateCacheEntry>
  readonly initialized: boolean
}

/**
 * Template compilation options
 */
export interface TemplateCompilerOptions {
  /** Enable template caching */
  readonly enableCache?: boolean
  /** Maximum cache entries */
  readonly maxCacheSize?: number
  /** Enable strict mode */
  readonly strict?: boolean
  /** Enable HTML escaping */
  readonly escapeHtml?: boolean
}

/**
 * Template compiler context
 */
export interface TemplateCompilerContext {
  readonly cache: TemplateCacheState
  readonly options: Required<TemplateCompilerOptions>
}

/**
 * Default template compiler options
 */
const DEFAULT_COMPILER_OPTIONS: Required<TemplateCompilerOptions> = {
  enableCache: true,
  maxCacheSize: 100,
  strict: true,
  escapeHtml: true,
}

/**
 * Create a new template compiler context with specified options
 *
 * @param options - Template compiler configuration options
 * @returns Template compiler context
 *
 * @example
 * ```typescript
 * const compilerContext = createTemplateCompilerContext({
 *   enableCache: true,
 *   maxCacheSize: 50,
 *   strict: true
 * })
 * ```
 */
export function createTemplateCompilerContext(
  options: TemplateCompilerOptions = {}
): TemplateCompilerContext {
  return {
    cache: {
      entries: new Map(),
      initialized: false,
    },
    options: {
      ...DEFAULT_COMPILER_OPTIONS,
      ...options,
    },
  }
}

/**
 * Initialize custom Handlebars helpers for enhanced template functionality
 *
 * Registers a comprehensive set of helpers for common template operations:
 * - Comparison helpers (eq, ne, gt, lt, includes)
 * - String transformation helpers (uppercase, lowercase, capitalize, kebab, pascal, camel)
 * - Utility helpers (json, date)
 * - Control flow helpers (if-eq, if-any, each-with-index)
 *
 * These helpers extend Handlebars' built-in functionality to support
 * complex template logic without requiring external preprocessing.
 *
 * Helper categories:
 * - **Comparison**: eq, ne, gt, lt, includes
 * - **String manipulation**: uppercase, lowercase, capitalize, kebab, pascal, camel
 * - **Data formatting**: json, date
 * - **Control flow**: if-eq, if-any, each-with-index
 *
 * @param context - Template compiler context
 * @returns Updated context with initialized helpers
 *
 * @see {@link https://handlebarsjs.com/guide/builtin-helpers.html} for built-in helpers
 */
export function initializeHandlebarsHelpers(
  context: TemplateCompilerContext
): TemplateCompilerContext {
  if (context.cache.initialized) {
    return context
  }

  // Equality helper for conditional rendering
  Handlebars.registerHelper('eq', (a: any, b: any) => a === b)

  // Not equal helper
  Handlebars.registerHelper('ne', (a: any, b: any) => a !== b)

  // Greater than helper
  Handlebars.registerHelper('gt', (a: number, b: number) => a > b)

  // Less than helper
  Handlebars.registerHelper('lt', (a: number, b: number) => a < b)

  // Array includes helper
  Handlebars.registerHelper(
    'includes',
    (array: any[], value: any) => Array.isArray(array) && array.includes(value)
  )

  // String helper for text manipulation with sanitization
  Handlebars.registerHelper('uppercase', (str: string) => {
    if (typeof str !== 'string') return str
    const sanitized = sanitizeText(str)
    return sanitized.isOk() ? sanitized.value.toUpperCase() : str
  })

  Handlebars.registerHelper('lowercase', (str: string) => {
    if (typeof str !== 'string') return str
    const sanitized = sanitizeText(str)
    return sanitized.isOk() ? sanitized.value.toLowerCase() : str
  })

  Handlebars.registerHelper('capitalize', (str: string) => {
    if (typeof str !== 'string') return str
    const sanitized = sanitizeText(str)
    if (!sanitized.isOk()) return str
    const clean = sanitized.value
    return clean.charAt(0).toUpperCase() + clean.slice(1)
  })

  // Kebab case helper with sanitization
  Handlebars.registerHelper('kebab', (str: string) => {
    if (typeof str !== 'string') return str
    const sanitized = sanitizeText(str)
    if (!sanitized.isOk()) return str
    return sanitized.value.replace(/[A-Z]/g, '-$&').toLowerCase().replace(/^-/, '')
  })

  // Pascal case helper with sanitization
  Handlebars.registerHelper('pascal', (str: string) => {
    if (typeof str !== 'string') return str
    const sanitized = sanitizeText(str)
    if (!sanitized.isOk()) return str
    return sanitized.value
      .split(/[-_\s]+/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  })

  // Camel case helper with sanitization
  Handlebars.registerHelper('camel', (str: string) => {
    if (typeof str !== 'string') return str
    const sanitized = sanitizeText(str)
    if (!sanitized.isOk()) return str
    const pascal = sanitized.value
      .split(/[-_\s]+/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
  })

  // JSON helper for safe JSON output
  Handlebars.registerHelper('json', (obj: any) => {
    try {
      // Sanitize object properties to prevent injection
      const sanitizeResult = sanitizeObject(obj)
      const safeObj = sanitizeResult.isOk() ? sanitizeResult.value : {}
      return JSON.stringify(safeObj, null, 2)
    } catch {
      return '{}'
    }
  })

  // Date helper
  Handlebars.registerHelper('date', (format?: string) => {
    const now = new Date()
    if (format === 'iso') {
      return now.toISOString()
    } else if (format === 'year') {
      return now.getFullYear().toString()
    }
    return now.toLocaleDateString()
  })

  // Conditional block helper
  Handlebars.registerHelper('if-eq', function (this: any, a: any, b: any, options: any) {
    if (a === b) {
      return options.fn(this)
    } else {
      return options.inverse(this)
    }
  })

  // Multiple condition helper
  Handlebars.registerHelper('if-any', function (this: any, ...args: any[]) {
    const options = args.pop()
    const conditions = args

    if (conditions.some(Boolean)) {
      return options.fn(this)
    } else {
      return options.inverse(this)
    }
  })

  // Array iteration with index
  Handlebars.registerHelper('each-with-index', function (this: any, array: any[], options: any) {
    if (!Array.isArray(array)) return options.inverse(this)

    let result = ''
    for (let i = 0; i < array.length; i++) {
      result += options.fn({
        ...array[i],
        index: i,
        isFirst: i === 0,
        isLast: i === array.length - 1,
      })
    }
    return result
  })

  return {
    ...context,
    cache: {
      ...context.cache,
      initialized: true,
    },
  }
}

/**
 * Compile and render a Handlebars template with intelligent caching
 *
 * This function provides optimized template compilation with:
 * - Automatic cache lookup based on file path and modification time
 * - On-demand compilation for cache misses
 * - Cache invalidation when template files are modified
 * - Performance optimization through template reuse
 *
 * @param templatePath - Absolute path to the Handlebars template file (.hbs)
 * @param templateContext - Template context object containing variables for interpolation
 * @param compilerContext - Template compiler context with cache and options
 * @returns Promise resolving to Result with rendered template string or error
 *
 * @example
 * ```typescript
 * const compilerContext = createTemplateCompilerContext()
 * const result = await compileTemplate('/templates/package.json.hbs', {
 *   projectName: 'my-project',
 *   version: '1.0.0',
 *   dependencies: ['express', 'chalk']
 * }, compilerContext)
 *
 * if (result.isOk()) {
 *   console.log(result.value)
 * }
 * ```
 *
 * Cache behavior:
 * - Cache hit: Returns cached template result immediately
 * - Cache miss: Compiles template, caches result, returns rendered content
 * - File modified: Invalidates cache entry and recompiles
 */
export async function compileTemplate(
  templatePath: string,
  templateContext: TemplateContext,
  compilerContext: TemplateCompilerContext = createTemplateCompilerContext()
): Promise<Result<string, CoreError>> {
  try {
    // Initialize helpers if not already done
    const initializedContext = initializeHandlebarsHelpers(compilerContext)

    // Try to get cached template
    const cachedResult = await getCachedTemplate(templatePath, initializedContext)
    if (cachedResult.isOk() && cachedResult.value) {
      const sanitizedContext = sanitizeTemplateContext(templateContext)
      if (sanitizedContext.isErr()) {
        return err(
          createTemplateCompilerError(
            ERROR_CODES.CONTEXT_SANITIZATION_FAILED,
            `Context sanitization failed: ${sanitizedContext.error.message}`,
            {
              operation: 'compileTemplate',
              context: { templatePath },
              cause: sanitizedContext.error,
              recoverable: false,
            }
          )
        )
      }
      return ok(cachedResult.value(sanitizedContext.value))
    }

    // Read template file
    const contentResult = await fs.readFile(templatePath)
    if (contentResult.isErr()) {
      return err(
        createTemplateCompilerError(
          ERROR_CODES.TEMPLATE_READ_FAILED,
          `Failed to read template file: ${contentResult.error.message}`,
          {
            operation: 'compileTemplate',
            context: { templatePath },
            cause: contentResult.error,
            recoverable: false,
          }
        )
      )
    }

    // Sanitize template context
    const sanitizedContext = sanitizeTemplateContext(templateContext)
    if (sanitizedContext.isErr()) {
      return err(
        createTemplateCompilerError(
          ERROR_CODES.CONTEXT_SANITIZATION_FAILED,
          `Context sanitization failed: ${sanitizedContext.error.message}`,
          {
            operation: 'compileTemplate',
            context: { templatePath },
            cause: sanitizedContext.error,
            recoverable: false,
          }
        )
      )
    }

    // Compile template
    const template = Handlebars.compile(contentResult.value, {
      noEscape: !initializedContext.options.escapeHtml,
      strict: initializedContext.options.strict,
      assumeObjects: false,
      preventIndent: false,
      ignoreStandalone: true,
      explicitPartialContext: true,
    })

    // Cache the compiled template
    await cacheTemplate(templatePath, template, initializedContext)

    // Render template
    const rendered = template(sanitizedContext.value)
    return ok(rendered)
  } catch (error) {
    return err(
      createTemplateCompilerError(
        ERROR_CODES.TEMPLATE_COMPILE_FAILED,
        `Template compilation failed: ${error instanceof Error ? error.message : String(error)}`,
        {
          operation: 'compileTemplate',
          context: { templatePath },
          cause: error instanceof Error ? error : undefined,
          recoverable: false,
        }
      )
    )
  }
}

/**
 * Get cached template if valid
 *
 * @param templatePath - Path to template file
 * @param context - Template compiler context
 * @returns Result with cached template or null if not cached/invalid
 */
export async function getCachedTemplate(
  templatePath: string,
  context: TemplateCompilerContext
): Promise<Result<HandlebarsTemplateDelegate | null, CoreError>> {
  if (!context.options.enableCache) {
    return ok(null)
  }

  const cached = context.cache.entries.get(templatePath)
  if (!cached) {
    return ok(null)
  }

  try {
    // Use node:fs/promises for stat since CLI filesystem doesn't expose it
    const { stat } = await import('node:fs/promises')
    const stats = await stat(templatePath)
    const currentMtime = stats.mtime.getTime()

    // Check if file has been modified
    if (currentMtime === cached.mtime) {
      return ok(cached.template)
    }

    // File modified, remove from cache
    context.cache.entries.delete(templatePath)
    return ok(null)
  } catch {
    // File doesn't exist or can't be accessed
    context.cache.entries.delete(templatePath)
    return ok(null)
  }
}

/**
 * Cache compiled template
 *
 * @param templatePath - Path to template file
 * @param template - Compiled Handlebars template
 * @param context - Template compiler context
 * @returns Updated template compiler context
 */
export async function cacheTemplate(
  templatePath: string,
  template: HandlebarsTemplateDelegate,
  context: TemplateCompilerContext
): Promise<TemplateCompilerContext> {
  if (!context.options.enableCache) {
    return context
  }

  try {
    // Use node:fs/promises for stat since CLI filesystem doesn't expose it
    const { stat } = await import('node:fs/promises')
    const stats = await stat(templatePath)

    const contentResult = await fs.readFile(templatePath)
    if (contentResult.isErr()) {
      return context // Can't cache if we can't read the file
    }

    const hash = createHash('sha256').update(contentResult.value).digest('hex')

    // Check cache size and cleanup if needed
    const updatedEntries = new Map(context.cache.entries)
    if (updatedEntries.size >= context.options.maxCacheSize) {
      const firstKey = updatedEntries.keys().next().value
      if (firstKey) {
        updatedEntries.delete(firstKey)
      }
    }

    updatedEntries.set(templatePath, {
      template,
      mtime: stats.mtime.getTime(),
      hash,
    })

    return {
      ...context,
      cache: {
        ...context.cache,
        entries: updatedEntries,
      },
    }
  } catch {
    // If we can't cache, just return unchanged context
    return context
  }
}

/**
 * Pre-compile multiple templates for better performance
 *
 * @param templatePaths - Array of template file paths to precompile
 * @param context - Template compiler context
 * @returns Result with updated context or error
 */
export async function precompileTemplates(
  templatePaths: string[],
  context: TemplateCompilerContext = createTemplateCompilerContext()
): Promise<Result<TemplateCompilerContext, CoreError>> {
  try {
    // Initialize helpers if not already done
    let currentContext = initializeHandlebarsHelpers(context)

    const results = await Promise.allSettled(
      templatePaths.map(async (templatePath) => {
        try {
          const contentResult = await fs.readFile(templatePath)
          if (contentResult.isErr()) {
            return null // Skip files that can't be read
          }

          const template = Handlebars.compile(contentResult.value, {
            noEscape: !currentContext.options.escapeHtml,
            strict: currentContext.options.strict,
            assumeObjects: false,
            preventIndent: false,
            ignoreStandalone: true,
            explicitPartialContext: true,
          })

          currentContext = await cacheTemplate(templatePath, template, currentContext)
          return templatePath
        } catch {
          return null // Skip files that can't be compiled
        }
      })
    )

    const _successful = results
      .filter(
        (result): result is PromiseFulfilledResult<string | null> =>
          result.status === 'fulfilled' && result.value !== null
      )
      .map((result) => result.value)

    return ok(currentContext)
  } catch (error) {
    return err(
      createTemplateCompilerError(
        ERROR_CODES.PRECOMPILE_FAILED,
        `Template precompilation failed: ${error instanceof Error ? error.message : String(error)}`,
        {
          operation: 'precompileTemplates',
          cause: error instanceof Error ? error : undefined,
          recoverable: true,
        }
      )
    )
  }
}

/**
 * Clear template cache
 *
 * @param context - Template compiler context
 * @returns Updated context with cleared cache
 */
export function clearTemplateCache(context: TemplateCompilerContext): TemplateCompilerContext {
  return {
    ...context,
    cache: {
      ...context.cache,
      entries: new Map(),
    },
  }
}

/**
 * Get cache statistics
 *
 * @param context - Template compiler context
 * @returns Cache statistics
 */
export function getTemplateCacheStats(context: TemplateCompilerContext): {
  size: number
  entries: string[]
} {
  return {
    size: context.cache.entries.size,
    entries: Array.from(context.cache.entries.keys()),
  }
}

/**
 * Cleanup old cache entries based on memory pressure
 *
 * @param context - Template compiler context
 * @param maxEntries - Maximum number of entries to keep
 * @returns Updated context with cleaned cache
 */
export function cleanupTemplateCache(
  context: TemplateCompilerContext,
  maxEntries: number = 100
): TemplateCompilerContext {
  if (context.cache.entries.size <= maxEntries) {
    return context
  }

  // Convert to array and keep only the last maxEntries
  const entries = Array.from(context.cache.entries.entries())
  const toKeep = entries.slice(-maxEntries)

  return {
    ...context,
    cache: {
      ...context.cache,
      entries: new Map(toKeep),
    },
  }
}

/**
 * Sanitize template context to prevent injection attacks
 *
 * @param context - Template context to sanitize
 * @returns Result with sanitized context or error
 */
export function sanitizeTemplateContext(
  context: TemplateContext
): Result<TemplateContext, CoreError> {
  try {
    const sanitized: any = {}

    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string') {
        const sanitizedValue = sanitizeText(value)
        sanitized[key] = sanitizedValue.isOk() ? sanitizedValue.value : ''
      } else if (typeof value === 'object' && value !== null) {
        const sanitizedObject = sanitizeObject(value)
        if (sanitizedObject.isErr()) {
          return sanitizedObject
        }
        sanitized[key] = sanitizedObject.value
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value
      } else {
        // Skip functions, undefined, null, symbols, etc.
        sanitized[key] = ''
      }
    }

    return ok(sanitized as TemplateContext)
  } catch (error) {
    return err(
      createTemplateCompilerError(
        ERROR_CODES.CONTEXT_SANITIZATION_FAILED,
        `Template context sanitization failed: ${error instanceof Error ? error.message : String(error)}`,
        {
          operation: 'sanitizeTemplateContext',
          cause: error instanceof Error ? error : undefined,
          recoverable: false,
        }
      )
    )
  }
}

/**
 * Recursively sanitize object properties
 *
 * @param obj - Object to sanitize
 * @returns Result with sanitized object or error
 */
export function sanitizeObject(obj: any): Result<any, CoreError> {
  try {
    if (obj === null || typeof obj !== 'object') {
      return ok(obj)
    }

    if (Array.isArray(obj)) {
      const sanitizedArray: any[] = []
      for (const item of obj) {
        const sanitizedItem = sanitizeObject(item)
        if (sanitizedItem.isErr()) {
          return sanitizedItem
        }
        sanitizedArray.push(sanitizedItem.value)
      }
      return ok(sanitizedArray)
    }

    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const sanitizedValue = sanitizeText(value)
        sanitized[key] = sanitizedValue.isOk() ? sanitizedValue.value : ''
      } else if (typeof value === 'object' && value !== null) {
        const sanitizedObject = sanitizeObject(value)
        if (sanitizedObject.isErr()) {
          return sanitizedObject
        }
        sanitized[key] = sanitizedObject.value
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value
      } else {
        // Skip functions, undefined, symbols, etc.
        sanitized[key] = ''
      }
    }

    return ok(sanitized)
  } catch (error) {
    return err(
      createTemplateCompilerError(
        ERROR_CODES.OBJECT_SANITIZATION_FAILED,
        `Object sanitization failed: ${error instanceof Error ? error.message : String(error)}`,
        {
          operation: 'sanitizeObject',
          cause: error instanceof Error ? error : undefined,
          recoverable: false,
        }
      )
    )
  }
}
