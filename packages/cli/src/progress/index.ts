export {
  createProgressTracker,
  updateProgress,
  calculateWeightedProgress,
} from './tracker.js';
export type {
  ProgressTracker,
  ProgressState,
  ProgressOptions,
} from './types.js';

// Re-export cli-progress for advanced usage
export { SingleBar, MultiBar, Presets } from 'cli-progress';
