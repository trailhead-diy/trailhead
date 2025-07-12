import { ok, err, type Result } from '@trailhead/core';
import type { CoreError } from '@trailhead/core';
import {
  createValidationError,
  createSchemaValidationError,
  createTypeError,
  createMissingFieldError,
  createEnumError,
  createRangeError,
  createLengthError,
  createPatternError,
  type ValidationError,
} from '../validation/errors.js';

// ========================================
// Enhanced Schema Types
// ========================================

export type ConfigResult<T> = Result<T, CoreError>;

export interface SchemaField<T = unknown> {
  readonly type: SchemaFieldType;
  readonly description?: string;
  readonly required?: boolean;
  readonly default?: T;
  readonly examples?: readonly T[];
  readonly validate?: (value: T) => boolean | string;
  readonly transform?: (value: unknown) => T;

  // Type-specific constraints
  readonly enum?: readonly T[];
  readonly pattern?: string;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly items?: SchemaField;
  readonly properties?: Record<string, SchemaField>;
  readonly additionalProperties?: boolean;
}

export type SchemaFieldType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any';

export interface ConfigSchema<T = Record<string, unknown>> {
  readonly name?: string;
  readonly description?: string;
  readonly version?: string;
  readonly fields: Record<keyof T, SchemaField>;
  readonly validate?: (config: T) => ConfigResult<void>;
  readonly strict?: boolean;
}

export type SchemaFields<T, K extends keyof T> = {
  readonly [P in K]: SchemaField<T[P]>;
};

export type OptionalSchemaFields<T> = {
  readonly [P in keyof T]?: SchemaField<T[P]>;
};

// ========================================
// Schema Builder API
// ========================================

export interface SchemaBuilder<T> {
  readonly name: (name: string) => SchemaBuilder<T>;
  readonly description: (description: string) => SchemaBuilder<T>;
  readonly version: (version: string) => SchemaBuilder<T>;
  readonly strict: (strict?: boolean) => SchemaBuilder<T>;
  readonly validate: (validator: (config: T) => ConfigResult<void>) => SchemaBuilder<T>;
  readonly build: () => ConfigSchema<T>;
}

export interface FieldBuilder<T> {
  readonly description: (description: string) => FieldBuilder<T>;
  readonly required: (required?: boolean) => FieldBuilder<T>;
  readonly default: (defaultValue: T) => FieldBuilder<T>;
  readonly examples: (...examples: T[]) => FieldBuilder<T>;
  readonly enum: (...values: T[]) => FieldBuilder<T>;
  readonly validate: (validator: (value: T) => boolean | string) => FieldBuilder<T>;
  readonly transform: (transformer: (value: unknown) => T) => FieldBuilder<T>;
}

export interface StringFieldBuilder extends FieldBuilder<string> {
  readonly pattern: (pattern: string) => StringFieldBuilder;
  readonly minLength: (min: number) => StringFieldBuilder;
  readonly maxLength: (max: number) => StringFieldBuilder;
  readonly length: (min: number, max: number) => StringFieldBuilder;
}

export interface NumberFieldBuilder extends FieldBuilder<number> {
  readonly minimum: (min: number) => NumberFieldBuilder;
  readonly maximum: (max: number) => NumberFieldBuilder;
  readonly range: (min: number, max: number) => NumberFieldBuilder;
  readonly integer: () => NumberFieldBuilder;
  readonly positive: () => NumberFieldBuilder;
}

export interface ArrayFieldBuilder<T> extends FieldBuilder<T[]> {
  readonly items: <U>(field: SchemaField<U>) => ArrayFieldBuilder<U>;
  readonly minItems: (min: number) => ArrayFieldBuilder<T>;
  readonly maxItems: (max: number) => ArrayFieldBuilder<T>;
  readonly unique: () => ArrayFieldBuilder<T>;
}

export interface ObjectFieldBuilder<T> extends FieldBuilder<T> {
  readonly properties: (props: Record<keyof T, SchemaField>) => ObjectFieldBuilder<T>;
  readonly additionalProperties: (allowed?: boolean) => ObjectFieldBuilder<T>;
}

// ========================================
// Schema Definition API
// ========================================

export const defineConfigSchema = <T extends Record<string, unknown>>() => ({
  object: <K extends keyof T>(fields: SchemaFields<T, K>) => ({
    optional: (optionalFields: OptionalSchemaFields<T> = {}) =>
      createSchemaBuilder<T>({
        ...fields,
        ...optionalFields,
      } as Record<keyof T, SchemaField>),
  }),
});

export const createSchemaBuilder = <T extends Record<string, unknown>>(
  fields: Record<keyof T, SchemaField>
): SchemaBuilder<T> => {
  let schemaName: string | undefined;
  let schemaDescription: string | undefined;
  let schemaVersion: string | undefined;
  let schemaStrict = false;
  let schemaValidator: ((config: T) => ConfigResult<void>) | undefined;

  const builder: SchemaBuilder<T> = {
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

    validate: (validator: (config: T) => ConfigResult<void>) => {
      schemaValidator = validator;
      return builder;
    },

    build: (): ConfigSchema<T> => ({
      name: schemaName,
      description: schemaDescription,
      version: schemaVersion,
      fields,
      validate: schemaValidator,
      strict: schemaStrict,
    }),
  };

  return builder;
};

// ========================================
// Field Definition API
// ========================================

export const string = (): StringFieldBuilder => {
  let field: Partial<SchemaField<string>> = { type: 'string' };

  const builder: StringFieldBuilder = {
    description: (description: string) => {
      field = { ...field, description };
      return builder;
    },

    required: (required = true) => {
      field = { ...field, required };
      return builder;
    },

    default: (defaultValue: string) => {
      field = { ...field, default: defaultValue };
      return builder;
    },

    examples: (...examples: string[]) => {
      field = { ...field, examples };
      return builder;
    },

    enum: (...values: string[]) => {
      field = { ...field, enum: values };
      return builder;
    },

    validate: (validator: (value: string) => boolean | string) => {
      field = { ...field, validate: validator };
      return builder;
    },

    transform: (transformer: (value: unknown) => string) => {
      field = { ...field, transform: transformer };
      return builder;
    },

    pattern: (pattern: string) => {
      field = { ...field, pattern };
      return builder;
    },

    minLength: (min: number) => {
      field = { ...field, minLength: min };
      return builder;
    },

    maxLength: (max: number) => {
      field = { ...field, maxLength: max };
      return builder;
    },

    length: (min: number, max: number) => {
      field = { ...field, minLength: min, maxLength: max };
      return builder;
    },
  };

  // Add build method to return the field
  (builder as any).build = () => field as SchemaField<string>;

  return builder;
};

export const number = (): NumberFieldBuilder => {
  let field: Partial<SchemaField<number>> = { type: 'number' };

  const builder: NumberFieldBuilder = {
    description: (description: string) => {
      field = { ...field, description };
      return builder;
    },

    required: (required = true) => {
      field = { ...field, required };
      return builder;
    },

    default: (defaultValue: number) => {
      field = { ...field, default: defaultValue };
      return builder;
    },

    examples: (...examples: number[]) => {
      field = { ...field, examples };
      return builder;
    },

    enum: (...values: number[]) => {
      field = { ...field, enum: values };
      return builder;
    },

    validate: (validator: (value: number) => boolean | string) => {
      field = { ...field, validate: validator };
      return builder;
    },

    transform: (transformer: (value: unknown) => number) => {
      field = { ...field, transform: transformer };
      return builder;
    },

    minimum: (min: number) => {
      field = { ...field, minimum: min };
      return builder;
    },

    maximum: (max: number) => {
      field = { ...field, maximum: max };
      return builder;
    },

    range: (min: number, max: number) => {
      field = { ...field, minimum: min, maximum: max };
      return builder;
    },

    integer: () => {
      const originalValidator = field.validate;
      field = {
        ...field,
        validate: (value: number) => {
          if (!Number.isInteger(value)) {
            return 'Value must be an integer';
          }
          return originalValidator ? originalValidator(value) : true;
        },
      };
      return builder;
    },

    positive: () => {
      field = { ...field, minimum: 0 };
      return builder;
    },
  };

  (builder as any).build = () => field as SchemaField<number>;

  return builder;
};

export const boolean = (): FieldBuilder<boolean> => {
  let field: Partial<SchemaField<boolean>> = { type: 'boolean' };

  const builder: FieldBuilder<boolean> = {
    description: (description: string) => {
      field = { ...field, description };
      return builder;
    },

    required: (required = true) => {
      field = { ...field, required };
      return builder;
    },

    default: (defaultValue: boolean) => {
      field = { ...field, default: defaultValue };
      return builder;
    },

    examples: (...examples: boolean[]) => {
      field = { ...field, examples };
      return builder;
    },

    enum: (...values: boolean[]) => {
      field = { ...field, enum: values };
      return builder;
    },

    validate: (validator: (value: boolean) => boolean | string) => {
      field = { ...field, validate: validator };
      return builder;
    },

    transform: (transformer: (value: unknown) => boolean) => {
      field = { ...field, transform: transformer };
      return builder;
    },
  };

  (builder as any).build = () => field as SchemaField<boolean>;

  return builder;
};

export const array = <T>(): ArrayFieldBuilder<T> => {
  let field: Partial<SchemaField<T[]>> = { type: 'array' };

  const builder: ArrayFieldBuilder<T> = {
    description: (description: string) => {
      field = { ...field, description };
      return builder;
    },

    required: (required = true) => {
      field = { ...field, required };
      return builder;
    },

    default: (defaultValue: T[]) => {
      field = { ...field, default: defaultValue };
      return builder;
    },

    examples: (...examples: T[][]) => {
      field = { ...field, examples };
      return builder;
    },

    enum: (...values: T[][]) => {
      field = { ...field, enum: values };
      return builder;
    },

    validate: (validator: (value: T[]) => boolean | string) => {
      field = { ...field, validate: validator };
      return builder;
    },

    transform: (transformer: (value: unknown) => T[]) => {
      field = { ...field, transform: transformer };
      return builder;
    },

    items: <U>(itemField: SchemaField<U>): ArrayFieldBuilder<U> => {
      field = { ...field, items: itemField };
      return builder as any;
    },

    minItems: (min: number) => {
      field = { ...field, minLength: min };
      return builder;
    },

    maxItems: (max: number) => {
      field = { ...field, maxLength: max };
      return builder;
    },

    unique: () => {
      const originalValidator = field.validate;
      field = {
        ...field,
        validate: (value: T[]) => {
          const unique = new Set(value);
          if (unique.size !== value.length) {
            return 'Array values must be unique';
          }
          return originalValidator ? originalValidator(value) : true;
        },
      };
      return builder;
    },
  };

  (builder as any).build = () => field as SchemaField<T[]>;

  return builder;
};

export const object = <T>(): ObjectFieldBuilder<T> => {
  let field: Partial<SchemaField<T>> = { type: 'object' };

  const builder: ObjectFieldBuilder<T> = {
    description: (description: string) => {
      field = { ...field, description };
      return builder;
    },

    required: (required = true) => {
      field = { ...field, required };
      return builder;
    },

    default: (defaultValue: T) => {
      field = { ...field, default: defaultValue };
      return builder;
    },

    examples: (...examples: T[]) => {
      field = { ...field, examples };
      return builder;
    },

    enum: (...values: T[]) => {
      field = { ...field, enum: values };
      return builder;
    },

    validate: (validator: (value: T) => boolean | string) => {
      field = { ...field, validate: validator };
      return builder;
    },

    transform: (transformer: (value: unknown) => T) => {
      field = { ...field, transform: transformer };
      return builder;
    },

    properties: (props: Record<keyof T, SchemaField>) => {
      field = { ...field, properties: props };
      return builder;
    },

    additionalProperties: (allowed = false) => {
      field = { ...field, additionalProperties: allowed };
      return builder;
    },
  };

  (builder as any).build = () => field as SchemaField<T>;

  return builder;
};

// ========================================
// Schema Validation
// ========================================

export const validateWithSchema = <T extends Record<string, unknown>>(
  data: unknown,
  schema: ConfigSchema<T>
): ConfigResult<T> => {
  if (typeof data !== 'object' || data === null) {
    return err(
      createValidationError({
        field: 'root',
        value: data,
        expectedType: 'object',
        suggestion: 'Provide a valid configuration object',
        examples: [{}],
        path: [],
      })
    );
  }

  const obj = data as Record<string, unknown>;
  const result: Partial<T> = {};
  const errors: ValidationError[] = [];

  // Validate fields
  for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
    const fieldResult = validateField(fieldName, obj[fieldName], fieldSchema, []);

    if (fieldResult.isErr()) {
      const fieldErrors = extractValidationErrors(fieldResult.error);
      errors.push(...fieldErrors);
    } else {
      (result as any)[fieldName] = fieldResult.value;
    }
  }

  // Check for additional properties in strict mode
  if (schema.strict) {
    const allowedFields = new Set(Object.keys(schema.fields));
    for (const key of Object.keys(obj)) {
      if (!allowedFields.has(key)) {
        errors.push(
          createValidationError({
            field: key,
            value: obj[key],
            expectedType: 'none',
            suggestion: `Remove unknown field "${key}" or disable strict mode`,
            path: [],
            rule: 'additionalProperties',
          })
        );
      }
    }
  }

  if (errors.length > 0) {
    return err(createSchemaValidationError(errors, schema.name));
  }

  const validatedResult = result as T;

  // Run schema-level validation
  if (schema.validate) {
    const schemaValidationResult = schema.validate(validatedResult);
    if (schemaValidationResult.isErr()) {
      return schemaValidationResult;
    }
  }

  return ok(validatedResult);
};

const validateField = <T>(
  fieldName: string,
  value: unknown,
  fieldSchema: SchemaField<T>,
  path: readonly string[]
): ConfigResult<T> => {
  const fieldPath = [...path, fieldName];

  // Check if field is required and missing
  if (value === undefined) {
    if (fieldSchema.required !== false) {
      return err(createMissingFieldError(fieldName, fieldSchema.type, path));
    }

    // Use default value if provided
    if (fieldSchema.default !== undefined) {
      return ok(fieldSchema.default);
    }

    return ok(undefined as any);
  }

  // Transform value if transformer is provided
  let transformedValue = value;
  if (fieldSchema.transform) {
    try {
      transformedValue = fieldSchema.transform(value);
    } catch (error) {
      return err(
        createValidationError({
          field: fieldName,
          value,
          expectedType: fieldSchema.type,
          suggestion: `Transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path,
          rule: 'transform',
          cause: error instanceof Error ? error : undefined,
        })
      );
    }
  }

  // Type validation
  const typeValidationResult = validateType(fieldName, transformedValue, fieldSchema.type, path);
  if (typeValidationResult.isErr()) {
    return typeValidationResult;
  }

  const typedValue = typeValidationResult.value as T;

  // Constraint validation
  const constraintResult = validateConstraints(fieldName, typedValue, fieldSchema, path);
  if (constraintResult.isErr()) {
    return constraintResult;
  }

  // Custom validation
  if (fieldSchema.validate) {
    const validationResult = fieldSchema.validate(typedValue);
    if (validationResult !== true) {
      const errorMessage =
        typeof validationResult === 'string' ? validationResult : 'Custom validation failed';
      return err(
        createValidationError({
          field: fieldName,
          value: typedValue,
          expectedType: fieldSchema.type,
          suggestion: errorMessage,
          path,
          rule: 'custom',
        })
      );
    }
  }

  return ok(typedValue);
};

const validateType = (
  fieldName: string,
  value: unknown,
  expectedType: SchemaFieldType,
  path: readonly string[]
): ConfigResult<unknown> => {
  switch (expectedType) {
    case 'string':
      if (typeof value !== 'string') {
        return err(createTypeError(fieldName, value, 'string', path));
      }
      break;
    case 'number':
      if (typeof value !== 'number' || !isFinite(value)) {
        return err(createTypeError(fieldName, value, 'number', path));
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        return err(createTypeError(fieldName, value, 'boolean', path));
      }
      break;
    case 'array':
      if (!Array.isArray(value)) {
        return err(createTypeError(fieldName, value, 'array', path));
      }
      break;
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return err(createTypeError(fieldName, value, 'object', path));
      }
      break;
    case 'any':
      // Any type is always valid
      break;
    default:
      return err(
        createValidationError({
          field: fieldName,
          value,
          expectedType: expectedType,
          suggestion: `Unknown type "${expectedType}"`,
          path,
          rule: 'type',
        })
      );
  }

  return ok(value);
};

const validateConstraints = <T>(
  fieldName: string,
  value: T,
  fieldSchema: SchemaField<T>,
  path: readonly string[]
): ConfigResult<T> => {
  // Enum validation
  if (fieldSchema.enum && fieldSchema.enum.length > 0) {
    if (!fieldSchema.enum.includes(value)) {
      return err(createEnumError(fieldName, value, fieldSchema.enum, path));
    }
  }

  // String constraints
  if (fieldSchema.type === 'string' && typeof value === 'string') {
    if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
      return err(
        createLengthError(fieldName, value, fieldSchema.minLength, fieldSchema.maxLength, path)
      );
    }
    if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
      return err(
        createLengthError(fieldName, value, fieldSchema.minLength, fieldSchema.maxLength, path)
      );
    }
    if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(value)) {
      return err(createPatternError(fieldName, value, fieldSchema.pattern, undefined, path));
    }
  }

  // Number constraints
  if (fieldSchema.type === 'number' && typeof value === 'number') {
    if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
      return err(
        createRangeError(fieldName, value, fieldSchema.minimum, fieldSchema.maximum, path)
      );
    }
    if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
      return err(
        createRangeError(fieldName, value, fieldSchema.minimum, fieldSchema.maximum, path)
      );
    }
  }

  // Array constraints
  if (fieldSchema.type === 'array' && Array.isArray(value)) {
    if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
      return err(
        createValidationError({
          field: fieldName,
          value,
          expectedType: 'array',
          suggestion: `Array must have at least ${fieldSchema.minLength} items`,
          path,
          rule: 'minItems',
          constraints: { minLength: fieldSchema.minLength },
        })
      );
    }
    if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
      return err(
        createValidationError({
          field: fieldName,
          value,
          expectedType: 'array',
          suggestion: `Array must have at most ${fieldSchema.maxLength} items`,
          path,
          rule: 'maxItems',
          constraints: { maxLength: fieldSchema.maxLength },
        })
      );
    }
  }

  return ok(value);
};

const extractValidationErrors = (error: CoreError): ValidationError[] => {
  // If it's already a validation error, return it
  if (error.code === 'VALIDATION_ERROR') {
    return [error as any as ValidationError];
  }

  // If it's a schema validation error, extract nested errors
  if (error.code === 'SCHEMA_VALIDATION_FAILED' && error.context?.errors) {
    return error.context.errors.filter((e: any) => e.type === 'VALIDATION_ERROR');
  }

  return [];
};
