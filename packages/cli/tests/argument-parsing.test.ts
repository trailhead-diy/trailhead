import { describe, it, expect } from 'vitest';
import { validateCommandOption } from '../src/command/index.js';

describe('CLI Argument Parsing and Validation', () => {
  it('should validate valid command options', () => {
    const validOption = {
      flags: '-f, --file <path>',
      description: 'Input file path',
      required: true,
    };

    const result = validateCommandOption(validOption, 0);
    expect(result.isOk()).toBe(true);
  });

  it('should reject invalid command options', () => {
    const invalidOption = {
      flags: '', // Invalid empty flags
      description: 'Invalid option',
    };

    const result = validateCommandOption(invalidOption, 0);
    expect(result.isErr()).toBe(true);
  });

  it('should validate option flags format', () => {
    const validOptions = [
      { flags: '-v, --verbose', description: 'Verbose output' },
      { flags: '-f, --file <path>', description: 'File path' },
      { flags: '--output [path]', description: 'Output path' },
      { flags: '-h, --help', description: 'Show help' },
    ];

    validOptions.forEach((option, index) => {
      const result = validateCommandOption(option, index);
      expect(result.isOk()).toBe(true);
    });
  });

  it('should reject malformed option flags', () => {
    const invalidOptions = [
      { flags: '', description: 'Empty flags' },
      { flags: 'invalid', description: 'No dashes' },
      { flags: '-', description: 'Single dash only' },
      { flags: '--', description: 'Double dash only' },
    ];

    invalidOptions.forEach((option, index) => {
      const result = validateCommandOption(option, index);
      expect(result.isErr()).toBe(true);
    });
  });

  it('should validate required vs optional options', () => {
    const requiredOption = {
      flags: '-f, --file <path>',
      description: 'Required file path',
      required: true,
    };

    const optionalOption = {
      flags: '-o, --output [path]',
      description: 'Optional output path',
      required: false,
    };

    expect(validateCommandOption(requiredOption, 0).isOk()).toBe(true);
    expect(validateCommandOption(optionalOption, 1).isOk()).toBe(true);
  });

  it('should provide helpful error messages', () => {
    const invalidOption = {
      flags: '',
      description: 'Invalid option',
    };

    const result = validateCommandOption(invalidOption, 0);
    expect(result.isErr()).toBe(true);

    if (result.isErr()) {
      expect(result.error.message).toContain('flags');
      expect(result.error.suggestion).toBeDefined();
    }
  });

  it('should handle option descriptions', () => {
    const optionWithDescription = {
      flags: '-v, --verbose',
      description: 'Enable verbose output',
    };

    const optionWithoutDescription = {
      flags: '-v, --verbose',
    };

    expect(validateCommandOption(optionWithDescription, 0).isOk()).toBe(true);
    // Should fail without description (description is required)
    expect(validateCommandOption(optionWithoutDescription, 1).isErr()).toBe(true);
  });
});
