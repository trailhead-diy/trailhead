/**
 * Transform context utilities for consistent context creation
 */

import type { TransformContext } from './transform-base.js';
import type { Logger } from '@esteban-url/trailhead-cli/core';

/**
 * Create a transform context with defaults
 */
export function createTransformContext(
  config: Partial<TransformContext> & {
    logger: Logger;
    filePath: string;
  }
): TransformContext {
  return {
    dryRun: false,
    debug: false,
    metadata: {},
    ...config,
  };
}
