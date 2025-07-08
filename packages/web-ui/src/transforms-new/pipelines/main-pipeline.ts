/**
 * Main transformation pipeline using atomic transforms
 */

import { type AtomicTransform, type TransformResult } from '../core/types';
import { logTransformResult } from '../core/ast-factory';

// Import atomic transforms
import { addCatalystPrefix } from '../business-logic/catalyst-integration/add-catalyst-prefix';
import { addClassNameParam } from '../business-logic/className-management/add-className-param';
import { forwardClassName } from '../business-logic/className-management/forward-className';
import { reorderParameters } from '../ast-operations/parameters/reorder-parameters';

export interface PipelineConfig {
  dryRun?: boolean;
  verbose?: boolean;
  skipValidation?: boolean;
}

export interface PipelineResult {
  success: boolean;
  totalChanges: number;
  transformResults: Array<{
    name: string;
    result: TransformResult;
  }>;
  finalSource?: string;
  errors: string[];
}

export class MainTransformPipeline {
  private transforms: Array<{
    transform: AtomicTransform<any>;
    config?: any;
  }> = [];

  constructor(private config: PipelineConfig = {}) {}

  // Add atomic transforms to the pipeline
  addTransform<TConfig>(transform: AtomicTransform<TConfig>, config?: TConfig): this {
    this.transforms.push({ transform, config });
    return this;
  }

  // Execute the pipeline
  execute(source: string): PipelineResult {
    const result: PipelineResult = {
      success: true,
      totalChanges: 0,
      transformResults: [],
      finalSource: source,
      errors: [],
    };

    let currentSource = source;

    for (const { transform, config } of this.transforms) {
      try {
        const transformResult = transform.apply(currentSource, config);

        result.transformResults.push({
          name: transform.name,
          result: transformResult,
        });

        if (transformResult.hasChanges) {
          result.totalChanges += transformResult.changes.length;
          // For now, we'll assume the transform returns the modified source
          // In a real implementation, we'd need to extract the source from the result
        }

        if (this.config.verbose) {
          logTransformResult(transform.name, transformResult);
        }

        // Check for errors
        const errors = transformResult.changes.filter(c => c.type === 'error');
        if (errors.length > 0) {
          result.errors.push(...errors.map(e => e.description));
        }
      } catch (error) {
        const errorMessage = `Transform ${transform.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMessage);
        result.success = false;

        if (this.config.verbose) {
          console.error(`❌ ${errorMessage}`);
        }
      }
    }

    result.finalSource = currentSource;
    return result;
  }
}

// Pre-configured pipelines for common use cases

export function createCatalystPrefixPipeline(config: PipelineConfig = {}): MainTransformPipeline {
  return new MainTransformPipeline(config).addTransform(addCatalystPrefix, { scope: 'all' });
}

export function createClassNamePipeline(config: PipelineConfig = {}): MainTransformPipeline {
  return new MainTransformPipeline(config)
    .addTransform(addClassNameParam, { position: 'before-rest' })
    .addTransform(forwardClassName, {});
}

export function createCompletePipeline(config: PipelineConfig = {}): MainTransformPipeline {
  return (
    new MainTransformPipeline(config)
      // 1. Add Catalyst prefixes first
      .addTransform(addCatalystPrefix, { scope: 'all' })
      // 2. Add className parameters
      .addTransform(addClassNameParam, { position: 'before-rest' })
      // 3. Forward className to children
      .addTransform(forwardClassName, {})
      // 4. Fix parameter ordering (last to fix any syntax issues)
      .addTransform(reorderParameters, {})
  );
}

// Backward compatibility with existing transform approach
export function applyMainTransforms(source: string, config: PipelineConfig = {}): PipelineResult {
  return createCompletePipeline(config).execute(source);
}
