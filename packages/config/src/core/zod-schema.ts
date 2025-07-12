import { z } from '@trailhead/validation';
import { ok, err, type Result } from '@trailhead/core';
import type { CoreError } from '@trailhead/core';
import { enhanceZodError, type ConfigValidationError } from '../validation/errors.js';

// ========================================
// Enhanced Zod-Based Schema Types
// ========================================

export type ConfigResult<T> = Result<T, CoreError>;

export interface ZodConfigSchema<T = Record<string, unknown>> {
  readonly name?: string;
  readonly description?: string;
  readonly version?: string;
  readonly zodSchema: z.ZodSchema<T>;
  readonly strict?: boolean;
}

// ========================================
// Enhanced Schema Builder API (Zod-Powered)
// ========================================

export interface ZodSchemaBuilder<T> {
  readonly name: (name: string) => ZodSchemaBuilder<T>;
  readonly description: (description: string) => ZodSchemaBuilder<T>;
  readonly version: (version: string) => ZodSchemaBuilder<T>;
  readonly strict: (strict?: boolean) => ZodSchemaBuilder<T>;
  readonly build: () => ZodConfigSchema<T>;
}

// ========================================
// Enhanced Field Builders (Zod-Powered)
// ========================================

export interface ZodStringFieldBuilder {
  readonly description: (description: string) => ZodStringFieldBuilder;
  readonly optional: () => ZodStringFieldBuilder;
  readonly default: (defaultValue: string) => ZodStringFieldBuilder;
  readonly examples: (...examples: string[]) => ZodStringFieldBuilder;
  readonly enum: <T extends readonly [string, ...string[]]>(
    ...values: T
  ) => ZodFieldBuilder<T[number]>;
  readonly pattern: (pattern: RegExp, message?: string) => ZodStringFieldBuilder;
  readonly minLength: (min: number, message?: string) => ZodStringFieldBuilder;
  readonly maxLength: (max: number, message?: string) => ZodStringFieldBuilder;
  readonly length: (min: number, max: number) => ZodStringFieldBuilder;
  readonly email: (message?: string) => ZodStringFieldBuilder;
  readonly url: (message?: string) => ZodStringFieldBuilder;
  readonly uuid: (message?: string) => ZodStringFieldBuilder;
  readonly trim: () => ZodStringFieldBuilder;
  readonly toLowerCase: () => ZodStringFieldBuilder;
  readonly toUpperCase: () => ZodStringFieldBuilder;
  readonly build: () => z.ZodString;
}

export interface ZodNumberFieldBuilder {
  readonly description: (description: string) => ZodNumberFieldBuilder;
  readonly optional: () => ZodNumberFieldBuilder;
  readonly default: (defaultValue: number) => ZodNumberFieldBuilder;
  readonly examples: (...examples: number[]) => ZodNumberFieldBuilder;
  readonly enum: <T extends readonly [number, ...number[]]>(
    ...values: T
  ) => ZodFieldBuilder<T[number]>;
  readonly min: (min: number, message?: string) => ZodNumberFieldBuilder;
  readonly max: (max: number, message?: string) => ZodNumberFieldBuilder;
  readonly range: (min: number, max: number) => ZodNumberFieldBuilder;
  readonly int: (message?: string) => ZodNumberFieldBuilder;
  readonly positive: (message?: string) => ZodNumberFieldBuilder;
  readonly negative: (message?: string) => ZodNumberFieldBuilder;
  readonly nonNegative: (message?: string) => ZodNumberFieldBuilder;
  readonly nonPositive: (message?: string) => ZodNumberFieldBuilder;
  readonly finite: (message?: string) => ZodNumberFieldBuilder;
  readonly multipleOf: (divisor: number, message?: string) => ZodNumberFieldBuilder;
  readonly build: () => z.ZodNumber;
}

export interface ZodBooleanFieldBuilder {
  readonly description: (description: string) => ZodBooleanFieldBuilder;
  readonly optional: () => ZodBooleanFieldBuilder;
  readonly default: (defaultValue: boolean) => ZodBooleanFieldBuilder;
  readonly examples: (...examples: boolean[]) => ZodBooleanFieldBuilder;
  readonly build: () => z.ZodBoolean;
}

export interface ZodArrayFieldBuilder<T> {
  readonly description: (description: string) => ZodArrayFieldBuilder<T>;
  readonly optional: () => ZodArrayFieldBuilder<T>;
  readonly default: (defaultValue: T[]) => ZodArrayFieldBuilder<T>;
  readonly examples: (...examples: T[][]) => ZodArrayFieldBuilder<T>;
  readonly minLength: (min: number, message?: string) => ZodArrayFieldBuilder<T>;
  readonly maxLength: (max: number, message?: string) => ZodArrayFieldBuilder<T>;
  readonly length: (length: number, message?: string) => ZodArrayFieldBuilder<T>;
  readonly nonempty: (message?: string) => ZodArrayFieldBuilder<T>;
  readonly build: () => z.ZodArray<z.ZodType<T>>;
}

export interface ZodObjectFieldBuilder<T> {
  readonly description: (description: string) => ZodObjectFieldBuilder<T>;
  readonly optional: () => ZodObjectFieldBuilder<T>;
  readonly default: (defaultValue: T) => ZodObjectFieldBuilder<T>;
  readonly examples: (...examples: T[]) => ZodObjectFieldBuilder<T>;
  readonly strict: () => ZodObjectFieldBuilder<T>;
  readonly passthrough: () => ZodObjectFieldBuilder<T>;
  readonly strip: () => ZodObjectFieldBuilder<T>;
  readonly build: () => z.ZodObject<any>;
}

export interface ZodFieldBuilder<T> {
  readonly description: (description: string) => ZodFieldBuilder<T>;
  readonly optional: () => ZodFieldBuilder<T>;
  readonly default: (defaultValue: T) => ZodFieldBuilder<T>;
  readonly examples: (...examples: T[]) => ZodFieldBuilder<T>;
  readonly build: () => z.ZodType<T>;
}

// ========================================
// Enhanced Schema Definition API
// ========================================

export const defineZodConfigSchema = <T extends Record<string, unknown>>() => ({
  object: <K extends z.ZodRawShape>(shape: K) =>
    createZodSchemaBuilder<z.infer<z.ZodObject<K>>>(z.object(shape)),
});

export const createZodSchemaBuilder = <T>(zodSchema: z.ZodSchema<T>): ZodSchemaBuilder<T> => {
  let schemaName: string | undefined;
  let schemaDescription: string | undefined;
  let schemaVersion: string | undefined;
  let schemaStrict = false;

  const builder: ZodSchemaBuilder<T> = {
    name: (name: string) => {
      schemaName = name;
      return builder;
    },

    description: (description: string) => {
      schemaDescription = description;
      return builder;
    },

    version: (version: string) => {
      schemaVersion = version;
      return builder;
    },

    strict: (strict = true) => {
      schemaStrict = strict;
      return builder;
    },

    build: (): ZodConfigSchema<T> => ({
      name: schemaName,
      description: schemaDescription,
      version: schemaVersion,
      zodSchema,
      strict: schemaStrict,
    }),
  };

  return builder;
};

// ========================================
// Enhanced Field Definition API (Zod-Powered)
// ========================================

export const zodString = (): ZodStringFieldBuilder => {
  let schema = z.string();
  let isOptional = false;

  const builder: ZodStringFieldBuilder = {
    description: (description: string) => {
      schema = schema.describe(description);
      return builder;
    },

    optional: () => {
      isOptional = true;
      return builder;
    },

    default: (defaultValue: string) => {
      schema = schema.default(defaultValue);
      return builder;
    },

    examples: (...examples: string[]) => {
      // Store examples as metadata - Zod doesn't have native examples support
      (schema as any)._def.examples = examples;
      return builder;
    },

    enum: <T extends readonly [string, ...string[]]>(...values: T) => {
      const enumSchema = z.enum(values);
      return {
        description: (description: string) => {
          enumSchema.describe(description);
          return enumSchema as any;
        },
        optional: () => enumSchema.optional() as any,
        default: (defaultValue: T[number]) => enumSchema.default(defaultValue) as any,
        examples: (...examples: T[number][]) => {
          (enumSchema as any)._def.examples = examples;
          return enumSchema as any;
        },
        build: () => enumSchema,
      } as ZodFieldBuilder<T[number]>;
    },

    pattern: (pattern: RegExp, message?: string) => {
      schema = schema.regex(pattern, message);
      return builder;
    },

    minLength: (min: number, message?: string) => {
      schema = schema.min(min, message);
      return builder;
    },

    maxLength: (max: number, message?: string) => {
      schema = schema.max(max, message);
      return builder;
    },

    length: (min: number, max: number) => {
      schema = schema.min(min).max(max);
      return builder;
    },

    email: (message?: string) => {
      schema = schema.email(message);
      return builder;
    },

    url: (message?: string) => {
      schema = schema.url(message);
      return builder;
    },

    uuid: (message?: string) => {
      schema = schema.uuid(message);
      return builder;
    },

    trim: () => {
      schema = schema.trim();
      return builder;
    },

    toLowerCase: () => {
      schema = schema.toLowerCase();
      return builder;
    },

    toUpperCase: () => {
      schema = schema.toUpperCase();
      return builder;
    },

    build: () => (isOptional ? (schema.optional() as z.ZodString) : schema),
  };

  return builder;
};

export const zodNumber = (): ZodNumberFieldBuilder => {
  let schema = z.number();
  let isOptional = false;

  const builder: ZodNumberFieldBuilder = {
    description: (description: string) => {
      schema = schema.describe(description);
      return builder;
    },

    optional: () => {
      isOptional = true;
      return builder;
    },

    default: (defaultValue: number) => {
      schema = schema.default(defaultValue);
      return builder;
    },

    examples: (...examples: number[]) => {
      (schema as any)._def.examples = examples;
      return builder;
    },

    enum: <T extends readonly [number, ...number[]]>(...values: T) => {
      const enumSchema = z.enum(values as any);
      return {
        description: (description: string) => {
          enumSchema.describe(description);
          return enumSchema as any;
        },
        optional: () => enumSchema.optional() as any,
        default: (defaultValue: T[number]) => enumSchema.default(defaultValue) as any,
        examples: (...examples: T[number][]) => {
          (enumSchema as any)._def.examples = examples;
          return enumSchema as any;
        },
        build: () => enumSchema,
      } as ZodFieldBuilder<T[number]>;
    },

    min: (min: number, message?: string) => {
      schema = schema.min(min, message);
      return builder;
    },

    max: (max: number, message?: string) => {
      schema = schema.max(max, message);
      return builder;
    },

    range: (min: number, max: number) => {
      schema = schema.min(min).max(max);
      return builder;
    },

    int: (message?: string) => {
      schema = schema.int(message);
      return builder;
    },

    positive: (message?: string) => {
      schema = schema.positive(message);
      return builder;
    },

    negative: (message?: string) => {
      schema = schema.negative(message);
      return builder;
    },

    nonNegative: (message?: string) => {
      schema = schema.nonnegative(message);
      return builder;
    },

    nonPositive: (message?: string) => {
      schema = schema.nonpositive(message);
      return builder;
    },

    finite: (message?: string) => {
      schema = schema.finite(message);
      return builder;
    },

    multipleOf: (divisor: number, message?: string) => {
      schema = schema.multipleOf(divisor, message);
      return builder;
    },

    build: () => (isOptional ? (schema.optional() as z.ZodNumber) : schema),
  };

  return builder;
};

export const zodBoolean = (): ZodBooleanFieldBuilder => {
  let schema = z.boolean();
  let isOptional = false;

  const builder: ZodBooleanFieldBuilder = {
    description: (description: string) => {
      schema = schema.describe(description);
      return builder;
    },

    optional: () => {
      isOptional = true;
      return builder;
    },

    default: (defaultValue: boolean) => {
      schema = schema.default(defaultValue);
      return builder;
    },

    examples: (...examples: boolean[]) => {
      (schema as any)._def.examples = examples;
      return builder;
    },

    build: () => (isOptional ? (schema.optional() as z.ZodBoolean) : schema),
  };

  return builder;
};

export const zodArray = <T>(elementSchema: z.ZodType<T>): ZodArrayFieldBuilder<T> => {
  let schema = z.array(elementSchema);
  let isOptional = false;

  const builder: ZodArrayFieldBuilder<T> = {
    description: (description: string) => {
      schema = schema.describe(description);
      return builder;
    },

    optional: () => {
      isOptional = true;
      return builder;
    },

    default: (defaultValue: T[]) => {
      schema = schema.default(defaultValue);
      return builder;
    },

    examples: (...examples: T[][]) => {
      (schema as any)._def.examples = examples;
      return builder;
    },

    minLength: (min: number, message?: string) => {
      schema = schema.min(min, message);
      return builder;
    },

    maxLength: (max: number, message?: string) => {
      schema = schema.max(max, message);
      return builder;
    },

    length: (length: number, message?: string) => {
      schema = schema.length(length, message);
      return builder;
    },

    nonempty: (message?: string) => {
      schema = schema.nonempty(message);
      return builder;
    },

    build: () => (isOptional ? (schema.optional() as any) : schema),
  };

  return builder;
};

export const zodObject = <T extends z.ZodRawShape>(
  shape: T
): ZodObjectFieldBuilder<z.infer<z.ZodObject<T>>> => {
  let schema = z.object(shape);
  let isOptional = false;

  const builder: ZodObjectFieldBuilder<z.infer<z.ZodObject<T>>> = {
    description: (description: string) => {
      schema = schema.describe(description);
      return builder;
    },

    optional: () => {
      isOptional = true;
      return builder;
    },

    default: (defaultValue: z.infer<z.ZodObject<T>>) => {
      schema = schema.default(defaultValue);
      return builder;
    },

    examples: (...examples: z.infer<z.ZodObject<T>>[]) => {
      (schema as any)._def.examples = examples;
      return builder;
    },

    strict: () => {
      schema = schema.strict();
      return builder;
    },

    passthrough: () => {
      schema = schema.passthrough();
      return builder;
    },

    strip: () => {
      schema = schema.strip();
      return builder;
    },

    build: () => (isOptional ? (schema.optional() as any) : schema),
  };

  return builder;
};

// ========================================
// Enhanced Schema Validation (Zod-Powered)
// ========================================

export const validateWithZodSchema = <T>(
  data: unknown,
  schema: ZodConfigSchema<T>
): ConfigResult<T> => {
  try {
    const result = schema.zodSchema.parse(data);
    return ok(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const enhancedError = enhanceZodError(error, schema.name);
      return err(enhancedError);
    }

    // Handle unexpected errors
    return err({
      code: 'VALIDATION_FAILED',
      message: 'Validation failed due to unexpected error',
      component: '@trailhead/config',
      operation: 'schema-validation',
      cause: error instanceof Error ? error : undefined,
    } as CoreError);
  }
};

export const validateWithZodSchemaAsync = async <T>(
  data: unknown,
  schema: ZodConfigSchema<T>
): Promise<ConfigResult<T>> => {
  try {
    const result = await schema.zodSchema.parseAsync(data);
    return ok(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const enhancedError = enhanceZodError(error, schema.name);
      return err(enhancedError);
    }

    return err({
      code: 'VALIDATION_FAILED',
      message: 'Async validation failed due to unexpected error',
      component: '@trailhead/config',
      operation: 'async-schema-validation',
      cause: error instanceof Error ? error : undefined,
    } as CoreError);
  }
};

// ========================================
// Convenience Functions
// ========================================

export const createZodSchema = <T extends z.ZodRawShape>(shape: T) =>
  createZodSchemaBuilder(z.object(shape));

// Alias for backwards compatibility with existing API
export const string = zodString;
export const number = zodNumber;
export const boolean = zodBoolean;
export const array = zodArray;
export const object = zodObject;
