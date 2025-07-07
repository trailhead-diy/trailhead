/**
 * Simplified pipeline for essential Catalyst enhancements
 * Focuses on semantic colors and className handling only
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import type { Transform } from '../shared/types.js';

// Essential semantic color transforms (per component)
import { buttonAddSemanticColorsTransform } from '../components/button/add-semantic-colors.js';
import { badgeAddSemanticColorsTransform } from '../components/badge/add-semantic-colors.js';
import { checkboxAddSemanticColorsTransform } from '../components/checkbox/add-semantic-colors.js';
import { radioAddSemanticColorsTransform } from '../components/radio/add-semantic-colors.js';
import { switchAddSemanticColorsTransform } from '../components/switch/add-semantic-colors.js';

// Essential className handling transforms
import { addClassNameParameterTransform } from '../components/common/className/add-parameter.js';
import { wrapStaticClassNameTransform } from '../components/common/className/wrap-static.js';
import { ensureClassNameInCnTransform } from '../components/common/className/ensure-in-cn.js';
import { reorderClassNameArgsTransform } from '../components/common/className/reorder-args.js';
import { removeUnusedClassNameTransform } from '../components/common/className/remove-unused.js';

// Import consistency
import { clsxToCnTransform } from '../components/common/imports/clsx-to-cn.js';

// Formatting
import { fileHeadersTransform } from '../components/common/formatting/file-headers.js';

/**
 * Simplified transform order - only essential transforms
 */
const SIMPLIFIED_TRANSFORM_ORDER: Transform[] = [
  // 1. Import consistency first
  clsxToCnTransform,

  // 2. Add semantic colors to components
  buttonAddSemanticColorsTransform,
  badgeAddSemanticColorsTransform,
  checkboxAddSemanticColorsTransform,
  radioAddSemanticColorsTransform,
  switchAddSemanticColorsTransform,

  // 3. className parameter management
  addClassNameParameterTransform,
  wrapStaticClassNameTransform,
  ensureClassNameInCnTransform,
  reorderClassNameArgsTransform,
  removeUnusedClassNameTransform,

  // 4. Final formatting
  fileHeadersTransform,
];

/**
 * Check if an error is a non-critical AST parsing warning that should be suppressed
 */
function isNonCriticalASTError(error: any): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message;

  // Suppress specific AST parsing warnings that don't affect functionality
  const suppressedPatterns = [
    'Rest element must be last element',
    'SyntaxError: Rest element must be last element',
    'ElementAfterRest',
  ];

  return suppressedPatterns.some(pattern => message.includes(pattern));
}

/**
 * Execute the simplified pipeline on a directory of files
 */
export async function runSimplifiedPipeline(
  sourceDir: string,
  options: {
    verbose?: boolean;
    dryRun?: boolean;
    filter?: (filename: string) => boolean;
  } = {}
): Promise<{
  success: boolean;
  processedFiles: number;
  errors: Array<{ file: string; error: string }>;
  summary: string;
}> {
  const { verbose = false, dryRun = false, filter } = options;

  console.log(chalk.blue(`🚀 Running simplified pipeline on ${sourceDir}`));
  console.log(chalk.gray(`Transforms: ${SIMPLIFIED_TRANSFORM_ORDER.length} essential transforms`));

  if (dryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No files will be modified'));
  }

  const errors: Array<{ file: string; error: string }> = [];
  let processedFiles = 0;

  try {
    const files = await readdir(sourceDir);
    const tsxFiles = files.filter(f => f.endsWith('.tsx'));
    const filteredFiles = filter ? tsxFiles.filter(filter) : tsxFiles;

    console.log(chalk.gray(`Found ${filteredFiles.length} component files to process`));

    for (const file of filteredFiles) {
      const filePath = join(sourceDir, file);

      try {
        if (verbose) {
          console.log(chalk.gray(`Processing ${file}...`));
        }

        let content = await readFile(filePath, 'utf-8');
        let hasChanges = false;

        // Apply each transform in order
        for (const transform of SIMPLIFIED_TRANSFORM_ORDER) {
          try {
            const result = transform.execute(content);

            if (result.hasChanges) {
              content = result.content;
              hasChanges = true;

              if (verbose && result.changes.length > 0) {
                console.log(chalk.green(`  ✓ ${transform.name}: ${result.changes.length} changes`));
              }
            }
          } catch (error: any) {
            if (!isNonCriticalASTError(error)) {
              console.warn(chalk.yellow(`  ⚠ ${transform.name} failed: ${error.message}`));
            }
          }
        }

        // Write file if changes were made and not in dry run mode
        if (hasChanges && !dryRun) {
          await writeFile(filePath, content, 'utf-8');
        }

        if (hasChanges) {
          processedFiles++;
          if (verbose) {
            console.log(chalk.green(`  ✓ ${file} ${dryRun ? '(would be updated)' : 'updated'}`));
          }
        } else if (verbose) {
          console.log(chalk.gray(`  - ${file} (no changes)`));
        }
      } catch (error: any) {
        errors.push({ file, error: error.message });
        console.error(chalk.red(`  ❌ ${file}: ${error.message}`));
      }
    }
  } catch (error: any) {
    errors.push({ file: sourceDir, error: error.message });
    console.error(chalk.red(`Failed to read directory: ${error.message}`));
  }

  // Generate summary
  const summary = [
    `Processed ${processedFiles} files`,
    errors.length > 0 ? `${errors.length} errors` : 'No errors',
    dryRun ? '(dry run)' : '',
  ]
    .filter(Boolean)
    .join(', ');

  console.log(chalk.blue(`✨ Pipeline complete: ${summary}`));

  return {
    success: errors.length === 0,
    processedFiles,
    errors,
    summary,
  };
}

/**
 * Get information about the simplified pipeline
 */
export function getSimplifiedPipelineInfo(): {
  transformCount: number;
  transforms: Array<{ name: string; description: string; type: string }>;
  categories: Record<string, number>;
} {
  const transforms = SIMPLIFIED_TRANSFORM_ORDER.map(t => ({
    name: t.name,
    description: t.description,
    type: t.type,
  }));

  const categories = {
    'Semantic Colors': 5, // button, badge, checkbox, radio, switch
    'className Management': 5, // add-parameter, wrap-static, ensure-in-cn, reorder-args, remove-unused
    'Import Consistency': 1, // clsx-to-cn
    Formatting: 1, // file-headers
  };

  return {
    transformCount: SIMPLIFIED_TRANSFORM_ORDER.length,
    transforms,
    categories,
  };
}
