/**
 * Template type definitions
 *
 * @module templates/types
 */

import type { PackageManager } from '../config/types.js'

/**
 * Template context variables for Handlebars compilation
 *
 * This interface defines all variables available to Handlebars templates
 * during the compilation process. These variables are interpolated into
 * template files to generate the final project structure.
 *
 * @interface
 *
 * @example
 * ```handlebars
 * {
 *   "name": "{{packageName}}",
 *   "version": "{{version}}",
 *   "author": "{{author}} <{{email}}>",
 *   "license": "{{license}}"
 * }
 * ```
 */
export interface TemplateContext {
  /** Project name as provided by user */
  projectName: string
  /** Sanitized package name (kebab-case, npm-compatible) */
  packageName: string
  /** Project description */
  description: string
  /** Author name */
  author: string
  /** Author email address */
  email: string
  /** License identifier (SPDX format) */
  license: string
  /** Initial project version */
  version: string
  /** Selected package manager */
  packageManager: PackageManager
  /** Current year for copyright notices */
  currentYear: number
  /** Whether documentation generation is enabled */
  hasDocs: boolean

  // Template configuration
  /** CLI version for smart test runner */
  CLI_VERSION: string
  /** Project name for template context */
  PROJECT_NAME: string
  /** Whether project is a monorepo */
  IS_MONOREPO: boolean
  /** Package manager command */
  PACKAGE_MANAGER: string
  /** Package manager version */
  PACKAGE_MANAGER_VERSION: string
  /** Directory containing packages (for monorepos) */
  PACKAGES_DIR: string
  /** Regex pattern to match package files */
  PACKAGES_PATTERN: string
  /** Test command to execute */
  TEST_COMMAND: string
  /** Test execution timeout in seconds */
  TIMEOUT: number
  /** File patterns for template processing */
  FILE_PATTERNS: string
  /** High-risk file patterns that trigger full tests */
  HIGH_RISK_PATTERNS: string[]
  /** File patterns to skip for test execution */
  SKIP_PATTERNS: string[]
  /** Whether project has subpath exports */
  HAS_SUBPATH_EXPORTS: boolean
  /** List of subpath exports */
  SUBPATH_EXPORTS: string[]
  /** Package name mappings (for monorepos) */
  PACKAGE_MAPPINGS?: Record<string, string>
  /** Lint command */
  LINT_COMMAND: string
  /** TypeScript type checking command */
  TYPECHECK_COMMAND: string
  /** Smart test runner script path */
  SMART_TEST_COMMAND: string
  /** Secrets scanning priority */
  SECRETS_PRIORITY: number
  /** File size check priority */
  FILESIZE_PRIORITY: number
  /** Tests execution priority */
  TESTS_PRIORITY: number
  /** Whether docs validation is enabled */
  DOCS_VALIDATION: boolean
  /** Whether changeset reminder is enabled */
  CHANGESET_REMINDER: boolean
  /** Whether conventional commits are enforced */
  CONVENTIONAL_COMMITS: boolean
  /** Whether lockfile validation is enabled */
  LOCKFILE_VALIDATION: boolean
}

/**
 * Template file metadata for processing pipeline
 *
 * Describes a single file in the template system with metadata
 * about how it should be processed and where it should be placed
 * in the generated project structure.
 *
 * @interface
 */
export interface TemplateFile {
  /** Source path relative to templates directory */
  source: string
  /** Destination path relative to project root */
  destination: string
  /** Whether file requires Handlebars template processing */
  isTemplate: boolean
  /** Whether file should be marked as executable */
  executable: boolean
}

/**
 * Template loader configuration options
 *
 * Allows customization of template discovery and loading behavior,
 * particularly useful for testing and advanced use cases.
 *
 * @interface
 */
export interface TemplateLoaderConfig {
  /** Base directory containing template files (defaults to built-in templates) */
  templatesDir?: string
  /** Custom shared template directory (overrides default shared path) */
  sharedDir?: string
  /** Additional template search directories (appended to default paths) */
  additionalDirs?: string[]
}
