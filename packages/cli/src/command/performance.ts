import type { CommandOption } from './types.js';

/**
 * Processed option configuration for Commander.js registration
 */
interface ProcessedOption {
  /** Commander.js compatible flags string */
  flags: string;
  /** Option name for internal reference */
  name: string;
  /** Option value type */
  type?: 'string' | 'boolean' | 'number';
  /** Whether the option is required */
  required: boolean;
}

const optionProcessingCache = new WeakMap<CommandOption, ProcessedOption>();

/**
 * Process option configuration with caching
 *
 * Transforms a CommandOption into a ProcessedOption suitable for Commander.js
 * registration. Handles flag generation, name extraction, and type processing.
 * Results are cached using WeakMap for performance optimization.
 *
 * @param option - The command option to process
 * @param index - Index of the option in the options array (for error reporting)
 * @returns Processed option ready for Commander.js registration
 * @throws {Error} When option has neither name nor flags property
 *
 * @example
 * Process option with flags:
 * ```typescript
 * const option = {
 *   flags: '-o, --output <dir>',
 *   description: 'Output directory',
 *   type: 'string'
 * };
 *
 * const processed = processOptionWithCache(option, 0);
 * // Result: { flags: '-o, --output <dir>', name: 'output', type: 'string', required: false }
 * ```
 *
 * @example
 * Process option with name and alias:
 * ```typescript
 * const option = {
 *   name: 'verbose',
 *   alias: 'v',
 *   description: 'Enable verbose output',
 *   type: 'boolean'
 * };
 *
 * const processed = processOptionWithCache(option, 0);
 * // Result: { flags: '-v, --verbose', name: 'verbose', type: 'boolean', required: false }
 * ```
 */
export function processOptionWithCache(option: CommandOption, index: number): ProcessedOption {
  const cached = optionProcessingCache.get(option);
  if (cached) {
    return cached;
  }

  let flags: string;
  let name: string;

  if (option.flags) {
    flags = option.flags;
    const match = option.flags.match(/--([a-zA-Z][a-zA-Z0-9-]*)/);
    name = option.name || (match ? match[1] : `option_${index}`);
  } else if (option.name) {
    name = option.name;
    flags = option.alias ? `-${option.alias}, --${option.name}` : `--${option.name}`;

    if (option.type !== 'boolean') {
      flags += ' <value>';
    }
  } else {
    throw new Error(`Option at index ${index} has no name or flags`);
  }

  const processed: ProcessedOption = {
    flags,
    name,
    type: option.type,
    required: option.required || false,
  };

  optionProcessingCache.set(option, processed);
  return processed;
}

/**
 * Process all options for a command with caching
 *
 * Processes an array of command options through the caching processor,
 * returning an array of processed options ready for Commander.js registration.
 *
 * @param options - Array of command options to process
 * @returns Array of processed options with caching applied
 *
 * @example
 * ```typescript
 * const options = [
 *   { flags: '-v, --verbose', description: 'Verbose output', type: 'boolean' },
 *   { flags: '-o, --output <dir>', description: 'Output directory', type: 'string' }
 * ];
 *
 * const processed = processCommandOptionsWithCache(options);
 * // Returns array of ProcessedOption objects ready for Commander.js
 * ```
 */
export function processCommandOptionsWithCache(options: CommandOption[]): ProcessedOption[] {
  return options.map((option, index) => processOptionWithCache(option, index));
}
