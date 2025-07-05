import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateCompiler } from '../lib/template-compiler.js';
import { writeFile, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Template Compiler Security', () => {
  let compiler: TemplateCompiler;
  let tempDir: string;

  beforeEach(() => {
    compiler = new TemplateCompiler();
    tempDir = join(tmpdir(), 'trailhead-test-' + Date.now());
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Context Sanitization', () => {
    it('should sanitize string values in context', async () => {
      const templatePath = join(tempDir, 'test.hbs');
      writeFile(templatePath, '{{projectName}}', () => {});

      const maliciousContext = {
        projectName: 'test\\0malicious',
      };

      const result = await compiler.compileTemplate(
        templatePath,
        maliciousContext,
      );
      expect(result).toBe('testmalicious');
    });

    it('should sanitize nested object properties', async () => {
      const templatePath = join(tempDir, 'test.hbs');
      writeFile(templatePath, '{{user.name}} {{user.email}}', () => {});

      const maliciousContext = {
        user: {
          name: 'John\\0Doe',
          email: 'test@evil.com\\x01malicious',
        },
      };

      const result = await compiler.compileTemplate(
        templatePath,
        maliciousContext,
      );
      expect(result).toBe('JohnDoe test@evil.commalicious');
    });

    it('should handle array values safely', async () => {
      const templatePath = join(tempDir, 'test.hbs');
      writeFile(templatePath, '{{#each items}}{{this}}{{/each}}', () => {});

      const maliciousContext = {
        items: ['item1\\0malicious', 'item2\\x01dangerous'],
      };

      const result = await compiler.compileTemplate(
        templatePath,
        maliciousContext,
      );
      expect(result).toBe('item1maliciousitem2dangerous');
    });

    it('should filter out dangerous property types', async () => {
      const templatePath = join(tempDir, 'test.hbs');
      writeFile(templatePath, '{{projectName}} {{func}} {{undef}}', () => {});

      const maliciousContext = {
        projectName: 'test',
        func: () => 'dangerous',
        undef: undefined,
        sym: Symbol('test'),
      };

      const result = await compiler.compileTemplate(
        templatePath,
        maliciousContext,
      );
      expect(result).toBe('test  ');
    });
  });

  describe('Helper Security', () => {
    it('should sanitize input to string helpers', async () => {
      const templatePath = join(tempDir, 'test.hbs');
      writeFile(templatePath, '{{uppercase name}}', () => {});

      const maliciousContext = {
        name: 'test\\0malicious',
      };

      const result = await compiler.compileTemplate(
        templatePath,
        maliciousContext,
      );
      expect(result).toBe('TESTMALICIOUS');
    });

    it('should handle malicious input to case helpers', async () => {
      const templatePath = join(tempDir, 'test.hbs');
      writeFile(templatePath, '{{kebab name}} {{pascal name}}', () => {});

      const maliciousContext = {
        name: 'Test\\x01Name',
      };

      const result = await compiler.compileTemplate(
        templatePath,
        maliciousContext,
      );
      expect(result).toBe('test-name TestName');
    });

    it('should safely handle JSON helper with malicious data', async () => {
      const templatePath = join(tempDir, 'test.hbs');
      writeFile(templatePath, '{{{json data}}}', () => {});

      const maliciousContext = {
        data: {
          name: 'test\\0malicious',
          evil: () => 'code',
        },
      };

      const result = await compiler.compileTemplate(
        templatePath,
        maliciousContext,
      );
      const parsed = JSON.parse(result);
      expect(parsed.name).toBe('testmalicious');
      expect(parsed.evil).toBe('');
    });
  });

  describe('Template Content Security', () => {
    it('should enable HTML escaping by default', async () => {
      const templatePath = join(tempDir, 'test.hbs');
      writeFile(templatePath, '{{content}}', () => {});

      const maliciousContext = {
        content: '<script>alert("xss")</script>',
      };

      const result = await compiler.compileTemplate(
        templatePath,
        maliciousContext,
      );
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should operate in strict mode', async () => {
      const templatePath = join(tempDir, 'test.hbs');
      writeFile(templatePath, '{{undefinedVariable}}', () => {});

      const context = {
        definedVariable: 'test',
      };

      // In strict mode, undefined variables should throw or render empty
      const result = await compiler.compileTemplate(templatePath, context);
      expect(result.trim()).toBe('');
    });

    it('should prevent partial injection', async () => {
      const templatePath = join(tempDir, 'test.hbs');
      writeFile(templatePath, '{{> ../malicious}}', () => {});

      const context = {};

      // Should fail gracefully without exposing system information
      await expect(async () => {
        await compiler.compileTemplate(templatePath, context);
      }).rejects.toThrow();
    });
  });

  describe('Cache Security', () => {
    it('should validate cached template integrity', async () => {
      const templatePath = join(tempDir, 'test.hbs');
      writeFile(templatePath, '{{projectName}}', () => {});

      const context = { projectName: 'test' };

      // First compilation
      const result1 = await compiler.compileTemplate(templatePath, context);
      expect(result1).toBe('test');

      // Simulate template modification (cache should be invalidated)
      writeFile(templatePath, '{{projectName}} modified', () => {});

      // Second compilation should use new content
      const result2 = await compiler.compileTemplate(templatePath, context);
      expect(result2).toBe('test modified');
    });

    it('should handle cache cleanup securely', () => {
      // Fill cache with many entries
      for (let i = 0; i < 150; i++) {
        const path = `/fake/path/${i}`;
        (compiler as any).cache.set(path, {
          template: () => '',
          mtime: Date.now(),
          hash: 'fake-hash',
        });
      }

      // Should cleanup without throwing
      expect(() => compiler.cleanup(50)).not.toThrow();
      expect(compiler.getCacheStats().size).toBe(50);
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose sensitive paths in errors', async () => {
      const nonExistentPath = '/etc/passwd';

      await expect(async () => {
        await compiler.compileTemplate(nonExistentPath, {});
      }).rejects.toThrow();

      // Error should not contain the full path
      try {
        await compiler.compileTemplate(nonExistentPath, {});
      } catch (error) {
        expect(error.message).not.toContain('/etc/passwd');
      }
    });

    it('should handle malformed templates gracefully', async () => {
      const templatePath = join(tempDir, 'malformed.hbs');
      writeFile(templatePath, '{{#if unclosed', () => {});

      await expect(async () => {
        await compiler.compileTemplate(templatePath, {});
      }).rejects.toThrow();
    });

    it('should prevent memory exhaustion attacks', async () => {
      const templatePath = join(tempDir, 'large.hbs');
      const largeTemplate = '{{projectName}}'.repeat(10000);
      writeFile(templatePath, largeTemplate, () => {});

      const context = { projectName: 'x'.repeat(1000) };

      // Should complete without hanging or excessive memory use
      const result = await compiler.compileTemplate(templatePath, context);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Security', () => {
    it('should handle many template compilations efficiently', async () => {
      const templatePath = join(tempDir, 'perf.hbs');
      writeFile(templatePath, '{{projectName}}-{{version}}', () => {});

      const context = { projectName: 'test', version: '1.0.0' };

      const start = Date.now();

      // Compile same template multiple times (should use cache)
      for (let i = 0; i < 100; i++) {
        await compiler.compileTemplate(templatePath, context);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete quickly due to caching
    });

    it('should prevent ReDoS attacks in helpers', async () => {
      const templatePath = join(tempDir, 'redos.hbs');
      writeFile(templatePath, '{{kebab evilString}}', () => {});

      // String designed to cause catastrophic backtracking
      const evilString = 'a'.repeat(50) + 'X';
      const context = { evilString };

      const start = Date.now();
      await compiler.compileTemplate(templatePath, context);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should complete quickly
    });
  });
});
