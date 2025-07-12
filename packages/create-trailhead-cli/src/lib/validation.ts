import { resolve, normalize, isAbsolute, relative } from 'path';
import { z } from 'zod';
import { ok, err, createCLIError } from '@trailhead/core';
import type { Result, CLIError } from '@trailhead/core';

/**
 * Validation utilities using Zod schemas for type-safe input validation
 */

// Constants for validation limits
const MAX_PROJECT_NAME_LENGTH = 100;
const MAX_PATH_LENGTH = 260; // Windows MAX_PATH limit
const MAX_TEXT_LENGTH = 1000;

// Allowed values
const ALLOWED_PACKAGE_MANAGERS = ['npm', 'pnpm'] as const;
const ALLOWED_TEMPLATES = ['basic', 'advanced'] as const;

// Zod schemas for validation
const projectNameSchema = z
  .string()
  .min(1, 'Project name cannot be empty')
  .max(
    MAX_PROJECT_NAME_LENGTH,
    `Project name must be ${MAX_PROJECT_NAME_LENGTH} characters or less`
  )
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
    'Project name can only contain alphanumeric characters, dots, dashes, and underscores. Must start with alphanumeric character.'
  )
  .refine(
    (name: string) => {
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
      return !reservedNames.includes(name.toLowerCase());
    },
    (name: string) => ({
      message: `"${name}" is a reserved name and cannot be used`,
    })
  );

const packageManagerSchema = z.enum(ALLOWED_PACKAGE_MANAGERS);

const templateSchema = z.enum(ALLOWED_TEMPLATES);

const pathSchema = z
  .string()
  .min(1, 'Path cannot be empty')
  .max(MAX_PATH_LENGTH, `Path must be ${MAX_PATH_LENGTH} characters or less`)
  .refine((path: string) => !path.includes('\u0000'), 'Path contains null bytes');

const textSchema = z
  .string()
  .max(MAX_TEXT_LENGTH, `Text input must be ${MAX_TEXT_LENGTH} characters or less`)
  .transform((text: string) => {
    // Remove dangerous characters
    let sanitized = text;
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/\u0000/g, ''); // null bytes
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\u0001-\u0008]/g, ''); // control chars
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\u000B\u000C]/g, ''); // form feed, vertical tab
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\u000E-\u001F]/g, ''); // other control chars
    sanitized = sanitized.replace(/\u007F/g, ''); // delete char
    return sanitized.trim();
  });

/**
 * Helper function to convert Zod validation results to Result type
 */
function zodResultToResult<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  operation: string
): Result<T, CLIError> {
  try {
    const result = schema.parse(input);
    return ok(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      return err(
        createCLIError(firstIssue.message, {
          context: { operation, details: `${operation} validation failed: ${firstIssue.message}` },
        })
      );
    }
    return err(
      createCLIError(`${operation} validation failed`, {
        cause: error,
        context: { details: error instanceof Error ? error.message : String(error) },
      })
    );
  }
}

/**
 * Validate and sanitize project name
 */
export function validateProjectName(name: string): Result<string, CLIError> {
  return zodResultToResult(projectNameSchema, name, 'Project name');
}

/**
 * Validate project path with directory traversal protection
 */
export function validateProjectPath(inputPath: string, baseDir: string): Result<string, CLIError> {
  // First validate the basic path schema
  const basicValidation = zodResultToResult(pathSchema, inputPath, 'Project path');
  if (!basicValidation.isOk()) {
    return basicValidation;
  }

  const trimmed = inputPath.trim();

  try {
    const resolvedPath = isAbsolute(trimmed) ? trimmed : resolve(baseDir, trimmed);
    return ok(resolvedPath);
  } catch (error) {
    return err(
      createCLIError('Invalid project path', {
        cause: error,
        context: { details: 'Unable to resolve project path' },
      })
    );
  }
}

/**
 * Validate package manager
 */
export function validatePackageManager(packageManager: string): Result<string, CLIError> {
  return zodResultToResult(packageManagerSchema, packageManager, 'Package manager');
}

/**
 * Validate template variant
 */
export function validateTemplate(template: string): Result<string, CLIError> {
  return zodResultToResult(templateSchema, template, 'Template');
}

/**
 * Validate template file path to prevent directory traversal
 */
export function validateTemplatePath(
  filePath: string,
  baseTemplateDir: string
): Result<string, CLIError> {
  // First validate basic path
  const basicValidation = zodResultToResult(pathSchema, filePath, 'Template file path');
  if (!basicValidation.isOk()) {
    return basicValidation;
  }

  try {
    const normalizedPath = normalize(filePath);
    const resolvedPath = resolve(baseTemplateDir, normalizedPath);
    const relativePath = relative(baseTemplateDir, resolvedPath);

    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      return err(
        createCLIError('Invalid template path', {
          context: { details: 'Template path must be within the template directory' },
        })
      );
    }

    return ok(resolvedPath);
  } catch (error) {
    return err(
      createCLIError('Invalid template path', {
        cause: error,
        context: { details: 'Unable to resolve template path' },
      })
    );
  }
}

/**
 * Validate output file path to prevent directory traversal
 */
export function validateOutputPath(
  filePath: string,
  baseOutputDir: string
): Result<string, CLIError> {
  // First validate basic path
  const basicValidation = zodResultToResult(pathSchema, filePath, 'Output file path');
  if (!basicValidation.isOk()) {
    return basicValidation;
  }

  try {
    const normalizedPath = normalize(filePath);

    if (normalizedPath.includes('..') || isAbsolute(normalizedPath)) {
      return err(
        createCLIError('Invalid output path', {
          context: { details: 'Output path must be relative and within the project directory' },
        })
      );
    }

    const resolvedPath = resolve(baseOutputDir, normalizedPath);
    const relativePath = relative(baseOutputDir, resolvedPath);

    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      return err(
        createCLIError('Invalid output path', {
          context: { details: 'Output path must be within the project directory' },
        })
      );
    }

    return ok(resolvedPath);
  } catch (error) {
    return err(
      createCLIError('Invalid output path', {
        cause: error,
        context: { details: 'Unable to resolve output path' },
      })
    );
  }
}

/**
 * Sanitize text input to prevent injection attacks
 */
export function sanitizeText(
  input: string,
  _maxLength: number = MAX_TEXT_LENGTH
): Result<string, CLIError> {
  if (!input || typeof input !== 'string') {
    return err(
      createCLIError('Text input is required', {
        context: { details: 'Text input must be a string' },
      })
    );
  }

  return zodResultToResult(textSchema, input, 'Text input');
}

// Export schemas for external use if needed
export const schemas = {
  projectName: projectNameSchema,
  packageManager: packageManagerSchema,
  template: templateSchema,
  path: pathSchema,
  text: textSchema,
} as const;

// Export constants for external use
export const constants = {
  MAX_PROJECT_NAME_LENGTH,
  MAX_PATH_LENGTH,
  MAX_TEXT_LENGTH,
  ALLOWED_PACKAGE_MANAGERS,
  ALLOWED_TEMPLATES,
} as const;
