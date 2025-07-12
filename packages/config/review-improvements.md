# @trailhead/config Package - Review Improvements

### 1. Enhanced Validation Error Messages (High)

**Why Important**: Current validation errors are often cryptic, making it difficult for users to fix configuration issues.

**Implementation Guidelines**:

```typescript
// Enhanced validation with contextual errors
export interface ValidationError extends CoreError {
  readonly type: 'VALIDATION_ERROR';
  readonly field: string;
  readonly value: unknown;
  readonly expectedType: string;
  readonly suggestion: string;
  readonly examples: unknown[];
  readonly path: string[];
}

// User-friendly error formatter
export const createValidationErrorFormatter = () => ({
  formatError(error: ValidationError): string {
    const pathStr = error.path.length > 0 ? ` at "${error.path.join('.')}"` : '';
    const valueStr = error.value !== undefined ? ` (received: ${JSON.stringify(error.value)})` : '';

    let message = `Invalid ${error.expectedType}${pathStr}${valueStr}\n`;
    message += `  Suggestion: ${error.suggestion}\n`;

    if (error.examples.length > 0) {
      message += `  Examples:\n`;
      error.examples.forEach(example => {
        message += `    ${JSON.stringify(example)}\n`;
      });
    }

    return message;
  },

  // Multi-error summary
  formatErrors(errors: ValidationError[]): string {
    if (errors.length === 1) {
      return this.formatError(errors[0]);
    }

    let summary = `Found ${errors.length} configuration errors:\n\n`;
    errors.forEach((error, index) => {
      summary += `${index + 1}. ${this.formatError(error)}\n`;
    });

    return summary;
  },
});

// Enhanced schema definition with better error messages
export const defineConfigSchema = <T>() => ({
  object: <K extends keyof T>(fields: SchemaFields<T, K>) => ({
    optional: (optionalFields: OptionalSchemaFields<T>) => ({
      validate: (data: unknown): ConfigResult<T> => {
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

        // Validate required fields
        for (const [key, schema] of Object.entries(fields)) {
          if (!(key in obj)) {
            errors.push(
              createValidationError({
                field: key,
                value: undefined,
                expectedType: schema.type,
                suggestion: `Add required field "${key}"`,
                examples: schema.examples || [],
                path: [key],
              })
            );
            continue;
          }

          const fieldResult = schema.validate(obj[key]);
          if (fieldResult.isErr()) {
            const fieldError = fieldResult.error as ValidationError;
            errors.push({
              ...fieldError,
              path: [key, ...fieldError.path],
            });
          } else {
            (result as any)[key] = fieldResult.value;
          }
        }

        if (errors.length > 0) {
          return err(
            createConfigError({
              subtype: 'SCHEMA_VALIDATION_FAILED',
              message: 'Configuration validation failed',
              context: { errors },
            })
          );
        }

        return ok(result as T);
      },
    }),
  }),
});
```

**Implementation Steps**:

1. Design enhanced error interface with contextual information
2. Create user-friendly error formatting utilities
3. Enhance schema validation with detailed error reporting
4. Add suggestion generation based on common mistakes
5. Implement interactive error fixing prompts

**Expected Outcome**: 80% reduction in configuration debugging time, improved user experience

### 2. Configuration Documentation Generation (Medium)

**Why Important**: Self-documenting configuration schemas improve developer onboarding and reduce support burden.

**Implementation Guidelines**:

```typescript
// Schema documentation generator
export const generateConfigDocs = <T>(schema: ConfigSchema<T>): ConfigDocumentation => ({
  generateMarkdown(): string {
    let docs = `# Configuration Reference\n\n`;
    docs += `Generated on ${new Date().toISOString()}\n\n`;

    // Generate field documentation
    docs += `## Configuration Fields\n\n`;
    for (const [field, fieldSchema] of Object.entries(schema.fields)) {
      docs += `### ${field}\n\n`;
      docs += `- **Type**: ${fieldSchema.type}\n`;
      docs += `- **Required**: ${fieldSchema.required ? 'Yes' : 'No'}\n`;
      if (fieldSchema.default !== undefined) {
        docs += `- **Default**: \`${JSON.stringify(fieldSchema.default)}\`\n`;
      }
      docs += `- **Description**: ${fieldSchema.description}\n\n`;

      if (fieldSchema.examples?.length > 0) {
        docs += `**Examples:**\n\n`;
        fieldSchema.examples.forEach(example => {
          docs += `\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\`\n\n`;
        });
      }
    }

    return docs;
  },

  generateJSONSchema(): JSONSchema {
    return convertToJSONSchema(schema);
  },
});
```
