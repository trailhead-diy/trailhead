/**
 * @file Configuration templates tests
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  configTemplates,
  getTemplate,
  getTemplateNames,
  hasTemplate,
  dataProcessingTemplate,
  cliAppTemplate,
  fileWatcherTemplate,
  apiClientTemplate,
  buildToolTemplate,
  testRunnerTemplate,
} from '../templates.js';
import type {
  DataProcessingConfig,
  CliAppConfig,
  FileWatcherConfig,
  ApiClientConfig,
  BuildToolConfig,
  TestRunnerConfig,
} from '../templates.js';

describe('Configuration Templates', () => {
  describe('template structure validation', () => {
    it('all templates have required properties', () => {
      Object.values(configTemplates).forEach(template => {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('schema');
        expect(template).toHaveProperty('defaults');
        expect(typeof template.name).toBe('string');
        expect(template.schema).toBeInstanceOf(z.ZodSchema);
        expect(typeof template.defaults).toBe('object');
      });
    });

    it('template names are valid', () => {
      const names = Object.keys(configTemplates);
      expect(names).toContain('dataProcessing');
      expect(names).toContain('cliApp');
      expect(names).toContain('fileWatcher');
      expect(names).toContain('apiClient');
      expect(names).toContain('buildTool');
      expect(names).toContain('testRunner');
    });
  });

  describe('dataProcessingTemplate', () => {
    it('has correct structure and defaults', () => {
      expect(dataProcessingTemplate.name).toBe('data-processing');
      expect(dataProcessingTemplate.defaults.input.format).toBe('csv');
      expect(dataProcessingTemplate.defaults.output.format).toBe('json');
      expect(dataProcessingTemplate.defaults.validation.strict).toBe(false);
      expect(dataProcessingTemplate.defaults.performance.parallel).toBe(true);
    });

    it('validates valid configuration', () => {
      const validConfig = {
        input: {
          format: 'json' as const,
          encoding: 'utf8',
          batchSize: 500,
          skipEmptyLines: false,
          headers: true,
        },
        output: {
          format: 'yaml' as const,
          encoding: 'utf8',
          pretty: true,
          indent: 4,
        },
        validation: {
          strict: true,
          skipErrors: true,
          maxErrors: 50,
        },
        performance: {
          parallel: false,
          maxConcurrency: 2,
          memoryLimit: '1GB',
        },
      };

      const result = dataProcessingTemplate.schema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('rejects invalid configuration', () => {
      const invalidConfig = {
        input: {
          format: 'invalid-format',
          batchSize: -1, // Invalid negative value
        },
      };

      const result = dataProcessingTemplate.schema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('applies defaults correctly', () => {
      const partialConfig = {
        input: {
          format: 'json' as const,
        },
      };

      const result = dataProcessingTemplate.schema.parse(partialConfig);
      expect(result.input.encoding).toBe('utf8');
      expect(result.input.batchSize).toBe(1000);
      expect(result.output.format).toBe('json');
    });
  });

  describe('cliAppTemplate', () => {
    it('has correct structure and defaults', () => {
      expect(cliAppTemplate.name).toBe('cli-app');
      expect(cliAppTemplate.defaults.app.version).toBe('1.0.0');
      expect(cliAppTemplate.defaults.output.colors).toBe(true);
      expect(cliAppTemplate.defaults.logging.level).toBe('info');
    });

    it('validates valid configuration', () => {
      const validConfig: CliAppConfig = {
        app: {
          name: 'my-cli',
          version: '2.0.0',
          description: 'A test CLI application',
        },
        commands: {
          defaultCommand: 'help',
          helpCommand: false,
          versionCommand: true,
        },
        output: {
          colors: false,
          verbose: true,
          quiet: false,
          format: 'json',
        },
        logging: {
          level: 'debug',
          file: 'app.log',
          timestamp: false,
        },
      };

      const result = cliAppTemplate.schema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('requires app name', () => {
      const configWithoutName = {
        app: {
          version: '1.0.0',
        },
      };

      const result = cliAppTemplate.schema.safeParse(configWithoutName);
      expect(result.success).toBe(false);
    });
  });

  describe('fileWatcherTemplate', () => {
    it('has correct structure and defaults', () => {
      expect(fileWatcherTemplate.name).toBe('file-watcher');
      expect(fileWatcherTemplate.defaults.watch.paths).toEqual(['src/**/*']);
      expect(fileWatcherTemplate.defaults.events.debounce).toBe(100);
      expect(fileWatcherTemplate.defaults.actions.build).toBe(true);
    });

    it('validates valid configuration', () => {
      const validConfig: FileWatcherConfig = {
        watch: {
          paths: ['app/**/*.ts', 'lib/**/*.js'],
          ignored: ['**/node_modules/**'],
          ignoreInitial: false,
          followSymlinks: true,
        },
        events: {
          debounce: 200,
          throttle: 500,
          batchEvents: true,
          maxBatchSize: 100,
        },
        actions: {
          build: true,
          test: true,
          lint: true,
          restart: false,
        },
        notifications: {
          enabled: false,
          success: false,
          error: true,
        },
      };

      const result = fileWatcherTemplate.schema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('apiClientTemplate', () => {
    it('has correct structure and defaults', () => {
      expect(apiClientTemplate.name).toBe('api-client');
      expect(apiClientTemplate.defaults.api.timeout).toBe(30000);
      expect(apiClientTemplate.defaults.auth.type).toBe('none');
      expect(apiClientTemplate.defaults.request.followRedirects).toBe(true);
    });

    it('validates valid configuration', () => {
      const validConfig: ApiClientConfig = {
        api: {
          baseURL: 'https://api.example.com/v1',
          timeout: 60000,
          retries: 5,
          retryDelay: 2000,
        },
        auth: {
          type: 'bearer',
          token: 'abc123',
        },
        request: {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'MyApp/1.0',
          },
          userAgent: 'MyApp/1.0',
          followRedirects: false,
          maxRedirects: 3,
        },
        response: {
          validateStatus: false,
          parseJSON: true,
          errorOnFailure: false,
        },
      };

      const result = apiClientTemplate.schema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('validates URL format', () => {
      const invalidConfig = {
        api: {
          baseURL: 'not-a-url',
        },
      };

      const result = apiClientTemplate.schema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('buildToolTemplate', () => {
    it('has correct structure and defaults', () => {
      expect(buildToolTemplate.name).toBe('build-tool');
      expect(buildToolTemplate.defaults.build.entry).toBe('src/index.ts');
      expect(buildToolTemplate.defaults.build.target).toBe('es2020');
      expect(buildToolTemplate.defaults.typescript.enabled).toBe(true);
    });

    it('validates valid configuration', () => {
      const validConfig: BuildToolConfig = {
        build: {
          entry: 'app/main.ts',
          outDir: 'build',
          target: 'es2018',
          format: 'cjs',
          minify: true,
          sourcemap: false,
        },
        watch: {
          enabled: true,
          include: ['app/**/*'],
          exclude: ['**/*.test.*'],
        },
        typescript: {
          enabled: false,
          configPath: 'tsconfig.build.json',
          declaration: false,
          declarationMap: false,
        },
        plugins: {
          terser: true,
          replace: {
            'process.env.NODE_ENV': '"production"',
          },
          copy: ['assets/**/*'],
        },
      };

      const result = buildToolTemplate.schema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('testRunnerTemplate', () => {
    it('has correct structure and defaults', () => {
      expect(testRunnerTemplate.name).toBe('test-runner');
      expect(testRunnerTemplate.defaults.test.timeout).toBe(10000);
      expect(testRunnerTemplate.defaults.coverage.threshold).toBe(80);
      expect(testRunnerTemplate.defaults.environment.node).toBe(true);
    });

    it('validates valid configuration', () => {
      const validConfig: TestRunnerConfig = {
        test: {
          include: ['**/*.test.ts'],
          exclude: ['**/node_modules/**'],
          timeout: 5000,
          concurrent: false,
          maxConcurrency: 1,
        },
        coverage: {
          enabled: false,
          threshold: 90,
          include: ['lib/**/*'],
          exclude: ['**/*.d.ts'],
          reporter: 'html',
        },
        watch: {
          enabled: true,
          runOnChange: false,
          ignore: ['**/dist/**'],
        },
        environment: {
          node: false,
          jsdom: true,
          happy_dom: false,
        },
      };

      const result = testRunnerTemplate.schema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('validates coverage threshold range', () => {
      const invalidConfig = {
        coverage: {
          threshold: 150, // Invalid - over 100
        },
      };

      const result = testRunnerTemplate.schema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('utility functions', () => {
    describe('getTemplate', () => {
      it('returns correct template by name', () => {
        expect(getTemplate('dataProcessing')).toBe(dataProcessingTemplate);
        expect(getTemplate('cliApp')).toBe(cliAppTemplate);
        expect(getTemplate('fileWatcher')).toBe(fileWatcherTemplate);
      });
    });

    describe('getTemplateNames', () => {
      it('returns all template names', () => {
        const names = getTemplateNames();
        expect(names).toContain('dataProcessing');
        expect(names).toContain('cliApp');
        expect(names).toContain('fileWatcher');
        expect(names).toContain('apiClient');
        expect(names).toContain('buildTool');
        expect(names).toContain('testRunner');
        expect(names.length).toBe(6);
      });
    });

    describe('hasTemplate', () => {
      it('returns true for existing templates', () => {
        expect(hasTemplate('dataProcessing')).toBe(true);
        expect(hasTemplate('cliApp')).toBe(true);
        expect(hasTemplate('fileWatcher')).toBe(true);
      });

      it('returns false for non-existing templates', () => {
        expect(hasTemplate('nonExistent')).toBe(false);
        expect(hasTemplate('')).toBe(false);
        expect(hasTemplate('invalid-template')).toBe(false);
      });

      it('provides type narrowing', () => {
        const templateName = 'dataProcessing' as string;

        if (hasTemplate(templateName)) {
          // Should narrow type to keyof typeof configTemplates
          const template = getTemplate(templateName);
          expect(template).toBeDefined();
        }
      });
    });
  });

  describe('configTemplates object', () => {
    it('contains all expected templates', () => {
      expect(configTemplates.dataProcessing).toBe(dataProcessingTemplate);
      expect(configTemplates.cliApp).toBe(cliAppTemplate);
      expect(configTemplates.fileWatcher).toBe(fileWatcherTemplate);
      expect(configTemplates.apiClient).toBe(apiClientTemplate);
      expect(configTemplates.buildTool).toBe(buildToolTemplate);
      expect(configTemplates.testRunner).toBe(testRunnerTemplate);
    });

    it('has correct number of templates', () => {
      const templateCount = Object.keys(configTemplates).length;
      expect(templateCount).toBe(6);
    });
  });

  describe('schema integration', () => {
    it('all templates work with zod parsing', () => {
      Object.values(configTemplates).forEach(template => {
        const result = template.schema.safeParse(template.defaults);
        expect(result.success).toBe(true);
      });
    });

    it('templates can be used for partial parsing', () => {
      const partialConfig = {
        input: {
          format: 'yaml' as const,
        },
      };

      const result = dataProcessingTemplate.schema.parse(partialConfig);
      expect(result.input.format).toBe('yaml');
      expect(result.input.batchSize).toBe(1000); // Default applied
    });
  });

  describe('type inference', () => {
    it('infers correct types from schemas', () => {
      // These should compile without errors if types are correct
      const dataConfig: DataProcessingConfig = {
        input: {
          format: 'csv',
          encoding: 'utf8',
          batchSize: 1000,
          skipEmptyLines: true,
          headers: true,
        },
        output: {
          format: 'json',
          encoding: 'utf8',
          pretty: true,
          indent: 2,
        },
        validation: {
          strict: false,
          skipErrors: false,
          maxErrors: 100,
        },
        performance: {
          parallel: true,
          maxConcurrency: 4,
          memoryLimit: '512MB',
        },
      };

      expect(dataConfig.input.format).toBe('csv');
    });
  });
});
