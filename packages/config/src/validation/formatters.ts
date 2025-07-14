import type { ConfigValidationError } from './errors.js';
import { isConfigValidationError } from './errors.js';
// Stub color functions - would normally come from @esteban-url/cli/utils
const redColor = (text: string): string => `\x1b[31m${text}\x1b[0m`;
const _success = (text: string): string => `\x1b[32m${text}\x1b[0m`;
const warning = (text: string): string => `\x1b[33m${text}\x1b[0m`;
const info = (text: string): string => `\x1b[36m${text}\x1b[0m`;
const muted = (text: string): string => `\x1b[90m${text}\x1b[0m`;
const bold = (text: string): string => `\x1b[1m${text}\x1b[0m`;
const _dim = (text: string): string => `\x1b[2m${text}\x1b[0m`;

// ========================================
// Error Formatting System
// ========================================

export interface ValidationErrorFormatter {
  readonly formatError: (error: ConfigValidationError) => string;
  readonly formatErrors: (errors: readonly ConfigValidationError[]) => string;
  readonly formatErrorsSummary: (errors: readonly ConfigValidationError[]) => string;
  readonly formatInteractive: (error: ConfigValidationError) => InteractiveErrorInfo;
  readonly formatJson: (error: ConfigValidationError) => ValidationErrorJson;
}

export interface InteractiveErrorInfo {
  readonly title: string;
  readonly description: string;
  readonly suggestion: string;
  readonly examples: readonly string[];
  readonly fixCommand?: string;
  readonly learnMoreUrl?: string;
}

export interface ValidationErrorJson {
  readonly field: string;
  readonly path: readonly string[];
  readonly value: unknown;
  readonly expectedType: string;
  readonly rule?: string;
  readonly message: string;
  readonly suggestion: string;
  readonly examples: readonly unknown[];
  readonly constraints?: Record<string, unknown>;
}

export interface FormatterOptions {
  readonly includeColors?: boolean;
  readonly includeExamples?: boolean;
  readonly maxExamples?: number;
  readonly compact?: boolean;
  readonly includeStackTrace?: boolean;
  readonly baseUrl?: string;
}

// ========================================
// ========================================
// Helper Functions
// ========================================

const formatJson = (error: ConfigValidationError): ValidationErrorJson => ({
  field: error.field || 'unknown',
  path: error.path,
  value: error.value,
  expectedType: error.expectedType,
  rule: error.code,
  message: error.message,
  suggestion: error.suggestion,
  examples: error.examples,
  constraints: error.data,
});

// ========================================
// Default Formatter Implementation
// ========================================

export const createValidationErrorFormatter = (
  options: FormatterOptions = {}
): ValidationErrorFormatter => {
  const {
    includeColors = true,
    includeExamples = true,
    maxExamples = 3,
    compact = false,
    includeStackTrace: _includeStackTrace = false,
    baseUrl: _baseUrl = 'https://trailhead.dev/config',
  } = options;

  const formatError = (error: ConfigValidationError): string => {
    if (compact) {
      return formatErrorCompact(error);
    }

    const pathStr = error.path.length > 0 ? ` at "${formatPath(error.path)}"` : '';
    const valueStr = error.value !== undefined ? ` (received: ${formatValue(error.value)})` : '';
    const ruleStr = error.code ? ` [${error.code}]` : '';

    let message = '';

    // Header
    if (includeColors) {
      message += `${redColor('✗')} Invalid ${info(error.expectedType)} for field ${warning(`"${error.field}"`)}${pathStr}${valueStr}${muted(ruleStr)}\n`;
    } else {
      message += `✗ Invalid ${error.expectedType} for field "${error.field}"${pathStr}${valueStr}${ruleStr}\n`;
    }

    // Suggestion
    if (includeColors) {
      message += `  ${info('Suggestion:')} ${error.suggestion}\n`;
    } else {
      message += `  Suggestion: ${error.suggestion}\n`;
    }

    // Examples
    if (includeExamples && error.examples.length > 0) {
      const examplesList = error.examples
        .slice(0, maxExamples)
        .map(example => `    ${formatValue(example)}`)
        .join('\n');

      if (includeColors) {
        message += `  ${info('Examples:')}\n${examplesList}\n`;
      } else {
        message += `  Examples:\n${examplesList}\n`;
      }
    }

    // Learn more link
    if (error.learnMoreUrl) {
      if (includeColors) {
        message += `  ${muted(`Learn more: ${error.learnMoreUrl}`)}\n`;
      } else {
        message += `  Learn more: ${error.learnMoreUrl}\n`;
      }
    }

    return message;
  };

  const formatErrors = (errors: readonly ConfigValidationError[]): string => {
    if (errors.length === 0) {
      return 'No validation errors found.';
    }

    if (errors.length === 1) {
      return formatError(errors[0]);
    }

    let summary = '';

    // Header
    if (includeColors) {
      summary += `${redColor(`Found ${errors.length} configuration error${errors.length === 1 ? '' : 's'}:`)}\n\n`;
    } else {
      summary += `Found ${errors.length} configuration error${errors.length === 1 ? '' : 's'}:\n\n`;
    }

    // Individual errors
    errors.forEach((validationError, index) => {
      const errorNumber = includeColors ? info(`${index + 1}.`) : `${index + 1}.`;
      const formattedError = formatError(validationError)
        .split('\n')
        .map((line, lineIndex) =>
          lineIndex === 0 ? `${errorNumber} ${line.substring(2)}` : `   ${line}`
        )
        .join('\n');

      summary += `${formattedError}\n`;
    });

    return summary;
  };

  const formatErrorsSummary = (errors: readonly ConfigValidationError[]): string => {
    if (errors.length === 0) {
      return 'Configuration is valid ✓';
    }

    const errorsByType = groupErrorsByType(errors);
    const errorsByField = groupErrorsByField(errors);

    let summary = '';

    if (includeColors) {
      summary += `${redColor(`Configuration validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}`)}\n\n`;
    } else {
      summary += `Configuration validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}\n\n`;
    }

    // Error types summary
    if (includeColors) {
      summary += `${bold('Error Types:')}\n`;
    } else {
      summary += 'Error Types:\n';
    }

    for (const [type, count] of Object.entries(errorsByType)) {
      summary += `  ${type}: ${count}\n`;
    }

    summary += '\n';

    // Affected fields summary
    if (includeColors) {
      summary += `${bold('Affected Fields:')}\n`;
    } else {
      summary += 'Affected Fields:\n';
    }

    for (const [field, count] of Object.entries(errorsByField)) {
      summary += `  ${field}: ${count} error${count === 1 ? '' : 's'}\n`;
    }

    return summary;
  };

  const formatInteractive = (error: ConfigValidationError): InteractiveErrorInfo => {
    const pathStr = error.path.length > 0 ? ` at ${formatPath(error.path)}` : '';

    return {
      title: `Invalid ${error.expectedType} for field "${error.field}"${pathStr}`,
      description: error.message,
      suggestion: error.suggestion,
      examples: error.examples.slice(0, maxExamples).map(example => formatValue(example)),
      fixCommand: error.fixCommand,
      learnMoreUrl: error.learnMoreUrl,
    };
  };

  return {
    formatError,
    formatErrors,
    formatErrorsSummary,
    formatInteractive,
    formatJson,
  };
};

// ========================================
// Utility Functions
// ========================================

const formatErrorCompact = (error: ConfigValidationError): string => {
  const pathStr = error.path.length > 0 ? `${formatPath(error.path)}.` : '';
  return `${pathStr}${error.field}: ${error.suggestion}`;
};

const formatPath = (path: readonly string[]): string => {
  return path.join('.');
};

const formatValue = (value: unknown): string => {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'function') return '[Function]';
  if (typeof value === 'symbol') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) return `[Error: ${value.message}]`;

  try {
    const jsonStr = JSON.stringify(value, null, 2);
    // For multiline JSON, add indentation
    if (jsonStr.includes('\n')) {
      return jsonStr
        .split('\n')
        .map(line => `    ${line}`)
        .join('\n')
        .trim();
    }
    return jsonStr;
  } catch {
    return '[Circular Reference]';
  }
};

const groupErrorsByType = (errors: readonly ConfigValidationError[]): Record<string, number> => {
  const groups: Record<string, number> = {};

  for (const error of errors) {
    const type = error.code || 'unknown';
    groups[type] = (groups[type] || 0) + 1;
  }

  return groups;
};

const groupErrorsByField = (errors: readonly ConfigValidationError[]): Record<string, number> => {
  const groups: Record<string, number> = {};

  for (const error of errors) {
    const field = error.path.length > 0 ? formatPath(error.path) : error.field || 'unknown';
    groups[field] = (groups[field] || 0) + 1;
  }

  return groups;
};

// ========================================
// Convenience Functions
// ========================================

export const formatValidationError = (
  error: ConfigValidationError,
  options?: FormatterOptions
): string => {
  const formatter = createValidationErrorFormatter(options);
  return formatter.formatError(error);
};

export const formatValidationErrors = (
  errors: readonly ConfigValidationError[],
  options?: FormatterOptions
): string => {
  const formatter = createValidationErrorFormatter(options);
  return formatter.formatErrors(errors);
};

export const formatValidationErrorsJson = (
  errors: readonly ConfigValidationError[]
): ValidationErrorJson[] => {
  const formatter = createValidationErrorFormatter();
  return errors.map(error => formatter.formatJson(error));
};

export const extractValidationErrors = (error: unknown): ConfigValidationError[] => {
  if (isConfigValidationError(error)) {
    return [error];
  }

  // Check if it's a schema validation error with nested validation errors
  if (
    typeof error === 'object' &&
    error !== null &&
    'context' in error &&
    typeof (error as any).context === 'object' &&
    'errors' in (error as any).context &&
    Array.isArray((error as any).context.errors)
  ) {
    return (error as any).context.errors.filter(isConfigValidationError);
  }

  return [];
};
