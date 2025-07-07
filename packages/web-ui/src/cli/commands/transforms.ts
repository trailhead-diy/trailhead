import { Ok, Err } from '@esteban-url/trailhead-cli';
import {
  createCommand,
  executeWithPhases,
  executeWithDryRun,
  executeInteractive,
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
import { CLI_ERROR_CODES, createCLIError } from '../core/errors/codes.js';
import { type StrictTransformsOptions } from '../core/types/command-options.js';

// Use strict typing for better type safety
type TransformsOptions = StrictTransformsOptions;

// ============================================================================
// COMMAND PHASES
// ============================================================================

const createTransformPhases = (_options: TransformsOptions): CommandPhase<TransformConfig>[] => [
  {
    name: 'Validating configuration',
    execute: async (config: TransformConfig) => {
      const validationResult = validateTransformConfig(config);
      if (!validationResult.success) {
        return Err({
          code: 'VALIDATION_ERROR',
          message: 'Invalid transform configuration',
          details: validationResult.error,
          recoverable: true,
        });
      }
      return Ok(config);
    },
  },
  {
    name: 'Preparing transformations',
    execute: async (config: TransformConfig) => {
      // Just validate that we're ready to transform
      // The actual transformation will happen after phases complete
      return Ok(config);
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
      // Load configuration
      const configResult = loadConfigSync(cmdContext.projectRoot);
      const loadedConfig = configResult.config;
      const configPath = configResult.filepath;

      // Always show when config is found
      if (configPath) {
        cmdContext.logger.info(`Configuration loaded from: ${configPath}`);
      }

      // Log detailed config in verbose mode (check both CLI option and config setting)
      if (options.interactive || options.verbose || loadedConfig.verbose) {
        logConfigDiscovery(configPath, loadedConfig, true, configResult.source);
      }

      // Execute with interactive support
      return executeInteractive(
        options,

        // Prompt function
        async () => {
          // Show config notice in interactive mode
          if (configPath && options.interactive) {
            cmdContext.logger.info(`Using configuration from: ${configPath}`);
            cmdContext.logger.info('');
          }

          const promptResults = await runTransformPrompts({
            currentSrcDir: options.src || loadedConfig?.transforms?.srcDir,
          });
          return promptResults;
        },

        // Execute function
        async (finalOptions: TransformsOptions) => {
          // Build configuration merging: CLI options > config file > defaults
          const transformsConfig = loadedConfig?.transforms;
          const config: TransformConfig = {
            srcDir: finalOptions.src || transformsConfig?.srcDir || 'src/components/lib',
            verbose: finalOptions.verbose ?? loadedConfig?.verbose ?? false,
            dryRun: finalOptions.dryRun ?? loadedConfig?.dryRun ?? false,
            skipTransforms: finalOptions.skipTransforms ?? false,
            enabledTransforms: transformsConfig?.enabledTransforms,
            disabledTransforms: transformsConfig?.disabledTransforms,
          };

          // Display configuration
          displaySummary(
            'Transform Configuration',
            [
              { label: 'Source directory', value: config.srcDir },
              { label: 'Dry run', value: config.dryRun ? 'yes' : 'no' },
              { label: 'Verbose', value: config.verbose ? 'yes' : 'no' },
            ],
            cmdContext
          );

          // Execute with dry run support
          return executeWithDryRun(
            finalOptions,
            async (options: TransformsOptions) => {
              if (options.dryRun) {
                // Dry run execution
                cmdContext.logger.info('Analyzing files that would be transformed...');

                // Run the transform in dry-run mode to get actual analysis
                const dryRunConfig: TransformConfig = {
                  ...config,
                  dryRun: true,
                };

                const analysisResult = await coreExecuteTransforms(dryRunConfig);

                if (!analysisResult.success) {
                  return Err(
                    createCLIError(
                      CLI_ERROR_CODES.DRY_RUN_ERROR,
                      'Dry run analysis failed: ' + analysisResult.error,
                      { recoverable: false }
                    )
                  );
                }

                const { filesProcessed, conversionsApplied } = analysisResult.value;

                displaySummary(
                  'Dry Run Analysis',
                  [
                    { label: 'Files to analyze', value: filesProcessed },
                    { label: 'Potential conversions', value: conversionsApplied },
                    { label: 'Source directory', value: config.srcDir },
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

                return Ok(undefined);
              } else {
                // Normal execution
                const phases = createTransformPhases(options);
                const result = await executeWithPhases(phases, config, cmdContext);

                if (result.success) {
                  // Get the transform result from the last phase
                  const transformConfig = result.value;
                  const transformResult = await coreExecuteTransforms(transformConfig);

                  if (transformResult.success && transformResult.value.filesModified > 0) {
                    cmdContext.logger.success(
                      `✅ Transformed ${transformResult.value.filesModified} files successfully!`
                    );

                    if (cmdContext.verbose) {
                      cmdContext.logger.info('');
                      cmdContext.logger.info('Modified files:');
                      // List files in the source directory
                      const fs = await import('fs/promises');
                      const files = await fs.readdir(transformConfig.srcDir);
                      const tsxFiles = files.filter(f => f.endsWith('.tsx')).sort();
                      tsxFiles.forEach(file => {
                        console.log(`  ✓ ${file}`);
                      });
                    }
                  } else if (transformResult.success) {
                    cmdContext.logger.info('No files needed transformation.');
                  } else {
                    return Err(
                      createCLIError(
                        CLI_ERROR_CODES.TRANSFORM_ERROR,
                        'Transform failed: ' + transformResult.error,
                        { recoverable: false }
                      )
                    );
                  }
                }

                return result.success ? Ok(undefined) : Err(result.error);
              }
            },
            cmdContext
          );
        },

        cmdContext
      );
    },
  });
};
