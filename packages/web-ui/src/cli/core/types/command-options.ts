/**
 * Enhanced type-safe command option definitions for Trailhead UI CLI
 *
 * Provides strict typing for all command options with proper validation
 * and better IntelliSense support.
 */

import type { CommandOptions } from '@esteban-url/trailhead-cli/command';

/**
 * Valid framework types supported by Trailhead UI
 */
export type FrameworkType = 'nextjs' | 'vite' | 'redwood-sdk' | 'generic-react';

/**
 * Valid dependency installation strategies
 */
export type DependencyStrategy = 'auto' | 'smart' | 'selective' | 'manual' | 'skip' | 'force';

/**
 * Enhanced install command options with strict typing
 */
export interface StrictInstallOptions extends CommandOptions {
  readonly interactive?: boolean;
  readonly framework?: FrameworkType;
  readonly dest?: string;
  readonly catalystDir?: string;
  readonly force?: boolean;
  readonly noConfig?: boolean;
  readonly overwrite?: boolean;
  readonly wrappers?: boolean;
  readonly dependencyStrategy?: DependencyStrategy;
  readonly dryRun?: boolean;
  readonly verbose?: boolean;
}

/**
 * Enhanced transforms command options with strict typing
 */
export interface StrictTransformsOptions extends CommandOptions {
  readonly src?: string;
  readonly interactive?: boolean;
  readonly skipTransforms?: boolean;
}

/**
 * Enhanced profile command options with strict typing
 */
export interface StrictProfileOptions extends CommandOptions {
  readonly pipeline?: boolean;
  readonly simple?: boolean;
  readonly memory?: boolean;
  readonly verbose?: boolean;
}

/**
 * Enhanced dev refresh command options with strict typing
 */
export interface StrictDevRefreshOptions extends CommandOptions {
  readonly src?: string;
  readonly dest?: string;
  readonly clean?: boolean;
  readonly verbose?: boolean;
}

/**
 * Enhanced init command options with strict typing
 */
export interface StrictInitOptions extends CommandOptions {
  readonly name?: string;
  readonly template?: string;
}

/**
 * Enhanced add command options with strict typing
 */
export interface StrictAddOptions extends CommandOptions {
  readonly force?: boolean;
  readonly components?: readonly string[];
}

/**
 * Type guard for framework validation
 */
export function isValidFramework(framework: string): framework is FrameworkType {
  return ['nextjs', 'vite', 'redwood-sdk', 'generic-react'].includes(framework);
}

/**
 * Type guard for dependency strategy validation
 */
export function isValidDependencyStrategy(strategy: string): strategy is DependencyStrategy {
  return ['auto', 'smart', 'selective', 'manual', 'skip', 'force'].includes(strategy);
}
