/**
 * Colors Object Protection Utilities
 *
 * - Functional composition from focused modules
 * - Single responsibility per module
 * - Pure functions with no side effects
 *
 * This facade re-exports all functionality from the modular implementation
 * for backward compatibility while maintaining a clean, organized structure.
 */

// Re-export everything from the modular implementation
export * from './colors-object-detector/detectors.js';
export * from './colors-object-detector/validators.js';
export * from './colors-object-detector/protectors.js';
