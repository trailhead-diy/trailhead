import { describe, it, expect } from 'vitest';
import { ok, err } from 'neverthrow';
import {
  createTrailheadError,
  createValidationError,
  createFileSystemError,
  createNetworkError,
  createConfigurationError,
  createDataError,
  createGitError,
  createCLIError,
  createDatabaseError,
  withContext,
  chainError,
  getErrorMessage,
  isRecoverableError,
  getErrorType,
  getErrorCategory,
} from '../src/errors/index.js';

describe('Error System', () => {
  describe('Base Error Creation', () => {
    it('should create a basic TrailheadError', () => {
      const error = createTrailheadError('TEST_ERROR', 'Test message', {
        details: 'Test details',
        suggestion: 'Test suggestion',
        recoverable: true,
      });

      expect(error).toEqual({
        type: 'TEST_ERROR',
        message: 'Test message',
        details: 'Test details',
        suggestion: 'Test suggestion',
        recoverable: true,
        cause: undefined,
        context: undefined,
      });
    });

    it('should create error with minimal options', () => {
      const error = createTrailheadError('MINIMAL_ERROR', 'Minimal message');

      expect(error).toEqual({
        type: 'MINIMAL_ERROR',
        message: 'Minimal message',
        details: undefined,
        suggestion: undefined,
        recoverable: false,
        cause: undefined,
        context: undefined,
      });
    });
  });

  describe('Validation Errors', () => {
    it('should create validation error', () => {
      const error = createValidationError('Invalid field', {
        field: 'email',
        value: 'not-an-email',
        constraints: { format: 'email' },
        suggestion: 'Provide a valid email address',
      });

      expect(error.type).toBe('VALIDATION_ERROR');
      expect(error.category).toBe('validation');
      expect(error.field).toBe('email');
      expect(error.value).toBe('not-an-email');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('File System Errors', () => {
    it('should create file system error', () => {
      const error = createFileSystemError('read', '/test/path', 'File not found', {
        errno: -2,
        suggestion: 'Check file path',
      });

      expect(error.type).toBe('FS_READ_ERROR');
      expect(error.category).toBe('filesystem');
      expect(error.path).toBe('/test/path');
      expect(error.operation).toBe('read');
      expect(error.errno).toBe(-2);
      expect(error.recoverable).toBe(false); // read operations are not recoverable
    });

    it('should make write operations recoverable', () => {
      const error = createFileSystemError('write', '/test/path', 'Write failed');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('Network Errors', () => {
    it('should create network error', () => {
      const error = createNetworkError('Request failed', {
        url: 'https://api.example.com',
        statusCode: 404,
        suggestion: 'Check the URL',
      });

      expect(error.type).toBe('NETWORK_ERROR');
      expect(error.category).toBe('network');
      expect(error.url).toBe('https://api.example.com');
      expect(error.statusCode).toBe(404);
      expect(error.recoverable).toBe(true);
    });

    it('should create timeout error', () => {
      const error = createNetworkError('Request timed out', {
        timeout: true,
      });

      expect(error.type).toBe('NETWORK_TIMEOUT');
      expect(error.timeout).toBe(true);
    });
  });

  describe('Configuration Errors', () => {
    it('should create configuration error', () => {
      const error = createConfigurationError('Invalid config', {
        configFile: 'config.json',
        missingFields: ['apiKey'],
        invalidFields: ['port'],
      });

      expect(error.type).toBe('CONFIG_ERROR');
      expect(error.category).toBe('configuration');
      expect(error.configFile).toBe('config.json');
      expect(error.missingFields).toEqual(['apiKey']);
      expect(error.invalidFields).toEqual(['port']);
    });
  });

  describe('Data Errors', () => {
    it('should create data error', () => {
      const error = createDataError('Parse error', {
        format: 'csv',
        row: 5,
        column: 'email',
      });

      expect(error.type).toBe('DATA_ERROR');
      expect(error.category).toBe('data');
      expect(error.format).toBe('csv');
      expect(error.row).toBe(5);
      expect(error.column).toBe('email');
    });
  });

  describe('Git Errors', () => {
    it('should create git error', () => {
      const error = createGitError('Branch not found', {
        repository: '/path/to/repo',
        branch: 'feature/test',
        operation: 'checkout',
      });

      expect(error.type).toBe('GIT_ERROR');
      expect(error.category).toBe('git');
      expect(error.repository).toBe('/path/to/repo');
      expect(error.branch).toBe('feature/test');
      expect(error.operation).toBe('checkout');
    });
  });

  describe('CLI Errors', () => {
    it('should create CLI error', () => {
      const error = createCLIError('Command failed', {
        command: 'build',
        args: ['--production'],
      });

      expect(error.type).toBe('CLI_ERROR');
      expect(error.category).toBe('cli');
      expect(error.command).toBe('build');
      expect(error.args).toEqual(['--production']);
    });
  });

  describe('Database Errors', () => {
    it('should create database error', () => {
      const error = createDatabaseError('Query failed', {
        query: 'SELECT * FROM users',
        table: 'users',
        operation: 'select',
      });

      expect(error.type).toBe('DATABASE_ERROR');
      expect(error.category).toBe('db');
      expect(error.query).toBe('SELECT * FROM users');
      expect(error.table).toBe('users');
      expect(error.operation).toBe('select');
      expect(error.recoverable).toBe(true);
    });

    it('should make migrate operations non-recoverable', () => {
      const error = createDatabaseError('Migration failed', {
        operation: 'migrate',
      });
      expect(error.recoverable).toBe(false);
    });
  });

  describe('Error Enhancement', () => {
    it('should add context to error', () => {
      const baseError = createTrailheadError('TEST_ERROR', 'Test message');
      const enhancedError = withContext(baseError, {
        operation: 'test-operation',
        component: 'test-component',
      });

      expect(enhancedError.details).toContain('Operation: test-operation');
      expect(enhancedError.details).toContain('Component: test-component');
      expect(enhancedError.context).toEqual({
        operation: 'test-operation',
        component: 'test-component',
      });
    });

    it('should chain errors', () => {
      const baseError = createTrailheadError('TEST_ERROR', 'Test message');
      const cause = new Error('Original cause');
      const chainedError = chainError(baseError, cause);

      expect(chainedError.cause).toBe(cause);
    });
  });

  describe('Error Utilities', () => {
    it('should extract error message', () => {
      const error = { message: 'Test error' };
      expect(getErrorMessage(error)).toBe('Test error');

      const noMessage = {};
      expect(getErrorMessage(noMessage)).toBe('Unknown error');

      const customDefault = getErrorMessage(noMessage, 'Custom default');
      expect(customDefault).toBe('Custom default');
    });

    it('should check if error is recoverable', () => {
      expect(isRecoverableError({ recoverable: true })).toBe(true);
      expect(isRecoverableError({ recoverable: false })).toBe(false);
      expect(isRecoverableError({})).toBe(false);
    });

    it('should get error type', () => {
      expect(getErrorType({ type: 'TEST_ERROR' })).toBe('TEST_ERROR');
      expect(getErrorType({})).toBe('unknown');
    });

    it('should get error category', () => {
      expect(getErrorCategory({ category: 'filesystem' })).toBe('filesystem');
      expect(getErrorCategory({})).toBe('unknown');
    });
  });

  describe('Result Integration', () => {
    it('should work with neverthrow ok/err', () => {
      const successResult = ok('success');
      const errorResult = err(createTrailheadError('TEST_ERROR', 'Test error'));

      expect(successResult.isOk()).toBe(true);
      expect(successResult.value).toBe('success');

      expect(errorResult.isErr()).toBe(true);
      expect(errorResult.error.type).toBe('TEST_ERROR');
    });
  });
});
