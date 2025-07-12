import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  expectSuccess,
  expectFailure,
  expectErrorCode,
  expectErrorMessage,
  createResultTestSuite,
  createFileSystemTestSuite,
  createErrorTemplateTestSuite,
  createValidationTestSuite,
  createMockFactory,
  createTestSuite,
  setupResultMatchers,
  fixtures,
  testData,
  createFixtureBuilder,
  addFile,
  addCsv,
  addJson,
  addPackageJson,
  buildFixtures,
  testUtils,
  profileTest,
} from '../index.js';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { createMemoryFileSystemLegacy as createMemoryFileSystem } from '../../filesystem/index.js';
import { errorTemplates } from '../../core/error-templates.js';

// Setup custom matchers
setupResultMatchers();

describe('Enhanced Testing Utilities', () => {
  describe('Enhanced Result Assertions', () => {
    it('expectSuccess should extract value from successful Result', () => {
      const result = ok('test value');
      const value = expectSuccess(result);
      expect(value).toBe('test value');
    });

    it('expectSuccess should throw on error Result', () => {
      const result = err(new Error('test error'));
      expect(() => expectSuccess(result)).toThrow(
        'Expected successful result, but got error: test error'
      );
    });

    it('expectFailure should extract error from failed Result', () => {
      const error = new Error('test error');
      const result = err(error);
      const extractedError = expectFailure(result);
      expect(extractedError).toBe(error);
    });

    it('expectFailure should throw on successful Result', () => {
      const result = ok('success');
      expect(() => expectFailure(result)).toThrow('Expected error result, but operation succeeded');
    });

    it('expectErrorCode should validate error codes', () => {
      const error = { code: 'TEST_ERROR', message: 'Test error' };
      const result = err(error);
      const extractedError = expectErrorCode(result, 'TEST_ERROR');
      expect(extractedError).toBe(error);
    });

    it('expectErrorMessage should validate error messages', () => {
      const error = { message: 'File not found: test.txt' };
      const result = err(error);
      const extractedError = expectErrorMessage(result, 'File not found');
      expect(extractedError).toBe(error);
    });

    it('expectErrorMessage should validate with regex', () => {
      const error = { message: 'File not found: test.txt' };
      const result = err(error);
      const extractedError = expectErrorMessage(result, /File not found: .+\.txt/);
      expect(extractedError).toBe(error);
    });
  });

  describe('Custom Vitest Matchers', () => {
    it('toBeOk matcher should work', () => {
      const result = ok('success');
      expect(result).toBeOk();
    });

    it('toBeErr matcher should work', () => {
      const result = err(new Error('error'));
      expect(result).toBeErr();
    });

    it('toHaveValue matcher should work', () => {
      const result = ok('test value');
      expect(result).toHaveValue('test value');
    });

    it('toHaveErrorCode matcher should work', () => {
      const result = err({ code: 'TEST_ERROR', message: 'Test' });
      expect(result).toHaveErrorCode('TEST_ERROR');
    });

    it('toHaveErrorMessage matcher should work', () => {
      const result = err({ message: 'Test error message' });
      expect(result).toHaveErrorMessage('Test error');
    });

    it('toHaveLength matcher should work', () => {
      const result = ok([1, 2, 3]);
      expect(result).toHaveLength(3);
    });
  });

  describe('Result Test Suite Builder', () => {
    it('should create a test suite builder function', () => {
      const testCases = [
        {
          name: 'should handle successful operation',
          operation: () => ok('success'),
          shouldSucceed: true,
        },
      ];

      const suiteBuilder = createResultTestSuite('Mock Operations', testCases);
      expect(typeof suiteBuilder).toBe('function');
    });
  });

  describe('FileSystem Test Suite Builder', () => {
    it('should create a filesystem test suite builder function', () => {
      const testCases = [
        {
          name: 'should write and read files',
          async operation(fs: any) {
            return fs.readFile('/test.txt');
          },
          expectations(_result: any) {
            // Test expectations
          },
        },
      ];

      const suiteBuilder = createFileSystemTestSuite(
        'Memory FileSystem Operations',
        () => createMemoryFileSystem(),
        testCases
      );
      expect(typeof suiteBuilder).toBe('function');
    });
  });

  describe('Error Template Test Suite Builder', () => {
    it('should create an error template test suite builder function', () => {
      const testCases = [
        {
          name: 'should create file not found error',
          args: ['/test.txt'],
          expectations: {
            category: 'filesystem',
            code: 'FILE_NOT_FOUND',
          },
        },
      ];

      const suiteBuilder = createErrorTemplateTestSuite(
        'fileNotFound',
        errorTemplates.fileNotFound,
        testCases
      );
      expect(typeof suiteBuilder).toBe('function');
    });
  });

  describe('Validation Test Suite Builder', () => {
    it('should create a validation test suite builder function', () => {
      const emailValidator = (input: string): Result<string, { errors: string[] }> => {
        return input.includes('@') ? ok(input) : err({ errors: ['Invalid email'] });
      };

      const testCases = [
        {
          name: 'should accept valid email',
          input: 'test@example.com',
          shouldPass: true,
        },
      ];

      const suiteBuilder = createValidationTestSuite('Email Validation', emailValidator, testCases);
      expect(typeof suiteBuilder).toBe('function');
    });
  });

  describe('Mock Factory', () => {
    it('should create mock factory with setup and teardown', () => {
      const mockFactory = createMockFactory(
        'testMock',
        () => ({ method: vi.fn() }),
        () => console.log('reset called')
      );

      expect(mockFactory.setup).toBeDefined();
      expect(mockFactory.beforeEach).toBeDefined();
      expect(mockFactory.afterEach).toBeDefined();
      expect(mockFactory.reset).toBeDefined();

      const mock = mockFactory.setup();
      expect(mock.method).toBeDefined();
    });
  });

  describe('Test Suite Builder', () => {
    it('should create a test suite builder function', () => {
      const testSuite = createTestSuite({
        filesystem: 'memory',
        fixtures: {
          'test.txt': 'test content',
          'data.json': '{"key": "value"}',
        },
      });

      expect(typeof testSuite).toBe('function');
    });
  });

  describe('Fixture Management', () => {
    it('should create CSV fixtures', () => {
      const csvFixtures = fixtures.csv({
        'sample.csv': 'name,age\nJohn,25\nJane,30',
      });

      expect(csvFixtures.has('sample.csv')).toBe(true);
      expect(csvFixtures.get('sample.csv')).toBe('name,age\nJohn,25\nJane,30');
    });

    it('should create JSON fixtures', () => {
      const jsonFixtures = fixtures.json({
        'config.json': { name: 'test', version: '1.0.0' },
      });

      expect(jsonFixtures.has('config.json')).toBe(true);
      const content = jsonFixtures.get('config.json');
      expect(content).toContain('"name": "test"');
    });

    it('should generate test data', () => {
      const csvData = testData.csv.simple();
      expect(csvData).toContain('name,age,city');
      expect(csvData).toContain('John,25,NYC');

      const largeCsv = testData.csv.largeCsv(5);
      const lines = largeCsv.split('\n');
      expect(lines.length).toBe(6); // header + 5 rows
    });

    it('should build fixtures with functional builder', () => {
      let builder = createFixtureBuilder();
      builder = addFile(builder, 'readme.txt', 'This is a readme');
      builder = addCsv(
        builder,
        'data.csv',
        ['name', 'age'],
        [
          ['John', '25'],
          ['Jane', '30'],
        ]
      );
      builder = addJson(builder, 'config.json', { debug: true });
      builder = addPackageJson(builder, 'package.json', { name: 'test-project' });

      const fixtures = buildFixtures(builder);

      expect(fixtures.has('readme.txt')).toBe(true);
      expect(fixtures.has('data.csv')).toBe(true);
      expect(fixtures.has('config.json')).toBe(true);
      expect(fixtures.has('package.json')).toBe(true);

      expect(fixtures.get('data.csv')).toBe('name,age\nJohn,25\nJane,30');
    });
  });

  describe('Test Debugging and Profiling', () => {
    beforeEach(() => {
      testUtils.clearAll();
    });

    it('should measure performance', async () => {
      await testUtils.performance.measure('test-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      });

      const stats = testUtils.performance.getStats('test-operation');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
      expect(stats!.avg).toBeGreaterThan(9);
    });

    it('should debug operations', () => {
      testUtils.debugger.enable();

      testUtils.debugger.debug('Test debug message', { test: true });
      testUtils.debugger.info('Test info message');
      testUtils.debugger.warn('Test warning');
      testUtils.debugger.error('Test error');

      const logs = testUtils.debugger.getLogs();
      expect(logs.length).toBe(4);
      expect(logs[0].level).toBe('DEBUG');
      expect(logs[1].level).toBe('INFO');
      expect(logs[2].level).toBe('WARN');
      expect(logs[3].level).toBe('ERROR');
    });

    it('should trace Result operations', () => {
      testUtils.debugger.enable();

      const successResult = ok('success');
      const errorResult = err(new Error('error'));

      testUtils.debugger.traceResult('success-op', successResult);
      testUtils.debugger.traceResult('error-op', errorResult);

      const logs = testUtils.debugger.getLogs();
      expect(logs.length).toBe(2);
      expect(logs[0].message).toContain('success-op succeeded');
      expect(logs[1].message).toContain('error-op failed');
    });

    it('should inspect state changes', () => {
      const state1 = { count: 0, items: ['a', 'b'] };
      const state2 = { count: 1, items: ['a', 'b', 'c'] };

      testUtils.inspector.capture('initial', state1);
      testUtils.inspector.capture('updated', state2);

      const differences = testUtils.inspector.compare('initial', 'updated');
      expect(differences.length).toBe(2);
      expect(differences[0].path).toBe('count');
      expect(differences[1].path).toBe('items.2');
    });

    it('should profile test functions', async () => {
      const profiledTest = profileTest('test-function', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return 'test result';
      });

      const result = await profiledTest();
      expect(result).toBe('test result');

      const stats = testUtils.performance.getStats('test-function');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
    });
  });
});
