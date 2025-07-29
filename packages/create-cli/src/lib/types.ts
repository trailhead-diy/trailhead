/**
 * Shared type definitions for the create-trailhead-cli generator system
 *
 * This module re-exports types from their domain-specific modules for
 * backward compatibility and convenience.
 *
 * @module Types
 */

// Re-export configuration types
export type { PackageManager, ProjectConfig } from './config/types.js'

// Re-export template types
export type { TemplateContext, TemplateFile, TemplateLoaderConfig } from './templates/types.js'

// Re-export core types
export type { GeneratorContext } from './core/types.js'
