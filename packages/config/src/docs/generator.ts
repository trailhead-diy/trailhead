import type { Result } from '@trailhead/core';
import type { CoreError } from '@trailhead/core';
import { ok, err, createCoreError } from '@trailhead/core';
import type { ConfigSchema, SchemaField, SchemaFieldType } from '../core/schema.js';

// ========================================
// Documentation Generator Types
// ========================================

export interface ConfigDocs {
  readonly title: string;
  readonly description?: string;
  readonly version?: string;
  readonly generatedAt: string;
  readonly sections: readonly DocumentationSection[];
  readonly metadata: DocsMetadata;
}

export interface DocumentationSection {
  readonly title: string;
  readonly description?: string;
  readonly fields: readonly FieldDocumentation[];
  readonly examples?: readonly ExampleConfig[];
}

export interface FieldDocumentation {
  readonly name: string;
  readonly type: SchemaFieldType;
  readonly description?: string;
  readonly required: boolean;
  readonly defaultValue?: unknown;
  readonly examples: readonly unknown[];
  readonly constraints?: FieldConstraints;
  readonly validation?: ValidationInfo;
  readonly path: readonly string[];
}

export interface FieldConstraints {
  readonly enum?: readonly unknown[];
  readonly pattern?: string;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly format?: string;
}

export interface ValidationInfo {
  readonly rules: readonly string[];
  readonly customValidator?: string;
  readonly errorMessages?: Record<string, string>;
}

export interface ExampleConfig {
  readonly title: string;
  readonly description?: string;
  readonly config: Record<string, unknown>;
  readonly valid: boolean;
  readonly useCase?: string;
}

export interface DocsMetadata {
  readonly fieldCount: number;
  readonly requiredFieldCount: number;
  readonly optionalFieldCount: number;
  readonly schemaVersion?: string;
  readonly generator: string;
  readonly generatorVersion: string;
}

export interface DocsGeneratorOptions {
  readonly title?: string;
  readonly includeExamples?: boolean;
  readonly includeConstraints?: boolean;
  readonly includeValidation?: boolean;
  readonly format?: 'markdown' | 'json' | 'html';
  readonly template?: string;
  readonly outputPath?: string;
}

export interface MarkdownOptions {
  readonly includeTableOfContents?: boolean;
  readonly includeTimestamp?: boolean;
  readonly includeMetadata?: boolean;
  readonly codeLanguage?: string;
  readonly tableFormat?: 'github' | 'simple';
}

export interface JsonSchemaOutput {
  readonly $schema: string;
  readonly type: string;
  readonly title?: string;
  readonly description?: string;
  readonly properties: Record<string, JsonSchemaProperty>;
  readonly required?: readonly string[];
  readonly additionalProperties?: boolean;
}

export interface JsonSchemaProperty {
  readonly type: string | readonly string[];
  readonly description?: string;
  readonly default?: unknown;
  readonly examples?: readonly unknown[];
  readonly enum?: readonly unknown[];
  readonly pattern?: string;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly items?: JsonSchemaProperty;
  readonly properties?: Record<string, JsonSchemaProperty>;
  readonly additionalProperties?: boolean;
}

// ========================================
// Core Documentation Generator
// ========================================

export const generateConfigDocs = <T extends Record<string, unknown>>(
  schema: ConfigSchema<T>,
  options: DocsGeneratorOptions = {}
): Result<ConfigDocs, CoreError> => {
  try {
    const {
      title = schema.name || 'Configuration Documentation',
      includeExamples = true,
      includeConstraints = true,
      includeValidation = true,
    } = options;

    // Generate field documentation
    const fieldsResult = generateFieldsDocumentation(schema.fields, {
      includeConstraints,
      includeValidation,
      includeExamples,
    });

    if (fieldsResult.isErr()) {
      return fieldsResult;
    }

    const fields = fieldsResult.value;

    // Generate examples if requested
    const examples: ExampleConfig[] = [];
    if (includeExamples) {
      const examplesResult = generateExamples(schema);
      if (examplesResult.isOk()) {
        examples.push(...examplesResult.value);
      }
    }

    // Create main section
    const sections: DocumentationSection[] = [
      {
        title: 'Configuration Fields',
        description: 'All available configuration options',
        fields,
        examples: examples.length > 0 ? examples : undefined,
      },
    ];

    // Calculate metadata
    const metadata: DocsMetadata = {
      fieldCount: fields.length,
      requiredFieldCount: fields.filter(f => f.required).length,
      optionalFieldCount: fields.filter(f => !f.required).length,
      schemaVersion: schema.version,
      generator: '@trailhead/config',
      generatorVersion: '1.0.0',
    };

    const docs: ConfigDocs = {
      title,
      description: schema.description,
      version: schema.version,
      generatedAt: new Date().toISOString(),
      sections,
      metadata,
    };

    return ok(docs);
  } catch (error) {
    return err(
      createCoreError('DOCS_GENERATION_FAILED', 'Failed to generate configuration documentation', {
        component: '@trailhead/config',
        operation: 'generate-docs',
        context: { schema: schema.name },
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
};

// ========================================
// Field Documentation Generation
// ========================================

interface FieldDocsOptions {
  readonly includeConstraints: boolean;
  readonly includeValidation: boolean;
  readonly includeExamples: boolean;
}

const generateFieldsDocumentation = (
  fields: Record<string, SchemaField>,
  options: FieldDocsOptions
): Result<readonly FieldDocumentation[], CoreError> => {
  try {
    const fieldDocs: FieldDocumentation[] = [];

    for (const [fieldName, fieldSchema] of Object.entries(fields)) {
      const doc = generateFieldDocumentation(fieldName, fieldSchema, [], options);
      fieldDocs.push(doc);
    }

    return ok(fieldDocs);
  } catch (error) {
    return err(
      createCoreError('FIELD_DOCS_GENERATION_FAILED', 'Failed to generate field documentation', {
        component: '@trailhead/config',
        operation: 'generate-field-docs',
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
};

const generateFieldDocumentation = (
  name: string,
  field: SchemaField,
  path: readonly string[],
  options: FieldDocsOptions
): FieldDocumentation => {
  // Build constraints
  let constraints: FieldConstraints | undefined;
  if (options.includeConstraints) {
    constraints = buildFieldConstraints(field);
  }

  // Build validation info
  let validation: ValidationInfo | undefined;
  if (options.includeValidation && field.validate) {
    validation = {
      rules: ['custom'],
      customValidator: field.validate.toString(),
    };
  }

  // Get examples
  const examples = options.includeExamples && field.examples ? field.examples : [];

  return {
    name,
    type: field.type,
    description: field.description,
    required: field.required !== false,
    defaultValue: field.default,
    examples,
    constraints,
    validation,
    path,
  };
};

const buildFieldConstraints = (field: SchemaField): FieldConstraints | undefined => {
  const constraints: Partial<FieldConstraints> = {};

  if (field.enum) constraints.enum = field.enum;
  if (field.pattern) constraints.pattern = field.pattern;
  if (field.minimum !== undefined) constraints.minimum = field.minimum;
  if (field.maximum !== undefined) constraints.maximum = field.maximum;
  if (field.minLength !== undefined) constraints.minLength = field.minLength;
  if (field.maxLength !== undefined) constraints.maxLength = field.maxLength;

  return Object.keys(constraints).length > 0 ? (constraints as FieldConstraints) : undefined;
};

// ========================================
// Example Generation
// ========================================

const generateExamples = <T extends Record<string, unknown>>(
  schema: ConfigSchema<T>
): Result<readonly ExampleConfig[], CoreError> => {
  try {
    const examples: ExampleConfig[] = [];

    // Generate minimal valid configuration
    const minimalConfig = generateMinimalConfig(schema.fields);
    if (Object.keys(minimalConfig).length > 0) {
      examples.push({
        title: 'Minimal Configuration',
        description: 'The minimum required configuration',
        config: minimalConfig,
        valid: true,
        useCase: 'Getting started',
      });
    }

    // Generate complete configuration with defaults
    const completeConfig = generateCompleteConfig(schema.fields);
    if (Object.keys(completeConfig).length > Object.keys(minimalConfig).length) {
      examples.push({
        title: 'Complete Configuration',
        description: 'All available options with default values',
        config: completeConfig,
        valid: true,
        useCase: 'Full feature configuration',
      });
    }

    // Generate development configuration example
    const devConfig = generateDevelopmentConfig(schema.fields);
    if (Object.keys(devConfig).length > 0) {
      examples.push({
        title: 'Development Configuration',
        description: 'Recommended settings for development',
        config: devConfig,
        valid: true,
        useCase: 'Development environment',
      });
    }

    return ok(examples);
  } catch (error) {
    return err(
      createCoreError('EXAMPLES_GENERATION_FAILED', 'Failed to generate configuration examples', {
        component: '@trailhead/config',
        operation: 'generate-examples',
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
};

const generateMinimalConfig = (fields: Record<string, SchemaField>): Record<string, unknown> => {
  const config: Record<string, unknown> = {};

  for (const [fieldName, fieldSchema] of Object.entries(fields)) {
    if (fieldSchema.required !== false && fieldSchema.default === undefined) {
      // Use first example or type-appropriate default
      const exampleValue = fieldSchema.examples?.[0] ?? getTypeDefault(fieldSchema.type);
      if (exampleValue !== undefined) {
        config[fieldName] = exampleValue;
      }
    }
  }

  return config;
};

const generateCompleteConfig = (fields: Record<string, SchemaField>): Record<string, unknown> => {
  const config: Record<string, unknown> = {};

  for (const [fieldName, fieldSchema] of Object.entries(fields)) {
    // Use default value, first example, or type default
    const value =
      fieldSchema.default ?? fieldSchema.examples?.[0] ?? getTypeDefault(fieldSchema.type);

    if (value !== undefined) {
      config[fieldName] = value;
    }
  }

  return config;
};

const generateDevelopmentConfig = (
  fields: Record<string, SchemaField>
): Record<string, unknown> => {
  const config: Record<string, unknown> = {};

  for (const [fieldName, fieldSchema] of Object.entries(fields)) {
    // Use development-friendly defaults
    let value: unknown;

    if (fieldName.toLowerCase().includes('debug') && fieldSchema.type === 'boolean') {
      value = true;
    } else if (
      fieldName.toLowerCase().includes('env') &&
      fieldSchema.enum?.includes('development')
    ) {
      value = 'development';
    } else if (fieldName.toLowerCase().includes('port') && fieldSchema.type === 'number') {
      value = 3000;
    } else {
      value = fieldSchema.default ?? fieldSchema.examples?.[0];
    }

    if (value !== undefined) {
      config[fieldName] = value;
    }
  }

  return config;
};

const getTypeDefault = (type: SchemaFieldType): unknown => {
  switch (type) {
    case 'string':
      return 'example';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return undefined;
  }
};

// ========================================
// Format Generators
// ========================================

export const generateMarkdown = (
  docs: ConfigDocs,
  options: MarkdownOptions = {}
): Result<string, CoreError> => {
  try {
    const {
      includeTableOfContents = true,
      includeTimestamp = true,
      includeMetadata = true,
      codeLanguage = 'json',
      tableFormat = 'github',
    } = options;

    let markdown = '';

    // Header
    markdown += `# ${docs.title}\n\n`;

    if (docs.description) {
      markdown += `${docs.description}\n\n`;
    }

    if (includeTimestamp) {
      markdown += `*Generated on ${new Date(docs.generatedAt).toLocaleString()}*\n\n`;
    }

    // Table of Contents
    if (includeTableOfContents) {
      markdown += '## Table of Contents\n\n';
      docs.sections.forEach((section, index) => {
        markdown += `${index + 1}. [${section.title}](#${section.title.toLowerCase().replace(/\s+/g, '-')})\n`;
      });
      markdown += '\n';
    }

    // Sections
    docs.sections.forEach(section => {
      markdown += `## ${section.title}\n\n`;

      if (section.description) {
        markdown += `${section.description}\n\n`;
      }

      // Fields table
      if (section.fields.length > 0) {
        markdown += generateFieldsTable(section.fields, tableFormat);
        markdown += '\n';
      }

      // Examples
      if (section.examples) {
        markdown += '### Examples\n\n';
        section.examples.forEach(example => {
          markdown += `#### ${example.title}\n\n`;
          if (example.description) {
            markdown += `${example.description}\n\n`;
          }
          markdown += `\`\`\`${codeLanguage}\n${JSON.stringify(example.config, null, 2)}\n\`\`\`\n\n`;
        });
      }
    });

    // Metadata
    if (includeMetadata) {
      markdown += '## Metadata\n\n';
      markdown += `- **Total Fields**: ${docs.metadata.fieldCount}\n`;
      markdown += `- **Required Fields**: ${docs.metadata.requiredFieldCount}\n`;
      markdown += `- **Optional Fields**: ${docs.metadata.optionalFieldCount}\n`;
      if (docs.metadata.schemaVersion) {
        markdown += `- **Schema Version**: ${docs.metadata.schemaVersion}\n`;
      }
      markdown += `- **Generated by**: ${docs.metadata.generator} v${docs.metadata.generatorVersion}\n`;
      markdown += '\n';
    }

    return ok(markdown);
  } catch (error) {
    return err(
      createCoreError('MARKDOWN_GENERATION_FAILED', 'Failed to generate markdown documentation', {
        component: '@trailhead/config',
        operation: 'generate-markdown',
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
};

const generateFieldsTable = (
  fields: readonly FieldDocumentation[],
  format: 'github' | 'simple'
): string => {
  if (format === 'github') {
    let table = '| Field | Type | Required | Default | Description |\n';
    table += '|-------|------|----------|---------|-------------|\n';

    fields.forEach(field => {
      const name = `\`${field.name}\``;
      const type = `\`${field.type}\``;
      const required = field.required ? '✓' : '✗';
      const defaultValue =
        field.defaultValue !== undefined ? `\`${JSON.stringify(field.defaultValue)}\`` : '-';
      const description = field.description || '-';

      table += `| ${name} | ${type} | ${required} | ${defaultValue} | ${description} |\n`;
    });

    return table;
  } else {
    // Simple format
    let content = '';
    fields.forEach(field => {
      content += `**${field.name}** (${field.type})\n`;
      if (field.description) {
        content += `  ${field.description}\n`;
      }
      content += `  Required: ${field.required ? 'Yes' : 'No'}\n`;
      if (field.defaultValue !== undefined) {
        content += `  Default: \`${JSON.stringify(field.defaultValue)}\`\n`;
      }
      content += '\n';
    });
    return content;
  }
};

export const generateJsonSchema = <T extends Record<string, unknown>>(
  schema: ConfigSchema<T>
): Result<JsonSchemaOutput, CoreError> => {
  try {
    const properties: Record<string, JsonSchemaProperty> = {};
    const required: string[] = [];

    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
      properties[fieldName] = convertToJsonSchemaProperty(fieldSchema);

      if (fieldSchema.required !== false) {
        required.push(fieldName);
      }
    }

    const jsonSchema: JsonSchemaOutput = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      title: schema.name,
      description: schema.description,
      properties,
      required: required.length > 0 ? required : undefined,
      additionalProperties: !schema.strict,
    };

    return ok(jsonSchema);
  } catch (error) {
    return err(
      createCoreError('JSON_SCHEMA_GENERATION_FAILED', 'Failed to generate JSON schema', {
        component: '@trailhead/config',
        operation: 'generate-json-schema',
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
};

const convertToJsonSchemaProperty = (field: SchemaField): JsonSchemaProperty => {
  const property: Partial<JsonSchemaProperty> = {
    type: mapTypeToJsonSchema(field.type),
    description: field.description,
  };

  if (field.default !== undefined) {
    property.default = field.default;
  }

  if (field.examples && field.examples.length > 0) {
    property.examples = field.examples;
  }

  if (field.enum) {
    property.enum = field.enum;
  }

  if (field.pattern) {
    property.pattern = field.pattern;
  }

  if (field.minimum !== undefined) {
    property.minimum = field.minimum;
  }

  if (field.maximum !== undefined) {
    property.maximum = field.maximum;
  }

  if (field.minLength !== undefined) {
    property.minLength = field.minLength;
  }

  if (field.maxLength !== undefined) {
    property.maxLength = field.maxLength;
  }

  return property as JsonSchemaProperty;
};

const mapTypeToJsonSchema = (type: SchemaFieldType): string => {
  switch (type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'array';
    case 'object':
      return 'object';
    case 'any':
      return 'string'; // JSON Schema doesn't have "any", default to string
    default:
      return 'string';
  }
};
