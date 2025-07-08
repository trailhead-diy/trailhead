/**
 * Simplified pipeline for essential Catalyst enhancements
 * Focuses on semantic colors and className handling only
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import type { Transform } from '../shared/types.js';
import type { FileSystem } from '../../cli/core/installation/types.js';
import { isNotTestRelated } from '../../cli/core/shared/file-filters.js';

// Essential semantic color transforms (per component)
import { buttonAddSemanticColorsTransform } from '../components/button/add-semantic-colors.js';
import { badgeAddSemanticColorsTransform } from '../components/badge/add-semantic-colors.js';
import { checkboxAddSemanticColorsTransform } from '../components/checkbox/add-semantic-colors.js';
import { radioAddSemanticColorsTransform } from '../components/radio/add-semantic-colors.js';
import { switchAddSemanticColorsTransform } from '../components/switch/add-semantic-colors.js';

// Essential className handling transforms
import { addClassNameParameterTransform } from '../components/common/className/add-parameter.js';
import { forwardClassNameToChildTransform } from '../components/common/className/forward-to-child.js';
import { wrapStaticClassNameTransform } from '../components/common/className/wrap-static.js';
import { ensureClassNameInCnTransform } from '../components/common/className/ensure-in-cn.js';
import { reorderClassNameArgsTransform } from '../components/common/className/reorder-args.js';
import { removeUnusedClassNameTransform } from '../components/common/className/remove-unused.js';

// Import consistency
import { clsxToCnTransform } from '../components/common/imports/clsx-to-cn.js';

// Formatting
import { fileHeadersTransform } from '../components/common/formatting/file-headers.js';

// Catalyst prefix transform (unified approach)
import { catalystPrefixTransform } from '../components/common/imports/catalyst-prefix.js';

// Parameter ordering (fixes syntax errors)
import { reorderParametersTransform } from '../components/common/parameters/reorder-parameters.js';

/**
 * Simplified transform order - only essential transforms
 */
const SIMPLIFIED_TRANSFORM_ORDER: Transform[] = [
  // 1. Catalyst prefix MUST be first to establish proper naming
  catalystPrefixTransform,

  // 2. Import consistency
  clsxToCnTransform,

  // 3. Add semantic colors to components
  buttonAddSemanticColorsTransform,
  badgeAddSemanticColorsTransform,
  checkboxAddSemanticColorsTransform,
  radioAddSemanticColorsTransform,
  switchAddSemanticColorsTransform,

  // 4. className parameter management
  addClassNameParameterTransform,
  forwardClassNameToChildTransform,
  wrapStaticClassNameTransform,
  ensureClassNameInCnTransform,
  reorderClassNameArgsTransform,
  removeUnusedClassNameTransform,

  // 5. Final formatting
  fileHeadersTransform,

  // 6. Fix any remaining syntax errors LAST - parameter ordering
  reorderParametersTransform,
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
 * Execute the main pipeline on a directory of files (Node.js filesystem)
 */
export async function runMainPipeline(
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
  return runMainPipelineWithFs(null, sourceDir, options);
}

/**
 * Execute the main pipeline with injectable filesystem
 */
export async function runMainPipelineWithFs(
  fs: FileSystem | null,
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

  console.log(chalk.blue(`🚀 Running main pipeline on ${sourceDir}`));
  console.log(chalk.gray(`Transforms: ${SIMPLIFIED_TRANSFORM_ORDER.length} essential transforms`));

  if (dryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No files will be modified'));
  }

  const errors: Array<{ file: string; error: string }> = [];
  let processedFiles = 0;

  try {
    // Use injected filesystem if available, otherwise fall back to Node.js fs
    let files: string[];
    if (fs) {
      const readdirResult = await fs.readdir(sourceDir);
      if (!readdirResult.success) {
        errors.push({ file: sourceDir, error: 'Failed to read directory' });
        return {
          success: false,
          processedFiles: 0,
          errors,
          summary: 'Failed to read directory',
        };
      }
      files = readdirResult.value;
    } else {
      files = await readdir(sourceDir);
    }

    const tsxFiles = files.filter(f => f.endsWith('.tsx') && isNotTestRelated(f));
    const filteredFiles = filter ? tsxFiles.filter(filter) : tsxFiles;

    console.log(chalk.gray(`Found ${filteredFiles.length} component files to process`));

    for (const file of filteredFiles) {
      const filePath = join(sourceDir, file);

      try {
        if (verbose) {
          console.log(chalk.gray(`Processing ${file}...`));
        }

        // Use injected filesystem if available
        const contentResult = fs
          ? await fs.readFile(filePath)
          : { success: true, value: await readFile(filePath, 'utf-8') };

        if (!contentResult.success) {
          errors.push({ file, error: 'Failed to read file' });
          continue;
        }

        let content = contentResult.value;
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
          if (fs) {
            await fs.writeFile(filePath, content);
          } else {
            await writeFile(filePath, content, 'utf-8');
          }
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
 * Get information about the main pipeline
 */
export function getMainPipelineInfo(): {
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
    'Parameter Fixing': 1, // reorder-parameters
    'Semantic Colors': 5, // button, badge, checkbox, radio, switch
    'className Management': 6, // add-parameter, forward-to-child, wrap-static, ensure-in-cn, reorder-args, remove-unused
    'Import Consistency': 1, // clsx-to-cn
    Formatting: 1, // file-headers
  };

  return {
    transformCount: SIMPLIFIED_TRANSFORM_ORDER.length,
    transforms,
    categories,
  };
}
