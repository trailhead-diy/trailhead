import type { Result } from '../core/errors/index.js';
import { Ok, Err } from '../core/errors/index.js';
import type { CommandConfig, CommandOptions } from './base.js';
import type { CommandOption } from './types.js';

/**
 * Validates a command option configuration
 * 
 * Performs comprehensive validation of a command option to ensure it meets
 * CLI framework requirements and Commander.js compatibility.
 * 
 * @param option - The command option to validate
 * @param index - Index of the option in the options array (for error reporting)
 * @returns Result indicating validation success or detailed error information
 * 
 * @example
 * ```typescript
 * const option = {
 *   flags: '-o, --output <dir>',
 *   description: 'Output directory',
 *   type: 'string'
 * };
 * 
 * const result = validateCommandOption(option, 0);
 * if (!result.success) {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function validateCommandOption(option: CommandOption, index: number): Result<void> {
  // Option must have either name or flags
  if (!option.name && !option.flags) {
    return Err({
      code: 'INVALID_OPTION_CONFIG',
      message: `Option at index ${index} must have either 'name' or 'flags' property`,
      details: JSON.stringify({ option, index }),
      recoverable: false,
      suggestion: 'Add either a "name" property or a "flags" property to the option',
    });
  }

  // If using flags, validate the format
  if (option.flags) {
    if (typeof option.flags !== 'string') {
      return Err({
        code: 'INVALID_OPTION_FLAGS',
        message: `Option at index ${index}: 'flags' must be a string`,
        details: JSON.stringify({ option, index }),
      recoverable: false,
      });
    }

    // Validate flags format (should match Commander.js patterns)
    const flagPattern = /^(-[a-zA-Z](?:,\s*)?)?--[a-zA-Z][a-zA-Z0-9-]*(?:\s+[<[].*[>\]])?$/;
    if (!flagPattern.test(option.flags)) {
      return Err({
        code: 'INVALID_OPTION_FLAGS_FORMAT',
        message: `Option at index ${index}: Invalid flags format '${option.flags}'. Expected format: '--long' or '-s, --long' with optional value placeholder`,
        details: JSON.stringify({ option, index }),
      recoverable: false,
        suggestion: 'Use formats like "--output", "-o, --output", or "--output <value>"',
      });
    }
  }

  // If using name, validate it
  if (option.name) {
    if (typeof option.name !== 'string' || option.name.length === 0) {
      return Err({
        code: 'INVALID_OPTION_NAME',
        message: `Option at index ${index}: 'name' must be a non-empty string`,
        details: JSON.stringify({ option, index }),
      recoverable: false,
      });
    }

    // Name should be kebab-case or camelCase
    const namePattern = /^[a-zA-Z][a-zA-Z0-9-]*$/;
    if (!namePattern.test(option.name)) {
      return Err({
        code: 'INVALID_OPTION_NAME_FORMAT',
        message: `Option at index ${index}: Invalid name format '${option.name}'. Use alphanumeric characters and hyphens only`,
        details: JSON.stringify({ option, index }),
      recoverable: false,
        suggestion: 'Use kebab-case (e.g., "output-dir") or camelCase (e.g., "outputDir")',
      });
    }
  }

  // Validate alias if provided
  if (option.alias !== undefined) {
    if (typeof option.alias !== 'string' || option.alias.length !== 1 || !/[a-zA-Z]/.test(option.alias)) {
      return Err({
        code: 'INVALID_OPTION_ALIAS',
        message: `Option at index ${index}: 'alias' must be a single letter`,
        details: JSON.stringify({ option, index }),
      recoverable: false,
        suggestion: 'Use a single letter like "o" for output or "v" for verbose',
      });
    }
  }

  // Validate type if provided
  if (option.type !== undefined) {
    const validTypes = ['string', 'boolean', 'number'];
    if (!validTypes.includes(option.type)) {
      return Err({
        code: 'INVALID_OPTION_TYPE',
        message: `Option at index ${index}: Invalid type '${option.type}'. Must be one of: ${validTypes.join(', ')}`,
        details: JSON.stringify({ option, index }),
      recoverable: false,
      });
    }
  }

  // Description is required
  if (!option.description || typeof option.description !== 'string') {
    return Err({
      code: 'MISSING_OPTION_DESCRIPTION',
      message: `Option at index ${index}: 'description' is required and must be a string`,
      details: JSON.stringify({ option, index }),
      recoverable: false,
    });
  }

  return Ok(undefined);
}

/**
 * Validates a complete command configuration
 * 
 * Performs comprehensive validation of a command configuration object,
 * checking all properties including name, description, options, examples,
 * and action function for correctness and CLI framework compatibility.
 * 
 * @template T - Command options type extending CommandOptions
 * @param config - The command configuration to validate
 * @returns Result indicating validation success or detailed error information
 * 
 * @example
 * ```typescript
 * const config = {
 *   name: 'build',
 *   description: 'Build the project',
 *   options: [
 *     { flags: '--output <dir>', description: 'Output directory' }
 *   ],
 *   action: async (options, context) => {
 *     return { success: true, value: undefined };
 *   }
 * };
 * 
 * const result = validateCommandConfig(config);
 * if (!result.success) {
 *   throw new Error(`Invalid command: ${result.error.message}`);
 * }
 * ```
 */
export function validateCommandConfig<T extends CommandOptions>(config: CommandConfig<T>): Result<void> {
  // Validate name
  if (!config.name || typeof config.name !== 'string') {
    return Err({
      code: 'INVALID_COMMAND_NAME',
      message: 'Command name is required and must be a non-empty string',
      details: JSON.stringify({ config }),
      recoverable: false,
    });
  }

  const namePattern = /^[a-zA-Z][a-zA-Z0-9-]*$/;
  if (!namePattern.test(config.name)) {
    return Err({
      code: 'INVALID_COMMAND_NAME_FORMAT',
      message: `Invalid command name format '${config.name}'. Use alphanumeric characters and hyphens only`,
      details: JSON.stringify({ config }),
      recoverable: false,
      suggestion: 'Use kebab-case like "build-app" or single words like "build"',
    });
  }

  // Validate description
  if (!config.description || typeof config.description !== 'string') {
    return Err({
      code: 'INVALID_COMMAND_DESCRIPTION',
      message: 'Command description is required and must be a non-empty string',
      details: JSON.stringify({ config }),
      recoverable: false,
    });
  }

  // Validate options if provided
  if (config.options) {
    if (!Array.isArray(config.options)) {
      return Err({
        code: 'INVALID_COMMAND_OPTIONS',
        message: 'Command options must be an array',
        details: JSON.stringify({ config }),
      recoverable: false,
      });
    }

    for (let i = 0; i < config.options.length; i++) {
      const optionResult = validateCommandOption(config.options[i], i);
      if (!optionResult.success) {
        return optionResult;
      }
    }

    // Check for duplicate option names/flags
    const names = new Set<string>();
    const aliases = new Set<string>();
    
    for (let i = 0; i < config.options.length; i++) {
      const option = config.options[i];
      
      if (option.name) {
        if (names.has(option.name)) {
          return Err({
            code: 'DUPLICATE_OPTION_NAME',
            message: `Duplicate option name '${option.name}' at index ${i}`,
            details: JSON.stringify({ config, index: i }),
            recoverable: false,
          });
        }
        names.add(option.name);
      }
      
      if (option.alias) {
        if (aliases.has(option.alias)) {
          return Err({
            code: 'DUPLICATE_OPTION_ALIAS',
            message: `Duplicate option alias '${option.alias}' at index ${i}`,
            details: JSON.stringify({ config, index: i }),
            recoverable: false,
          });
        }
        aliases.add(option.alias);
      }
    }
  }

  // Validate examples if provided
  if (config.examples) {
    if (!Array.isArray(config.examples)) {
      return Err({
        code: 'INVALID_COMMAND_EXAMPLES',
        message: 'Command examples must be an array of strings',
        details: JSON.stringify({ config }),
      recoverable: false,
      });
    }

    for (let i = 0; i < config.examples.length; i++) {
      if (typeof config.examples[i] !== 'string') {
        return Err({
          code: 'INVALID_EXAMPLE_FORMAT',
          message: `Example at index ${i} must be a string`,
          details: JSON.stringify({ config, index: i }),
          recoverable: false,
        });
      }
    }
  }

  // Validate action
  if (!config.action || typeof config.action !== 'function') {
    return Err({
      code: 'INVALID_COMMAND_ACTION',
      message: 'Command action is required and must be a function',
      details: JSON.stringify({ config }),
      recoverable: false,
    });
  }

  // Validate validation function if provided
  if (config.validation && typeof config.validation !== 'function') {
    return Err({
      code: 'INVALID_COMMAND_VALIDATION',
      message: 'Command validation must be a function',
      details: JSON.stringify({ config }),
      recoverable: false,
    });
  }

  return Ok(undefined);
}

/**
 * Cache for validated option configurations to improve performance
 */
const validationCache = new WeakMap<CommandConfig<any>, boolean>();

/**
 * Validates command configuration with caching for performance
 * 
 * Provides cached validation for command configurations to avoid redundant
 * validation of the same configuration objects. Uses WeakMap for automatic
 * garbage collection when config objects are no longer referenced.
 * 
 * @template T - Command options type extending CommandOptions
 * @param config - The command configuration to validate
 * @returns Result indicating validation success or detailed error information
 * 
 * @example
 * ```typescript
 * // First call performs validation and caches result
 * const result1 = validateCommandConfigWithCache(config);
 * 
 * // Second call with same config object returns cached result
 * const result2 = validateCommandConfigWithCache(config);
 * ```
 */
export function validateCommandConfigWithCache<T extends CommandOptions>(config: CommandConfig<T>): Result<void> {
  // Check cache first
  if (validationCache.has(config)) {
    return Ok(undefined);
  }

  // Perform validation
  const result = validateCommandConfig(config);
  
  // Cache successful validations
  if (result.success) {
    validationCache.set(config, true);
  }
  
  return result;
}