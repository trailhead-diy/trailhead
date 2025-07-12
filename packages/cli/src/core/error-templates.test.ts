import { describe, it, expect, beforeEach } from 'vitest';
import {
  errorTemplates,
  errors,
  createCLIErrorTemplate as createErrorTemplate,
  createCLIErrorTemplateRegistry as createErrorTemplateRegistry,
  globalErrorTemplates,
} from './error-templates.js';
import type { ErrorTemplateRegistry } from './error-templates.js';

describe('Error Templates', () => {
  describe('errorTemplates', () => {
    describe('file system errors', () => {
      it('creates file not found error', () => {
        const error = errorTemplates.fileNotFound('/path/to/file.txt');

        expect(error.category).toBe('filesystem');
        expect(error.type).toBe('FS_READ_ERROR');
        expect(error.message).toBe('File not found: /path/to/file.txt');
        expect(error.path).toBe('/path/to/file.txt');
        expect(error.operation).toBe('read');
        expect(error.errno).toBe(-2);
        expect(error.suggestion).toContain('Check if the file exists');
      });

      it('creates file not found error with custom suggestion', () => {
        const error = errorTemplates.fileNotFound('/path/to/file.txt', 'Custom suggestion');

        expect(error.suggestion).toBe('Custom suggestion');
      });

      it('creates directory not found error', () => {
        const error = errorTemplates.directoryNotFound('/path/to/dir');

        expect(error.category).toBe('filesystem');
        expect(error.message).toBe('Directory not found: /path/to/dir');
        expect(error.suggestion).toContain('Create the directory');
      });

      it('creates file already exists error', () => {
        const error = errorTemplates.fileAlreadyExists('/path/to/file.txt');

        expect(error.category).toBe('filesystem');
        expect(error.message).toBe('File already exists: /path/to/file.txt');
        expect(error.errno).toBe(-17);
        expect(error.suggestion).toContain('--force');
      });

      it('creates permission denied error', () => {
        const error = errorTemplates.permissionDenied('/path/to/file.txt', 'write');

        expect(error.category).toBe('filesystem');
        expect(error.message).toBe('Permission denied: cannot write /path/to/file.txt');
        expect(error.operation).toBe('write');
        expect(error.errno).toBe(-13);
        expect(error.suggestion).toContain('Check file permissions');
      });

      it('creates disk space full error', () => {
        const error = errorTemplates.diskSpaceFull('/path/to/file.txt');

        expect(error.category).toBe('filesystem');
        expect(error.message).toBe('No space left on device: /path/to/file.txt');
        expect(error.errno).toBe(-28);
        expect(error.suggestion).toContain('Free up disk space');
      });
    });

    describe('validation errors', () => {
      it('creates required field missing error', () => {
        const error = errorTemplates.requiredFieldMissing('email');

        expect(error.category).toBe('validation');
        expect(error.type).toBe('VALIDATION_ERROR');
        expect(error.message).toBe("Required field 'email' is missing");
        expect(error.field).toBe('email');
        expect(error.suggestion).toContain('Provide a value');
      });

      it('creates invalid format error', () => {
        const error = errorTemplates.invalidFormat('email', 'email format', 'invalid-email');

        expect(error.category).toBe('validation');
        expect(error.message).toBe("Field 'email' has invalid format: expected email format");
        expect(error.field).toBe('email');
        expect(error.value).toBe('invalid-email');
        expect(error.constraints).toEqual({ expectedFormat: 'email format' });
      });

      it('creates value out of range error', () => {
        const error = errorTemplates.valueOutOfRange('age', 18, 65, 10);

        expect(error.category).toBe('validation');
        expect(error.message).toBe("Field 'age' is out of range: must be between 18 and 65");
        expect(error.field).toBe('age');
        expect(error.value).toBe(10);
        expect(error.constraints).toEqual({ min: 18, max: 65 });
      });

      it('creates invalid choice error', () => {
        const error = errorTemplates.invalidChoice('format', ['json', 'csv', 'xml'], 'yaml');

        expect(error.category).toBe('validation');
        expect(error.message).toBe(
          "Field 'format' has invalid value: must be one of json, csv, xml"
        );
        expect(error.field).toBe('format');
        expect(error.value).toBe('yaml');
        expect(error.constraints).toEqual({ validChoices: ['json', 'csv', 'xml'] });
        expect(error.suggestion).toContain('Choose one of: json, csv, xml');
      });
    });

    describe('network errors', () => {
      it('creates connection timeout error', () => {
        const error = errorTemplates.connectionTimeout('https://api.example.com', 5000);

        expect(error.category).toBe('network');
        expect(error.type).toBe('NETWORK_TIMEOUT');
        expect(error.message).toBe('Connection timeout: https://api.example.com');
        expect(error.url).toBe('https://api.example.com');
        expect(error.timeout).toBe(true);
        expect(error.statusCode).toBe(408);
        expect(error.suggestion).toContain('5000ms');
      });

      it('creates connection refused error', () => {
        const error = errorTemplates.connectionRefused('https://api.example.com');

        expect(error.category).toBe('network');
        expect(error.message).toBe('Connection refused: https://api.example.com');
        expect(error.statusCode).toBe(0);
        expect(error.suggestion).toContain('server is running');
      });

      it('creates not found error', () => {
        const error = errorTemplates.notFound('https://api.example.com/resource');

        expect(error.category).toBe('network');
        expect(error.message).toBe('Resource not found: https://api.example.com/resource');
        expect(error.statusCode).toBe(404);
        expect(error.suggestion).toContain('Check the URL');
      });

      it('creates unauthorized error', () => {
        const error = errorTemplates.unauthorized('https://api.example.com');

        expect(error.category).toBe('network');
        expect(error.message).toBe('Unauthorized access: https://api.example.com');
        expect(error.statusCode).toBe(401);
        expect(error.suggestion).toContain('authentication credentials');
      });

      it('creates rate limited error', () => {
        const error = errorTemplates.rateLimited('https://api.example.com', 60);

        expect(error.category).toBe('network');
        expect(error.message).toBe('Rate limit exceeded: https://api.example.com');
        expect(error.statusCode).toBe(429);
        expect(error.suggestion).toContain('60 seconds');
      });

      it('creates rate limited error without retry after', () => {
        const error = errorTemplates.rateLimited('https://api.example.com');

        expect(error.suggestion).toContain('Wait a moment');
      });
    });

    describe('configuration errors', () => {
      it('creates config file missing error', () => {
        const error = errorTemplates.configFileMissing('/path/to/config.json');

        expect(error.category).toBe('configuration');
        expect(error.type).toBe('CONFIG_ERROR');
        expect(error.message).toBe('Configuration file not found: /path/to/config.json');
        expect(error.configFile).toBe('/path/to/config.json');
        expect(error.suggestion).toContain('--init');
      });

      it('creates config file invalid error', () => {
        const error = errorTemplates.configFileInvalid('/path/to/config.json', 'Unexpected token');

        expect(error.category).toBe('configuration');
        expect(error.message).toBe('Invalid configuration file: /path/to/config.json');
        expect(error.suggestion).toContain('Unexpected token');
        expect(error.suggestion).toContain('Fix the configuration syntax: Unexpected token');
      });

      it('creates config value invalid error', () => {
        const error = errorTemplates.configValueInvalid('port', 'invalid', 'number');

        expect(error.category).toBe('configuration');
        expect(error.message).toBe("Invalid configuration value for 'port': expected number");
        expect(error.invalidFields).toEqual(['port']);
        expect(error.suggestion).toContain('valid number value');
      });
    });

    describe('execution errors', () => {
      it('creates command not found error', () => {
        const error = errorTemplates.commandNotFound('nonexistent-command');

        expect(error.category).toBe('execution');
        expect(error.type).toBe('EXECUTION_ERROR');
        expect(error.message).toBe('Command not found: nonexistent-command');
        expect(error.command).toBe('nonexistent-command');
        expect(error.suggestion).toContain('installed and available in PATH');
      });

      it('creates command failed error', () => {
        const error = errorTemplates.commandFailed('test-command', 1, 'Error output');

        expect(error.category).toBe('execution');
        expect(error.message).toBe('Command failed: test-command (exit code 1)');
        expect(error.command).toBe('test-command');
        expect(error.exitCode).toBe(1);
        expect(error.stderr).toBe('Error output');
        expect(error.suggestion).toContain('Fix the error: Error output');
      });

      it('creates process timeout error', () => {
        const error = errorTemplates.processTimeout('slow-command', 30000);

        expect(error.category).toBe('execution');
        expect(error.message).toBe('Process timeout: slow-command (after 30000ms)');
        expect(error.command).toBe('slow-command');
        expect(error.message).toContain('30000ms');
        expect(error.suggestion).toContain('Increase timeout');
      });
    });

    describe('user input errors', () => {
      it('creates invalid input error', () => {
        const error = errorTemplates.invalidInput('invalid-value', 'Must be a number');

        expect(error.category).toBe('user-input');
        expect(error.type).toBe('USER_INPUT_ERROR');
        expect(error.message).toBe('Invalid input: invalid-value');
        expect(error.input).toBe('invalid-value');
        expect(error.suggestion).toContain('Must be a number');
        expect(error.suggestion).toBe('Must be a number');
      });

      it('creates missing argument error', () => {
        const error = errorTemplates.missingArgument('filename');

        expect(error.category).toBe('user-input');
        expect(error.message).toBe('Missing required argument: filename');
        expect(error.message).toContain('filename');
        expect(error.suggestion).toContain('required argument: filename');
      });

      it('creates too many arguments error', () => {
        const error = errorTemplates.tooManyArguments(2, 5);

        expect(error.category).toBe('user-input');
        expect(error.message).toBe('Too many arguments: expected 2, got 5');
        expect(error.message).toContain('expected 2');
        expect(error.message).toContain('got 5');
        expect(error.suggestion).toContain('exactly 2 arguments');
      });
    });

    describe('dependency errors', () => {
      it('creates package not installed error', () => {
        const error = errorTemplates.packageNotInstalled('typescript', 'npm install typescript');

        expect(error.category).toBe('dependency');
        expect(error.type).toBe('DEPENDENCY_ERROR');
        expect(error.message).toBe('Package not installed: typescript');
        expect(error.packageName).toBe('typescript');
        expect(error.suggestion).toBe('Install the package: npm install typescript');
      });

      it('creates version mismatch error', () => {
        const error = errorTemplates.versionMismatch('node', '18.0.0', '16.0.0');

        expect(error.category).toBe('dependency');
        expect(error.message).toBe('Version mismatch for node: required 18.0.0, found 16.0.0');
        expect(error.packageName).toBe('node');
        expect(error.requiredVersion).toBe('18.0.0');
        expect(error.installedVersion).toBe('16.0.0');
        expect(error.suggestion).toContain('Update');
      });

      it('creates dependency conflict error', () => {
        const error = errorTemplates.dependencyConflict(
          'package-a',
          'package-b',
          'Incompatible versions'
        );

        expect(error.category).toBe('dependency');
        expect(error.message).toBe('Dependency conflict between package-a and package-b');
        expect(error.packageName).toBe('package-a');
        expect(error.message).toContain('package-b');
        expect(error.suggestion).toBe('Incompatible versions');
      });
    });

    describe('operation errors', () => {
      it('creates operation cancelled error', () => {
        const error = errorTemplates.operationCancelled('file-upload');

        expect(error.type).toBe('CLI_ERROR');
        expect(error.message).toBe('Operation cancelled: file-upload');
        expect(error.recoverable).toBe(true);
        expect(error.suggestion).toContain('Restart the operation');
      });

      it('creates operation timeout error', () => {
        const error = errorTemplates.operationTimeout('backup', 60000);

        expect(error.type).toBe('CLI_ERROR');
        expect(error.message).toBe('Operation timed out: backup (after 60000ms)');
        expect(error.message).toContain('60000ms');
        expect(error.recoverable).toBe(true);
      });

      it('creates operation failed error', () => {
        const error = errorTemplates.operationFailed('sync', 'Network connection lost');

        expect(error.type).toBe('CLI_ERROR');
        expect(error.message).toBe('Operation failed: sync');
        expect(error.message).toContain('sync');
        expect(error.recoverable).toBe(true);
      });
    });

    describe('parse errors', () => {
      it('creates parse failure error', () => {
        const error = errorTemplates.parseFailure('JSON', '/path/to/file.json', 'Unexpected token');

        expect(error.type).toBe('CLI_ERROR');
        expect(error.message).toBe('Failed to parse JSON: /path/to/file.json');
        expect(error.message).toContain('JSON');
        expect(error.suggestion).toContain('Fix the JSON syntax: Unexpected token');
      });

      it('creates parse failure error without file path', () => {
        const error = errorTemplates.parseFailure('CSV');

        expect(error.message).toBe('Failed to parse CSV');
      });
    });

    describe('format errors', () => {
      it('creates unsupported format error', () => {
        const error = errorTemplates.unsupportedFormat('yaml', ['json', 'csv', 'xml']);

        expect(error.type).toBe('CLI_ERROR');
        expect(error.message).toBe('Unsupported format: yaml');
        expect(error.message).toContain('yaml');
        expect(error.suggestion).toContain('Use one of the supported formats');
      });
    });

    describe('authentication errors', () => {
      it('creates authentication failed error', () => {
        const error = errorTemplates.authenticationFailed('GitHub');

        expect(error.type).toBe('CLI_ERROR');
        expect(error.message).toBe('Authentication failed for GitHub');
        expect(error.recoverable).toBe(true);
        expect(error.suggestion).toContain('Check your credentials');
      });

      it('creates authentication failed error without service', () => {
        const error = errorTemplates.authenticationFailed();

        expect(error.message).toBe('Authentication failed');
      });

      it('creates authentication expired error', () => {
        const error = errorTemplates.authenticationExpired('API');

        expect(error.type).toBe('CLI_ERROR');
        expect(error.message).toBe('Authentication expired for API');
        expect(error.recoverable).toBe(true);
        expect(error.suggestion).toContain('Re-authenticate');
      });
    });
  });

  describe('errors alias', () => {
    it('provides access to all error templates', () => {
      expect(errors).toBe(errorTemplates);
      expect(errors.fileNotFound).toBe(errorTemplates.fileNotFound);
      expect(errors.requiredFieldMissing).toBe(errorTemplates.requiredFieldMissing);
    });
  });

  describe('createErrorTemplate', () => {
    it('creates custom error template', () => {
      const template = createErrorTemplate(
        'CUSTOM_ERROR',
        'custom',
        'Custom error: {message}',
        (message: string) =>
          ({
            code: 'CUSTOM_ERROR',
            category: 'custom',
            message: `Custom error: ${message}`,
            recoverable: false,
          }) as any
      );

      expect(template.code).toBe('CUSTOM_ERROR');
      expect(template.category).toBe('custom');
      expect(typeof template.create).toBe('function');
    });
  });

  describe('ErrorTemplateRegistry', () => {
    let registry: ErrorTemplateRegistry;

    beforeEach(() => {
      registry = createErrorTemplateRegistry();
    });

    it('registers and retrieves templates', () => {
      const template = createErrorTemplate(
        'TEST_ERROR',
        'test',
        'Test error',
        () => ({ code: 'TEST_ERROR' }) as any
      );

      const updatedRegistry = registry.register('test', template);

      expect(updatedRegistry.has('test')).toBe(true);
      expect(updatedRegistry.get('test')).toBe(template);
    });

    it('lists registered template names', () => {
      const template1 = createErrorTemplate('ERROR1', 'test', '', () => ({}) as any);
      const template2 = createErrorTemplate('ERROR2', 'test', '', () => ({}) as any);

      const registry1 = registry.register('template1', template1);
      const registry2 = registry1.register('template2', template2);

      const names = registry2.list();
      expect(names).toContain('template1');
      expect(names).toContain('template2');
      expect(names).toHaveLength(2);
    });

    it('clears all templates', () => {
      const template = createErrorTemplate('ERROR', 'test', '', () => ({}) as any);
      const registryWithTemplate = registry.register('test', template);

      expect(registryWithTemplate.has('test')).toBe(true);

      const clearedRegistry = registryWithTemplate.clear();

      expect(clearedRegistry.has('test')).toBe(false);
      expect(clearedRegistry.list()).toHaveLength(0);
    });

    it('returns undefined for non-existent templates', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
      expect(registry.has('nonexistent')).toBe(false);
    });

    it('maintains immutability between registry instances', () => {
      const template = createErrorTemplate('ERROR', 'test', '', () => ({}) as any);
      const registryWithTemplate = registry.register('test', template);

      // Original registry should not have the template
      expect(registry.has('test')).toBe(false);
      expect(registryWithTemplate.has('test')).toBe(true);
    });
  });

  describe('globalErrorTemplates', () => {
    it('provides global registry instance', () => {
      expect(globalErrorTemplates).toHaveProperty('register');
      expect(globalErrorTemplates).toHaveProperty('get');
      expect(globalErrorTemplates).toHaveProperty('has');
      expect(globalErrorTemplates).toHaveProperty('list');
      expect(globalErrorTemplates).toHaveProperty('clear');
      expect(globalErrorTemplates).toHaveProperty('getState');
      expect(typeof globalErrorTemplates.register).toBe('function');
      expect(typeof globalErrorTemplates.get).toBe('function');
      expect(typeof globalErrorTemplates.has).toBe('function');
      expect(typeof globalErrorTemplates.list).toBe('function');
      expect(typeof globalErrorTemplates.clear).toBe('function');
      expect(typeof globalErrorTemplates.getState).toBe('function');
    });
  });
});
