/**
 * Base transform infrastructure using CLI framework Result types
 * Provides foundation for maintainable, composable transforms
 */

import type { Result, CLIError } from '@esteban-url/trailhead-cli/core';
import type { Logger } from '@esteban-url/trailhead-cli/core';
import { Ok, Err } from '@esteban-url/trailhead-cli/core';

/**
 * Transform execution context
 */
export interface TransformContext {
  readonly logger: Logger;
  readonly dryRun: boolean;
  readonly debug: boolean;
  readonly filePath: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Transform execution result with metadata
 */
export interface TransformResult {
  readonly content: string;
  readonly changed: boolean;
  readonly warnings: string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Base transform interface using CLI Result types
 */
export interface Transform {
  readonly name: string;
  readonly description: string;
  readonly category: 'semantic' | 'format' | 'quality' | 'import' | 'ast';

  /**
   * Execute transform with proper error handling
   */
  execute(input: string, context: TransformContext): Promise<Result<TransformResult, CLIError>>;
}

/**
 * Abstract base class for immutable transforms
 */
export abstract class ImmutableTransform implements Transform {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly category: Transform['category'];

  async execute(
    input: string,
    context: TransformContext
  ): Promise<Result<TransformResult, CLIError>> {
    try {
      if (context.debug) {
        context.logger.info(`[${this.name}] Starting transformation`);
        context.logger.info(`[${this.name}] Input length: ${input.length}`);
      }

      const startTime = performance.now();

      // Execute the actual transformation
      const result = await this.transform(input, context);

      const endTime = performance.now();
      const duration = endTime - startTime;

      if (context.debug) {
        context.logger.info(`[${this.name}] Completed in ${duration.toFixed(2)}ms`);
        context.logger.info(`[${this.name}] Changed: ${result.changed}`);
        context.logger.info(`[${this.name}] Warnings: ${result.warnings.length}`);
      }

      // Log warnings
      for (const warning of result.warnings) {
        context.logger.error(`[${this.name}] ${warning}`);
      }

      return Ok(result);
    } catch (error) {
      const cliError: CLIError = {
        code: 'TRANSFORM_ERROR',
        message: `Transform ${this.name} failed: ${error instanceof Error ? error.message : String(error)}`,
        details: error instanceof Error ? error.stack : undefined,
        cause: error,
        recoverable: true,
      };

      if (context.debug) {
        context.logger.error(`[${this.name}] Error: ${cliError.message}`);
        if (cliError.details) {
          context.logger.error(`[${this.name}] Stack: ${cliError.details}`);
        }
      }

      return Err(cliError);
    }
  }

  /**
   * Implement the actual transformation logic
   */
  protected abstract transform(input: string, context: TransformContext): Promise<TransformResult>;
}

/**
 * Utility functions for transform results
 */
export const TransformUtils = {
  /**
   * Create a successful transform result
   */
  success: (
    content: string,
    changed: boolean = true,
    warnings: string[] = []
  ): TransformResult => ({
    content,
    changed,
    warnings,
  }),

  /**
   * Create a no-change result
   */
  noChange: (content: string, warnings: string[] = []): TransformResult => ({
    content,
    changed: false,
    warnings,
  }),

  /**
   * Create a transform error
   */
  error: (code: string, message: string, details?: string, cause?: unknown): CLIError => ({
    code,
    message,
    details,
    cause,
    recoverable: true,
  }),

  /**
   * Check if content has changed
   */
  hasChanged: (original: string, transformed: string): boolean => {
    return original !== transformed;
  },

  /**
   * Sanitize content for comparison
   */
  sanitizeForComparison: (content: string): string => {
    return content.trim().replace(/\s+/g, ' ');
  },
};
