import { resolve, join } from 'path'
import type { TemplateLoaderConfig } from './types.js'

/**
 * Template configuration utilities for creating and managing custom template paths
 *
 * This module provides helper functions for creating template loader configurations,
 * particularly useful for testing, customization, and advanced use cases.
 *
 * @module TemplateConfig
 */

/**
 * Create a template configuration for testing with temporary directories
 *
 * Generates a configuration suitable for testing scenarios where templates
 * need to be loaded from specific test directories or mock filesystems.
 *
 * @param testBaseDir - Base directory for test templates
 * @param options - Additional configuration options
 * @returns Template configuration optimized for testing
 *
 * @example
 * ```typescript
 * // Create test config with mock templates
 * const testConfig = createTestTemplateConfig('/tmp/test-templates', {
 *   additionalDirs: ['/tmp/mock-templates']
 * })
 *
 * // Use in test
 * const files = await getTemplateFiles('basic', testConfig)
 * expect(files).toHaveLength(expectedFileCount)
 * ```
 */
export function createTestTemplateConfig(
  testBaseDir: string,
  options: Partial<TemplateLoaderConfig> = {}
): TemplateLoaderConfig {
  const baseDir = resolve(testBaseDir)
  const config: TemplateLoaderConfig = {}

  // Directly set resolved paths since createTemplateConfig was removed
  config.templatesDir = baseDir
  config.sharedDir = join(baseDir, 'shared')

  if (options.templatesDir) {
    config.templatesDir = resolve(options.templatesDir)
  }

  if (options.sharedDir) {
    config.sharedDir = resolve(options.sharedDir)
  }

  if (options.additionalDirs) {
    config.additionalDirs = options.additionalDirs.map((dir) => resolve(dir))
  }

  return config
}
