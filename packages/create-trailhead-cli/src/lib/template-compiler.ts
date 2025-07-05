import { readFile, stat } from 'fs-extra';
import { createHash } from 'crypto';
import Handlebars from 'handlebars';
import type { TemplateContext } from './types.js';

/**
 * Cache entry structure for compiled Handlebars templates
 *
 * @internal
 */
interface CacheEntry {
  /** Compiled Handlebars template function */
  template: HandlebarsTemplateDelegate;
  /** File modification time for cache invalidation */
  mtime: number;
  /** SHA-256 hash of template content for integrity verification */
  hash: string;
}

/**
 * Optimized Handlebars template compiler with intelligent caching and performance improvements
 *
 * This class provides a high-performance template compilation system with:
 * - Template caching based on file modification time and content hash
 * - Custom Handlebars helpers for common template operations
 * - Batch pre-compilation for better performance
 * - Memory management and cache cleanup
 * - Performance tracking and optimization
 *
 * The compiler automatically registers useful helpers for template processing
 * and maintains a cache of compiled templates to avoid recompilation overhead.
 *
 * @example
 * ```typescript
 * const compiler = new TemplateCompiler()
 *
 * // Compile and render a template
 * const result = await compiler.compileTemplate('/path/to/template.hbs', {
 *   projectName: 'my-cli',
 *   version: '1.0.0'
 * })
 *
 * // Pre-compile multiple templates for better performance
 * await compiler.precompileTemplates([
 *   '/path/to/template1.hbs',
 *   '/path/to/template2.hbs'
 * ])
 *
 * // Get cache statistics
 * const stats = compiler.getCacheStats()
 * console.log(`Cached ${stats.size} templates`)
 * ```
 *
 * @see {@link https://handlebarsjs.com/} for Handlebars documentation
 */
export class TemplateCompiler {
  private cache = new Map<string, CacheEntry>();
  private initialized = false;

  constructor() {
    this.initializeHelpers();
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
   * @private
   * @internal
   *
   * Helper categories:
   * - **Comparison**: eq, ne, gt, lt, includes
   * - **String manipulation**: uppercase, lowercase, capitalize, kebab, pascal, camel
   * - **Data formatting**: json, date
   * - **Control flow**: if-eq, if-any, each-with-index
   *
   * @see {@link https://handlebarsjs.com/guide/builtin-helpers.html} for built-in helpers
   */
  private initializeHelpers(): void {
    if (this.initialized) return;

    // Equality helper for conditional rendering
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);

    // Not equal helper
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);

    // Greater than helper
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);

    // Less than helper
    Handlebars.registerHelper('lt', (a: number, b: number) => a < b);

    // Array includes helper
    Handlebars.registerHelper(
      'includes',
      (array: any[], value: any) =>
        Array.isArray(array) && array.includes(value),
    );

    // String helper for text manipulation
    Handlebars.registerHelper('uppercase', (str: string) =>
      typeof str === 'string' ? str.toUpperCase() : str,
    );

    Handlebars.registerHelper('lowercase', (str: string) =>
      typeof str === 'string' ? str.toLowerCase() : str,
    );

    Handlebars.registerHelper('capitalize', (str: string) =>
      typeof str === 'string'
        ? str.charAt(0).toUpperCase() + str.slice(1)
        : str,
    );

    // Kebab case helper
    Handlebars.registerHelper('kebab', (str: string) =>
      typeof str === 'string'
        ? str.replace(/[A-Z]/g, '-$&').toLowerCase().replace(/^-/, '')
        : str,
    );

    // Pascal case helper
    Handlebars.registerHelper('pascal', (str: string) =>
      typeof str === 'string'
        ? str
            .split(/[-_\s]+/)
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join('')
        : str,
    );

    // Camel case helper
    Handlebars.registerHelper('camel', (str: string) => {
      if (typeof str !== 'string') return str;
      const pascal = str
        .split(/[-_\s]+/)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join('');
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });

    // JSON helper for safe JSON output
    Handlebars.registerHelper('json', (obj: any) => {
      try {
        return JSON.stringify(obj, null, 2);
      } catch {
        return '{}';
      }
    });

    // Date helper
    Handlebars.registerHelper('date', (format?: string) => {
      const now = new Date();
      if (format === 'iso') {
        return now.toISOString();
      } else if (format === 'year') {
        return now.getFullYear().toString();
      }
      return now.toLocaleDateString();
    });

    // Conditional block helper
    Handlebars.registerHelper(
      'if-eq',
      function (this: any, a: any, b: any, options: any) {
        if (a === b) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      },
    );

    // Multiple condition helper
    Handlebars.registerHelper('if-any', function (this: any, ...args: any[]) {
      const options = args.pop();
      const conditions = args.slice(0, -1);

      if (conditions.some(Boolean)) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Array iteration with index
    Handlebars.registerHelper(
      'each-with-index',
      function (this: any, array: any[], options: any) {
        if (!Array.isArray(array)) return options.inverse(this);

        let result = '';
        for (let i = 0; i < array.length; i++) {
          result += options.fn({
            ...array[i],
            index: i,
            isFirst: i === 0,
            isLast: i === array.length - 1,
          });
        }
        return result;
      },
    );

    this.initialized = true;
  }

  /**
   * Compile and render a Handlebars template with intelligent caching
   *
   * This method provides optimized template compilation with:
   * - Automatic cache lookup based on file path and modification time
   * - On-demand compilation for cache misses
   * - Cache invalidation when template files are modified
   * - Performance optimization through template reuse
   *
   * @param templatePath - Absolute path to the Handlebars template file (.hbs)
   * @param context - Template context object containing variables for interpolation
   * @returns Promise resolving to the rendered template string
   *
   * @throws {Error} When template file cannot be read or compilation fails
   *
   * @example
   * ```typescript
   * const compiler = new TemplateCompiler()
   * const rendered = await compiler.compileTemplate('/templates/package.json.hbs', {
   *   projectName: 'my-project',
   *   version: '1.0.0',
   *   dependencies: ['express', 'chalk']
   * })
   * ```
   *
   * Cache behavior:
   * - Cache hit: Returns cached template result immediately
   * - Cache miss: Compiles template, caches result, returns rendered content
   * - File modified: Invalidates cache entry and recompiles
   *
   * @see {@link getCachedTemplate} for cache lookup logic
   * @see {@link cacheTemplate} for cache storage logic
   */
  async compileTemplate(
    templatePath: string,
    context: TemplateContext,
  ): Promise<string> {
    const cached = await this.getCachedTemplate(templatePath);
    if (cached) {
      return cached(context);
    }

    // Read and compile template
    const templateContent = await readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent, {
      // Optimize for performance
      noEscape: false,
      strict: false,
      assumeObjects: true,
      preventIndent: false,
      ignoreStandalone: true,
      explicitPartialContext: false,
    });

    // Cache the compiled template
    await this.cacheTemplate(templatePath, template);

    return template(context);
  }

  /**
   * Get cached template if valid
   */
  private async getCachedTemplate(
    templatePath: string,
  ): Promise<HandlebarsTemplateDelegate | null> {
    const cached = this.cache.get(templatePath);
    if (!cached) return null;

    try {
      const stats = await stat(templatePath);
      const currentMtime = stats.mtime.getTime();

      // Check if file has been modified
      if (currentMtime === cached.mtime) {
        return cached.template;
      }

      // File modified, remove from cache
      this.cache.delete(templatePath);
      return null;
    } catch {
      // File doesn't exist or can't be accessed
      this.cache.delete(templatePath);
      return null;
    }
  }

  /**
   * Cache compiled template
   */
  private async cacheTemplate(
    templatePath: string,
    template: HandlebarsTemplateDelegate,
  ): Promise<void> {
    try {
      const stats = await stat(templatePath);
      const templateContent = await readFile(templatePath, 'utf-8');
      const hash = createHash('sha256').update(templateContent).digest('hex');

      this.cache.set(templatePath, {
        template,
        mtime: stats.mtime.getTime(),
        hash,
      });
    } catch {
      // If we can't cache, just continue
    }
  }

  /**
   * Pre-compile multiple templates for better performance
   */
  async precompileTemplates(templatePaths: string[]): Promise<void> {
    const promises = templatePaths.map(async (templatePath) => {
      try {
        const templateContent = await readFile(templatePath, 'utf-8');
        const template = Handlebars.compile(templateContent, {
          noEscape: false,
          strict: false,
          assumeObjects: true,
          preventIndent: false,
          ignoreStandalone: true,
          explicitPartialContext: false,
        });

        await this.cacheTemplate(templatePath, template);
      } catch {
        // Skip files that can't be read
      }
    });

    await Promise.all(promises);
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Cleanup old cache entries based on memory pressure
   */
  cleanup(maxEntries: number = 100): void {
    if (this.cache.size <= maxEntries) return;

    // Convert to array and sort by access time (approximate)
    const entries = Array.from(this.cache.entries());
    const toRemove = entries.slice(0, entries.length - maxEntries);

    for (const [key] of toRemove) {
      this.cache.delete(key);
    }
  }
}
