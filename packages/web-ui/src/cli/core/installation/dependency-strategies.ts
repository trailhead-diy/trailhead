/**
 * Dependency strategy selection and configuration
 */

import type { WorkspaceInfo, CIEnvironment } from './workspace-detection.js';
import type { DependencyAnalysis, ConflictSeverity } from './dependency-resolution.js';
import { analyzeConflictSeverity } from './dependency-resolution.js';
import {
  buildInstallCommand,
  getStrategyOptions,
  getPackageManagerEnv,
  type PackageManagerName,
} from './package-manager-registry.js';

// ============================================================================
// TYPES
// ============================================================================

export type DependencyStrategyType = 'auto' | 'smart' | 'selective' | 'manual' | 'skip' | 'force';

export interface DependencyStrategy {
  readonly type: DependencyStrategyType;
  readonly useLockfile?: boolean;
  readonly skipConflicts?: boolean;
  readonly preferWorkspace?: boolean;
  readonly reason?: string;
  readonly peerDeps?: 'legacy' | 'strict';
}

export interface DependencyContext {
  readonly hasConflicts: boolean;
  readonly conflictSeverity: ConflictSeverity;
  readonly isCI: boolean;
  readonly isOffline: boolean;
  readonly hasWorkspace: boolean;
  readonly packageManager: string;
  readonly hasLockfile: boolean;
}

export interface InstallOptions {
  readonly packageManager: string;
  readonly useLockfile: boolean;
  readonly flags: readonly string[];
  readonly env: Readonly<Record<string, string>>;
}

// ============================================================================
// STRATEGY RECOMMENDATION
// ============================================================================

// Strategy selection rules - data-driven approach
interface StrategyRule {
  readonly condition: (context: DependencyContext) => boolean;
  readonly strategy: DependencyStrategy;
  readonly priority: number;
}

const STRATEGY_RULES: readonly StrategyRule[] = [
  // Highest priority: Environmental constraints
  {
    priority: 100,
    condition: ctx => ctx.isCI,
    strategy: {
      type: 'auto',
      useLockfile: true,
      skipConflicts: false,
      reason: 'CI environment detected',
    },
  },
  {
    priority: 90,
    condition: ctx => ctx.isOffline,
    strategy: {
      type: 'manual',
      reason: 'Offline mode detected - manual installation required',
    },
  },

  // High priority: Breaking conflicts
  {
    priority: 80,
    condition: ctx => ctx.conflictSeverity === 'breaking',
    strategy: {
      type: 'manual',
      reason: 'Breaking changes detected - manual review required',
      peerDeps: 'legacy',
    },
  },

  // Medium priority: Workspace + conflicts
  {
    priority: 70,
    condition: ctx => ctx.hasWorkspace && ctx.hasConflicts,
    strategy: {
      type: 'selective',
      preferWorkspace: true,
      reason: 'Workspace with conflicts - selective installation recommended',
    },
  },

  // Medium priority: Major conflicts
  {
    priority: 60,
    condition: ctx => ctx.conflictSeverity === 'major',
    strategy: {
      type: 'selective',
      reason: 'Major version conflicts - review needed',
    },
  },

  // Low priority: Minor conflicts
  {
    priority: 50,
    condition: ctx => ctx.conflictSeverity === 'minor',
    strategy: {
      type: 'smart',
      skipConflicts: false,
      reason: 'Minor version conflicts - smart resolution available',
    },
  },

  // Default: No conflicts
  {
    priority: 10,
    condition: () => true, // Always matches as fallback
    strategy: {
      type: 'auto',
      reason: 'No conflicts detected - automatic installation',
    },
  },
] as const;

/**
 * Recommend a dependency strategy based on context using data-driven rules
 */
export const recommendStrategy = (context: DependencyContext): DependencyStrategy => {
  // Find the highest priority rule that matches
  const matchingRule = STRATEGY_RULES.filter(rule => rule.condition(context)).sort(
    (a, b) => b.priority - a.priority
  )[0];

  // Apply workspace preference to strategy if applicable
  const baseStrategy = matchingRule.strategy;
  return {
    ...baseStrategy,
    preferWorkspace: baseStrategy.preferWorkspace ?? context.hasWorkspace,
  };
};

/**
 * Get all matching rules for debugging/analysis (exported for testing)
 */
export const getMatchingRules = (context: DependencyContext): readonly StrategyRule[] => {
  return STRATEGY_RULES.filter(rule => rule.condition(context)).sort(
    (a, b) => b.priority - a.priority
  );
};

/**
 * Create dependency context from analysis
 */
export const createDependencyContext = (
  analysis: DependencyAnalysis,
  workspace: WorkspaceInfo | null,
  ci: CIEnvironment | null,
  packageManager: string,
  hasLockfile: boolean,
  isOffline: boolean = false
): DependencyContext => ({
  hasConflicts: analysis.hasConflicts,
  conflictSeverity: analyzeConflictSeverity(analysis.conflicts),
  isCI: ci !== null,
  isOffline,
  hasWorkspace: workspace !== null,
  packageManager,
  hasLockfile,
});

// ============================================================================
// INSTALL OPTIONS
// ============================================================================

/**
 * Get install command options based on strategy and package manager
 */
export const getInstallOptions = (
  strategy: DependencyStrategy,
  packageManager: string,
  hasLockfile: boolean
): InstallOptions => {
  const pm = packageManager as PackageManagerName;

  // Get options from registry
  const options = getStrategyOptions(strategy, pm, hasLockfile);

  // Build command
  const command = buildInstallCommand(pm, {
    ci: options?.ci,
    force: options?.force,
    legacyPeerDeps: options?.legacyPeerDeps,
    frozen: options?.frozen,
    offline: options?.offline,
    verbose: options?.verbose,
    timeout: options?.timeout,
    workspace: strategy.preferWorkspace ? 'root' : undefined,
  });

  // Get environment
  const env = getPackageManagerEnv(pm, {
    color: true,
    ci: strategy.type === 'auto',
  });

  // Parse command back to flags (for compatibility)
  const commandParts = command.split(' ');
  const flags = commandParts.slice(2); // Skip "npm install" part

  return {
    packageManager,
    useLockfile: options?.frozen || options?.ci || false,
    flags: Object.freeze(flags),
    env: Object.freeze(env),
  };
};

// ============================================================================
// STRATEGY HELPERS
// ============================================================================

/**
 * Check if a strategy requires user interaction
 */
export const isInteractiveStrategy = (strategy: DependencyStrategyType): boolean => {
  return strategy === 'selective' || strategy === 'manual';
};

/**
 * Check if a strategy will modify package.json
 */
export const modifiesPackageJson = (strategy: DependencyStrategyType): boolean => {
  return strategy !== 'skip';
};

/**
 * Check if a strategy will run install command
 */
export const runsInstallCommand = (strategy: DependencyStrategyType): boolean => {
  return strategy === 'auto' || strategy === 'smart' || strategy === 'force';
};

/**
 * Get human-readable strategy description
 */
export const getStrategyDescription = (strategy: DependencyStrategyType): string => {
  switch (strategy) {
    case 'auto':
      return 'Automatically install all dependencies';
    case 'smart':
      return 'Smart resolution with automatic conflict handling';
    case 'selective':
      return 'Choose which dependencies to install';
    case 'manual':
      return 'Update package.json only (manual install required)';
    case 'skip':
      return 'Skip dependency management entirely';
    case 'force':
      return 'Force install, overriding all conflicts';
    default:
      return 'Unknown strategy';
  }
};

// ============================================================================
// FRAMEWORK-SPECIFIC STRATEGIES
// ============================================================================

/**
 * Get framework-specific dependency handling
 */
export const getFrameworkStrategy = (
  framework: string,
  hasConflicts: boolean
): Partial<DependencyStrategy> => {
  switch (framework) {
    case 'nextjs':
      // Next.js often has React version requirements
      return hasConflicts ? { peerDeps: 'legacy' } : {};

    case 'vite':
      // Vite is usually more flexible
      return {};

    case 'redwood-sdk':
      // RedwoodJS has specific requirements
      return { preferWorkspace: true };

    default:
      return {};
  }
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate strategy selection
 */
export const validateStrategy = (
  strategy: DependencyStrategy,
  context: DependencyContext
): readonly string[] => {
  const warnings: string[] = [];

  // Warn about force in production
  if (strategy.type === 'force' && !context.isCI) {
    warnings.push('Force strategy may break other packages - use with caution');
  }

  // Warn about skip with missing deps
  if (strategy.type === 'skip' && context.hasConflicts) {
    warnings.push('Skipping dependency management with conflicts may cause runtime errors');
  }

  // Warn about offline auto
  if (strategy.type === 'auto' && context.isOffline) {
    warnings.push('Auto-install may fail in offline mode');
  }

  return Object.freeze(warnings);
};
