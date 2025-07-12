// Pure delegation to @trailhead/core domain package
export * from '@trailhead/core';

// CLI-specific error templates (kept as CLI-specific functionality)
export * from './error-templates.js';

// CLI-specific logger (kept as CLI-specific functionality)
export * from './logger.js';

// CLI-specific pipeline utilities (kept as CLI-specific functionality)
// Export specific functions to avoid conflicts
export {
  pipeline,
  parallel,
  parallelSettled,
  retryPipeline,
  type Pipeline,
  type PipelineStep,
  type ConditionalStep,
  type ErrorHandler,
} from './pipeline.js';

// Direct exports - no backward compatibility
export { createCoreError } from '@trailhead/core';
