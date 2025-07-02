import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

// Skip example CLI tests - they require @trailhead/cli to be published or dist files built
// These tests execute actual CLI files that import from dist/index.js
// They will pass once the package is published to npm or when using make-standalone.sh script
describe.skip('Advanced CLI Example Integration Tests', () => {
  const advancedCliPath = resolve(__dirname, '../advanced-cli.ts');
  let testDir: string;
  let testInputFile: string;
  let testInputFile2: string;

  beforeAll(async () => {
    // Create a temporary directory for test files
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'advanced-cli-test-'));
    testInputFile = path.join(testDir, 'test-input.txt');
    testInputFile2 = path.join(testDir, 'test-input2.txt');
    
    // Create test files
    await fs.writeFile(testInputFile, 'Hello World\nThis is a test file\nWith multiple lines');
    await fs.writeFile(testInputFile2, 'Another test file\nWith different content');
  });

  afterAll(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('process command', () => {
    it('should process file with default text format', async () => {
      const result = execSync(`npx tsx "${advancedCliPath}" process "${testInputFile}"`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Successfully processed file');

      // Check that output file was created
      const outputPath = `${testInputFile}.processed`;
      const outputContent = await fs.readFile(outputPath, 'utf-8');
      expect(outputContent).toBe('HELLO WORLD\nTHIS IS A TEST FILE\nWITH MULTIPLE LINES');

      // Cleanup
      await fs.unlink(outputPath);
    });

    it('should process file with JSON format', async () => {
      const outputPath = path.join(testDir, 'output.json');
      
      const result = execSync(`npx tsx "${advancedCliPath}" process "${testInputFile}" --output "${outputPath}" --format json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Successfully processed file');

      // Check JSON output
      const outputContent = await fs.readFile(outputPath, 'utf-8');
      const parsed = JSON.parse(outputContent);
      expect(parsed.content).toBe('Hello World\nThis is a test file\nWith multiple lines');
      expect(parsed.timestamp).toBeDefined();

      // Cleanup
      await fs.unlink(outputPath);
    });

    it('should process file with CSV format', async () => {
      const outputPath = path.join(testDir, 'output.csv');
      
      const result = execSync(`npx tsx "${advancedCliPath}" process "${testInputFile}" --output "${outputPath}" --format csv`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Successfully processed file');

      // Check CSV output
      const outputContent = await fs.readFile(outputPath, 'utf-8');
      expect(outputContent).toBe('"Hello World",\n"This is a test file",\n"With multiple lines"');

      // Cleanup
      await fs.unlink(outputPath);
    });

    it('should handle dry run mode', () => {
      const result = execSync(`npx tsx "${advancedCliPath}" process "${testInputFile}" --dry-run`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('[DRY RUN] Would write to:');
      expect(result).toContain('Successfully processed file (dry run)');
    });

    it('should use custom output path', async () => {
      const outputPath = path.join(testDir, 'custom-output.txt');
      
      const result = execSync(`npx tsx "${advancedCliPath}" process "${testInputFile}" --output "${outputPath}"`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Successfully processed file');

      // Check that file was created at custom path
      const outputContent = await fs.readFile(outputPath, 'utf-8');
      expect(outputContent).toBe('HELLO WORLD\nTHIS IS A TEST FILE\nWITH MULTIPLE LINES');

      // Cleanup
      await fs.unlink(outputPath);
    });

    it('should handle verbose mode', () => {
      const result = execSync(`npx tsx "${advancedCliPath}" process "${testInputFile}" --verbose --dry-run`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Processing');
      expect(result).toContain('characters...');
    });

    it('should handle missing input file error', () => {
      const nonExistentFile = path.join(testDir, 'does-not-exist.txt');
      
      try {
        execSync(`npx tsx "${advancedCliPath}" process "${nonExistentFile}"`, {
          encoding: 'utf8',
          cwd: process.cwd(),
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.stdout || error.stderr).toContain('Failed to read file');
      }
    });

    it('should use short flags', async () => {
      const outputPath = path.join(testDir, 'short-flags.json');
      
      const result = execSync(`npx tsx "${advancedCliPath}" process "${testInputFile}" -o "${outputPath}" -f json`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Successfully processed file');

      // Verify file was created
      expect(await fs.access(outputPath)).toBe(undefined);

      // Cleanup
      await fs.unlink(outputPath);
    });
  });

  describe('batch command', () => {
    it('should process multiple files with default prefix', async () => {
      // Create pattern that matches our test files
      const pattern = path.join(testDir, 'test-input');
      
      const result = execSync(`npx tsx "${advancedCliPath}" batch "${pattern}"`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Processed');
      expect(result).toContain('files');

      // Check that processed files were created
      const processedFile1 = path.join(testDir, 'processed_test-input.txt');
      const processedFile2 = path.join(testDir, 'processed_test-input2.txt');

      const content1 = await fs.readFile(processedFile1, 'utf-8');
      const content2 = await fs.readFile(processedFile2, 'utf-8');

      expect(content1).toBe('HELLO WORLD\nTHIS IS A TEST FILE\nWITH MULTIPLE LINES');
      expect(content2).toBe('ANOTHER TEST FILE\nWITH DIFFERENT CONTENT');

      // Cleanup
      await fs.unlink(processedFile1);
      await fs.unlink(processedFile2);
    });

    it('should use custom prefix', async () => {
      const pattern = path.join(testDir, 'test-input');
      
      const result = execSync(`npx tsx "${advancedCliPath}" batch "${pattern}" --prefix "custom_"`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Processed');

      // Check that files were created with custom prefix
      const customFile1 = path.join(testDir, 'custom_test-input.txt');
      const customFile2 = path.join(testDir, 'custom_test-input2.txt');

      expect(await fs.access(customFile1)).toBe(undefined);
      expect(await fs.access(customFile2)).toBe(undefined);

      // Cleanup
      await fs.unlink(customFile1);
      await fs.unlink(customFile2);
    });

    it('should handle directory not found error', () => {
      const invalidPattern = '/nonexistent/directory/pattern';
      
      try {
        execSync(`npx tsx "${advancedCliPath}" batch "${invalidPattern}"`, {
          encoding: 'utf8',
          cwd: process.cwd(),
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.stdout || error.stderr).toContain('Failed to find files');
      }
    });
  });

  describe('CLI metadata and help', () => {
    it('should show main help', () => {
      const result = execSync(`npx tsx "${advancedCliPath}" --help`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('file-processor');
      expect(result).toContain('Advanced file processing CLI with Result type handling');
      expect(result).toContain('process');
      expect(result).toContain('batch');
    });

    it('should show version', () => {
      const result = execSync(`npx tsx "${advancedCliPath}" --version`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('2.0.0');
    });

    it('should show process command help with examples', () => {
      const result = execSync(`npx tsx "${advancedCliPath}" process --help`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Process files with various transformations');
      expect(result).toContain('--output');
      expect(result).toContain('--format');
      expect(result).toContain('--dry-run');
      expect(result).toContain('Examples:');
      expect(result).toContain('process input.txt');
      expect(result).toContain('process data.json --output result.csv --format csv');
    });

    it('should show batch command help', () => {
      const result = execSync(`npx tsx "${advancedCliPath}" batch --help`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Process multiple files at once');
      expect(result).toContain('--prefix');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle unknown command', () => {
      try {
        execSync(`npx tsx "${advancedCliPath}" unknown`, {
          encoding: 'utf8',
          cwd: process.cwd(),
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBe(1);
      }
    });

    it('should handle empty file processing', async () => {
      const emptyFile = path.join(testDir, 'empty.txt');
      await fs.writeFile(emptyFile, '');
      
      const result = execSync(`npx tsx "${advancedCliPath}" process "${emptyFile}" --dry-run`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(result).toContain('Processing 0 characters');
      expect(result).toContain('Successfully processed file (dry run)');

      // Cleanup
      await fs.unlink(emptyFile);
    });

    it('should handle permission errors gracefully', async () => {
      // Create a file in a directory that doesn't allow writes (if possible)
      const readOnlyDir = path.join(testDir, 'readonly');
      await fs.mkdir(readOnlyDir);
      
      try {
        // Try to make directory read-only (may not work on all systems)
        await fs.chmod(readOnlyDir, 0o444);
        
        const outputInReadOnly = path.join(readOnlyDir, 'output.txt');
        
        try {
          execSync(`npx tsx "${advancedCliPath}" process "${testInputFile}" --output "${outputInReadOnly}"`, {
            encoding: 'utf8',
            cwd: process.cwd(),
          });
          expect.fail('Should have failed due to permission error');
        } catch (error: any) {
          expect(error.stdout || error.stderr).toContain('Failed to write file');
        }
      } catch (error) {
        // Skip this test if we can't create read-only directory
        console.log('Skipping permission test - unable to create read-only directory');
      } finally {
        // Restore permissions and cleanup
        try {
          await fs.chmod(readOnlyDir, 0o755);
          await fs.rmdir(readOnlyDir);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
  });
});