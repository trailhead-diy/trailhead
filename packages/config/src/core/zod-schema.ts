import { z } from '@trailhead/validation';
import { ok, err, createCoreError, type Result } from '@trailhead/core';
import type { CoreError } from '@trailhead/core';
import { enhanceZodError } from '../validation/errors.js';

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
  readonly build: () => z.ZodType<string | undefined>;
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
  readonly build: () => z.ZodType<number | undefined>;
}

export interface ZodBooleanFieldBuilder {
  readonly description: (description: string) => ZodBooleanFieldBuilder;
  readonly optional: () => ZodBooleanFieldBuilder;
  readonly default: (defaultValue: boolean) => ZodBooleanFieldBuilder;
  readonly examples: (...examples: boolean[]) => ZodBooleanFieldBuilder;
  readonly build: () => z.ZodType<boolean | undefined>;
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
  readonly build: () => z.ZodType<T[] | undefined>;
}

export interface ZodObjectFieldBuilder<T> {
  readonly description: (description: string) => ZodObjectFieldBuilder<T>;
  readonly optional: () => ZodObjectFieldBuilder<T>;
  readonly default: (defaultValue: T) => ZodObjectFieldBuilder<T>;
  readonly examples: (...examples: T[]) => ZodObjectFieldBuilder<T>;
  readonly strict: () => ZodObjectFieldBuilder<T>;
  readonly passthrough: () => ZodObjectFieldBuilder<T>;
  readonly strip: () => ZodObjectFieldBuilder<T>;
  readonly build: () => z.ZodType<T | undefined>;
}

export interface ZodFieldBuilder<T> {
  readonly description: (description: string) => ZodFieldBuilder<T>;
  readonly optional: () => ZodFieldBuilder<T>;
  readonly default: (defaultValue: T) => ZodFieldBuilder<T>;
  readonly examples: (...examples: T[]) => ZodFieldBuilder<T>;
  readonly build: () => z.ZodType<T | undefined>;
}

// ========================================
// Enhanced Schema Definition API
// ========================================

export const defineZodConfigSchema = <_T extends Record<string, unknown>>() => ({
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
  let baseSchema = z.string();
  let isOptional = false;
  let defaultValue: string | undefined = undefined;

  const builder: ZodStringFieldBuilder = {
    description: (description: string) => {
      baseSchema = baseSchema.describe(description);
      return builder;
    },

    optional: () => {
      isOptional = true;
      return builder;
    },

    default: (value: string) => {
      defaultValue = value;
      return builder;
    },

    examples: (...examples: string[]) => {
      // Store examples as metadata - Zod doesn't have native examples support
      (baseSchema as any)._def.examples = examples;
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
      baseSchema = baseSchema.regex(pattern, message);
      return builder;
    },

    minLength: (min: number, message?: string) => {
      baseSchema = baseSchema.min(min, message);
      return builder;
    },

    maxLength: (max: number, message?: string) => {
      baseSchema = baseSchema.max(max, message);
      return builder;
    },

    length: (min: number, max: number) => {
      baseSchema = baseSchema.min(min).max(max);
      return builder;
    },

    email: (message?: string) => {
      baseSchema = baseSchema.email(message);
      return builder;
    },

    url: (message?: string) => {
      baseSchema = baseSchema.url(message);
      return builder;
    },

    uuid: (message?: string) => {
      baseSchema = baseSchema.uuid(message);
      return builder;
    },

    trim: () => {
      baseSchema = baseSchema.trim();
      return builder;
    },

    toLowerCase: () => {
      baseSchema = baseSchema.toLowerCase();
      return builder;
    },

    toUpperCase: () => {
      baseSchema = baseSchema.toUpperCase();
      return builder;
    },

    build: () => {
      if (defaultValue !== undefined) {
        return baseSchema.default(defaultValue);
      } else if (isOptional) {
        return baseSchema.optional();
      }
      return baseSchema;
    },
  };

  return builder;
};

export const zodNumber = (): ZodNumberFieldBuilder => {
  let baseSchema = z.number();
  let isOptional = false;
  let defaultValue: number | undefined = undefined;

  const builder: ZodNumberFieldBuilder = {
    description: (description: string) => {
      baseSchema = baseSchema.describe(description);
      return builder;
    },

    optional: () => {
      isOptional = true;
      return builder;
    },

    default: (value: number) => {
      defaultValue = value;
      return builder;
    },

    examples: (...examples: number[]) => {
      (baseSchema as any)._def.examples = examples;
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
      baseSchema = baseSchema.min(min, message);
      return builder;
    },

    max: (max: number, message?: string) => {
      baseSchema = baseSchema.max(max, message);
      return builder;
    },

    range: (min: number, max: number) => {
      baseSchema = baseSchema.min(min).max(max);
      return builder;
    },

    int: (message?: string) => {
      baseSchema = baseSchema.int(message);
      return builder;
    },

    positive: (message?: string) => {
      baseSchema = baseSchema.positive(message);
      return builder;
    },

    negative: (message?: string) => {
      baseSchema = baseSchema.negative(message);
      return builder;
    },

    nonNegative: (message?: string) => {
      baseSchema = baseSchema.nonnegative(message);
      return builder;
    },

    nonPositive: (message?: string) => {
      baseSchema = baseSchema.nonpositive(message);
      return builder;
    },

    finite: (message?: string) => {
      baseSchema = baseSchema.finite(message);
      return builder;
    },

    multipleOf: (divisor: number, message?: string) => {
      baseSchema = baseSchema.multipleOf(divisor, message);
      return builder;
    },

    build: () => {
      if (defaultValue !== undefined) {
        return baseSchema.default(defaultValue);
      } else if (isOptional) {
        return baseSchema.optional();
      }
      return baseSchema;
    },
  };

  return builder;
};

export const zodBoolean = (): ZodBooleanFieldBuilder => {
  let baseSchema = z.boolean();
  let isOptional = false;
  let defaultValue: boolean | undefined = undefined;

  const builder: ZodBooleanFieldBuilder = {
    description: (description: string) => {
      baseSchema = baseSchema.describe(description);
      return builder;
    },

    optional: () => {
      isOptional = true;
      return builder;
    },

    default: (value: boolean) => {
      defaultValue = value;
      return builder;
    },

    examples: (...examples: boolean[]) => {
      (baseSchema as any)._def.examples = examples;
      return builder;
    },

    build: () => {
      if (defaultValue !== undefined) {
        return baseSchema.default(defaultValue);
      } else if (isOptional) {
        return baseSchema.optional();
      }
      return baseSchema;
    },
  };

  return builder;
};

export const zodArray = <T>(elementSchema: z.ZodType<T>): ZodArrayFieldBuilder<T> => {
  let baseSchema: z.ZodArray<z.ZodType<T>> = z.array(elementSchema);
  let isOptional = false;
  let defaultValue: T[] | undefined = undefined;

  const builder: ZodArrayFieldBuilder<T> = {
    description: (description: string) => {
      baseSchema = baseSchema.describe(description);
      return builder;
    },

    optional: () => {
      isOptional = true;
      return builder;
    },

    default: (value: T[]) => {
      defaultValue = value;
      return builder;
    },

    examples: (...examples: T[][]) => {
      (baseSchema as any)._def.examples = examples;
      return builder;
    },

    minLength: (min: number, message?: string) => {
      baseSchema = baseSchema.min(min, message);
      return builder;
    },

    maxLength: (max: number, message?: string) => {
      baseSchema = baseSchema.max(max, message);
      return builder;
    },

    length: (length: number, message?: string) => {
      baseSchema = baseSchema.length(length, message);
      return builder;
    },

    nonempty: (message?: string) => {
      baseSchema = baseSchema.nonempty(message) as any; // Type assertion needed as nonempty changes cardinality
      return builder;
    },

    build: () => {
      if (defaultValue !== undefined) {
        return baseSchema.default(defaultValue);
      } else if (isOptional) {
        return baseSchema.optional();
      }
      return baseSchema;
    },
  };

  return builder;
};

export const zodObject = <T extends z.ZodRawShape>(
  shape: T
): ZodObjectFieldBuilder<z.infer<z.ZodObject<T>>> => {
  let baseSchema: z.ZodObject<T> = z.object(shape);
  let isOptional = false;
  let defaultValue: z.infer<z.ZodObject<T>> | undefined = undefined;

  const builder: ZodObjectFieldBuilder<z.infer<z.ZodObject<T>>> = {
    description: (description: string) => {
      baseSchema = baseSchema.describe(description);
      return builder;
    },

    optional: () => {
      isOptional = true;
      return builder;
    },

    default: (value: z.infer<z.ZodObject<T>>) => {
      defaultValue = value;
      return builder;
    },

    examples: (...examples: z.infer<z.ZodObject<T>>[]) => {
      (baseSchema as any)._def.examples = examples;
      return builder;
    },

    strict: () => {
      baseSchema = baseSchema.strict() as any; // Type assertion needed as strict changes catch mode
      return builder;
    },

    passthrough: () => {
      baseSchema = baseSchema.passthrough() as any; // Type assertion needed as passthrough changes catch mode
      return builder;
    },

    strip: () => {
      baseSchema = baseSchema.strip() as any; // Type assertion needed for consistency
      return builder;
    },

    build: () => {
      if (defaultValue !== undefined) {
        return baseSchema.default(defaultValue);
      } else if (isOptional) {
        return baseSchema.optional();
      }
      return baseSchema;
    },
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
    return err(
      createCoreError('VALIDATION_FAILED', 'Validation failed due to unexpected error', {
        component: '@trailhead/config',
        operation: 'schema-validation',
        cause: error instanceof Error ? error : undefined,
      })
    );
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

    return err(
      createCoreError('VALIDATION_FAILED', 'Async validation failed due to unexpected error', {
        component: '@trailhead/config',
        operation: 'async-schema-validation',
        cause: error instanceof Error ? error : undefined,
      })
    );
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

// Additional exports for validator operations
export type ConfigValidator<T> = {
  readonly name: string;
  readonly schema: ZodConfigSchema<T>;
  readonly validate: (config: unknown) => Promise<Result<T, CoreError>>;
};

export const validate = <T>(config: unknown, schema: ZodConfigSchema<T>): Result<T, CoreError> => {
  try {
    const result = schema.zodSchema.safeParse(config);
    if (result.success) {
      return ok(result.data);
    } else {
      return err(enhanceZodError(result.error, schema.name));
    }
  } catch (error) {
    return err(
      createCoreError('VALIDATION_ERROR', 'Validation failed', {
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
};
