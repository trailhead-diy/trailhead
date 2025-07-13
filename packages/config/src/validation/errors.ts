import { createValidationError as baseCreateValidationError, z } from '@trailhead/validation';
import type { ValidationError as BaseValidationError } from '@trailhead/validation';
import { createCoreError, type CoreError } from '@trailhead/core';

// ========================================
// Enhanced Configuration Validation Errors
// ========================================

export interface ConfigValidationError extends BaseValidationError {
  readonly suggestion: string;
  readonly examples: readonly unknown[];
  readonly fixCommand?: string;
  readonly learnMoreUrl?: string;
  readonly expectedType: string;
  readonly path: readonly string[];
  readonly code?: string;
  readonly data?: Record<string, unknown>;
}

export interface ConfigValidationContext {
  readonly field: string;
  readonly value: unknown;
  readonly expectedType: string;
  readonly suggestion: string;
  readonly examples?: readonly unknown[];
  readonly path?: readonly string[];
  readonly rule?: string;
  readonly constraints?: Record<string, unknown>;
  readonly cause?: Error | CoreError;
  readonly fixCommand?: string;
  readonly learnMoreUrl?: string;
}

// ========================================
// Enhanced Error Factory Functions
// ========================================

export const createConfigValidationError = (
  context: ConfigValidationContext
): ConfigValidationError => {
  const {
    field,
    value,
    expectedType,
    suggestion,
    examples = [],
    path = [],
    rule,
    constraints,
    cause,
    fixCommand,
    learnMoreUrl,
  } = context;

  // Create base validation error
  const message = generateErrorMessage({ field, value, expectedType, suggestion, path, rule });
  const baseError = baseCreateValidationError(message, {
    field,
    value,
    constraints: { expectedType, rule },
    cause,
  });

  // Enhance with config-specific features
  return {
    ...baseError,
    suggestion,
    examples,
    expectedType,
    path,
    code: rule,
    data: constraints,
    fixCommand: fixCommand || generateFixCommand(field, rule, examples),
    learnMoreUrl: learnMoreUrl || generateLearnMoreUrl(rule),
  };
};

export const createSchemaValidationError = (
  errors: readonly ConfigValidationError[],
  schemaName?: string
): CoreError => {
  const message = schemaName
    ? `Schema validation failed for "${schemaName}" with ${errors.length} error(s)`
    : `Schema validation failed with ${errors.length} error(s)`;

  return createCoreError('SCHEMA_VALIDATION_FAILED', message, {
    component: '@trailhead/config',
    operation: 'schema-validation',
    context: {
      errorCount: errors.length,
      errors: errors, // Store original errors, not serialized
      schemaName,
    },
    recoverable: true,
    severity: 'high',
  });
};

// ========================================
// Error Message Generation
// ========================================

interface MessageContext {
  readonly field: string;
  readonly value: unknown;
  readonly expectedType: string;
  readonly suggestion: string;
  readonly path: readonly string[];
  readonly rule?: string;
}

const generateErrorMessage = (context: MessageContext): string => {
  const { field, value, expectedType, suggestion, path, rule } = context;

  const pathStr = path.length > 0 ? ` at "${path.join('.')}"` : '';
  const valueStr = ` (received: ${serializeValue(value)})`;
  const ruleStr = rule ? ` [rule: ${rule}]` : '';

  return `Invalid ${expectedType} for field "${field}"${pathStr}${valueStr}${ruleStr}. ${suggestion}`;
};

// ========================================
// Enhanced Configuration Error Factories
// ========================================

export const enhanceZodError = (zodError: z.ZodError, schemaName?: string): CoreError => {
  const configErrors = zodError.errors.map(issue => {
    const field = issue.path.join('.');
    const rule = issue.code;

    let suggestion: string;
    let examples: readonly unknown[] = [];

    switch (issue.code) {
      case 'invalid_type':
        suggestion = `Expected ${issue.expected}, received ${issue.received}`;
        examples = getTypeExamples(issue.expected);
        break;
      case 'too_small':
        if (issue.type === 'string') {
          suggestion = `Must be at least ${issue.minimum} characters`;
        } else {
          suggestion = `Must be at least ${issue.minimum}`;
        }
        break;
      case 'too_big':
        if (issue.type === 'string') {
          suggestion = `Must be at most ${issue.maximum} characters`;
        } else {
          suggestion = `Must be at most ${issue.maximum}`;
        }
        break;
      case 'invalid_enum_value':
        suggestion = `Must be one of: ${issue.options.map(v => JSON.stringify(v)).join(', ')}`;
        examples = issue.options;
        break;
      case 'invalid_string':
        if (issue.validation === 'email') {
          suggestion = 'Must be a valid email address';
          examples = ['user@example.com', 'admin@company.org'];
        } else if (issue.validation === 'url') {
          suggestion = 'Must be a valid URL';
          examples = ['https://example.com', 'http://localhost:3000'];
        } else {
          suggestion = `Invalid ${issue.validation} format`;
        }
        break;
      default:
        suggestion = issue.message;
    }

    return createConfigValidationError({
      field,
      value: undefined, // Zod doesn't always provide the actual value
      expectedType: getExpectedType(issue),
      suggestion,
      examples,
      path: issue.path.map(String),
      rule,
    });
  });

  return createSchemaValidationError(configErrors, schemaName);
};

export const createMissingFieldError = (
  field: string,
  expectedType: string,
  path: readonly string[] = []
): ConfigValidationError =>
  createConfigValidationError({
    field,
    value: undefined,
    expectedType,
    suggestion: `Add required field "${field}" to your configuration`,
    examples: getTypeExamples(expectedType),
    path,
    rule: 'required',
  });

export const createTypeError = (
  field: string,
  value: unknown,
  expectedType: string,
  path: readonly string[] = []
): ConfigValidationError =>
  createConfigValidationError({
    field,
    value,
    expectedType,
    suggestion: `Provide a valid ${expectedType} value for field "${field}"`,
    examples: getTypeExamples(expectedType),
    path,
    rule: 'type',
  });

export const createEnumError = (
  field: string,
  value: unknown,
  allowedValues: readonly unknown[],
  path: readonly string[] = []
): ConfigValidationError =>
  createConfigValidationError({
    field,
    value,
    expectedType: 'enum',
    suggestion: `Value must be one of: ${allowedValues.map(v => JSON.stringify(v)).join(', ')}`,
    examples: allowedValues,
    path,
    rule: 'enum',
    constraints: { allowedValues },
  });

export const createRangeError = (
  field: string,
  value: unknown,
  min?: number,
  max?: number,
  path: readonly string[] = []
): ConfigValidationError => {
  let suggestion: string;
  if (min !== undefined && max !== undefined) {
    suggestion = `Value must be between ${min} and ${max}`;
  } else if (min !== undefined) {
    suggestion = `Value must be at least ${min}`;
  } else if (max !== undefined) {
    suggestion = `Value must be at most ${max}`;
  } else {
    suggestion = 'Value is out of range';
  }

  return createConfigValidationError({
    field,
    value,
    expectedType: 'number',
    suggestion,
    examples: min !== undefined && max !== undefined ? [min, Math.floor((min + max) / 2), max] : [],
    path,
    rule: 'range',
    constraints: { min, max },
  });
};

export const createLengthError = (
  field: string,
  value: unknown,
  minLength?: number,
  maxLength?: number,
  path: readonly string[] = []
): ConfigValidationError => {
  let suggestion: string;
  if (minLength !== undefined && maxLength !== undefined) {
    suggestion = `Length must be between ${minLength} and ${maxLength} characters`;
  } else if (minLength !== undefined) {
    suggestion = `Length must be at least ${minLength} characters`;
  } else if (maxLength !== undefined) {
    suggestion = `Length must be at most ${maxLength} characters`;
  } else {
    suggestion = 'Length is invalid';
  }

  return createConfigValidationError({
    field,
    value,
    expectedType: 'string',
    suggestion,
    examples: [],
    path,
    rule: 'length',
    constraints: { minLength, maxLength },
  });
};

export const createPatternError = (
  field: string,
  value: unknown,
  pattern: string,
  description?: string,
  path: readonly string[] = []
): ConfigValidationError =>
  createConfigValidationError({
    field,
    value,
    expectedType: 'string',
    suggestion: description || `Value must match pattern: ${pattern}`,
    examples: [],
    path,
    rule: 'pattern',
    constraints: { pattern, description },
  });

// ========================================
// Utility Functions
// ========================================

const generateFixCommand = (
  field: string,
  rule?: string,
  examples?: readonly unknown[]
): string => {
  const fieldPath = field;

  switch (rule) {
    case 'required':
      return `config set ${fieldPath} <value>`;
    case 'type':
      const example = examples?.[0];
      if (example !== undefined) {
        return `config set ${fieldPath} ${JSON.stringify(example)}`;
      }
      return `config set ${fieldPath} <value>`;
    case 'enum':
      const firstOption = examples?.[0];
      if (firstOption !== undefined) {
        return `config set ${fieldPath} ${JSON.stringify(firstOption)}`;
      }
      return `config set ${fieldPath} <value>`;
    default:
      return `config set ${fieldPath} <value>`;
  }
};

const generateLearnMoreUrl = (rule?: string): string => {
  const baseUrl = 'https://trailhead.dev/config/rules';
  return rule ? `${baseUrl}/${rule}` : baseUrl;
};

const getExpectedType = (issue: z.ZodIssue): string => {
  switch (issue.code) {
    case 'invalid_type':
      return issue.expected;
    case 'invalid_enum_value':
      return 'enum';
    case 'too_small':
    case 'too_big':
      return issue.type;
    default:
      return 'unknown';
  }
};

const serializeValue = (value: unknown): string => {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'function') return '[Function]';
  if (typeof value === 'symbol') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) return `[Error: ${value.message}]`;

  try {
    return JSON.stringify(value);
  } catch {
    return '[Circular Reference]';
  }
};

const serializeValidationError = (error: ConfigValidationError) => ({
  field: error.field,
  value: serializeValue(error.value),
  expectedType: error.expectedType,
  suggestion: error.suggestion,
  path: error.path,
  rule: error.code,
  constraints: error.data,
});

const getTypeExamples = (type: string): readonly unknown[] => {
  switch (type) {
    case 'string':
      return ['example-string', 'hello-world'];
    case 'number':
      return [42, 3.14, 0];
    case 'boolean':
      return [true, false];
    case 'array':
      return [[], ['item1', 'item2']];
    case 'object':
      return [{}, { key: 'value' }];
    default:
      return [];
  }
};

// ========================================
// Validation Error Predicates
// ========================================

export const isConfigValidationError = (error: unknown): error is ConfigValidationError => {
  return (
    typeof error === 'object' && error !== null && 'suggestion' in error && 'examples' in error
  );
};

export const isSchemaValidationError = (error: unknown): error is CoreError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as any).type === 'SCHEMA_VALIDATION_FAILED'
  );
};

// Clean exports - no legacy compatibility needed
