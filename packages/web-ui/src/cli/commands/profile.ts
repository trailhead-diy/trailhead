/**
 * Refactored Profile Command using command patterns
 */

import { Ok } from '@esteban-url/trailhead-cli';
import {
  createCommand,
  executeWithPhases,
  executeSubprocess,
  displaySummary,
  type CommandPhase,
  type CommandContext,
} from '@esteban-url/trailhead-cli/command';
import { type StrictProfileOptions } from '../core/types/command-options.js';

// ============================================================================
// TYPES
// ============================================================================

// Use strict typing for better type safety
type ProfileOptions = StrictProfileOptions;

interface ProfileConfig {
  options: ProfileOptions;
  projectRoot: string;
  env: Record<string, string>;
  profilingModule: string;
  args: string[];
}

// ============================================================================
// COMMAND PHASES
// ============================================================================

/**
 * Create profiling phases for structured execution
 */
const createProfilePhases = (cmdContext: CommandContext): CommandPhase<ProfileConfig>[] => [
  {
    name: 'Validating environment',
    execute: async (config: ProfileConfig) => {
      // Check if --expose-gc is available for memory profiling
      if (config.options.memory && !global.gc) {
        cmdContext.logger.warning(
          'Memory profiling requested but --expose-gc flag not detected. ' +
            'For accurate memory measurements, run with: node --expose-gc trailhead-ui profile --memory'
        );
      }

      return Ok(config);
    },
  },
  {
    name: 'Executing profiling',
    execute: async (config: ProfileConfig) => {
      const result = await executeSubprocess(
        {
          command: 'node',
          args: config.args,
          env: config.env,
          cwd: config.projectRoot,
        },
        cmdContext
      );

      if (!result.success) {
        return result;
      }

      cmdContext.logger.success('Profiling completed successfully');
      return Ok(config);
    },
  },
];

// ============================================================================
// COMMAND CONFIGURATION
// ============================================================================

/**
 * Create profile command using unified patterns
 */
export const createProfileCommand = () => {
  return createCommand<ProfileOptions>({
    name: 'profile',
    description: 'Profile transform performance with detailed metrics and memory analysis',

    options: [
      {
        flags: '-p, --pipeline',
        description: 'profile full pipeline execution',
        default: false,
      },
      {
        flags: '-s, --simple',
        description: 'profile simple (color-only) transforms',
        default: false,
      },
      {
        flags: '--memory',
        description: 'include memory profiling (requires --expose-gc)',
        default: false,
      },
    ],

    examples: [
      '$ trailhead-ui profile',
      '$ trailhead-ui profile --pipeline --verbose',
      '$ trailhead-ui profile --simple --memory',
      '$ node --expose-gc trailhead-ui profile --memory',
    ],

    validation: (options: ProfileOptions) => {
      if (options.pipeline && options.simple) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cannot use both --pipeline and --simple options together',
            suggestion:
              'Choose either --pipeline for full pipeline profiling or --simple for color-only transforms',
            recoverable: true,
          },
        };
      }
      return { success: true, value: options };
    },

    action: async (options: ProfileOptions, cmdContext: CommandContext) => {
      // Set up environment based on options
      const env: Record<string, string> = {};

      if (options.pipeline) {
        env.PROFILE_MODE = 'pipeline';
      } else if (options.simple) {
        env.PROFILE_MODE = 'simple';
      }

      if (options.verbose) {
        env.PROFILE_VERBOSE = 'true';
      }

      if (options.memory) {
        env.PROFILE_MEMORY = 'true';
      }

      // Delegate to the profiling system
      const profilingModule = `${cmdContext.projectRoot}/dist/src/transforms/profiling/main.js`;

      // Build args based on whether memory profiling is enabled
      const args =
        options.memory && global.gc ? ['--expose-gc', profilingModule] : [profilingModule];

      // Initialize config
      const config: ProfileConfig = {
        options,
        projectRoot: cmdContext.projectRoot,
        env,
        profilingModule,
        args,
      };

      // Execute profiling phases
      const phases = createProfilePhases(cmdContext);
      const result = await executeWithPhases(phases, config, cmdContext);

      if (!result.success) {
        return result;
      }

      // Display final summary
      displaySummary(
        'Profiling Complete',
        [
          {
            label: 'Mode',
            value: options.pipeline ? 'Pipeline' : options.simple ? 'Simple' : 'Default',
          },
          { label: 'Memory Profiling', value: options.memory ? 'Enabled' : 'Disabled' },
          { label: 'Verbose Output', value: options.verbose ? 'Enabled' : 'Disabled' },
        ],
        cmdContext
      );

      return Ok(undefined);
    },
  });
};
