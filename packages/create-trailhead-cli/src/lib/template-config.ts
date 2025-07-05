import { resolve, join } from 'path';
import type { TemplateLoaderConfig, TemplateVariant } from './types.js';

/**
 * Template configuration utilities for creating and managing custom template paths
 *
 * This module provides helper functions for creating template loader configurations,
 * particularly useful for testing, customization, and advanced use cases.
 *
 * @module TemplateConfig
 */

/**
 * Create a template loader configuration with validation and path resolution
 *
 * Provides a safe way to create template configurations with automatic path
 * resolution and validation. Ensures all paths are absolute and accessible.
 *
 * @param options - Template configuration options
 * @returns Validated and resolved template loader configuration
 *
 * @example
 * ```typescript
 * // Create config for custom template directory
 * const config = createTemplateConfig({
 *   templatesDir: './my-templates'
 * })
 *
 * // Create config with specific variant overrides
 * const advancedConfig = createTemplateConfig({
 *   variantDirs: {
 *     advanced: './custom-advanced',
 *     enterprise: './enterprise-templates'
 *   },
 *   additionalDirs: ['./extra-templates']
 * })
 *
 * // Use with generator
 * const files = await getTemplateFiles('advanced', config)
 * ```
 *
 * @see {@link TemplateLoaderConfig} for all available options
 */
export function createTemplateConfig(
  options: Partial<TemplateLoaderConfig> = {},
): TemplateLoaderConfig {
  const config: TemplateLoaderConfig = {};

  // Resolve base templates directory
  if (options.templatesDir) {
    config.templatesDir = resolve(options.templatesDir);
  }

  // Resolve variant directories
  if (options.variantDirs) {
    config.variantDirs = {};
    for (const [variant, path] of Object.entries(options.variantDirs)) {
      if (path) {
        config.variantDirs[variant as TemplateVariant] = resolve(path);
      }
    }
  }

  // Resolve shared directory
  if (options.sharedDir) {
    config.sharedDir = resolve(options.sharedDir);
  }

  // Resolve additional directories
  if (options.additionalDirs) {
    config.additionalDirs = options.additionalDirs.map((dir) => resolve(dir));
  }

  return config;
}

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
  options: Partial<TemplateLoaderConfig> = {},
): TemplateLoaderConfig {
  const baseDir = resolve(testBaseDir);

  return createTemplateConfig({
    templatesDir: baseDir,
    sharedDir: join(baseDir, 'shared'),
    ...options,
  });
}

/**
 * Create a template configuration for development with custom overrides
 *
 * Helpful for development scenarios where you want to override specific
 * template variants while keeping the built-in templates for others.
 *
 * @param overrides - Specific template variant overrides
 * @returns Template configuration with selective overrides
 *
 * @example
 * ```typescript
 * // Override just the enterprise template while keeping built-ins
 * const devConfig = createDevTemplateConfig({
 *   enterprise: './dev-enterprise-template'
 * })
 *
 * // Now enterprise uses custom template, but basic/advanced use built-ins
 * const enterpriseFiles = await getTemplateFiles('enterprise', devConfig)
 * const basicFiles = await getTemplateFiles('basic', devConfig)
 * ```
 */
export function createDevTemplateConfig(
  overrides: Partial<Record<TemplateVariant, string>>,
): TemplateLoaderConfig {
  const variantDirs: Partial<Record<TemplateVariant, string>> = {};

  for (const [variant, path] of Object.entries(overrides)) {
    if (path) {
      variantDirs[variant as TemplateVariant] = resolve(path);
    }
  }

  return createTemplateConfig({
    variantDirs,
  });
}

/**
 * Validate template configuration paths exist and are accessible
 *
 * Performs validation checks on a template configuration to ensure
 * all specified paths exist and are readable. Useful for early
 * error detection and debugging.
 *
 * @param config - Template configuration to validate
 * @returns Promise resolving to validation results
 *
 * @example
 * ```typescript
 * const config = createTemplateConfig({
 *   templatesDir: './my-templates'
 * })
 *
 * const validation = await validateTemplateConfig(config)
 * if (!validation.valid) {
 *   console.error('Invalid template config:', validation.errors)
 * }
 * ```
 */
export async function validateTemplateConfig(
  config: TemplateLoaderConfig,
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Validate base templates directory
  if (config.templatesDir) {
    try {
      const { stat } = await import('fs-extra');
      const stats = await stat(config.templatesDir);
      if (!stats.isDirectory()) {
        errors.push(`templatesDir is not a directory: ${config.templatesDir}`);
      }
    } catch {
      errors.push(`templatesDir does not exist: ${config.templatesDir}`);
    }
  }

  // Validate variant directories
  if (config.variantDirs) {
    for (const [variant, path] of Object.entries(config.variantDirs)) {
      if (path) {
        try {
          const { stat } = await import('fs-extra');
          const stats = await stat(path);
          if (!stats.isDirectory()) {
            errors.push(
              `variantDir for ${variant} is not a directory: ${path}`,
            );
          }
        } catch {
          errors.push(`variantDir for ${variant} does not exist: ${path}`);
        }
      }
    }
  }

  // Validate shared directory
  if (config.sharedDir) {
    try {
      const { stat } = await import('fs-extra');
      const stats = await stat(config.sharedDir);
      if (!stats.isDirectory()) {
        errors.push(`sharedDir is not a directory: ${config.sharedDir}`);
      }
    } catch {
      errors.push(`sharedDir does not exist: ${config.sharedDir}`);
    }
  }

  // Validate additional directories
  if (config.additionalDirs) {
    for (const [index, path] of config.additionalDirs.entries()) {
      try {
        const { stat } = await import('fs-extra');
        const stats = await stat(path);
        if (!stats.isDirectory()) {
          errors.push(`additionalDir[${index}] is not a directory: ${path}`);
        }
      } catch {
        errors.push(`additionalDir[${index}] does not exist: ${path}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get template configuration summary for debugging and logging
 *
 * Provides a human-readable summary of a template configuration,
 * useful for debugging and verbose logging output.
 *
 * @param config - Template configuration to summarize
 * @returns Formatted configuration summary
 *
 * @example
 * ```typescript
 * const config = createTemplateConfig({
 *   templatesDir: './templates',
 *   variantDirs: { advanced: './custom-advanced' }
 * })
 *
 * console.log(getTemplateConfigSummary(config))
 * // Output:
 * // Template Configuration:
 * //   Base Directory: /path/to/templates
 * //   Variant Overrides:
 * //     advanced: /path/to/custom-advanced
 * ```
 */
export function getTemplateConfigSummary(config: TemplateLoaderConfig): string {
  const lines: string[] = ['Template Configuration:'];

  if (config.templatesDir) {
    lines.push(`  Base Directory: ${config.templatesDir}`);
  }

  if (config.variantDirs && Object.keys(config.variantDirs).length > 0) {
    lines.push('  Variant Overrides:');
    for (const [variant, path] of Object.entries(config.variantDirs)) {
      if (path) {
        lines.push(`    ${variant}: ${path}`);
      }
    }
  }

  if (config.sharedDir) {
    lines.push(`  Shared Directory: ${config.sharedDir}`);
  }

  if (config.additionalDirs && config.additionalDirs.length > 0) {
    lines.push('  Additional Directories:');
    config.additionalDirs.forEach((dir, index) => {
      lines.push(`    [${index}]: ${dir}`);
    });
  }

  if (lines.length === 1) {
    lines.push('  (using built-in templates)');
  }

  return lines.join('\n');
}
