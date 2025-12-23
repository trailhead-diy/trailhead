export { createProgressTracker, updateProgress, calculateWeightedProgress } from './tracker.js'
export type { ProgressTracker, ProgressState, ProgressOptions } from './types.js'

// Enhanced progress tracking - deprecated in v2.0.0
// These exports are kept for backward compatibility but may be removed in v3.0.0
export {
  createEnhancedProgressTracker,
  type EnhancedProgressTracker,
  type EnhancedProgressState,
  type EnhancedProgressOptions,
  type EnhancedProgressStep,
} from './enhanced-tracker.js'
