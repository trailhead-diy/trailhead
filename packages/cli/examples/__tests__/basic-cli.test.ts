import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { resolve } from 'path';

// Mock process.exit to prevent test suite from exiting
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

// Skip example CLI tests - they require @trailhead/cli to be published or dist files built
// These tests execute actual CLI files that import from dist/index.js
// They will pass once the package is published to npm or when using make-standalone.sh script
describe.skip('Basic CLI Example Integration Tests', () => {
  const basicCliPath = resolve(__dirname, '../basic-cli.ts');
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('greet command', () => {
    it('should greet with default message', () => {
      const result = execSync(`npx tsx "${basicCliPath}" greet Alice`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Hello, Alice!');
    });

    it('should greet with custom message', () => {
      const result = execSync(`npx tsx "${basicCliPath}" greet Bob --message "Hi there"`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Hi there, Bob!');
    });

    it('should greet with uppercase flag', () => {
      const result = execSync(`npx tsx "${basicCliPath}" greet Charlie --uppercase`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('HELLO, CHARLIE!');
    });

    it('should greet with custom message and uppercase', () => {
      const result = execSync(`npx tsx "${basicCliPath}" greet Dana --message "Good morning" --uppercase`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('GOOD MORNING, DANA!');
    });

    it('should use short flags', () => {
      const result = execSync(`npx tsx "${basicCliPath}" greet Eve -m "Hey" -u`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('HEY, EVE!');
    });
  });

  describe('calculate command', () => {
    it('should perform addition', () => {
      const result = execSync(`npx tsx "${basicCliPath}" calculate add 5 3`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('5 add 3 = 8');
    });

    it('should perform subtraction', () => {
      const result = execSync(`npx tsx "${basicCliPath}" calculate subtract 10 4`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('10 subtract 4 = 6');
    });

    it('should perform multiplication', () => {
      const result = execSync(`npx tsx "${basicCliPath}" calculate multiply 7 6`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('7 multiply 6 = 42');
    });

    it('should perform division', () => {
      const result = execSync(`npx tsx "${basicCliPath}" calculate divide 15 3`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('15 divide 3 = 5');
    });

    it('should handle decimal results', () => {
      const result = execSync(`npx tsx "${basicCliPath}" calculate divide 10 3`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('10 divide 3 = 3.3333333333333335');
    });

    it('should handle division by zero error', () => {
      try {
        execSync(`npx tsx "${basicCliPath}" calculate divide 5 0`, {
          encoding: 'utf8',
          cwd: process.cwd(),
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.stdout || error.stderr).toContain('Cannot divide by zero');
      }
    });

    it('should validate invalid operation', () => {
      try {
        execSync(`npx tsx "${basicCliPath}" calculate power 2 3`, {
          encoding: 'utf8',
          cwd: process.cwd(),
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.stdout || error.stderr).toContain('Operation must be: add, subtract, multiply, or divide');
      }
    });

    it('should validate invalid numbers', () => {
      try {
        execSync(`npx tsx "${basicCliPath}" calculate add abc 5`, {
          encoding: 'utf8',
          cwd: process.cwd(),
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.stdout || error.stderr).toContain('Both arguments must be valid numbers');
      }
    });

    it('should validate missing arguments', () => {
      try {
        execSync(`npx tsx "${basicCliPath}" calculate add 5`, {
          encoding: 'utf8',
          cwd: process.cwd(),
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        // Commander.js handles missing required arguments automatically
        expect(error.stdout || error.stderr).toContain('missing required argument');
      }
    });
  });

  describe('CLI help and metadata', () => {
    it('should show help information', () => {
      const result = execSync(`npx tsx "${basicCliPath}" --help`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('example-cli');
      expect(result).toContain('Example CLI demonstrating @trailhead/cli features');
      expect(result).toContain('greet');
      expect(result).toContain('calculate');
    });

    it('should show version information', () => {
      const result = execSync(`npx tsx "${basicCliPath}" --version`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('1.0.0');
    });

    it('should show command-specific help for greet', () => {
      const result = execSync(`npx tsx "${basicCliPath}" greet --help`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Greet someone with a message');
      expect(result).toContain('--message');
      expect(result).toContain('--uppercase');
    });

    it('should show command-specific help for calculate', () => {
      const result = execSync(`npx tsx "${basicCliPath}" calculate --help`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Perform basic calculations');
    });
  });

  describe('error scenarios', () => {
    it('should handle unknown command', () => {
      try {
        execSync(`npx tsx "${basicCliPath}" unknown-command`, {
          encoding: 'utf8',
          cwd: process.cwd(),
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(1);
      }
    });

    it('should handle no command provided', () => {
      try {
        execSync(`npx tsx "${basicCliPath}"`, {
          encoding: 'utf8',
          cwd: process.cwd(),
        });
        expect.fail('Should have shown help and exited with status code');
      } catch (error: any) {
        // Commander.js shows help and exits with status 1 when no command is provided
        expect(error.stdout || error.stderr).toContain('example-cli');
        expect(error.status).toBe(1);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in greet name', () => {
      const result = execSync(`npx tsx "${basicCliPath}" greet "John Doe"`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Hello, John Doe!');
    });

    it('should handle negative numbers in calculation', () => {
      const result = execSync(`npx tsx "${basicCliPath}" calculate add -5 3`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('-5 add 3 = -2');
    });

    it('should handle floating point numbers', () => {
      const result = execSync(`npx tsx "${basicCliPath}" calculate multiply 2.5 4`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('2.5 multiply 4 = 10');
    });
  });
});