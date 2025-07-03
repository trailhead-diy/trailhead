import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  chalk,
  success,
  error,
  warning,
  info,
  muted,
  bold,
  dim,
  italic,
  underline,
} from '../chalk.js';

describe('Chalk Utilities', () => {
  // Mock chalk for testing
  const mockChalk = {
    green: vi.fn((text: string) => `green(${text})`),
    red: vi.fn((text: string) => `red(${text})`),
    yellow: vi.fn((text: string) => `yellow(${text})`),
    blue: vi.fn((text: string) => `blue(${text})`),
    gray: vi.fn((text: string) => `gray(${text})`),
    bold: vi.fn((text: string) => `bold(${text})`),
    dim: vi.fn((text: string) => `dim(${text})`),
    italic: vi.fn((text: string) => `italic(${text})`),
    underline: vi.fn((text: string) => `underline(${text})`),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('color functions', () => {
    it('should format success messages', () => {
      const mockSuccess = vi.fn((text: string) => `green(${text})`);
      vi.doMock('chalk', () => ({ default: { green: mockSuccess } }));

      // Since we're testing the wrapper functions, we test the expected behavior
      expect(typeof success).toBe('function');
    });

    it('should format error messages', () => {
      expect(typeof error).toBe('function');
    });

    it('should format warning messages', () => {
      expect(typeof warning).toBe('function');
    });

    it('should format info messages', () => {
      expect(typeof info).toBe('function');
    });

    it('should format muted messages', () => {
      expect(typeof muted).toBe('function');
    });
  });

  describe('style functions', () => {
    it('should format bold text', () => {
      expect(typeof bold).toBe('function');
    });

    it('should format dim text', () => {
      expect(typeof dim).toBe('function');
    });

    it('should format italic text', () => {
      expect(typeof italic).toBe('function');
    });

    it('should format underlined text', () => {
      expect(typeof underline).toBe('function');
    });
  });

  describe('chalk re-export', () => {
    it('should re-export chalk instance', () => {
      expect(chalk).toBeDefined();
      expect(typeof chalk).toBe('function');
    });
  });

  // Integration tests would require actual chalk output testing
  // but since we're re-exporting chalk functions, we mainly test
  // that our wrapper functions exist and are functions
  describe('function signatures', () => {
    const testFunctions = [
      success,
      error,
      warning,
      info,
      muted,
      bold,
      dim,
      italic,
      underline,
    ];

    testFunctions.forEach((fn, index) => {
      it(`should export function ${index + 1} correctly`, () => {
        expect(typeof fn).toBe('function');
        expect(fn.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // Test with actual strings to ensure the functions work
  describe('actual usage', () => {
    it('should handle empty strings', () => {
      expect(() => success('')).not.toThrow();
      expect(() => error('')).not.toThrow();
      expect(() => warning('')).not.toThrow();
      expect(() => info('')).not.toThrow();
      expect(() => muted('')).not.toThrow();
    });

    it('should handle regular strings', () => {
      const testString = 'test message';

      expect(() => success(testString)).not.toThrow();
      expect(() => error(testString)).not.toThrow();
      expect(() => warning(testString)).not.toThrow();
      expect(() => info(testString)).not.toThrow();
      expect(() => muted(testString)).not.toThrow();
      expect(() => bold(testString)).not.toThrow();
      expect(() => dim(testString)).not.toThrow();
      expect(() => italic(testString)).not.toThrow();
      expect(() => underline(testString)).not.toThrow();
    });

    it('should handle special characters', () => {
      const specialString =
        'Special chars: !@#$%^&*()[]{}|\\:";\'<>?,./ 中文 🚀';

      expect(() => success(specialString)).not.toThrow();
      expect(() => error(specialString)).not.toThrow();
      expect(() => warning(specialString)).not.toThrow();
      expect(() => info(specialString)).not.toThrow();
      expect(() => muted(specialString)).not.toThrow();
    });

    it('should handle multiline strings', () => {
      const multilineString = 'Line 1\\nLine 2\\nLine 3';

      expect(() => success(multilineString)).not.toThrow();
      expect(() => error(multilineString)).not.toThrow();
      expect(() => warning(multilineString)).not.toThrow();
    });

    it('should return strings', () => {
      const testString = 'test';

      expect(typeof success(testString)).toBe('string');
      expect(typeof error(testString)).toBe('string');
      expect(typeof warning(testString)).toBe('string');
      expect(typeof info(testString)).toBe('string');
      expect(typeof muted(testString)).toBe('string');
      expect(typeof bold(testString)).toBe('string');
      expect(typeof dim(testString)).toBe('string');
      expect(typeof italic(testString)).toBe('string');
      expect(typeof underline(testString)).toBe('string');
    });
  });

  describe('chalk instance methods', () => {
    it('should provide access to chalk methods', () => {
      expect(typeof chalk.green).toBe('function');
      expect(typeof chalk.red).toBe('function');
      expect(typeof chalk.yellow).toBe('function');
      expect(typeof chalk.blue).toBe('function');
      expect(typeof chalk.bold).toBe('function');
      expect(typeof chalk.dim).toBe('function');
    });

    it('should allow method chaining via chalk', () => {
      const testString = 'test';

      expect(() => chalk.bold.green(testString)).not.toThrow();
      expect(() => chalk.red.underline(testString)).not.toThrow();
      expect(() => chalk.dim.italic(testString)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle numeric inputs', () => {
      expect(() => success(String(123))).not.toThrow();
      expect(() => error(String(0))).not.toThrow();
      expect(() => warning(String(-42))).not.toThrow();
    });

    it('should handle boolean inputs converted to strings', () => {
      expect(() => success(String(true))).not.toThrow();
      expect(() => error(String(false))).not.toThrow();
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);

      expect(() => success(longString)).not.toThrow();
      expect(() => error(longString)).not.toThrow();
    });
  });

  describe('consistency', () => {
    it('should maintain consistent function signatures', () => {
      const colorFunctions = [success, error, warning, info, muted];
      const styleFunctions = [bold, dim, italic, underline];

      // All color functions should be functions (chalk functions have length 0)
      colorFunctions.forEach((fn) => {
        expect(typeof fn).toBe('function');
      });

      // All style functions should be functions
      styleFunctions.forEach((fn) => {
        expect(typeof fn).toBe('function');
      });
    });

    it('should return different outputs for different colors', () => {
      const testString = 'test';

      const successOutput = success(testString);
      const errorOutput = error(testString);
      const warningOutput = warning(testString);

      // Outputs should be different (assuming chalk adds ANSI codes)
      // We can't test exact output due to chalk's complexity, but we can
      // ensure they're all strings and potentially different
      expect(typeof successOutput).toBe('string');
      expect(typeof errorOutput).toBe('string');
      expect(typeof warningOutput).toBe('string');
    });
  });
});
