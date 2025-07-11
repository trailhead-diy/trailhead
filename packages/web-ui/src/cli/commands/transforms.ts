import { ok, err } from '@esteban-url/trailhead-cli';
import {
  createCommand,
  executeWithPhases,
  displaySummary,
  type CommandPhase,
  type CommandContext,
} from '@esteban-url/trailhead-cli/command';
import {
  executeTransforms as coreExecuteTransforms,
  validateTransformConfig,
  type TransformConfig,
} from '../core/shared/transform-core.js';
import { runTransformPrompts } from '../prompts/transforms.js';
import { loadConfigSync, logConfigDiscovery } from '../config.js';
import { createError } from '@esteban-url/trailhead-cli/core';
import { type StrictTransformsOptions } from '../core/types/command-options.js';

// Use strict typing for better type safety
type TransformsOptions = StrictTransformsOptions;

// ============================================================================
// TYPES
// ============================================================================

interface TransformsConfig {
  options: TransformsOptions;
  projectRoot: string;
  loadedConfig?: any;
  configPath?: string | null;
  finalOptions?: TransformsOptions;
  transformConfig?: TransformConfig;
}

// ============================================================================
// COMMAND PHASES
// ============================================================================

/**
 * Create configuration and setup phases
 */
const createSetupPhases = (cmdContext: CommandContext): CommandPhase<TransformsConfig>[] => [
  {
    name: 'Loading configuration',
    execute: async (config: TransformsConfig) => {
      const configResult = loadConfigSync(config.projectRoot);
      const loadedConfig = configResult.config;
      const configPath = configResult.filepath;

      // Always show when config is found
      if (configPath) {
        cmdContext.logger.info(`Configuration loaded from: ${configPath}`);
      }

      // Log detailed config in verbose mode
      if (config.options.interactive || config.options.verbose || loadedConfig.verbose) {
        logConfigDiscovery(configPath, loadedConfig, true, configResult.source);
      }

      return ok({
        ...config,
        loadedConfig,
        configPath,
      });
    },
  },
  {
    name: 'Running interactive prompts',
    execute: async (config: TransformsConfig) => {
      let finalOptions = config.options;

      // Run interactive prompts if needed
      if (config.options.interactive) {
        // Show config notice in interactive mode
        if (config.configPath) {
          cmdContext.logger.info(`Using configuration from: ${config.configPath}`);
          cmdContext.logger.info('');
        }

        const promptResults = await runTransformPrompts({
          currentSrcDir: config.options.src || config.loadedConfig?.transforms?.srcDir,
        });

        // Merge prompt results with CLI options
        finalOptions = {
          ...promptResults,
          // CLI options take precedence
          ...(config.options.src ? { src: config.options.src } : {}),
          ...(config.options.dryRun !== undefined ? { dryRun: config.options.dryRun } : {}),
          ...(config.options.verbose !== undefined ? { verbose: config.options.verbose } : {}),
        };
      }

      return ok({
        ...config,
        finalOptions,
      });
    },
  },
  {
    name: 'Building transform configuration',
    execute: async (config: TransformsConfig) => {
      const effectiveOptions = config.finalOptions || config.options;
      const transformsConfig = config.loadedConfig?.transforms;

      const transformConfig: TransformConfig = {
        srcDir: effectiveOptions.src || transformsConfig?.srcDir || 'src/components/lib',
        verbose: effectiveOptions.verbose ?? config.loadedConfig?.verbose ?? false,
        dryRun: effectiveOptions.dryRun ?? config.loadedConfig?.dryRun ?? false,
        skipTransforms: effectiveOptions.skipTransforms ?? false,
        enabledTransforms: transformsConfig?.enabledTransforms,
        disabledTransforms: transformsConfig?.disabledTransforms,
      };

      // Validate transform configuration
      const validationResult = validateTransformConfig(transformConfig);
      if (!validationResult.isOk()) {
        return err(
          createError(
            'VALIDATION_ERROR',
            'Invalid transform configuration: ' + validationResult.error
          )
        );
      }

      // Display configuration
      displaySummary(
        'Transform Configuration',
        [
          { label: 'Source directory', value: transformConfig.srcDir },
          { label: 'Dry run', value: transformConfig.dryRun ? 'yes' : 'no' },
          { label: 'Verbose', value: transformConfig.verbose ? 'yes' : 'no' },
        ],
        cmdContext
      );

      return ok({
        ...config,
        transformConfig,
      });
    },
  },
];

/**
 * Create execution phases for dry run and live transforms
 */
const createExecutionPhases = (cmdContext: CommandContext): CommandPhase<TransformsConfig>[] => [
  {
    name: 'Executing transformations',
    execute: async (config: TransformsConfig) => {
      if (!config.transformConfig) {
        return err(createError('CONFIG_ERROR', 'Transform configuration not found'));
      }

      if (config.transformConfig.dryRun) {
        // Dry run execution
        cmdContext.logger.info('Analyzing files that would be transformed...');

        const analysisResult = await coreExecuteTransforms(config.transformConfig);

        if (!analysisResult.isOk()) {
          return err(
            createError('DRY_RUN_ERROR', 'Dry run analysis failed: ' + analysisResult.error)
          );
        }

        const { filesProcessed, conversionsApplied } = analysisResult.value;

        displaySummary(
          'Dry Run Analysis',
          [
            { label: 'Files to analyze', value: filesProcessed.toString() },
            { label: 'Potential conversions', value: conversionsApplied.toString() },
            { label: 'Source directory', value: config.transformConfig.srcDir },
          ],
          cmdContext
        );

        if (filesProcessed > 0) {
          cmdContext.logger.info('');
          cmdContext.logger.info('Run without --dry-run to apply these transformations.');
        } else {
          cmdContext.logger.info('');
          cmdContext.logger.info('No files found to transform.');
        }

        return ok(config);
      } else {
        // Live execution
        const transformResult = await coreExecuteTransforms(config.transformConfig);

        if (!transformResult.isOk()) {
          return err(createError('TRANSFORM_ERROR', 'Transform failed: ' + transformResult.error));
        }

        if (transformResult.value.filesModified > 0) {
          cmdContext.logger.success(
            `✅ Transformed ${transformResult.value.filesModified} files successfully!`
          );

          if (cmdContext.verbose) {
            cmdContext.logger.info('');
            cmdContext.logger.info('Modified files:');
            // List files in the source directory
            const fs = await import('@esteban-url/trailhead-cli/filesystem');
            const fileSystem = fs.createFileSystem();
            const readResult = await fileSystem.readdir(config.transformConfig.srcDir);
            if (readResult.isOk()) {
              const tsxFiles = readResult.value.filter((f: string) => f.endsWith('.tsx')).sort();
              tsxFiles.forEach((file: string) => {
                cmdContext.logger.info(`  ✓ ${file}`);
              });
            }
          }
        } else {
          cmdContext.logger.info('No files needed transformation.');
        }

        return ok(config);
      }
    },
  },
];

// ============================================================================
// COMMAND CONFIGURATION
// ============================================================================

/**
 * Create transforms command using unified patterns
 */
export const createTransformsCommand = () => {
  return createCommand<TransformsOptions>({
    name: 'transforms',
    description: 'Transform hardcoded colors to semantic tokens in existing component files',

    options: [
      {
        flags: '-s, --src <path>',
        description: 'source directory containing components',
        default: 'src/components/lib',
      },
      {
        flags: '--dry-run',
        description: 'preview changes without modifying files',
        default: false,
      },
      {
        flags: '-i, --interactive',
        description: 'run in interactive mode',
        default: false,
      },
    ],

    examples: [
      '$ trailhead-ui transforms',
      '$ trailhead-ui transforms --dry-run',
      '$ trailhead-ui transforms --src ./components',
      '$ trailhead-ui transforms --interactive',
      '$ trailhead-ui transforms --verbose',
    ],

    action: async (options: TransformsOptions, cmdContext: CommandContext) => {
      // Initialize config
      const config: TransformsConfig = {
        options,
        projectRoot: cmdContext.projectRoot,
      };

      // Execute setup phases (configuration, prompts, validation)
      const setupPhases = createSetupPhases(cmdContext);
      const setupResult = await executeWithPhases(setupPhases, config, cmdContext);

      if (!setupResult.isOk()) {
        return err(setupResult.error);
      }

      // Execute transformation phases
      const executionPhases = createExecutionPhases(cmdContext);
      const executionResult = await executeWithPhases(
        executionPhases,
        setupResult.value,
        cmdContext
      );

      if (!executionResult.isOk()) {
        return err(executionResult.error);
      }

      // Display final summary
      const finalConfig = executionResult.value;
      displaySummary(
        'Transform Complete',
        [
          { label: 'Source Directory', value: finalConfig.transformConfig?.srcDir || 'Unknown' },
          {
            label: 'Mode',
            value: finalConfig.transformConfig?.dryRun ? 'Dry Run' : 'Live Transform',
          },
          ...(finalConfig.configPath ? [{ label: 'Config', value: finalConfig.configPath }] : []),
        ],
        cmdContext
      );

      return ok(undefined);
    },
  });
};
