import { resolve, normalize, isAbsolute, relative } from 'path';
import { createError } from '@esteban-url/trailhead-cli/core';
import type { Result, CLIError } from '@esteban-url/trailhead-cli/core';

/**
 * Security utilities for safe path handling and input validation
 */

// Allowed characters for project names (alphanumeric, dash, underscore, dot)
const PROJECT_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const MAX_PROJECT_NAME_LENGTH = 100;
const MAX_PATH_LENGTH = 260; // Windows MAX_PATH limit

// Allowed package managers
const ALLOWED_PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;

// Allowed template variants
const ALLOWED_TEMPLATES = ['basic', 'advanced', 'enterprise'] as const;

/**
 * Validate and sanitize project name
 */
export function validateProjectName(name: string): Result<string, CLIError> {
  if (!name || typeof name !== 'string') {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Project name is required', {
        details: 'Project name must be a non-empty string',
      }),
    };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Project name cannot be empty', {
        details: 'Project name must contain non-whitespace characters',
      }),
    };
  }

  if (trimmed.length > MAX_PROJECT_NAME_LENGTH) {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Project name too long', {
        details: `Project name must be ${MAX_PROJECT_NAME_LENGTH} characters or less`,
      }),
    };
  }

  if (!PROJECT_NAME_REGEX.test(trimmed)) {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Invalid project name format', {
        details:
          'Project name can only contain alphanumeric characters, dots, dashes, and underscores. Must start with alphanumeric character.',
      }),
    };
  }

  // Check for reserved names
  const reservedNames = [
    'con',
    'prn',
    'aux',
    'nul',
    'com1',
    'com2',
    'com3',
    'com4',
    'com5',
    'com6',
    'com7',
    'com8',
    'com9',
    'lpt1',
    'lpt2',
    'lpt3',
    'lpt4',
    'lpt5',
    'lpt6',
    'lpt7',
    'lpt8',
    'lpt9',
  ];
  if (reservedNames.includes(trimmed.toLowerCase())) {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Reserved project name', {
        details: `"${trimmed}" is a reserved name and cannot be used`,
      }),
    };
  }

  return { success: true, value: trimmed };
}

/**
 * Validate and sanitize project path to prevent directory traversal
 */
export function validateProjectPath(
  inputPath: string,
  baseDir: string,
): Result<string, CLIError> {
  if (!inputPath || typeof inputPath !== 'string') {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Project path is required', {
        details: 'Project path must be a non-empty string',
      }),
    };
  }

  const trimmed = inputPath.trim();

  if (trimmed.length === 0) {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Project path cannot be empty', {
        details: 'Project path must contain non-whitespace characters',
      }),
    };
  }

  if (trimmed.length > MAX_PATH_LENGTH) {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Project path too long', {
        details: `Project path must be ${MAX_PATH_LENGTH} characters or less`,
      }),
    };
  }

  try {
    // Normalize the path to resolve any .. or . components
    const normalizedPath = normalize(trimmed);

    // Resolve to absolute path based on baseDir
    const resolvedPath = isAbsolute(normalizedPath)
      ? normalizedPath
      : resolve(baseDir, normalizedPath);

    // Ensure the resolved path is within the base directory
    const relativePath = relative(baseDir, resolvedPath);

    // Check if path tries to escape base directory
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      return {
        success: false,
        error: createError('VALIDATION_FAILED', 'Invalid project path', {
          details: 'Project path must be within the current working directory',
        }),
      };
    }

    // Check for dangerous path components
    const pathComponents = resolvedPath.split(/[\\/]/);
    for (const component of pathComponents) {
      if (
        component === '.' ||
        component === '..' ||
        component.includes('\0') ||
        component.includes('\u0000')
      ) {
        return {
          success: false,
          error: createError('VALIDATION_FAILED', 'Invalid path component', {
            details: 'Path contains invalid or dangerous components',
          }),
        };
      }
    }

    return { success: true, value: resolvedPath };
  } catch (error) {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Invalid project path', {
        cause: error,
        details: 'Unable to resolve project path',
      }),
    };
  }
}

/**
 * Validate package manager selection
 */
export function validatePackageManager(
  packageManager: string,
): Result<string, CLIError> {
  if (!packageManager || typeof packageManager !== 'string') {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Package manager is required', {
        details: 'Package manager must be specified',
      }),
    };
  }

  const trimmed = packageManager.trim().toLowerCase();

  if (!ALLOWED_PACKAGE_MANAGERS.includes(trimmed as any)) {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Invalid package manager', {
        details: `Package manager must be one of: ${ALLOWED_PACKAGE_MANAGERS.join(', ')}`,
      }),
    };
  }

  return { success: true, value: trimmed };
}

/**
 * Validate template variant selection
 */
export function validateTemplate(template: string): Result<string, CLIError> {
  if (!template || typeof template !== 'string') {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Template is required', {
        details: 'Template variant must be specified',
      }),
    };
  }

  const trimmed = template.trim().toLowerCase();

  if (!ALLOWED_TEMPLATES.includes(trimmed as any)) {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Invalid template', {
        details: `Template must be one of: ${ALLOWED_TEMPLATES.join(', ')}`,
      }),
    };
  }

  return { success: true, value: trimmed };
}

/**
 * Sanitize template file path to prevent directory traversal
 */
export function validateTemplatePath(
  filePath: string,
  baseTemplateDir: string,
): Result<string, CLIError> {
  if (!filePath || typeof filePath !== 'string') {
    return {
      success: false,
      error: createError(
        'VALIDATION_FAILED',
        'Template file path is required',
        {
          details: 'Template file path must be specified',
        },
      ),
    };
  }

  try {
    // Normalize the path
    const normalizedPath = normalize(filePath);

    // Resolve against base template directory
    const resolvedPath = resolve(baseTemplateDir, normalizedPath);

    // Ensure the resolved path is within the base template directory
    const relativePath = relative(baseTemplateDir, resolvedPath);

    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      return {
        success: false,
        error: createError('VALIDATION_FAILED', 'Invalid template path', {
          details: 'Template path must be within the template directory',
        }),
      };
    }

    return { success: true, value: resolvedPath };
  } catch (error) {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Invalid template path', {
        cause: error,
        details: 'Unable to resolve template path',
      }),
    };
  }
}

/**
 * Sanitize output file path to prevent directory traversal during generation
 */
export function validateOutputPath(
  filePath: string,
  baseOutputDir: string,
): Result<string, CLIError> {
  if (!filePath || typeof filePath !== 'string') {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Output file path is required', {
        details: 'Output file path must be specified',
      }),
    };
  }

  try {
    // Check for dangerous characters in the input path
    if (filePath.includes('\0') || filePath.includes('\u0000')) {
      return {
        success: false,
        error: createError('VALIDATION_FAILED', 'Invalid path component', {
          details: 'Output path contains null bytes',
        }),
      };
    }

    // Normalize the path
    const normalizedPath = normalize(filePath);

    // Check if it tries to escape (before resolving)
    if (normalizedPath.includes('..') || isAbsolute(normalizedPath)) {
      return {
        success: false,
        error: createError('VALIDATION_FAILED', 'Invalid output path', {
          details:
            'Output path must be relative and within the project directory',
        }),
      };
    }

    // Resolve against base output directory
    const resolvedPath = resolve(baseOutputDir, normalizedPath);

    // Double-check that resolved path is still within base directory
    const relativePath = relative(baseOutputDir, resolvedPath);

    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      return {
        success: false,
        error: createError('VALIDATION_FAILED', 'Invalid output path', {
          details: 'Output path must be within the project directory',
        }),
      };
    }

    return { success: true, value: resolvedPath };
  } catch (error) {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Invalid output path', {
        cause: error,
        details: 'Unable to resolve output path',
      }),
    };
  }
}

/**
 * Sanitize text input to prevent injection attacks
 */
export function sanitizeText(
  input: string,
  maxLength: number = 1000,
): Result<string, CLIError> {
  if (!input || typeof input !== 'string') {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Text input is required', {
        details: 'Text input must be a string',
      }),
    };
  }

  if (input.length > maxLength) {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Text input too long', {
        details: `Text input must be ${maxLength} characters or less`,
      }),
    };
  }

  // Remove null bytes and other dangerous characters
  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove dangerous control characters (preserving tab, newline, carriage return)
  sanitized = sanitized.replace(/[\u0001-\u0008]/g, ''); // Control chars 1-8
  sanitized = sanitized.replace(/[\u000B-\u000C]/g, ''); // Vertical tab, form feed
  sanitized = sanitized.replace(/[\u000E-\u001F]/g, ''); // Control chars 14-31
  sanitized = sanitized.replace(/\u007F/g, ''); // DEL character

  return { success: true, value: sanitized.trim() };
}

/**
 * Validate git configuration value to prevent injection
 */
export function validateGitConfigValue(
  value: string,
): Result<string, CLIError> {
  if (!value || typeof value !== 'string') {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Git config value is required', {
        details: 'Git config value must be a string',
      }),
    };
  }

  const trimmed = value.trim();

  // Check for command injection patterns
  const dangerousPatterns = [
    /[;&|`$()]/, // Shell metacharacters
    /[\n\r]/, // Newlines
    /--/, // Git option prefix
    /^-/, // Leading dash
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        success: false,
        error: createError('VALIDATION_FAILED', 'Invalid git config value', {
          details: 'Git config value contains dangerous characters',
        }),
      };
    }
  }

  if (trimmed.length > 200) {
    return {
      success: false,
      error: createError('VALIDATION_FAILED', 'Git config value too long', {
        details: 'Git config value must be 200 characters or less',
      }),
    };
  }

  return { success: true, value: trimmed };
}
