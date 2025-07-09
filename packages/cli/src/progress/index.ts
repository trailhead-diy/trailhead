export { createProgressTracker, updateProgress, calculateWeightedProgress } from './tracker.js';
export type { ProgressTracker, ProgressState, ProgressOptions } from './types.js';

// Enhanced progress tracking exports - addresses issue #116 item 13
export {
  createEnhancedProgressTracker,
  type EnhancedProgressTracker,
  type EnhancedProgressState,
  type EnhancedProgressOptions,
  type EnhancedProgressStep,
} from './enhanced-tracker.js';

// Re-export cli-progress for advanced usage
export { SingleBar, MultiBar, Presets } from 'cli-progress';
