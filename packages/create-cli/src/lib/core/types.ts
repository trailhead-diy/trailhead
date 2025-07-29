/**
 * Core generator type definitions
 *
 * @module core/types
 */

import type { Logger } from '@esteban-url/cli/utils'
import type { TemplateLoaderConfig } from '../templates/types.js'

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
  logger: Logger
  /** Whether to enable verbose logging output */
  verbose: boolean
  /** Optional template loader configuration for custom template paths */
  templateConfig?: TemplateLoaderConfig
}
