import type { Result } from '@trailhead/core';
import type { CoreError } from '@trailhead/core';
import { ok, err, createCoreError } from '@trailhead/core';
import type { ConfigSchema, SchemaField, SchemaFieldType } from '../core/schema.js';

// ========================================
// Schema Introspection Types
// ========================================

export interface SchemaIntrospection {
  readonly name?: string;
  readonly description?: string;
  readonly version?: string;
  readonly structure: SchemaStructure;
  readonly statistics: SchemaStatistics;
  readonly relationships: readonly FieldRelationship[];
  readonly validation: ValidationRules;
  readonly complexity: ComplexityMetrics;
}

export interface SchemaStructure {
  readonly fields: readonly FieldIntrospection[];
  readonly depth: number;
  readonly branches: readonly SchemaBranch[];
  readonly fieldPaths: readonly string[];
}

export interface FieldIntrospection {
  readonly name: string;
  readonly path: readonly string[];
  readonly type: SchemaFieldType;
  readonly description?: string;
  readonly required: boolean;
  readonly hasDefault: boolean;
  readonly defaultValue?: unknown;
  readonly constraints: FieldConstraintSummary;
  readonly examples: readonly unknown[];
  readonly validation: FieldValidationInfo;
  readonly complexity: FieldComplexity;
  readonly relationships: readonly string[];
}

export interface SchemaBranch {
  readonly path: readonly string[];
  readonly fields: readonly string[];
  readonly depth: number;
  readonly optional: boolean;
}

export interface FieldConstraintSummary {
  readonly hasEnum: boolean;
  readonly enumValues?: readonly unknown[];
  readonly hasPattern: boolean;
  readonly pattern?: string;
  readonly hasRange: boolean;
  readonly range?: { min?: number; max?: number };
  readonly hasLength: boolean;
  readonly length?: { min?: number; max?: number };
  readonly hasFormat: boolean;
  readonly format?: string;
}

export interface FieldValidationInfo {
  readonly hasCustomValidator: boolean;
  readonly validatorSource?: string;
  readonly rules: readonly string[];
  readonly dependencies: readonly string[];
}

export interface FieldComplexity {
  readonly score: number;
  readonly factors: readonly ComplexityFactor[];
  readonly level: 'simple' | 'moderate' | 'complex';
}

export interface ComplexityFactor {
  readonly type: 'constraints' | 'validation' | 'nesting' | 'dependencies';
  readonly weight: number;
  readonly description: string;
}

export interface SchemaStatistics {
  readonly totalFields: number;
  readonly requiredFields: number;
  readonly optionalFields: number;
  readonly constrainedFields: number;
  readonly validatedFields: number;
  readonly nestedFields: number;
  readonly typeDistribution: Record<SchemaFieldType, number>;
  readonly constraintDistribution: Record<string, number>;
  readonly complexityDistribution: Record<string, number>;
}

export interface FieldRelationship {
  readonly type: 'dependency' | 'reference' | 'composition' | 'validation';
  readonly source: string;
  readonly target: string;
  readonly description: string;
  readonly strength: 'weak' | 'moderate' | 'strong';
}

export interface ValidationRules {
  readonly fieldRules: Record<string, readonly string[]>;
  readonly crossFieldRules: readonly CrossFieldRule[];
  readonly schemaRules: readonly string[];
  readonly customValidators: readonly CustomValidatorInfo[];
}

export interface CrossFieldRule {
  readonly name: string;
  readonly fields: readonly string[];
  readonly type: 'dependency' | 'mutual_exclusion' | 'conditional' | 'aggregate';
  readonly description: string;
}

export interface CustomValidatorInfo {
  readonly field: string;
  readonly source: string;
  readonly dependencies: readonly string[];
  readonly async: boolean;
}

export interface ComplexityMetrics {
  readonly overall: number;
  readonly structural: number;
  readonly validation: number;
  readonly constraint: number;
  readonly factors: readonly ComplexityFactor[];
  readonly recommendations: readonly string[];
}

export interface IntrospectionOptions {
  readonly includePrivateFields?: boolean;
  readonly includeValidationSource?: boolean;
  readonly includeComplexityAnalysis?: boolean;
  readonly includeRelationships?: boolean;
  readonly maxDepth?: number;
}

// ========================================
// Core Introspection Functions
// ========================================

export const introspectSchema = <T extends Record<string, unknown>>(
  schema: ConfigSchema<T>,
  options: IntrospectionOptions = {}
): Result<SchemaIntrospection, CoreError> => {
  try {
    const {
      includePrivateFields = false,
      includeValidationSource = false,
      includeComplexityAnalysis = true,
      includeRelationships = true,
      maxDepth = 10,
    } = options;

    // Build field introspections
    const fieldsResult = buildFieldIntrospections(schema.fields, [], {
      includePrivateFields,
      includeValidationSource,
      includeComplexityAnalysis,
      maxDepth,
    });

    if (fieldsResult.isErr()) {
      return fieldsResult;
    }

    const fields = fieldsResult.value;

    // Build schema structure
    const structure = buildSchemaStructure(fields);

    // Calculate statistics
    const statistics = calculateStatistics(fields);

    // Analyze relationships
    const relationships = includeRelationships ? analyzeRelationships(fields, schema) : [];

    // Extract validation rules
    const validation = extractValidationRules(fields, schema);

    // Calculate complexity metrics
    const complexity = includeComplexityAnalysis
      ? calculateComplexityMetrics(fields, structure, validation)
      : createEmptyComplexityMetrics();

    const introspection: SchemaIntrospection = {
      name: schema.name,
      description: schema.description,
      version: schema.version,
      structure,
      statistics,
      relationships,
      validation,
      complexity,
    };

    return ok(introspection);
  } catch (error) {
    return err(
      createCoreError('SCHEMA_INTROSPECTION_FAILED', 'Failed to introspect schema', {
        component: '@trailhead/config',
        operation: 'introspect-schema',
        context: { schema: schema.name },
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
};

// ========================================
// Field Introspection
// ========================================

interface FieldIntrospectionOptions {
  readonly includePrivateFields: boolean;
  readonly includeValidationSource: boolean;
  readonly includeComplexityAnalysis: boolean;
  readonly maxDepth: number;
}

const buildFieldIntrospections = (
  fields: Record<string, SchemaField>,
  basePath: readonly string[],
  options: FieldIntrospectionOptions
): Result<readonly FieldIntrospection[], CoreError> => {
  try {
    const fieldIntrospections: FieldIntrospection[] = [];

    for (const [fieldName, fieldSchema] of Object.entries(fields)) {
      // Skip private fields if not included
      if (!options.includePrivateFields && fieldName.startsWith('_')) {
        continue;
      }

      const fieldPath = [...basePath, fieldName];

      // Build constraint summary
      const constraints = buildConstraintSummary(fieldSchema);

      // Build validation info
      const validation = buildValidationInfo(fieldSchema, options.includeValidationSource);

      // Calculate field complexity
      const complexity = options.includeComplexityAnalysis
        ? calculateFieldComplexity(fieldSchema, constraints, validation)
        : createEmptyFieldComplexity();

      // Analyze relationships (placeholder for now)
      const relationships: string[] = [];

      const fieldIntrospection: FieldIntrospection = {
        name: fieldName,
        path: fieldPath,
        type: fieldSchema.type,
        description: fieldSchema.description,
        required: fieldSchema.required !== false,
        hasDefault: fieldSchema.default !== undefined,
        defaultValue: fieldSchema.default,
        constraints,
        examples: fieldSchema.examples || [],
        validation,
        complexity,
        relationships,
      };

      fieldIntrospections.push(fieldIntrospection);

      // Handle nested objects recursively
      if (
        fieldSchema.type === 'object' &&
        fieldSchema.properties &&
        fieldPath.length < options.maxDepth
      ) {
        const nestedResult = buildFieldIntrospections(fieldSchema.properties, fieldPath, options);
        if (nestedResult.isOk()) {
          fieldIntrospections.push(...nestedResult.value);
        }
      }
    }

    return ok(fieldIntrospections);
  } catch (error) {
    return err(
      createCoreError('FIELD_INTROSPECTION_FAILED', 'Failed to build field introspections', {
        component: '@trailhead/config',
        operation: 'introspect-fields',
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
};

const buildConstraintSummary = (field: SchemaField): FieldConstraintSummary => {
  return {
    hasEnum: !!field.enum && field.enum.length > 0,
    enumValues: field.enum,
    hasPattern: !!field.pattern,
    pattern: field.pattern,
    hasRange: field.minimum !== undefined || field.maximum !== undefined,
    range: {
      min: field.minimum,
      max: field.maximum,
    },
    hasLength: field.minLength !== undefined || field.maxLength !== undefined,
    length: {
      min: field.minLength,
      max: field.maxLength,
    },
    hasFormat: false, // Could be extended for format validation
    format: undefined,
  };
};

const buildValidationInfo = (field: SchemaField, includeSource: boolean): FieldValidationInfo => {
  const hasCustomValidator = !!field.validate;
  const rules: string[] = [];

  // Add constraint-based rules
  if (field.enum) rules.push('enum');
  if (field.pattern) rules.push('pattern');
  if (field.minimum !== undefined || field.maximum !== undefined) rules.push('range');
  if (field.minLength !== undefined || field.maxLength !== undefined) rules.push('length');
  if (field.validate) rules.push('custom');

  return {
    hasCustomValidator,
    validatorSource: includeSource && field.validate ? field.validate.toString() : undefined,
    rules,
    dependencies: [], // Would need more analysis to determine dependencies
  };
};

// ========================================
// Structure Analysis
// ========================================

const buildSchemaStructure = (fields: readonly FieldIntrospection[]): SchemaStructure => {
  const fieldPaths = fields.map(f => f.path.join('.'));
  const maxDepth = Math.max(...fields.map(f => f.path.length), 0);

  // Build branches (groups of fields with common path prefixes)
  const branches = buildSchemaBranches(fields);

  return {
    fields,
    depth: maxDepth,
    branches,
    fieldPaths,
  };
};

const buildSchemaBranches = (fields: readonly FieldIntrospection[]): readonly SchemaBranch[] => {
  const branchMap = new Map<string, SchemaBranch>();

  for (const field of fields) {
    for (let depth = 1; depth <= field.path.length; depth++) {
      const branchPath = field.path.slice(0, depth);
      const branchKey = branchPath.join('.');

      if (!branchMap.has(branchKey)) {
        const branchFields = fields
          .filter(f => f.path.slice(0, depth).join('.') === branchKey)
          .map(f => f.name);

        const optional = fields
          .filter(f => f.path.slice(0, depth).join('.') === branchKey)
          .every(f => !f.required);

        branchMap.set(branchKey, {
          path: branchPath,
          fields: branchFields,
          depth,
          optional,
        });
      }
    }
  }

  return Array.from(branchMap.values());
};

// ========================================
// Statistics Calculation
// ========================================

const calculateStatistics = (fields: readonly FieldIntrospection[]): SchemaStatistics => {
  const totalFields = fields.length;
  const requiredFields = fields.filter(f => f.required).length;
  const optionalFields = totalFields - requiredFields;
  const constrainedFields = fields.filter(f => hasConstraints(f.constraints)).length;
  const validatedFields = fields.filter(f => f.validation.hasCustomValidator).length;
  const nestedFields = fields.filter(f => f.path.length > 1).length;

  // Type distribution
  const typeDistribution: Record<SchemaFieldType, number> = {
    string: 0,
    number: 0,
    boolean: 0,
    array: 0,
    object: 0,
    any: 0,
  };

  fields.forEach(field => {
    typeDistribution[field.type]++;
  });

  // Constraint distribution
  const constraintDistribution: Record<string, number> = {};
  fields.forEach(field => {
    field.validation.rules.forEach(rule => {
      constraintDistribution[rule] = (constraintDistribution[rule] || 0) + 1;
    });
  });

  // Complexity distribution
  const complexityDistribution: Record<string, number> = {
    simple: 0,
    moderate: 0,
    complex: 0,
  };

  fields.forEach(field => {
    complexityDistribution[field.complexity.level]++;
  });

  return {
    totalFields,
    requiredFields,
    optionalFields,
    constrainedFields,
    validatedFields,
    nestedFields,
    typeDistribution,
    constraintDistribution,
    complexityDistribution,
  };
};

const hasConstraints = (constraints: FieldConstraintSummary): boolean => {
  return (
    constraints.hasEnum ||
    constraints.hasPattern ||
    constraints.hasRange ||
    constraints.hasLength ||
    constraints.hasFormat
  );
};

// ========================================
// Relationship Analysis
// ========================================

const analyzeRelationships = <T extends Record<string, unknown>>(
  fields: readonly FieldIntrospection[],
  schema: ConfigSchema<T>
): readonly FieldRelationship[] => {
  const relationships: FieldRelationship[] = [];

  // Analyze field name patterns for potential relationships
  for (let i = 0; i < fields.length; i++) {
    for (let j = i + 1; j < fields.length; j++) {
      const field1 = fields[i];
      const field2 = fields[j];

      // Check for naming patterns that suggest relationships
      const relationship = detectRelationship(field1, field2);
      if (relationship) {
        relationships.push(relationship);
      }
    }
  }

  return relationships;
};

const detectRelationship = (
  field1: FieldIntrospection,
  field2: FieldIntrospection
): FieldRelationship | null => {
  const name1 = field1.name.toLowerCase();
  const name2 = field2.name.toLowerCase();

  // Check for reference patterns (e.g., "userId" and "user")
  if (name1.includes('id') && name2.includes(name1.replace('id', ''))) {
    return {
      type: 'reference',
      source: field1.name,
      target: field2.name,
      description: `${field1.name} references ${field2.name}`,
      strength: 'moderate',
    };
  }

  // Check for composition patterns (nested objects)
  if (field1.path.length > 0 && field2.path.length > 0) {
    const commonPrefix = getCommonPrefix(field1.path, field2.path);
    if (
      commonPrefix.length > 0 &&
      commonPrefix.length < Math.min(field1.path.length, field2.path.length)
    ) {
      return {
        type: 'composition',
        source: field1.name,
        target: field2.name,
        description: `${field1.name} and ${field2.name} are part of the same object`,
        strength: 'weak',
      };
    }
  }

  return null;
};

const getCommonPrefix = (path1: readonly string[], path2: readonly string[]): readonly string[] => {
  const commonPrefix: string[] = [];
  const minLength = Math.min(path1.length, path2.length);

  for (let i = 0; i < minLength; i++) {
    if (path1[i] === path2[i]) {
      commonPrefix.push(path1[i]);
    } else {
      break;
    }
  }

  return commonPrefix;
};

// ========================================
// Validation Rules Extraction
// ========================================

const extractValidationRules = <T extends Record<string, unknown>>(
  fields: readonly FieldIntrospection[],
  schema: ConfigSchema<T>
): ValidationRules => {
  const fieldRules: Record<string, readonly string[]> = {};
  const customValidators: CustomValidatorInfo[] = [];

  fields.forEach(field => {
    fieldRules[field.name] = field.validation.rules;

    if (field.validation.hasCustomValidator) {
      customValidators.push({
        field: field.name,
        source: field.validation.validatorSource || '',
        dependencies: field.validation.dependencies,
        async: false, // Would need source analysis to determine
      });
    }
  });

  // Extract schema-level rules
  const schemaRules: string[] = [];
  if (schema.validate) {
    schemaRules.push('schema-validation');
  }
  if (schema.strict) {
    schemaRules.push('strict-mode');
  }

  return {
    fieldRules,
    crossFieldRules: [], // Would need more sophisticated analysis
    schemaRules,
    customValidators,
  };
};

// ========================================
// Complexity Analysis
// ========================================

const calculateFieldComplexity = (
  field: SchemaField,
  constraints: FieldConstraintSummary,
  validation: FieldValidationInfo
): FieldComplexity => {
  const factors: ComplexityFactor[] = [];
  let score = 1; // Base score

  // Constraint complexity
  if (constraints.hasEnum) {
    factors.push({ type: 'constraints', weight: 2, description: 'Has enum constraint' });
    score += 2;
  }
  if (constraints.hasPattern) {
    factors.push({ type: 'constraints', weight: 3, description: 'Has pattern constraint' });
    score += 3;
  }
  if (constraints.hasRange) {
    factors.push({ type: 'constraints', weight: 2, description: 'Has range constraint' });
    score += 2;
  }
  if (constraints.hasLength) {
    factors.push({ type: 'constraints', weight: 2, description: 'Has length constraint' });
    score += 2;
  }

  // Validation complexity
  if (validation.hasCustomValidator) {
    factors.push({ type: 'validation', weight: 4, description: 'Has custom validator' });
    score += 4;
  }

  // Type complexity
  if (field.type === 'object') {
    factors.push({ type: 'nesting', weight: 3, description: 'Nested object type' });
    score += 3;
  }
  if (field.type === 'array') {
    factors.push({ type: 'nesting', weight: 2, description: 'Array type' });
    score += 2;
  }

  // Determine complexity level
  let level: 'simple' | 'moderate' | 'complex';
  if (score <= 3) {
    level = 'simple';
  } else if (score <= 8) {
    level = 'moderate';
  } else {
    level = 'complex';
  }

  return {
    score,
    factors,
    level,
  };
};

const calculateComplexityMetrics = (
  fields: readonly FieldIntrospection[],
  structure: SchemaStructure,
  validation: ValidationRules
): ComplexityMetrics => {
  const fieldComplexities = fields.map(f => f.complexity.score);
  const averageFieldComplexity =
    fieldComplexities.reduce((sum, score) => sum + score, 0) / fields.length;

  const structural = Math.min(structure.depth * 2 + structure.branches.length, 20);
  const validationComplexity =
    validation.customValidators.length * 3 + validation.schemaRules.length * 2;
  const constraintComplexity = Object.values(validation.fieldRules).flat().length;

  const overall =
    (averageFieldComplexity + structural + validationComplexity + constraintComplexity) / 4;

  const factors: ComplexityFactor[] = [
    { type: 'nesting', weight: structural, description: `Schema depth: ${structure.depth}` },
    {
      type: 'validation',
      weight: validationComplexity,
      description: `Custom validators: ${validation.customValidators.length}`,
    },
    {
      type: 'constraints',
      weight: constraintComplexity,
      description: `Field constraints: ${constraintComplexity}`,
    },
  ];

  const recommendations: string[] = [];
  if (overall > 15) {
    recommendations.push('Consider breaking down complex fields into simpler ones');
  }
  if (structure.depth > 5) {
    recommendations.push('Deep nesting detected - consider flattening structure');
  }
  if (validation.customValidators.length > 5) {
    recommendations.push('Many custom validators - consider using constraint-based validation');
  }

  return {
    overall,
    structural,
    validation: validationComplexity,
    constraint: constraintComplexity,
    factors,
    recommendations,
  };
};

const createEmptyFieldComplexity = (): FieldComplexity => ({
  score: 1,
  factors: [],
  level: 'simple',
});

const createEmptyComplexityMetrics = (): ComplexityMetrics => ({
  overall: 0,
  structural: 0,
  validation: 0,
  constraint: 0,
  factors: [],
  recommendations: [],
});

// ========================================
// Query Functions
// ========================================

export const findFieldsByType = (
  introspection: SchemaIntrospection,
  type: SchemaFieldType
): readonly FieldIntrospection[] => {
  return introspection.structure.fields.filter(field => field.type === type);
};

export const findFieldsByComplexity = (
  introspection: SchemaIntrospection,
  level: 'simple' | 'moderate' | 'complex'
): readonly FieldIntrospection[] => {
  return introspection.structure.fields.filter(field => field.complexity.level === level);
};

export const findFieldsWithConstraints = (
  introspection: SchemaIntrospection
): readonly FieldIntrospection[] => {
  return introspection.structure.fields.filter(field => hasConstraints(field.constraints));
};

export const findFieldsWithCustomValidation = (
  introspection: SchemaIntrospection
): readonly FieldIntrospection[] => {
  return introspection.structure.fields.filter(field => field.validation.hasCustomValidator);
};

export const getFieldByPath = (
  introspection: SchemaIntrospection,
  path: string
): FieldIntrospection | undefined => {
  return introspection.structure.fields.find(field => field.path.join('.') === path);
};
