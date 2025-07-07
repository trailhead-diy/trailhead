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
import type { TrailheadConfig } from '../core/config/index.js';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { join } from 'path';

// Import framework utilities
import { ensureDirectory } from '@esteban-url/trailhead-cli/filesystem';

// Import local utilities
import { copyFreshFilesBatch } from '../core/shared/file-utils.js';
import { loadConfigSync, logConfigDiscovery } from '../core/config/index.js';
import { CLI_ERROR_CODES, createCLIError } from '../core/errors/codes.js';
import { type StrictDevRefreshOptions } from '../core/types/command-options.js';

// ============================================================================
// TYPES
// ============================================================================

// Use strict typing for better type safety
type DevRefreshOptions = StrictDevRefreshOptions;

interface RefreshConfig {
  source: string;
  dest: string;
  clean: boolean;
}

// ============================================================================
// COMMAND PHASES
// ============================================================================

const createRefreshPhases = (_options: DevRefreshOptions): CommandPhase<RefreshConfig>[] => [
  {
    name: 'Validating paths',
    execute: async (config: RefreshConfig) => {
      // Check if source exists
      if (!existsSync(config.source)) {
        return Err(
          createCLIError(
            CLI_ERROR_CODES.PATH_NOT_FOUND,
            `Source directory not found: ${config.source}`,
            {
              details: 'Please ensure catalyst-ui-kit is installed or provide a valid source path',
              recoverable: true,
            }
          )
        );
      }

      // Source and dest cannot be the same
      if (config.source === config.dest) {
        return Err(
          createCLIError(
            CLI_ERROR_CODES.CONFIG_ERROR,
            'Source and destination cannot be the same directory',
            { recoverable: true }
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
        if (config.clean && existsSync(config.dest)) {
          await rm(config.dest, { recursive: true });
        }

        const result = await ensureDirectory(config.dest);
        if (!result.success) {
          return Err(
            createCLIError(
              CLI_ERROR_CODES.FS_ERROR,
              `Failed to create destination directory: ${result.error.message}`,
              { recoverable: false }
            )
          );
        }

        return Ok(config);
      } catch (error) {
        return Err(
          createCLIError(
            CLI_ERROR_CODES.FS_ERROR,
            `Failed to prepare destination: ${error instanceof Error ? error.message : 'Unknown error'}`,
            { recoverable: false }
          )
        );
      }
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
    description: '[Dev] Copy fresh Catalyst components with catalyst- prefix for development',

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
      let loadedConfig: TrailheadConfig | null = null;
      let configPath: string | null = null;

      if (configResult.success) {
        loadedConfig = configResult.value.config;
        configPath = configResult.value.filepath;

        // Always show when config is found
        if (configPath) {
          cmdContext.logger.info(`Found configuration at: ${configPath}`);
        }

        // Log detailed config in verbose mode (check both CLI option and config setting)
        if (loadedConfig && (options.verbose || loadedConfig.verbose)) {
          logConfigDiscovery(configPath, loadedConfig, true);
        }
      }

      // Build configuration merging: CLI options > config file > defaults
      const devRefreshConfig = loadedConfig?.devRefresh;
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

      // Execute phases
      const phases = createRefreshPhases(options);
      const phaseResult = await executeWithPhases(phases, config, cmdContext);

      if (!phaseResult.success) {
        return phaseResult;
      }

      // Copy files with ADD prefix
      cmdContext.logger.info('Copying fresh Catalyst components...');

      const copyResult = await copyFreshFilesBatch(
        config.source,
        config.dest,
        true, // force
        true // addPrefix - add catalyst- prefix to component files
      );

      if (!copyResult.success) {
        return Err(
          createCLIError(
            CLI_ERROR_CODES.FS_ERROR,
            `Failed to copy files: ${copyResult.error.message}`,
            { recoverable: false }
          )
        );
      }

      const { copied, skipped, failed } = copyResult.value;

      // Display results
      cmdContext.logger.success(`✅ Refreshed ${copied.length} components successfully!`);

      if (cmdContext.verbose) {
        if (copied.length > 0) {
          cmdContext.logger.info('\nCopied files:');
          copied.slice(0, 10).forEach((file: string) => {
            cmdContext.logger.info(`  ✓ ${file}`);
          });
          if (copied.length > 10) {
            cmdContext.logger.info(`  ... and ${copied.length - 10} more`);
          }
        }

        if (skipped.length > 0) {
          cmdContext.logger.info(`\nSkipped ${skipped.length} identical files`);
        }

        if (failed.length > 0) {
          cmdContext.logger.warning(`\nFailed to copy ${failed.length} files:`);
          failed.forEach((file: string) => {
            cmdContext.logger.warning(`  ✗ ${file}`);
          });
        }
      }

      cmdContext.logger.info(
        '\nNext step: Run `trailhead-ui transforms` to transform the components'
      );

      return Ok(undefined);
    },
  });
};
