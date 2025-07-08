import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConfirmationPrompt, createDirectoryPrompt } from '../index.js';

// Mock @inquirer/prompts
vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn(),
  input: vi.fn(),
}));

describe('Prompts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console.log mock
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('createConfirmationPrompt', () => {
    it('should create confirmation prompt with basic message', async () => {
      const { confirm } = await import('@inquirer/prompts');
      vi.mocked(confirm).mockResolvedValue(true);

      const promptFn = createConfirmationPrompt('Are you sure?');
      const result = await promptFn();

      expect(confirm).toHaveBeenCalledWith({
        message: 'Are you sure?',
        default: true,
      });
      expect(result).toBe(true);
    });

    it('should create confirmation prompt with custom default', async () => {
      const { confirm } = await import('@inquirer/prompts');
      vi.mocked(confirm).mockResolvedValue(false);

      const promptFn = createConfirmationPrompt('Delete files?', undefined, false);
      const result = await promptFn();

      expect(confirm).toHaveBeenCalledWith({
        message: 'Delete files?',
        default: false,
      });
      expect(result).toBe(false);
    });

    it('should display details when provided', async () => {
      const { confirm } = await import('@inquirer/prompts');
      vi.mocked(confirm).mockResolvedValue(true);
      const consoleSpy = vi.spyOn(console, 'log');

      const details = ['Create new directory', 'Install dependencies', 'Setup configuration'];
      const promptFn = createConfirmationPrompt('Continue with setup?', details);

      await promptFn();

      expect(consoleSpy).toHaveBeenCalledWith('\nThis will:');
      expect(consoleSpy).toHaveBeenCalledWith('  • Create new directory');
      expect(consoleSpy).toHaveBeenCalledWith('  • Install dependencies');
      expect(consoleSpy).toHaveBeenCalledWith('  • Setup configuration');
      expect(consoleSpy).toHaveBeenCalledWith('');
    });

    it('should not display details when array is empty', async () => {
      const { confirm } = await import('@inquirer/prompts');
      vi.mocked(confirm).mockResolvedValue(true);
      const consoleSpy = vi.spyOn(console, 'log');

      const promptFn = createConfirmationPrompt('Continue?', []);

      await promptFn();

      expect(consoleSpy).not.toHaveBeenCalledWith('\nThis will:');
    });

    it('should not display details when undefined', async () => {
      const { confirm } = await import('@inquirer/prompts');
      vi.mocked(confirm).mockResolvedValue(true);
      const consoleSpy = vi.spyOn(console, 'log');

      const promptFn = createConfirmationPrompt('Continue?');

      await promptFn();

      expect(consoleSpy).not.toHaveBeenCalledWith('\nThis will:');
    });
  });

  describe('createDirectoryPrompt', () => {
    it('should create directory prompt with basic message', async () => {
      const { input } = await import('@inquirer/prompts');
      vi.mocked(input).mockResolvedValue('src/components');

      const promptFn = createDirectoryPrompt('Enter directory path:');
      const result = await promptFn();

      expect(input).toHaveBeenCalledWith({
        message: 'Enter directory path:',
        default: undefined,
        validate: expect.any(Function),
        transformer: expect.any(Function),
      });
      expect(result).toBe('src/components');
    });

    it('should create directory prompt with default path', async () => {
      const { input } = await import('@inquirer/prompts');
      vi.mocked(input).mockResolvedValue('components/ui');

      const promptFn = createDirectoryPrompt('Enter directory:', 'components');
      const result = await promptFn();

      expect(input).toHaveBeenCalledWith({
        message: 'Enter directory:',
        default: 'components',
        validate: expect.any(Function),
        transformer: expect.any(Function),
      });
      expect(result).toBe('components/ui');
    });

    describe('validation', () => {
      it('should validate valid directory paths', async () => {
        const { input } = await import('@inquirer/prompts');
        let validateFn: (answer: string) => boolean | string;

        vi.mocked(input).mockImplementation((config: any) => {
          validateFn = config.validate;
          return Promise.resolve('valid/path');
        });

        const promptFn = createDirectoryPrompt('Enter directory:');
        await promptFn();

        expect(validateFn!('src/components')).toBe(true);
        expect(validateFn!('components/ui')).toBe(true);
        expect(validateFn!('lib')).toBe(true);
      });

      it('should reject empty or invalid inputs', async () => {
        const { input } = await import('@inquirer/prompts');
        let validateFn: (answer: string) => boolean | string;

        vi.mocked(input).mockImplementation((config: any) => {
          validateFn = config.validate;
          return Promise.resolve('valid');
        });

        const promptFn = createDirectoryPrompt('Enter directory:');
        await promptFn();

        expect(validateFn!('')).toBe('Please enter a valid directory path');
        expect(validateFn!(null as any)).toBe('Please enter a valid directory path');
        expect(validateFn!(undefined as any)).toBe('Please enter a valid directory path');
      });

      it('should reject paths with .. segments', async () => {
        const { input } = await import('@inquirer/prompts');
        let validateFn: (answer: string) => boolean | string;

        vi.mocked(input).mockImplementation((config: any) => {
          validateFn = config.validate;
          return Promise.resolve('valid');
        });

        const promptFn = createDirectoryPrompt('Enter directory:');
        await promptFn();

        expect(validateFn!('../components')).toBe(
          'Please enter a relative path without ".." segments'
        );
        expect(validateFn!('src/../lib')).toBe(
          'Please enter a relative path without ".." segments'
        );
      });

      it('should reject absolute paths', async () => {
        const { input } = await import('@inquirer/prompts');
        let validateFn: (answer: string) => boolean | string;

        vi.mocked(input).mockImplementation((config: any) => {
          validateFn = config.validate;
          return Promise.resolve('valid');
        });

        const promptFn = createDirectoryPrompt('Enter directory:');
        await promptFn();

        expect(validateFn!('/absolute/path')).toBe(
          'Please enter a relative path without ".." segments'
        );
        expect(validateFn!('/usr/local')).toBe(
          'Please enter a relative path without ".." segments'
        );
      });
    });

    describe('transformation', () => {
      it('should normalize path separators and trim', async () => {
        const { input } = await import('@inquirer/prompts');
        let transformFn: (answer: string) => string;

        vi.mocked(input).mockImplementation((config: any) => {
          transformFn = config.transformer;
          return Promise.resolve('transformed');
        });

        const promptFn = createDirectoryPrompt('Enter directory:');
        await promptFn();

        expect(transformFn!('  src\\components\\ui  ')).toBe('src/components/ui');
        expect(transformFn!('lib\\utils\\')).toBe('lib/utils/');
        expect(transformFn!(' components ')).toBe('components');
      });

      it('should handle already normalized paths', async () => {
        const { input } = await import('@inquirer/prompts');
        let transformFn: (answer: string) => string;

        vi.mocked(input).mockImplementation((config: any) => {
          transformFn = config.transformer;
          return Promise.resolve('transformed');
        });

        const promptFn = createDirectoryPrompt('Enter directory:');
        await promptFn();

        expect(transformFn!('src/components')).toBe('src/components');
        expect(transformFn!('components/ui')).toBe('components/ui');
      });
    });
  });

  describe('Integration', () => {
    it('should work together in a typical flow', async () => {
      const { input, confirm } = await import('@inquirer/prompts');

      vi.mocked(input).mockResolvedValue('src/components');
      vi.mocked(confirm).mockResolvedValue(true);

      const directoryPrompt = createDirectoryPrompt('Target directory:', 'components');
      const confirmPrompt = createConfirmationPrompt('Install components?', [
        'Create directory structure',
        'Copy component files',
      ]);

      const directory = await directoryPrompt();
      const confirmed = await confirmPrompt();

      expect(directory).toBe('src/components');
      expect(confirmed).toBe(true);
    });
  });
});
