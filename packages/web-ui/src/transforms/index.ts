/**
 * New functional transform pipeline using CLI framework architecture
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import { ok } from '@esteban-url/cli/core';
import type { Logger } from '@esteban-url/cli/core';
import { isNotTestRelated } from '../cli/core/shared/file-filters.js';
// Import FileSystem from CLI framework
import type { FileSystem } from '@esteban-url/cli/filesystem';

// Import functional transforms
import { transformClsxToCn, clsxToCnTransform } from './imports/clsx-to-cn.js';
import { transformCatalystPrefix, catalystPrefixTransform } from './format/prefixing/index.js';
import { transformSemanticColors, semanticColorsTransform } from './semantic/color-tokens/index.js';
import { transformFileHeaders, fileHeadersTransform } from './format/file-headers.js';
import { transformTsNocheck, tsNocheckTransform } from './format/ts-nocheck.js';
import {
  transformRemoveDuplicateProps,
  removeDuplicatePropsTransform,
} from './format/remove-duplicate-props.js';
import { transformReorderCnArgs, reorderCnArgsTransform } from './format/reorder-cn-args.js';

/**
 * Execute the new functional pipeline on a directory of files
 */
export async function runMainPipeline(
  sourceDir: string,
  options: {
    verbose?: boolean;
    dryRun?: boolean;
    filter?: (filename: string) => boolean;
    logger?: Logger;
  } = {}
): Promise<{
  success: boolean;
  processedFiles: number;
  errors: Array<{ file: string; error: string }>;
  summary: string;
}> {
  return runMainPipelineWithFs(null, sourceDir, options);
}

/**
 * Execute the new functional pipeline with injectable filesystem
 */
export async function runMainPipelineWithFs(
  fs: FileSystem | null,
  sourceDir: string,
  options: {
    verbose?: boolean;
    dryRun?: boolean;
    filter?: (filename: string) => boolean;
    logger?: Logger;
  } = {}
): Promise<{
  success: boolean;
  processedFiles: number;
  errors: Array<{ file: string; error: string }>;
  summary: string;
}> {
  const { verbose = false, dryRun = false, filter, logger } = options;

  // Create a basic logger if none provided
  const defaultLogger = {
    info: (msg: string) => console.log(msg),
    warn: (msg: string) => console.warn(msg),
    error: (msg: string) => console.error(msg),
    debug: (msg: string) => verbose && console.log(msg),
    success: (msg: string) => console.log(msg),
  };

  const effectiveLogger = logger || defaultLogger;

  effectiveLogger.info(`🚀 Running pipeline on ${sourceDir}`);

  if (dryRun) {
    effectiveLogger.info('🔍 DRY RUN MODE - No files will be modified');
  }

  const errors: Array<{ file: string; error: string }> = [];
  let processedFiles = 0;

  try {
    // Use injected filesystem if available, otherwise Node.js fs
    const dirResult = fs ? await fs.readdir(sourceDir) : ok(await readdir(sourceDir));

    if (dirResult.isErr()) {
      errors.push({ file: sourceDir, error: 'Failed to read directory' });
      return {
        success: false,
        processedFiles: 0,
        errors,
        summary: 'Failed to read directory',
      };
    }

    const files = dirResult.value;

    const tsxFiles = files.filter(f => f.endsWith('.tsx') && isNotTestRelated(f));
    const filteredFiles = filter ? tsxFiles.filter(filter) : tsxFiles;

    // effectiveLogger.info(`Found ${filteredFiles.length} component files to process`);

    // Define functional transforms to apply
    const transforms = [
      { ...clsxToCnTransform, transform: transformClsxToCn },
      { ...catalystPrefixTransform, transform: transformCatalystPrefix },
      { ...semanticColorsTransform, transform: transformSemanticColors },
      { ...removeDuplicatePropsTransform, transform: transformRemoveDuplicateProps },
      { ...reorderCnArgsTransform, transform: transformReorderCnArgs },
      { ...tsNocheckTransform, transform: transformTsNocheck },
      { ...fileHeadersTransform, transform: transformFileHeaders },
    ];

    for (const file of filteredFiles) {
      const filePath = join(sourceDir, file);

      try {
        if (verbose) {
          effectiveLogger.info(`Processing ${file}...`);
        }

        // Use injected filesystem if available
        const contentResult = fs
          ? await fs.readFile(filePath)
          : ok(await readFile(filePath, 'utf-8'));

        if (contentResult.isErr()) {
          errors.push({ file, error: 'Failed to read file' });
          continue;
        }

        let content = contentResult.value.toString();
        let hasChanges = false;
        const allWarnings: string[] = [];

        // Apply all transforms in sequence
        for (const transform of transforms) {
          // Pass filename to transforms that need it (like ts-nocheck)
          const result =
            transform.name === 'ts-nocheck'
              ? transform.transform(content, file)
              : transform.transform(content);

          if (result.isOk()) {
            const transformResult = result.value;
            if (transformResult.changed) {
              content = transformResult.content;
              hasChanges = true;
              if (verbose) {
                effectiveLogger.info(`  ✓ ${transform.name}: applied`);
              }
            } else if (verbose) {
              effectiveLogger.debug(`  - ${transform.name}: no changes`);
            }

            // Collect warnings
            allWarnings.push(...transformResult.warnings);
          } else {
            const errorMessage = result.error?.message || String(result.error);
            errors.push({ file, error: `${transform.name}: ${errorMessage}` });
            effectiveLogger.error(`❌ ${file} (${transform.name}): ${errorMessage}`);
          }
        }

        // Write file if changes were made and not in dry run mode
        if (hasChanges && !dryRun) {
          const writeResult = fs
            ? await fs.writeFile(filePath, content)
            : ok(await writeFile(filePath, content, 'utf-8'));

          if (writeResult.isErr()) {
            errors.push({ file, error: 'Failed to write file' });
            continue;
          }
        }

        // Log warnings if any
        if (allWarnings.length > 0 && verbose) {
          for (const warning of allWarnings) {
            effectiveLogger.info(`  ⚠️  ${warning}`);
          }
        }

        if (hasChanges) {
          processedFiles++;
          if (verbose) {
            effectiveLogger.info(
              `✅ ${file} (${hasChanges ? 'modified' : 'unchanged'})${dryRun ? ' (dry run)' : ''}`
            );
          }
        } else if (verbose) {
          effectiveLogger.info(`- ${file} (no changes)`);
        }
      } catch (error: any) {
        errors.push({ file, error: error.message });
        effectiveLogger.error(`❌ ${file}: ${error.message}`);
      }
    }
  } catch (error: any) {
    errors.push({ file: sourceDir, error: error.message });
    effectiveLogger.error(`Failed to read directory: ${error.message}`);
  }

  // Generate summary
  const summary = [
    `Processed ${processedFiles} files`,
    errors.length > 0 ? `${errors.length} errors` : 'No errors',
    dryRun ? '(dry run)' : '',
  ]
    .filter(Boolean)
    .join(', ');

  // effectiveLogger.info(`✨ New pipeline complete: ${summary}`);

  return {
    success: errors.length === 0,
    processedFiles,
    errors,
    summary,
  };
}

/**
 * Get information about the new functional pipeline
 */
export function getMainPipelineInfo(): {
  transformCount: number;
  transforms: Array<{ name: string; description: string; type: string }>;
  categories: Record<string, number>;
} {
  const transforms = [
    {
      name: clsxToCnTransform.name,
      description: clsxToCnTransform.description,
      type: clsxToCnTransform.category,
    },
    {
      name: catalystPrefixTransform.name,
      description: catalystPrefixTransform.description,
      type: catalystPrefixTransform.category,
    },
    {
      name: semanticColorsTransform.name,
      description: semanticColorsTransform.description,
      type: semanticColorsTransform.category,
    },
    {
      name: removeDuplicatePropsTransform.name,
      description: removeDuplicatePropsTransform.description,
      type: removeDuplicatePropsTransform.category,
    },
    {
      name: reorderCnArgsTransform.name,
      description: reorderCnArgsTransform.description,
      type: reorderCnArgsTransform.category,
    },
    {
      name: tsNocheckTransform.name,
      description: tsNocheckTransform.description,
      type: tsNocheckTransform.category,
    },
    {
      name: fileHeadersTransform.name,
      description: fileHeadersTransform.description,
      type: fileHeadersTransform.category,
    },
  ];

  const categories = transforms.reduce(
    (acc, transform) => {
      acc[transform.type] = (acc[transform.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    transformCount: transforms.length,
    transforms,
    categories,
  };
}
