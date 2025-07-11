/**
 * Enhanced type-safe command option definitions for Trailhead UI CLI
 *
 * Provides strict typing for all command options with proper validation
 * and better IntelliSense support.
 */

import type { CommandOptions } from '@esteban-url/trailhead-cli/command';

/**
 * Enhanced dev refresh command options with strict typing
 */
export interface StrictDevRefreshOptions extends CommandOptions {
  readonly src?: string;
  readonly dest?: string;
  readonly clean?: boolean;
  readonly skipTransforms?: boolean;
  readonly verbose?: boolean;
}
