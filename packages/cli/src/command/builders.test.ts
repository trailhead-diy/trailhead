import { describe, it, expect, beforeEach } from 'vitest';
import { createMemoryFileSystem } from '../filesystem/index.js';
import { createSilentLogger } from '../core/index.js';
import { Ok, Err } from '../core/errors/index.js';
import {
  createFileProcessingCommand,
  commonOptions,
  defineOptions,
  type FileProcessingOptions,
  type FileProcessingContext,
} from './builders.js';
import type { CommandContext } from './types.js';

describe('Command Enhancement Suite', () => {
  let context: CommandContext;

  beforeEach(() => {
    const fs = createMemoryFileSystem();
    context = {
      projectRoot: '/test',
      logger: createSilentLogger(),
      verbose: false,
      fs,
      args: [],
    };
  });

  describe('commonOptions', () => {
    it('creates output option with defaults', () => {
      const option = commonOptions.output();

      expect(option.name).toBe('output');
      expect(option.alias).toBe('o');
      expect(option.flags).toBe('-o, --output <path>');
      expect(option.type).toBe('string');
      expect(option.description).toBe('Output file path');
    });

    it('creates output option with custom description', () => {
      const option = commonOptions.output('Custom output path');

      expect(option.description).toBe('Custom output path');
    });

    it('creates format option with default choices', () => {
      const option = commonOptions.format();

      expect(option.name).toBe('format');
      expect(option.alias).toBe('f');
      expect(option.description).toBe('Output format (json, csv)');
      expect(option.default).toBe('json');
    });

    it('creates format option with custom choices', () => {
      const option = commonOptions.format(['yaml', 'toml'], 'yaml');

      expect(option.description).toBe('Output format (yaml, toml)');
      expect(option.default).toBe('yaml');
    });

    it('creates verbose option', () => {
      const option = commonOptions.verbose();

      expect(option.name).toBe('verbose');
      expect(option.alias).toBe('v');
      expect(option.type).toBe('boolean');
      expect(option.default).toBe(false);
    });

    it('creates dryRun option', () => {
      const option = commonOptions.dryRun();

      expect(option.name).toBe('dryRun');
      expect(option.alias).toBe('d');
      expect(option.flags).toBe('-d, --dry-run');
      expect(option.type).toBe('boolean');
    });

    it('creates force option', () => {
      const option = commonOptions.force();

      expect(option.name).toBe('force');
      expect(option.flags).toBe('--force');
      expect(option.type).toBe('boolean');
    });

    it('creates interactive option', () => {
      const option = commonOptions.interactive();

      expect(option.name).toBe('interactive');
      expect(option.alias).toBe('i');
      expect(option.type).toBe('boolean');
    });
  });

  describe('defineOptions', () => {
    it('builds common options', () => {
      const options = defineOptions().common(['output', 'verbose']).build();

      expect(options).toHaveLength(2);
      expect(options[0].name).toBe('output');
      expect(options[1].name).toBe('verbose');
    });

    it('builds custom format choices', () => {
      const options = defineOptions().common(['format']).format(['xml', 'html'], 'xml').build();

      expect(options).toHaveLength(1);
      expect(options[0].name).toBe('format');
      expect(options[0].description).toBe('Output format (xml, html)');
      expect(options[0].default).toBe('xml');
    });

    it('adds custom options', () => {
      const customOption = {
        name: 'custom',
        description: 'Custom option',
        type: 'string' as const,
      };

      const options = defineOptions().common(['verbose']).custom([customOption]).build();

      expect(options).toHaveLength(2);
      expect(options[0].name).toBe('verbose');
      expect(options[1].name).toBe('custom');
    });

    it('replaces existing format option', () => {
      const options = defineOptions()
        .common(['format', 'verbose'])
        .format(['custom1', 'custom2'])
        .build();

      expect(options).toHaveLength(2);
      expect(options.filter(opt => opt.name === 'format')).toHaveLength(1);
      expect(options.find(opt => opt.name === 'format')?.description).toBe(
        'Output format (custom1, custom2)'
      );
    });

    it('supports method chaining', () => {
      const options = defineOptions()
        .common(['output', 'verbose'])
        .format(['json', 'yaml'])
        .custom([{ name: 'test', description: 'Test option', type: 'boolean' }])
        .build();

      expect(options).toHaveLength(4); // output, verbose, format, test
    });
  });

  describe('createFileProcessingCommand', () => {
    interface TestOptions extends FileProcessingOptions {
      customFlag?: boolean;
    }

    it('creates command with input file validation', async () => {
      const command = createFileProcessingCommand<TestOptions>({
        name: 'test-process',
        description: 'Test processing command',
        inputFile: { required: true },
        action: async () => Ok(undefined),
      });

      expect(command.name).toBe('test-process');
      expect(command.description).toBe('Test processing command');
    });

    it('validates required input file', async () => {
      const command = createFileProcessingCommand<TestOptions>({
        name: 'test-process',
        description: 'Test command',
        inputFile: { required: true },
        action: async () => Ok(undefined),
      });

      const result = await command.execute({}, { ...context, args: [] });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe("Required field 'input file' is missing");
      }
    });

    it('validates file existence', async () => {
      const command = createFileProcessingCommand<TestOptions>({
        name: 'test-process',
        description: 'Test command',
        inputFile: { required: true },
        action: async () => Ok(undefined),
      });

      const result = await command.execute({}, { ...context, args: ['nonexistent.txt'] });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('File not found: nonexistent.txt');
      }
    });

    it('provides file processing context', async () => {
      let capturedContext: FileProcessingContext | undefined;

      const command = createFileProcessingCommand<TestOptions>({
        name: 'test-process',
        description: 'Test command',
        inputFile: { required: true },
        action: async (options, ctx, processing) => {
          capturedContext = processing;
          return Ok(undefined);
        },
      });

      // Create test file
      await context.fs.writeFile('/test/input.txt', 'test content');

      const result = await command.execute(
        { output: '/test/output.txt' },
        { ...context, args: ['/test/input.txt'] }
      );

      expect(result.success).toBe(true);
      expect(capturedContext).toBeDefined();
      expect(capturedContext?.inputFile).toBe('/test/input.txt');
      expect(capturedContext?.outputPath).toBe('/test/output.txt');
      expect(capturedContext?.fs).toBe(context.fs);
    });

    it('includes common options', () => {
      const command = createFileProcessingCommand<TestOptions>({
        name: 'test-process',
        description: 'Test command',
        inputFile: { required: true },
        commonOptions: ['output', 'verbose', 'dryRun'],
        action: async () => Ok(undefined),
      });

      expect(command.options).toHaveLength(3);
      expect(command.options?.map(opt => opt.name)).toEqual(['output', 'verbose', 'dryRun']);
    });

    it('includes custom options', () => {
      const customOption = {
        name: 'customFlag',
        description: 'Custom flag',
        type: 'boolean' as const,
      };

      const command = createFileProcessingCommand<TestOptions>({
        name: 'test-process',
        description: 'Test command',
        inputFile: { required: true },
        customOptions: [customOption],
        action: async () => Ok(undefined),
      });

      expect(command.options).toHaveLength(1);
      expect(command.options?.[0].name).toBe('customFlag');
    });

    it('combines common and custom options', () => {
      const command = createFileProcessingCommand<TestOptions>({
        name: 'test-process',
        description: 'Test command',
        inputFile: { required: true },
        commonOptions: ['output', 'verbose'],
        customOptions: [{ name: 'custom', description: 'Custom', type: 'string' }],
        action: async () => Ok(undefined),
      });

      expect(command.options).toHaveLength(3);
      expect(command.options?.map(opt => opt.name)).toEqual(['output', 'verbose', 'custom']);
    });

    it('allows optional input file', async () => {
      const command = createFileProcessingCommand<TestOptions>({
        name: 'test-process',
        description: 'Test command',
        inputFile: { required: false },
        action: async (options, ctx, processing) => {
          expect(processing.inputFile).toBe('');
          return Ok(undefined);
        },
      });

      const result = await command.execute({}, { ...context, args: [] });
      expect(result.success).toBe(true);
    });

    it('resolves output path correctly', async () => {
      let capturedProcessing: FileProcessingContext | undefined;

      const command = createFileProcessingCommand<TestOptions>({
        name: 'test-process',
        description: 'Test command',
        inputFile: { required: false },
        commonOptions: ['output'],
        action: async (options, ctx, processing) => {
          capturedProcessing = processing;
          return Ok(undefined);
        },
      });

      await command.execute({ output: '/custom/path.json' }, { ...context, args: [] });

      expect(capturedProcessing?.outputPath).toBe('/custom/path.json');
    });

    it('handles action errors correctly', async () => {
      const command = createFileProcessingCommand<TestOptions>({
        name: 'test-process',
        description: 'Test command',
        inputFile: { required: false },
        action: async () => Err(new Error('Processing failed')),
      });

      const result = await command.execute({}, { ...context, args: [] });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Processing failed');
      }
    });
  });
});
