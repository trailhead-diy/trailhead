/**
 * Enhanced AST transform factory for atomic operations
 */

import jscodeshift, { type API, type FileInfo, type Options } from 'jscodeshift';
import { type TransformResult, type TransformChange, type TransformConfig } from './types';

export interface ASTTransformOptions extends TransformConfig {
  parser?: 'ts' | 'tsx' | 'js' | 'jsx';
  preserveComments?: boolean;
}

export function createASTTransform(
  name: string,
  description: string,
  transformFn: (
    fileInfo: FileInfo,
    api: API,
    options: Options,
    changes: TransformChange[]
  ) => string | null | undefined
) {
  return {
    name,
    description,
    apply: (source: string, config: ASTTransformOptions = {}): TransformResult => {
      const changes: TransformChange[] = [];
      const { parser = 'tsx', preserveComments = true, ...restConfig } = config;

      try {
        const fileInfo: FileInfo = {
          path: 'temp.tsx',
          source,
        };

        const api: API = {
          jscodeshift: jscodeshift.withParser(parser),
          j: jscodeshift.withParser(parser),
          stats: () => {},
          report: () => {},
        };

        const options: Options = {
          ...restConfig,
          preserveComments,
        };

        transformFn(fileInfo, api, options, changes);

        return {
          hasChanges: changes.length > 0,
          changes,
        };
      } catch (error) {
        changes.push({
          type: 'error',
          description: `Transform ${name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });

        return {
          hasChanges: false,
          changes,
        };
      }
    },
  };
}

export function createRegexTransform(
  name: string,
  description: string,
  transformFn: (source: string, changes: TransformChange[]) => string
) {
  return {
    name,
    description,
    apply: (source: string, _config: TransformConfig = {}): TransformResult => {
      const changes: TransformChange[] = [];

      try {
        transformFn(source, changes);

        return {
          hasChanges: changes.length > 0,
          changes,
        };
      } catch (error) {
        changes.push({
          type: 'error',
          description: `Transform ${name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });

        return {
          hasChanges: false,
          changes,
        };
      }
    },
  };
}

export function logTransformResult(transformName: string, result: TransformResult): void {
  if (result.hasChanges) {
    console.log(`✅ ${transformName}: ${result.changes.length} changes`);
    result.changes.forEach((change, index) => {
      console.log(`  ${index + 1}. ${change.description}`);
    });
  } else {
    console.log(`⚪ ${transformName}: No changes needed`);
  }

  // Log errors if any
  const errors = result.changes.filter(c => c.type === 'error');
  if (errors.length > 0) {
    console.error(`❌ ${transformName} errors:`);
    errors.forEach(error => console.error(`  - ${error.description}`));
  }
}
