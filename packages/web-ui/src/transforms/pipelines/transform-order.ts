/**
 * Transform execution order configuration
 * Defines the order in which transforms are applied and their dependencies
 */

import type { TransformPhase } from '../shared/types.js';

/**
 * The order in which transforms are executed is critical for correct operation.
 * Some transforms depend on the output of others.
 */
export const TRANSFORM_ORDER: TransformPhase[] = [
  // ======================================================================
  // Phase 1: Import transformations (AST)
  // Must run first as other transforms depend on having correct imports
  // ======================================================================
  {
    path: 'common/imports/clsx-to-cn',
    type: 'ast',
  },

  // ======================================================================
  // Phase 2: Structural transformations (AST)
  // Need proper structure before applying styles
  // ======================================================================
  {
    path: 'common/className/add-parameter',
    type: 'ast',
  },
  {
    path: 'common/className/wrap-static',
    type: 'ast',
  },
  {
    path: 'components/*/semantic-enhancement',
    type: 'ast',
    parallel: true, // Can run all component enhancements in parallel
  },
  {
    path: 'components/button/add-semantic-colors',
    type: 'ast',
  },
  {
    path: 'components/badge/add-semantic-colors',
    type: 'ast',
  },
  {
    path: 'components/checkbox/add-semantic-colors',
    type: 'ast',
  },
  {
    path: 'components/radio/add-semantic-colors',
    type: 'ast',
  },
  {
    path: 'components/switch/add-semantic-colors',
    type: 'ast',
  },

  // Update default colors to semantic tokens
  {
    path: 'common/semantic-tokens/update-defaults/button',
    type: 'ast',
  },
  {
    path: 'common/semantic-tokens/update-defaults/badge',
    type: 'ast',
  },
  {
    path: 'common/semantic-tokens/update-defaults/checkbox',
    type: 'ast',
  },
  {
    path: 'common/semantic-tokens/update-defaults/radio',
    type: 'ast',
  },
  {
    path: 'common/semantic-tokens/update-defaults/switch',
    type: 'ast',
  },

  // ======================================================================
  // Phase 3: Color transformations (Regex)
  // Common transforms before component-specific ones
  // ======================================================================
  {
    path: 'common/colors/base-mappings',
    type: 'regex',
  },
  {
    path: 'common/colors/interactive-states',
    type: 'regex',
  },
  {
    path: 'common/colors/dark-mode',
    type: 'regex',
  },
  {
    path: 'common/colors/special-patterns',
    type: 'regex',
  },
  {
    path: 'components/*/color-mappings',
    type: 'regex',
    parallel: true,
  },
  {
    path: 'common/colors/remove-color-prefix',
    type: 'regex',
  },
  {
    path: 'common/colors/add-enhanced-fallbacks',
    type: 'regex',
  },

  // ======================================================================
  // Phase 4: Edge case fixes (Regex)
  // Fix what the main transforms missed
  // ======================================================================
  {
    path: 'common/edge-cases/text-colors',
    type: 'regex',
  },
  {
    path: 'common/edge-cases/icon-fills',
    type: 'regex',
  },
  {
    path: 'common/edge-cases/blue-to-primary',
    type: 'regex',
  },
  {
    path: 'common/edge-cases/focus-states',
    type: 'regex',
  },
  {
    path: 'components/*/edge-cases',
    type: 'regex',
    parallel: true,
    optional: true, // Not all components have edge cases
  },

  // ======================================================================
  // Phase 5: Cleanup (AST)
  // Clean up after all modifications
  // ======================================================================
  {
    path: 'common/className/reorder-args',
    type: 'ast',
  },
  {
    path: 'common/className/ensure-in-cn',
    type: 'ast',
  },
  {
    path: 'common/className/remove-unused',
    type: 'ast',
  },

  // ======================================================================
  // Phase 6: Formatting
  // Final formatting after all code changes
  // ======================================================================
  {
    path: 'common/formatting/file-headers',
    type: 'regex',
  },
  {
    path: 'common/formatting/post-process',
    type: 'ast',
  },
];

/**
 * Get transforms for a specific phase
 */
export function getTransformsByPhase(phase: number): TransformPhase[] {
  const phases = [
    [0, 1], // Phase 1: Imports
    [2, 12], // Phase 2: Structure (includes semantic-enhancement, add-semantic-colors, and update-defaults)
    [13, 19], // Phase 3: Colors (includes remove-color-prefix and add-enhanced-fallbacks)
    [20, 24], // Phase 4: Edge cases
    [25, 27], // Phase 5: Cleanup
    [28, 29], // Phase 6: Formatting
  ];

  if (phase < 1 || phase > phases.length) {
    throw new Error(`Invalid phase: ${phase}. Must be between 1 and ${phases.length}`);
  }

  const [start, end] = phases[phase - 1];
  return TRANSFORM_ORDER.slice(start, end + 1);
}

/**
 * Get all transforms that can run in parallel
 */
export function getParallelTransforms(): TransformPhase[] {
  return TRANSFORM_ORDER.filter(t => t.parallel);
}

/**
 * Get all optional transforms
 */
export function getOptionalTransforms(): TransformPhase[] {
  return TRANSFORM_ORDER.filter(t => t.optional);
}
