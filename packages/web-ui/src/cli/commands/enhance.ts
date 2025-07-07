/**
 * Enhance Command - Add semantic colors and essential className handling to Catalyst components
 * Simplified alternative to the complex transforms command
 */

import { Ok, Err, createError } from '@esteban-url/trailhead-cli/core';
import {
  createCommand,
  executeWithPhases,
  displaySummary,
  type CommandPhase,
  type CommandContext,
} from '@esteban-url/trailhead-cli/command';
import { existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

import { runMainPipeline, getMainPipelineInfo } from '../../transforms/pipelines/main.js';
import { loadConfigSync, logConfigDiscovery } from '../config.js';

// ============================================================================
// TYPES
// ============================================================================

interface EnhanceOptions {
  readonly src?: string;
  readonly dryRun?: boolean;
  readonly verbose?: boolean;
  readonly info?: boolean;
}

interface EnhanceConfig {
  sourceDir: string;
  dryRun: boolean;
  verbose: boolean;
}

// ============================================================================
// COMMAND PHASES
// ============================================================================

const createEnhancePhases = (_options: EnhanceOptions): CommandPhase<EnhanceConfig>[] => [
  {
    name: 'Validating source directory',
    execute: async (config: EnhanceConfig) => {
      if (!existsSync(config.sourceDir)) {
        return Err(
          createError('SOURCE_NOT_FOUND', `Source directory not found: ${config.sourceDir}`)
        );
      }
      return Ok(config);
    },
  },
  {
    name: 'Running enhancement pipeline',
    execute: async (config: EnhanceConfig) => {
      const result = await runMainPipeline(config.sourceDir, {
        verbose: config.verbose,
        dryRun: config.dryRun,
        filter: (filename: string) => {
          // Only process Catalyst component files
          const catalystComponents = [
            'alert',
            'auth-layout',
            'avatar',
            'badge',
            'button',
            'checkbox',
            'combobox',
            'description-list',
            'dialog',
            'divider',
            'dropdown',
            'fieldset',
            'heading',
            'input',
            'link',
            'listbox',
            'navbar',
            'pagination',
            'radio',
            'select',
            'sidebar-layout',
            'sidebar',
            'stacked-layout',
            'switch',
            'table',
            'text',
            'textarea',
          ];

          return catalystComponents.some(component =>
            filename.includes(`catalyst-${component}.tsx`)
          );
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
        chalk.green(`✨ Enhanced ${result.processedFiles} components with semantic colors`)
      );

      return Ok(config);
    },
  },
];

// ============================================================================
// COMMAND CONFIGURATION
// ============================================================================

/**
 * Create enhance command for adding semantic colors and className handling
 */
export const createEnhanceCommand = () => {
  return createCommand<EnhanceOptions>({
    name: 'enhance',
    description: 'Add semantic colors and essential className handling to Catalyst components',

    options: [
      {
        flags: '-s, --src <path>',
        description: 'source directory containing Catalyst components',
        default: 'src/components/lib',
      },
      {
        flags: '--dry-run',
        description: 'preview changes without modifying files',
        default: false,
      },
      {
        flags: '--info',
        description: 'show information about enhancement pipeline',
        default: false,
      },
      {
        flags: '--verbose',
        description: 'verbose output',
        default: false,
      },
    ],

    examples: [
      '$ trailhead-ui enhance',
      '$ trailhead-ui enhance --dry-run',
      '$ trailhead-ui enhance --src ./components',
      '$ trailhead-ui enhance --info',
      '$ trailhead-ui enhance --verbose',
    ],

    action: async (options: EnhanceOptions, cmdContext: CommandContext) => {
      // Show pipeline info if requested
      if (options.info) {
        const info = getMainPipelineInfo();

        console.log(chalk.blue('🔧 Enhancement Pipeline Information'));
        console.log(chalk.gray(`Total transforms: ${info.transformCount}`));
        console.log('');

        Object.entries(info.categories).forEach(([category, count]) => {
          console.log(chalk.cyan(`${category}: ${count} transforms`));
        });

        console.log('');
        console.log(chalk.gray('Transform details:'));
        info.transforms.forEach((transform: any) => {
          console.log(`  • ${chalk.green(transform.name)}: ${transform.description}`);
        });

        return Ok(undefined);
      }

      // Load configuration
      const configResult = loadConfigSync(cmdContext.projectRoot);
      const loadedConfig = configResult.config;
      const configPath = configResult.filepath;

      if (options.verbose && configPath) {
        logConfigDiscovery(configPath, loadedConfig, options.verbose, configResult.source);
      }

      // Resolve source directory
      const sourceDir = options.src
        ? options.src.startsWith('/')
          ? options.src
          : join(cmdContext.projectRoot, options.src)
        : join(cmdContext.projectRoot, 'src/components/lib');

      const config: EnhanceConfig = {
        sourceDir,
        dryRun: Boolean(options.dryRun),
        verbose: options.verbose ?? false,
      };

      // Execute command phases
      const phasesResult = await executeWithPhases(
        createEnhancePhases(options),
        config,
        cmdContext
      );

      if (!phasesResult.success) {
        return phasesResult;
      }

      // Display summary
      displaySummary(
        'Enhancement Complete',
        [
          { label: 'Source Directory', value: sourceDir },
          { label: 'Mode', value: options.dryRun ? 'Dry Run' : 'Live' },
          {
            label: 'Transforms Applied',
            value: getMainPipelineInfo().transformCount.toString(),
          },
          ...(configPath ? [{ label: 'Config', value: configPath }] : []),
        ],
        cmdContext
      );

      return Ok(undefined);
    },
  });
};
