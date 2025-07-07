/**
 * Dependency resolution module with functional composition
 */

import semver from 'semver';
import type { PackageJsonDeps } from './types.js';

// ============================================================================
// TYPES
// ============================================================================

export interface DependencyConflict {
  readonly name: string;
  readonly current: string;
  readonly required: string;
}

export interface DependencyAnalysis {
  readonly missing: Readonly<Record<string, string>>;
  readonly conflicts: readonly DependencyConflict[];
  readonly existing: Readonly<Record<string, string>>;
  readonly hasConflicts: boolean;
}

export interface ResolutionResult {
  readonly dependencies: Readonly<Record<string, string>>;
  readonly overrides: Readonly<Record<string, string>>;
  readonly warnings: readonly string[];
  readonly suggestions: readonly string[];
}

export type ResolutionStrategy = 'smart' | 'strict' | 'force' | 'legacy';

interface ConflictResolution {
  readonly type: 'incompatible' | 'override' | 'satisfied';
  readonly dependency?: Readonly<Record<string, string>>;
  readonly override?: Readonly<Record<string, string>>;
  readonly warning?: string;
  readonly suggestion?: string;
}

export type ConflictSeverity = 'minor' | 'major' | 'breaking';

// ============================================================================
// DEPENDENCY ANALYSIS
// ============================================================================

/**
 * Analyze dependencies to find missing and conflicting packages
 */
export const analyzeDependencies = (
  currentDeps: PackageJsonDeps,
  requiredDeps: Readonly<Record<string, string>>
): DependencyAnalysis => {
  const allCurrentDeps = {
    ...currentDeps.dependencies,
    ...currentDeps.devDependencies,
  };

  const missing: Record<string, string> = {};
  const conflicts: DependencyConflict[] = [];
  const existing: Record<string, string> = {};

  for (const [name, requiredVersion] of Object.entries(requiredDeps)) {
    const currentVersion = allCurrentDeps[name];

    if (!currentVersion) {
      missing[name] = requiredVersion;
    } else if (!semver.satisfies(currentVersion, requiredVersion)) {
      conflicts.push({
        name,
        current: currentVersion,
        required: requiredVersion,
      });
    } else {
      existing[name] = currentVersion;
    }
  }

  return {
    missing: Object.freeze(missing),
    conflicts: Object.freeze(conflicts),
    existing: Object.freeze(existing),
    hasConflicts: conflicts.length > 0,
  };
};

// ============================================================================
// VERSION COMPATIBILITY
// ============================================================================

/**
 * Find a compatible version between current and required
 */
const findCompatibleVersion = (
  current: string,
  required: string
): { version: string; strategy: 'current' | 'required' | 'intersection' } | null => {
  // Current satisfies required
  if (semver.satisfies(current, required)) {
    return { version: current, strategy: 'current' };
  }

  // No intersection possible
  if (!semver.intersects(current, required)) {
    return null;
  }

  // Find intersection
  const minRequired = semver.minVersion(required);
  const minCurrent = semver.minVersion(current);

  if (!minRequired || !minCurrent) {
    return null;
  }

  // Use the higher minimum version
  const version = semver.gte(minRequired, minCurrent) ? required : current;
  return { version, strategy: 'intersection' };
};

/**
 * Analyze the severity of a version conflict
 */
export const analyzeConflictSeverity = (
  conflicts: readonly DependencyConflict[]
): ConflictSeverity => {
  if (conflicts.length === 0) return 'minor';

  const severities = conflicts.map(conflict => {
    const currentMajor = semver.major(conflict.current);
    const requiredMajor = semver.major(conflict.required);

    if (currentMajor !== requiredMajor) return 'breaking';

    const currentMinor = semver.minor(conflict.current);
    const requiredMinor = semver.minor(conflict.required);

    if (currentMinor !== requiredMinor) return 'major';

    return 'minor';
  });

  // Return highest severity
  if (severities.includes('breaking')) return 'breaking';
  if (severities.includes('major')) return 'major';
  return 'minor';
};

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

/**
 * Resolve a single dependency conflict
 */
const resolveConflict = (conflict: DependencyConflict): ConflictResolution => {
  const compatible = findCompatibleVersion(conflict.current, conflict.required);

  if (!compatible) {
    return {
      type: 'incompatible',
      dependency: { [conflict.name]: conflict.required },
      warning: `${conflict.name}: Breaking change from ${conflict.current} to ${conflict.required}`,
    };
  }

  if (compatible.strategy === 'current') {
    return {
      type: 'satisfied',
      warning: `${conflict.name}: Current version ${conflict.current} satisfies ${conflict.required}`,
    };
  }

  return {
    type: 'override',
    override: { [conflict.name]: compatible.version },
    suggestion: `Using ${conflict.name}@${compatible.version} to satisfy both requirements`,
  };
};

/**
 * Resolve all dependency conflicts using a specific strategy
 */
export const resolveDependencies = (
  analysis: DependencyAnalysis,
  strategy: ResolutionStrategy
): ResolutionResult => {
  // Strict mode - no automatic resolution
  if (strategy === 'strict') {
    return {
      dependencies: analysis.missing,
      overrides: {},
      warnings: analysis.conflicts.map(
        c => `Conflict: ${c.name} requires ${c.required} but found ${c.current}`
      ),
      suggestions: [],
    };
  }

  // Force mode - just use required versions
  if (strategy === 'force') {
    const forcedDeps = analysis.conflicts.reduce(
      (acc, conflict) => ({ ...acc, [conflict.name]: conflict.required }),
      analysis.missing
    );

    return {
      dependencies: forcedDeps,
      overrides: {},
      warnings: ['Using --force strategy, overriding all conflicts'],
      suggestions: [],
    };
  }

  // Legacy mode - ignore peer dependencies
  if (strategy === 'legacy') {
    return {
      dependencies: analysis.missing,
      overrides: {},
      warnings: ['Using --legacy-peer-deps strategy, conflicts may remain'],
      suggestions: analysis.conflicts.map(c => `Review ${c.name}: ${c.current} vs ${c.required}`),
    };
  }

  // Smart resolution
  const resolutions = analysis.conflicts.map(resolveConflict);

  return resolutions.reduce<ResolutionResult>(
    (acc, resolution) => {
      switch (resolution.type) {
        case 'incompatible':
          return {
            ...acc,
            dependencies: { ...acc.dependencies, ...(resolution.dependency || {}) },
            warnings: [...acc.warnings, resolution.warning || ''],
          };

        case 'override':
          return {
            ...acc,
            overrides: { ...acc.overrides, ...(resolution.override || {}) },
            suggestions: [...acc.suggestions, resolution.suggestion || ''],
          };

        case 'satisfied':
          return {
            ...acc,
            warnings: [...acc.warnings, resolution.warning || ''],
          };
      }
    },
    {
      dependencies: analysis.missing,
      overrides: {},
      warnings: [],
      suggestions: [],
    }
  );
};

// ============================================================================
// DEPENDENCY HELPERS
// ============================================================================

/**
 * Check if a dependency is a shared/common dependency
 */
export const isSharedDependency = (name: string): boolean => {
  const sharedPatterns = [
    /^@types\//,
    /^typescript$/,
    /^eslint/,
    /^prettier/,
    /^vitest/,
    /^jest/,
    /^@testing-library/,
  ];

  return sharedPatterns.some(pattern => pattern.test(name));
};

/**
 * Filter dependencies by type
 */
export const filterDependencies = (
  deps: Readonly<Record<string, string>>,
  predicate: (name: string, version: string) => boolean
): Readonly<Record<string, string>> => {
  const filtered: Record<string, string> = {};

  for (const [name, version] of Object.entries(deps)) {
    if (predicate(name, version)) {
      filtered[name] = version;
    }
  }

  return Object.freeze(filtered);
};

/**
 * Merge dependency records
 */
export const mergeDependencies = (
  ...deps: Array<Readonly<Record<string, string>>>
): Readonly<Record<string, string>> => {
  return Object.freeze(Object.assign({}, ...deps));
};

/**
 * Get dependency install order (topological sort)
 * For now, returns deps as-is (would need full dependency graph for proper sorting)
 */
export const getDependencyInstallOrder = (
  deps: Readonly<Record<string, string>>
): readonly string[] => {
  // Simple heuristic: install types and build tools first
  const entries = Object.entries(deps);

  const types = entries.filter(([name]) => name.startsWith('@types/'));
  const buildTools = entries.filter(([name]) =>
    /typescript|vite|webpack|rollup|esbuild/.test(name)
  );
  const others = entries.filter(
    ([name]) => !name.startsWith('@types/') && !/typescript|vite|webpack|rollup|esbuild/.test(name)
  );

  return Object.freeze([
    ...types.map(([name]) => name),
    ...buildTools.map(([name]) => name),
    ...others.map(([name]) => name),
  ]);
};

// ============================================================================
// PEER DEPENDENCY HANDLING
// ============================================================================

/**
 * Determine if a conflict is likely a peer dependency issue
 */
export const isPeerDependencyConflict = (conflict: DependencyConflict): boolean => {
  // If versions are very different, likely a peer dep issue
  const currentMajor = semver.major(conflict.current);
  const requiredMajor = semver.major(conflict.required);

  // Major version differences often indicate peer dep conflicts
  return currentMajor !== requiredMajor;
};

/**
 * Get peer dependency resolution strategy
 */
export const getPeerDependencyStrategy = (
  conflicts: readonly DependencyConflict[]
): 'strict' | 'legacy' | 'smart' => {
  const peerConflicts = conflicts.filter(isPeerDependencyConflict);

  if (peerConflicts.length === 0) {
    return 'strict';
  }

  // If all peer conflicts are for React ecosystem, use smart
  const allReactRelated = peerConflicts.every(c => /react|react-dom|@types\/react/.test(c.name));

  if (allReactRelated) {
    return 'smart';
  }

  // Default to legacy for safety
  return 'legacy';
};
