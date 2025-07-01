/**
 * Transform factory for semantic token enhancements
 *
 * - Modular architecture with focused responsibilities
 * - Functional composition through separate utilities
 * - Pure functions with no side effects
 *
 * This facade re-exports the modular implementation
 * for backward compatibility while maintaining clean architecture.
 */

// Re-export main transform creation function
export { createSemanticEnhancementTransform } from './transform-factory/create-transform.js'
// Re-export types
export type { ComponentConfig, TransformContext } from './transform-factory/types.js'
