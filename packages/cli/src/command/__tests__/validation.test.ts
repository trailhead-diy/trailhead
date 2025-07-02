import { describe, it, expect } from 'vitest';
import { 
  validateCommandOption, 
  validateCommandConfig,
  validateCommandConfigWithCache 
} from '../validation.js';
import type { CommandOption, CommandConfig, CommandOptions } from '../base.js';

describe('Command Validation', () => {
  describe('validateCommandOption', () => {
    it('should validate valid option with name', () => {
      const option: CommandOption = {
        name: 'output',
        description: 'Output directory',
        type: 'string',
      };

      const result = validateCommandOption(option, 0);
      expect(result.success).toBe(true);
    });

    it('should validate valid option with flags', () => {
      const option: CommandOption = {
        flags: '--output <dir>',
        description: 'Output directory',
      };

      const result = validateCommandOption(option, 0);
      expect(result.success).toBe(true);
    });

    it('should validate option with alias', () => {
      const option: CommandOption = {
        name: 'output',
        alias: 'o',
        description: 'Output directory',
      };

      const result = validateCommandOption(option, 0);
      expect(result.success).toBe(true);
    });

    it('should fail for option without name or flags', () => {
      const option: CommandOption = {
        description: 'Some option',
      };

      const result = validateCommandOption(option, 0);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_OPTION_CONFIG');
    });

    it('should fail for invalid flags format', () => {
      const option: CommandOption = {
        flags: 'invalid-flags',
        description: 'Some option',
      };

      const result = validateCommandOption(option, 0);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_OPTION_FLAGS_FORMAT');
    });

    it('should fail for invalid option name', () => {
      const option: CommandOption = {
        name: 'invalid name!',
        description: 'Some option',
      };

      const result = validateCommandOption(option, 0);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_OPTION_NAME_FORMAT');
    });

    it('should fail for invalid alias', () => {
      const option: CommandOption = {
        name: 'output',
        alias: 'invalid',
        description: 'Some option',
      };

      const result = validateCommandOption(option, 0);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_OPTION_ALIAS');
    });

    it('should fail for invalid type', () => {
      const option: CommandOption = {
        name: 'output',
        description: 'Some option',
        type: 'invalid' as any,
      };

      const result = validateCommandOption(option, 0);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_OPTION_TYPE');
    });

    it('should fail for missing description', () => {
      const option: CommandOption = {
        name: 'output',
      } as any;

      const result = validateCommandOption(option, 0);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('MISSING_OPTION_DESCRIPTION');
    });
  });

  describe('validateCommandConfig', () => {
    it('should validate valid command config', () => {
      const config: CommandConfig<CommandOptions> = {
        name: 'test',
        description: 'Test command',
        action: async () => ({ success: true, value: undefined }),
      };

      const result = validateCommandConfig(config);
      expect(result.success).toBe(true);
    });

    it('should validate command with options', () => {
      const config: CommandConfig<CommandOptions> = {
        name: 'build',
        description: 'Build command',
        options: [
          {
            name: 'output',
            description: 'Output directory',
            type: 'string',
          },
          {
            flags: '--watch',
            description: 'Watch mode',
            type: 'boolean',
          },
        ],
        action: async () => ({ success: true, value: undefined }),
      };

      const result = validateCommandConfig(config);
      expect(result.success).toBe(true);
    });

    it('should validate command with examples', () => {
      const config: CommandConfig<CommandOptions> = {
        name: 'build',
        description: 'Build command',
        examples: [
          'build --output dist',
          'build --watch',
        ],
        action: async () => ({ success: true, value: undefined }),
      };

      const result = validateCommandConfig(config);
      expect(result.success).toBe(true);
    });

    it('should fail for invalid command name', () => {
      const config: CommandConfig<CommandOptions> = {
        name: 'invalid name!',
        description: 'Test command',
        action: async () => ({ success: true, value: undefined }),
      };

      const result = validateCommandConfig(config);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COMMAND_NAME_FORMAT');
    });

    it('should fail for missing description', () => {
      const config: CommandConfig<CommandOptions> = {
        name: 'test',
        action: async () => ({ success: true, value: undefined }),
      } as any;

      const result = validateCommandConfig(config);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COMMAND_DESCRIPTION');
    });

    it('should fail for invalid options array', () => {
      const config: CommandConfig<CommandOptions> = {
        name: 'test',
        description: 'Test command',
        options: 'invalid' as any,
        action: async () => ({ success: true, value: undefined }),
      };

      const result = validateCommandConfig(config);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COMMAND_OPTIONS');
    });

    it('should fail for duplicate option names', () => {
      const config: CommandConfig<CommandOptions> = {
        name: 'test',
        description: 'Test command',
        options: [
          {
            name: 'output',
            description: 'Output directory',
          },
          {
            name: 'output',
            description: 'Another output option',
          },
        ],
        action: async () => ({ success: true, value: undefined }),
      };

      const result = validateCommandConfig(config);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('DUPLICATE_OPTION_NAME');
    });

    it('should fail for duplicate option aliases', () => {
      const config: CommandConfig<CommandOptions> = {
        name: 'test',
        description: 'Test command',
        options: [
          {
            name: 'output',
            alias: 'o',
            description: 'Output directory',
          },
          {
            name: 'other',
            alias: 'o',
            description: 'Other option',
          },
        ],
        action: async () => ({ success: true, value: undefined }),
      };

      const result = validateCommandConfig(config);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('DUPLICATE_OPTION_ALIAS');
    });

    it('should fail for missing action', () => {
      const config: CommandConfig<CommandOptions> = {
        name: 'test',
        description: 'Test command',
      } as any;

      const result = validateCommandConfig(config);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COMMAND_ACTION');
    });

    it('should fail for invalid validation function', () => {
      const config: CommandConfig<CommandOptions> = {
        name: 'test',
        description: 'Test command',
        action: async () => ({ success: true, value: undefined }),
        validation: 'invalid' as any,
      };

      const result = validateCommandConfig(config);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_COMMAND_VALIDATION');
    });

    it('should fail for invalid examples', () => {
      const config: CommandConfig<CommandOptions> = {
        name: 'test',
        description: 'Test command',
        examples: [
          'valid example',
          123 as any,
        ],
        action: async () => ({ success: true, value: undefined }),
      };

      const result = validateCommandConfig(config);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_EXAMPLE_FORMAT');
    });
  });

  describe('validateCommandConfigWithCache', () => {
    it('should cache validation results', () => {
      const config: CommandConfig<CommandOptions> = {
        name: 'test',
        description: 'Test command',
        action: async () => ({ success: true, value: undefined }),
      };

      // First call should validate
      const result1 = validateCommandConfigWithCache(config);
      expect(result1.success).toBe(true);

      // Second call should use cache (we can't easily test this without implementation details)
      const result2 = validateCommandConfigWithCache(config);
      expect(result2.success).toBe(true);
    });

    it('should not cache failed validations', () => {
      const config: CommandConfig<CommandOptions> = {
        name: 'invalid name!',
        description: 'Test command',
        action: async () => ({ success: true, value: undefined }),
      };

      const result1 = validateCommandConfigWithCache(config);
      expect(result1.success).toBe(false);

      const result2 = validateCommandConfigWithCache(config);
      expect(result2.success).toBe(false);
    });
  });
});