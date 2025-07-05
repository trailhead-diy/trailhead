/**
 * Type definitions for the create-trailhead-cli generator system
 *
 * This module provides comprehensive type definitions for all aspects
 * of the CLI project generation system, from configuration interfaces
 * to template processing metadata.
 *
 * @module Types
 */

/**
 * Available template variants for CLI project generation
 *
 * Each variant provides different levels of functionality and complexity:
 * - **basic**: Minimal CLI with essential features
 * - **advanced**: Full-featured CLI with examples and comprehensive testing
 * - **enterprise**: Production-ready CLI with monitoring, security, and observability
 */
export type TemplateVariant = 'basic' | 'advanced' | 'enterprise';

/**
 * Supported package managers for dependency installation
 *
 * All major Node.js package managers are supported with automatic
 * command detection and installation workflow adaptation.
 */
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

/**
 * User-facing generation options from interactive prompts or CLI flags
 *
 * This interface represents the subset of configuration that users
 * directly control through the command interface.
 *
 * @interface
 */
export interface GenerateOptions {
  /** Template variant to use for project generation */
  template: TemplateVariant;
  /** Package manager for dependency installation */
  packageManager: PackageManager;
  /** Whether to include comprehensive documentation */
  includeDocs: boolean;
  /** Whether to initialize a Git repository */
  initGit: boolean;
  /** Whether to install dependencies after generation */
  installDependencies: boolean;
}

/**
 * Complete project configuration for the generation process
 *
 * Extends GenerateOptions with additional metadata required for
 * the generator execution, including computed paths and execution flags.
 *
 * @interface
 * @extends GenerateOptions
 */
export interface ProjectConfig {
  /** Name of the project (used for directory and package naming) */
  projectName: string;
  /** Absolute path where the project will be created */
  projectPath: string;
  /** Template variant to use for project generation */
  template: TemplateVariant;
  /** Package manager for dependency installation */
  packageManager: PackageManager;
  /** Whether to include comprehensive documentation */
  includeDocs: boolean;
  /** Whether to initialize a Git repository */
  initGit: boolean;
  /** Whether to install dependencies after generation */
  installDependencies: boolean;
  /** Whether to run in dry-run mode (no actual file operations) */
  dryRun: boolean;
}

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
  projectName: string;
  /** Sanitized package name (kebab-case, npm-compatible) */
  packageName: string;
  /** Project description */
  description: string;
  /** Author name */
  author: string;
  /** Author email address */
  email: string;
  /** License identifier (SPDX format) */
  license: string;
  /** Initial project version */
  version: string;
  /** Selected package manager */
  packageManager: PackageManager;
  /** Current year for copyright notices */
  currentYear: number;
  /** Whether Git initialization is enabled */
  hasGit: boolean;
  /** Whether documentation generation is enabled */
  hasDocs: boolean;

  // Git hooks configuration
  /** CLI version for smart test runner */
  CLI_VERSION: string;
  /** Whether project is a monorepo */
  IS_MONOREPO: boolean;
  /** Package manager command */
  PACKAGE_MANAGER: string;
  /** Directory containing packages (for monorepos) */
  PACKAGES_DIR: string;
  /** Regex pattern to match package files */
  PACKAGES_PATTERN: string;
  /** Test command to execute */
  TEST_COMMAND: string;
  /** Test execution timeout in seconds */
  TIMEOUT: number;
  /** File patterns for template processing */
  FILE_PATTERNS: string;
  /** High-risk file patterns that trigger full tests */
  HIGH_RISK_PATTERNS: string[];
  /** File patterns to skip for test execution */
  SKIP_PATTERNS: string[];
  /** Package name mappings (for monorepos) */
  PACKAGE_MAPPINGS?: Record<string, string>;
  /** Lint command */
  LINT_COMMAND: string;
  /** TypeScript type checking command */
  TYPECHECK_COMMAND: string;
  /** Smart test runner script path */
  SMART_TEST_COMMAND: string;
  /** Secrets scanning priority */
  SECRETS_PRIORITY: number;
  /** File size check priority */
  FILESIZE_PRIORITY: number;
  /** Tests execution priority */
  TESTS_PRIORITY: number;
  /** Whether docs validation is enabled */
  DOCS_VALIDATION: boolean;
  /** Whether changeset reminder is enabled */
  CHANGESET_REMINDER: boolean;
  /** Whether conventional commits are enforced */
  CONVENTIONAL_COMMITS: boolean;
  /** Whether lockfile validation is enabled */
  LOCKFILE_VALIDATION: boolean;
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
  source: string;
  /** Destination path relative to project root */
  destination: string;
  /** Whether file requires Handlebars template processing */
  isTemplate: boolean;
  /** Whether file should be marked as executable */
  executable: boolean;
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
  templatesDir?: string;
  /** Custom template variant directories (overrides default variant paths) */
  variantDirs?: Partial<Record<TemplateVariant, string>>;
  /** Custom shared template directory (overrides default shared path) */
  sharedDir?: string;
  /** Additional template search directories (appended to default paths) */
  additionalDirs?: string[];
}

/**
 * Execution context for the generator system
 *
 * Provides access to essential services and configuration needed
 * throughout the generation process, including logging and filesystem
 * abstraction for testing and cross-platform compatibility.
 *
 * @interface
 */
export interface GeneratorContext {
  /** Logger instance for user feedback and debugging */
  logger: any;
  /** Filesystem abstraction for file operations */
  fs: any;
  /** Whether to enable verbose logging output */
  verbose: boolean;
  /** Optional template loader configuration for custom template paths */
  templateConfig?: TemplateLoaderConfig;
}
