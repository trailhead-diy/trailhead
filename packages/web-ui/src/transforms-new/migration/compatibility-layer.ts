/**
 * Compatibility layer for migrating from old transforms to atomic transforms
 */

import { type Transform, type Change } from '../core/types';
import { type AtomicTransform } from '../core/types';

// Import the old transform types
import { reorderParameters } from '../ast-operations/parameters/reorder-parameters';
import { addCatalystPrefix } from '../business-logic/catalyst-integration/add-catalyst-prefix';

/**
 * Convert atomic transform to old Transform interface
 */
export function atomicToLegacyTransform<TConfig = any>(
  atomicTransform: AtomicTransform<TConfig>,
  defaultConfig?: TConfig
): Transform {
  return {
    name: atomicTransform.name,
    description: atomicTransform.description,
    apply: (source: string): { source: string; changes: Change[] } => {
      const result = atomicTransform.apply(source, defaultConfig);

      // Convert new change format to old format
      const legacyChanges: Change[] = result.changes.map(change => ({
        type: change.type,
        description: change.description,
        before: change.before || '',
        after: change.after || '',
      }));

      return {
        source, // For now, we'll return the original source as atomic transforms don't modify in place
        changes: legacyChanges,
      };
    },
  };
}

/**
 * Compatibility versions of atomic transforms using legacy interface
 */
export const legacyReorderParametersTransform = atomicToLegacyTransform(reorderParameters);

export const legacyAddCatalystPrefixTransform = atomicToLegacyTransform(addCatalystPrefix, {
  scope: 'all' as const,
});

/**
 * Migration helper: Apply multiple atomic transforms as legacy transforms
 */
export function createLegacyPipeline(
  atomicTransforms: Array<{
    transform: AtomicTransform<any>;
    config?: any;
  }>
): Transform {
  return {
    name: 'atomic-pipeline',
    description: 'Pipeline of atomic transforms',
    apply: (source: string): { source: string; changes: Change[] } => {
      let currentSource = source;
      const allChanges: Change[] = [];

      for (const { transform, config } of atomicTransforms) {
        const result = transform.apply(currentSource, config);

        // Convert changes to legacy format
        const legacyChanges: Change[] = result.changes.map(change => ({
          type: change.type,
          description: change.description,
          before: change.before || '',
          after: change.after || '',
        }));

        allChanges.push(...legacyChanges);

        // Note: In a real implementation, we'd need to extract the modified source
        // For now, atomic transforms return results, not modified source
      }

      return {
        source: currentSource,
        changes: allChanges,
      };
    },
  };
}
