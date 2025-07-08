/**
 * Dev Refresh Command - Copy fresh Catalyst components for development
 */

import { Ok, Err } from '@esteban-url/trailhead-cli';
import {
  createCommand,
  executeWithPhases,
  displaySummary,
  type CommandPhase,
  type CommandContext,
} from '@esteban-url/trailhead-cli/command';
import { join } from 'path';

// Import framework utilities
import { ensureDirectory, pathExists } from '@esteban-url/trailhead-cli/filesystem';

// Import local utilities
import { copyFreshFilesBatch } from '../core/shared/file-utils.js';
import { loadConfigSync, logConfigDiscovery } from '../config.js';
import { createError } from '@esteban-url/trailhead-cli/core';
import { type StrictDevRefreshOptions } from '../core/types/command-options.js';
import { runMainPipeline } from '../../transforms/pipelines/main.js';
import chalk from 'chalk';

// ============================================================================
// TYPES
// ============================================================================

// Use strict typing for better type safety
type DevRefreshOptions = StrictDevRefreshOptions;

interface RefreshConfig {
  source: string;
  dest: string;
  clean: boolean;
  copiedFiles: string[];
}

// ============================================================================
// COMMAND PHASES
// ============================================================================

const createRefreshPhases = (options: DevRefreshOptions): CommandPhase<RefreshConfig>[] => [
  {
    name: 'Validating paths',
    execute: async (config: RefreshConfig) => {
      // Check if source exists
      const sourceExistsResult = await pathExists(config.source);
      if (!sourceExistsResult.success) {
        return Err(sourceExistsResult.error);
      }
      if (!sourceExistsResult.value) {
        return Err(
          createError(
            'SOURCE_NOT_FOUND',
            `Source directory not found: ${config.source}. Please ensure catalyst-ui-kit is installed or provide a valid source path`
          )
        );
      }

      // Source and dest cannot be the same
      if (config.source === config.dest) {
        return Err(
          createError(
            'INVALID_CONFIGURATION',
            'Source and destination cannot be the same directory'
          )
        );
      }

      return Ok(config);
    },
  },
  {
    name: 'Preparing destination',
    execute: async (config: RefreshConfig) => {
      try {
        if (config.clean) {
          const destExistsResult = await pathExists(config.dest);
          if (!destExistsResult.success) {
            return Err(destExistsResult.error);
          }
          if (destExistsResult.value) {
            // Use Node.js fs for removal since CLI framework doesn't export removeDirectory
            const { rm } = await import('fs/promises');
            await rm(config.dest, { recursive: true });
          }
        }

        const result = await ensureDirectory(config.dest);
        if (!result.success) {
          return Err(
            createError(
              'FILESYSTEM_ERROR',
              `Failed to create destination directory: ${result.error.message}`
            )
          );
        }

        return Ok(config);
      } catch (error) {
        return Err(
          createError(
            'FILESYSTEM_ERROR',
            `Failed to prepare destination: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        );
      }
    },
  },
  {
    name: 'Copying fresh components',
    execute: async (config: RefreshConfig) => {
      const copyResult = await copyFreshFilesBatch(
        config.source,
        config.dest,
        true, // force
        true // addPrefix - add catalyst- prefix to component files
      );

      if (!copyResult.success) {
        return Err(createError('COPY_ERROR', `Failed to copy files: ${copyResult.error.message}`));
      }

      const { copied, skipped, failed } = copyResult.value;

      // Update config with copied files for transformation phase
      config.copiedFiles = copied;

      console.log(chalk.green(`✅ Copied ${copied.length} components successfully!`));

      if (options.verbose) {
        if (copied.length > 0) {
          console.log(chalk.gray('\nCopied files:'));
          copied.slice(0, 10).forEach((file: string) => {
            console.log(chalk.gray(`  ✓ ${file}`));
          });
          if (copied.length > 10) {
            console.log(chalk.gray(`  ... and ${copied.length - 10} more`));
          }
        }

        if (skipped.length > 0) {
          console.log(chalk.gray(`\nSkipped ${skipped.length} identical files`));
        }

        if (failed.length > 0) {
          console.log(chalk.yellow(`\nFailed to copy ${failed.length} files:`));
          failed.forEach((file: string) => {
            console.log(chalk.yellow(`  ✗ ${file}`));
          });
        }
      }

      return Ok(config);
    },
  },
  {
    name: 'Applying enhancement transforms',
    execute: async (config: RefreshConfig) => {
      if (config.copiedFiles.length === 0) {
        return Ok(config);
      }

      const result = await runMainPipeline(config.dest, {
        verbose: options.verbose,
        dryRun: false,
        filter: (filename: string) => {
          // Only process the files we just copied
          return config.copiedFiles.some(copiedFile => filename.includes(copiedFile));
        },
      });

      if (!result.success) {
        return Err(
          createError(
            'ENHANCEMENT_ERROR',
            `Enhancement pipeline failed: ${result.errors.length} errors occurred during enhancement`
          )
        );
      }

      console.log(
        chalk.green(`✨ Enhanced ${result.processedFiles} components with full transform pipeline`)
      );

      return Ok(config);
    },
  },
];

// ============================================================================
// COMMAND CONFIGURATION
// ============================================================================

/**
 * Create dev-refresh command
 */
export const createDevRefreshCommand = () => {
  return createCommand<DevRefreshOptions>({
    name: 'dev-refresh',
    description:
      '[Dev] Copy fresh Catalyst components with catalyst- prefix and apply all enhancements',

    options: [
      {
        flags: '-s, --src <path>',
        description: 'source directory containing Catalyst components',
        default: 'catalyst-ui-kit/typescript',
      },
      {
        flags: '-d, --dest <path>',
        description: 'destination directory for components',
        default: 'src/components/lib',
      },
      {
        flags: '--clean',
        description: 'clean destination directory before copying',
        default: true,
      },
      {
        flags: '--no-clean',
        description: 'do not clean destination directory',
      },
    ],

    examples: [
      '$ trailhead-ui dev:refresh',
      '$ trailhead-ui dev:refresh --src ./catalyst-ui-kit/typescript',
      '$ trailhead-ui dev:refresh --dest ./components/lib',
      '$ trailhead-ui dev:refresh --no-clean',
    ],

    action: async (options: DevRefreshOptions, cmdContext: CommandContext) => {
      // Load configuration
      const configResult = loadConfigSync(cmdContext.projectRoot);
      const loadedConfig = configResult.config;
      const configPath = configResult.filepath;

      // Always show when config is found
      if (configPath) {
        cmdContext.logger.info(`Configuration loaded from: ${configPath}`);
      }

      // Log detailed config in verbose mode (check both CLI option and config setting)
      if (options.verbose || loadedConfig.verbose) {
        logConfigDiscovery(configPath, loadedConfig, true, configResult.source);
      }

      // Build configuration merging: CLI options > config file > defaults
      const devRefreshConfig = loadedConfig.devRefresh;
      const config: RefreshConfig = {
        source: join(
          cmdContext.projectRoot,
          options.src || devRefreshConfig?.srcDir || 'catalyst-ui-kit/typescript'
        ),
        dest: join(
          cmdContext.projectRoot,
          options.dest || devRefreshConfig?.destDir || 'src/components/lib'
        ),
        clean: options.clean ?? true,
        copiedFiles: [], // Will be populated after copying
      };

      // Display configuration
      displaySummary(
        'Dev Refresh Configuration',
        [
          { label: 'Source', value: config.source },
          { label: 'Destination', value: config.dest },
          { label: 'Clean destination', value: config.clean ? 'yes' : 'no' },
        ],
        cmdContext
      );

      // Execute all phases (validation, preparation, copying, transformations)
      const phases = createRefreshPhases(options);
      const phaseResult = await executeWithPhases(phases, config, cmdContext);

      if (!phaseResult.success) {
        return phaseResult;
      }

      // Display final results
      cmdContext.logger.success(
        `✅ Refreshed and enhanced ${config.copiedFiles.length} components successfully!`
      );

      cmdContext.logger.info(
        '\nComponents refreshed and fully enhanced! All transforms have been applied.'
      );

      return Ok(undefined);
    },
  });
};
