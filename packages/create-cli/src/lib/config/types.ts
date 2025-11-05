/**
 * Configuration type definitions
 *
 * @module config/types
 */

/**
 * Supported package managers for dependency installation
 *
 * Focus on the two most widely used and stable package managers:
 * - npm: Universal compatibility, industry standard
 * - pnpm: Modern, efficient, monorepo-ready
 */
export type PackageManager = 'npm' | 'pnpm'

/**
 * Complete project configuration for the generation process
 *
 * @interface
 */
export interface ProjectConfig {
  /** Name of the project (used for directory and package naming) */
  projectName: string
  /** Absolute path where the project will be created */
  projectPath: string
  /** Project description */
  description?: string
  /** Project author information */
  author?: {
    name: string
    email: string
  }
  /** Project license */
  license?: string
  /** Package manager for dependency installation */
  packageManager: PackageManager
  /** Feature flags */
  features: {
    core: true // Always required
    config?: boolean
    validation?: boolean
    testing?: boolean
    cicd?: boolean
  }
  /** Project type */
  projectType: 'standalone-cli' | 'library' | 'monorepo-package'
  /** Target Node.js version */
  nodeVersion: string
  /** Whether to use TypeScript (always true) */
  typescript: boolean
  /** IDE configuration */
  ide: 'vscode' | 'none'
  /** Whether to run in dry-run mode (no actual file operations) */
  dryRun: boolean
  /** Whether to force overwrite existing directories */
  force: boolean
  /** Whether to enable verbose logging */
  verbose: boolean
}
