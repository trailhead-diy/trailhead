import { ok, err } from '@esteban-url/core';
import type { Result } from '@esteban-url/core';
import type { ProjectConfig } from './types.js';

export interface ParsedArgs extends ProjectConfig {
  help: boolean;
  version: boolean;
}

/**
 * Parse command line arguments into configuration
 */
export function parseArguments(args: string[]): Result<ParsedArgs, Error> {
  try {
    const config: ParsedArgs = {
      projectName: '',
      projectPath: '',
      template: 'basic',
      packageManager: 'pnpm',
      includeDocs: false,
      initGit: true,
      installDependencies: true,
      force: false,
      dryRun: false,
      verbose: false,
      help: false,
      version: false,
    };

    let i = 0;

    // Parse project name (first positional argument)
    if (args.length > 0 && !args[0].startsWith('-')) {
      config.projectName = args[0];
      config.projectPath = config.projectName; // Will be resolved later
      i = 1;
    }

    // Parse options
    while (i < args.length) {
      const arg = args[i];

      switch (arg) {
        case '-h':
        case '--help':
          config.help = true;
          break;

        case '-v':
        case '--version':
          config.version = true;
          break;

        case '-t':
        case '--template':
          if (i + 1 >= args.length) {
            return err(new Error('--template requires a value'));
          }
          const template = args[i + 1];
          if (template !== 'basic' && template !== 'advanced') {
            return err(new Error('Template must be "basic" or "advanced"'));
          }
          config.template = template;
          i++; // Skip the value
          break;

        case '-p':
        case '--package-manager':
          if (i + 1 >= args.length) {
            return err(new Error('--package-manager requires a value'));
          }
          const pm = args[i + 1];
          if (pm !== 'npm' && pm !== 'pnpm') {
            return err(new Error('Package manager must be "npm" or "pnpm"'));
          }
          config.packageManager = pm;
          i++; // Skip the value
          break;

        case '--docs':
          config.includeDocs = true;
          break;

        case '--no-git':
          config.initGit = false;
          break;

        case '--no-install':
          config.installDependencies = false;
          break;

        case '--force':
          config.force = true;
          break;

        case '--dry-run':
          config.dryRun = true;
          break;

        case '--verbose':
          config.verbose = true;
          break;

        default:
          if (arg.startsWith('-')) {
            return err(new Error(`Unknown option: ${arg}`));
          }
          // Additional positional arguments are not supported
          return err(new Error(`Unexpected argument: ${arg}`));
      }

      i++;
    }

    // Validate required arguments
    if (!config.help && !config.version && !config.projectName) {
      return err(new Error('Project name is required'));
    }

    return ok(config);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
