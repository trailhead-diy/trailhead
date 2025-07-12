import { describe, it, expect } from 'vitest';
import { defineConfigSchema, string, number, boolean, validateWithSchema } from '../core/schema.js';
import { createConfigOperations } from '../core/operations.js';
import { generateConfigDocs, generateMarkdown, generateJsonSchema } from '../docs/generator.js';
import { introspectSchema } from '../docs/introspection.js';
import { formatValidationError, formatValidationErrors } from '../validation/formatters.js';
import {
  createEnvironmentValidator,
  createPortValidator,
  createUrlValidator,
  createSecurityValidator,
} from '../validators/operations.js';

// ========================================
// Complete Workflow Integration Tests
// ========================================

describe('Enhanced Configuration System - Integration Tests', () => {
  // Sample application configuration schema
  const appConfigSchema = defineConfigSchema<{
    app: {
      name: string;
      version: string;
      environment: string;
      debug: boolean;
    };
    server: {
      port: number;
      host: string;
      baseUrl: string;
    };
    database: {
      url: string;
      maxConnections: number;
      timeout: number;
    };
    security: {
      apiKey: string;
      jwtSecret: string;
    };
  }>()
    .object({
      app: {
        type: 'object',
        required: true,
        properties: {
          name: string()
            .required()
            .minLength(3)
            .maxLength(50)
            .examples('my-app', 'awesome-service'),
          version: string().required().pattern('^\\d+\\.\\d+\\.\\d+$').examples('1.0.0', '2.1.3'),
          environment: string()
            .required()
            .enum('development', 'staging', 'production')
            .default('development'),
          debug: boolean().required().default(false),
        },
      } as any,
      server: {
        type: 'object',
        required: true,
        properties: {
          port: number().required().range(1, 65535).default(3000).examples(3000, 8080, 9000),
          host: string().required().default('localhost').examples('localhost', '0.0.0.0'),
          baseUrl: string().required().examples('http://localhost:3000', 'https://api.example.com'),
        },
      } as any,
      database: {
        type: 'object',
        required: true,
        properties: {
          url: string().required().examples('postgres://user:pass@localhost:5432/db'),
          maxConnections: number().required().range(1, 100).default(10),
          timeout: number().required().range(1000, 30000).default(5000),
        },
      } as any,
      security: {
        type: 'object',
        required: true,
        properties: {
          apiKey: string().required().minLength(32),
          jwtSecret: string().required().minLength(32),
        },
      } as any,
    })
    .optional({})
    .name('Application Configuration')
    .description('Complete application configuration schema')
    .version('1.0.0')
    .strict(true)
    .build();

  describe('Schema Definition and Validation', () => {
    it('should create a valid schema with builder pattern', () => {
      expect(appConfigSchema.name).toBe('Application Configuration');
      expect(appConfigSchema.description).toBe('Complete application configuration schema');
      expect(appConfigSchema.version).toBe('1.0.0');
      expect(appConfigSchema.strict).toBe(true);
      expect(Object.keys(appConfigSchema.fields)).toHaveLength(4);
    });

    it('should validate a complete valid configuration', () => {
      const validConfig = {
        app: {
          name: 'my-awesome-app',
          version: '1.2.3',
          environment: 'development',
          debug: true,
        },
        server: {
          port: 3000,
          host: 'localhost',
          baseUrl: 'http://localhost:3000',
        },
        database: {
          url: 'postgres://user:password@localhost:5432/myapp',
          maxConnections: 20,
          timeout: 5000,
        },
        security: {
          apiKey: 'abcdefghijklmnopqrstuvwxyz123456789012',
          jwtSecret: 'supersecretjwtkeythatisverylongandcomplex123',
        },
      };

      const result = validateWithSchema(validConfig, appConfigSchema);
      expect(result.isOk()).toBe(true);
    });

    it('should collect multiple validation errors', () => {
      const invalidConfig = {
        app: {
          name: 'ab', // Too short
          version: '1.2', // Invalid pattern
          environment: 'invalid', // Not in enum
          debug: 'true', // Wrong type
        },
        server: {
          port: 70000, // Out of range
          host: 123, // Wrong type
          baseUrl: 'not-a-url', // Invalid URL format
        },
        database: {
          // Missing required url field
          maxConnections: 0, // Out of range
          timeout: 500, // Out of range
        },
        security: {
          apiKey: 'short', // Too short
          jwtSecret: '', // Too short
        },
        extraField: 'not allowed', // Additional property in strict mode
      };

      const result = validateWithSchema(invalidConfig as any, appConfigSchema);
      expect(result.isErr()).toBe(true);

      if (result.isErr()) {
        expect(result.error.code).toBe('SCHEMA_VALIDATION_FAILED');
        expect(result.error.context?.errors).toBeDefined();
        expect(result.error.context?.errors.length).toBeGreaterThan(5);
      }
    });

    it('should format validation errors beautifully', () => {
      const invalidConfig = {
        app: {
          name: 'ab',
          version: '1.0.0',
          environment: 'development',
          debug: false,
        },
        server: {
          port: 70000,
          host: 'localhost',
          baseUrl: 'http://localhost:3000',
        },
        database: {
          url: 'postgres://user:pass@localhost:5432/db',
          maxConnections: 10,
          timeout: 5000,
        },
        security: {
          apiKey: 'short',
          jwtSecret: 'supersecretjwtkeythatisverylongandcomplex123',
        },
      };

      const result = validateWithSchema(invalidConfig as any, appConfigSchema);
      expect(result.isErr()).toBe(true);

      if (result.isErr()) {
        const errors = result.error.context?.errors || [];
        const formatted = formatValidationErrors(errors, { includeColors: false });

        expect(formatted).toContain('name');
        expect(formatted).toContain('port');
        expect(formatted).toContain('apiKey');
        expect(formatted).toContain('Suggestion:');
        expect(formatted).toContain('Examples:');
      }
    });
  });

  describe('Complete Configuration Operations', () => {
    it('should create and load configuration with validation', async () => {
      const configOps = createConfigOperations();

      const definition = {
        name: 'test-config',
        version: '1.0.0',
        description: 'Test configuration',
        schema: appConfigSchema,
        sources: [
          {
            type: 'object' as const,
            data: {
              app: {
                name: 'test-app',
                version: '1.0.0',
                environment: 'development',
                debug: false,
              },
              server: {
                port: 3000,
                host: 'localhost',
                baseUrl: 'http://localhost:3000',
              },
              database: {
                url: 'postgres://user:pass@localhost:5432/test',
                maxConnections: 10,
                timeout: 5000,
              },
              security: {
                apiKey: 'abcdefghijklmnopqrstuvwxyz123456789012',
                jwtSecret: 'supersecretjwtkeythatisverylongandcomplex123',
              },
            },
            priority: 1,
          },
        ],
        validators: [
          createEnvironmentValidator(),
          createPortValidator(),
          createUrlValidator(),
          createSecurityValidator(),
        ],
      };

      const loadResult = await configOps.load(definition);
      expect(loadResult.isOk()).toBe(true);

      if (loadResult.isOk()) {
        const state = loadResult.value;
        expect(state.resolved.app.name).toBe('test-app');
        expect(state.metadata.valid).toBe(true);
        expect(state.metadata.validationErrors).toHaveLength(0);
      }
    });

    it('should fail validation with built-in validators', async () => {
      const configOps = createConfigOperations();

      const definition = {
        name: 'test-config',
        schema: appConfigSchema,
        sources: [
          {
            type: 'object' as const,
            data: {
              app: {
                name: 'test-app',
                version: '1.0.0',
                environment: 'invalid-env', // Will fail environment validator
                debug: true, // Will fail security validator in production
              },
              server: {
                port: 70000, // Will fail port validator
                host: 'localhost',
                baseUrl: 'not-a-url', // Will fail URL validator
              },
              database: {
                url: 'not-a-url', // Will fail URL validator
                maxConnections: 10,
                timeout: 5000,
              },
              security: {
                apiKey: 'short', // Will fail security validator
                jwtSecret: 'short', // Will fail security validator
              },
            },
            priority: 1,
          },
        ],
        validators: [
          createEnvironmentValidator(),
          createPortValidator(),
          createUrlValidator(),
          createSecurityValidator(),
        ],
      };

      const loadResult = await configOps.load(definition);
      expect(loadResult.isOk()).toBe(true); // Should still load but with validation errors

      if (loadResult.isOk()) {
        const state = loadResult.value;
        expect(state.metadata.valid).toBe(false);
        expect(state.metadata.validationErrors.length).toBeGreaterThan(0);
        expect(state.metadata.transformationErrors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Documentation Generation', () => {
    it('should generate comprehensive documentation', () => {
      const docsResult = generateConfigDocs(appConfigSchema, {
        title: 'My App Configuration',
        includeExamples: true,
        includeConstraints: true,
        includeValidation: true,
      });

      expect(docsResult.isOk()).toBe(true);

      if (docsResult.isOk()) {
        const docs = docsResult.value;
        expect(docs.title).toBe('My App Configuration');
        expect(docs.description).toBe('Complete application configuration schema');
        expect(docs.version).toBe('1.0.0');
        expect(docs.sections).toHaveLength(1);
        expect(docs.sections[0].fields.length).toBeGreaterThan(0);
        expect(docs.sections[0].examples).toBeDefined();
        expect(docs.metadata.fieldCount).toBeGreaterThan(0);
      }
    });

    it('should generate markdown documentation', () => {
      const docsResult = generateConfigDocs(appConfigSchema);
      expect(docsResult.isOk()).toBe(true);

      if (docsResult.isOk()) {
        const docs = docsResult.value;
        const markdownResult = generateMarkdown(docs, {
          includeTableOfContents: true,
          includeTimestamp: true,
          includeMetadata: true,
        });

        expect(markdownResult.isOk()).toBe(true);

        if (markdownResult.isOk()) {
          const markdown = markdownResult.value;
          expect(markdown).toContain('# Application Configuration');
          expect(markdown).toContain('## Table of Contents');
          expect(markdown).toContain('## Configuration Fields');
          expect(markdown).toContain('## Metadata');
          expect(markdown).toContain('| Field |');
          expect(markdown).toContain('### Examples');
        }
      }
    });

    it('should generate JSON Schema', () => {
      const jsonSchemaResult = generateJsonSchema(appConfigSchema);
      expect(jsonSchemaResult.isOk()).toBe(true);

      if (jsonSchemaResult.isOk()) {
        const jsonSchema = jsonSchemaResult.value;
        expect(jsonSchema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
        expect(jsonSchema.type).toBe('object');
        expect(jsonSchema.title).toBe('Application Configuration');
        expect(jsonSchema.properties).toBeDefined();
        expect(jsonSchema.required).toBeDefined();
        expect(jsonSchema.additionalProperties).toBe(false); // strict mode
      }
    });
  });

  describe('Schema Introspection', () => {
    it('should perform comprehensive schema introspection', () => {
      const introspectionResult = introspectSchema(appConfigSchema, {
        includeComplexityAnalysis: true,
        includeRelationships: true,
        includeValidationSource: false,
      });

      expect(introspectionResult.isOk()).toBe(true);

      if (introspectionResult.isOk()) {
        const introspection = introspectionResult.value;

        expect(introspection.name).toBe('Application Configuration');
        expect(introspection.description).toBe('Complete application configuration schema');
        expect(introspection.version).toBe('1.0.0');

        // Structure analysis
        expect(introspection.structure.fields.length).toBeGreaterThan(0);
        expect(introspection.structure.depth).toBeGreaterThan(1); // Nested objects
        expect(introspection.structure.branches.length).toBeGreaterThan(0);

        // Statistics
        expect(introspection.statistics.totalFields).toBeGreaterThan(0);
        expect(introspection.statistics.requiredFields).toBeGreaterThan(0);
        expect(introspection.statistics.constrainedFields).toBeGreaterThan(0);
        expect(introspection.statistics.typeDistribution.string).toBeGreaterThan(0);
        expect(introspection.statistics.typeDistribution.number).toBeGreaterThan(0);
        expect(introspection.statistics.typeDistribution.boolean).toBeGreaterThan(0);
        expect(introspection.statistics.typeDistribution.object).toBeGreaterThan(0);

        // Validation rules
        expect(Object.keys(introspection.validation.fieldRules).length).toBeGreaterThan(0);
        expect(introspection.validation.schemaRules).toContain('strict-mode');

        // Complexity analysis
        expect(introspection.complexity.overall).toBeGreaterThan(0);
        expect(introspection.complexity.structural).toBeGreaterThan(0);
        expect(introspection.complexity.factors.length).toBeGreaterThan(0);
      }
    });

    it('should provide useful complexity recommendations', () => {
      // Create a deliberately complex schema
      const complexSchema = defineConfigSchema<{
        field1: string;
        field2: string;
        field3: string;
        field4: string;
        field5: string;
      }>()
        .object({
          field1: string().required().pattern('^[a-z]+$').minLength(10).maxLength(20),
          field2: string().required().pattern('^[A-Z]+$').minLength(15).maxLength(25),
          field3: string().required().pattern('^[0-9]+$').minLength(5).maxLength(15),
          field4: string().required().pattern('^[a-zA-Z0-9]+$').minLength(8).maxLength(30),
          field5: string().required().pattern('^[!@#$%^&*()]+$').minLength(12).maxLength(50),
        })
        .optional({})
        .strict(true)
        .build();

      const introspectionResult = introspectSchema(complexSchema, {
        includeComplexityAnalysis: true,
      });

      expect(introspectionResult.isOk()).toBe(true);

      if (introspectionResult.isOk()) {
        const introspection = introspectionResult.value;
        expect(introspection.complexity.overall).toBeGreaterThan(10);
        expect(introspection.complexity.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Recovery and User Experience', () => {
    it('should provide helpful error messages for common mistakes', () => {
      const commonMistakes = [
        {
          name: 'Missing required fields',
          config: {
            app: {
              // Missing name, version, environment
              debug: false,
            },
            // Missing server, database, security
          },
        },
        {
          name: 'Wrong types',
          config: {
            app: {
              name: 123, // Should be string
              version: '1.0.0',
              environment: 'development',
              debug: 'false', // Should be boolean
            },
            server: {
              port: '3000', // Should be number
              host: 'localhost',
              baseUrl: 'http://localhost:3000',
            },
            database: {
              url: 'postgres://user:pass@localhost:5432/db',
              maxConnections: '10', // Should be number
              timeout: 5000,
            },
            security: {
              apiKey: 'abcdefghijklmnopqrstuvwxyz123456789012',
              jwtSecret: 'supersecretjwtkeythatisverylongandcomplex123',
            },
          },
        },
        {
          name: 'Out of range values',
          config: {
            app: {
              name: 'my-app',
              version: '1.0.0',
              environment: 'development',
              debug: false,
            },
            server: {
              port: 70000, // Out of range
              host: 'localhost',
              baseUrl: 'http://localhost:3000',
            },
            database: {
              url: 'postgres://user:pass@localhost:5432/db',
              maxConnections: 150, // Out of range
              timeout: 500, // Out of range
            },
            security: {
              apiKey: 'short', // Too short
              jwtSecret: 'short', // Too short
            },
          },
        },
      ];

      commonMistakes.forEach(({ name, config }) => {
        const result = validateWithSchema(config as any, appConfigSchema);
        expect(result.isErr()).toBe(true);

        if (result.isErr()) {
          const errors = result.error.context?.errors || [];
          expect(errors.length).toBeGreaterThan(0);

          const formatted = formatValidationError(errors[0], { includeColors: false });
          expect(formatted).toContain('Suggestion:');
          expect(formatted).toContain('Examples:');

          // Should contain helpful context
          expect(formatted.length).toBeGreaterThan(50); // Substantial error message
        }
      });
    });

    it('should handle partial configuration loading gracefully', async () => {
      const configOps = createConfigOperations();

      const definition = {
        name: 'partial-config',
        schema: appConfigSchema,
        sources: [
          {
            type: 'object' as const,
            data: {
              app: {
                name: 'partial-app',
                version: '1.0.0',
                environment: 'development',
                debug: false,
              },
              // Missing server, database, security sections
            },
            priority: 1,
          },
        ],
      };

      const loadResult = await configOps.load(definition);
      expect(loadResult.isOk()).toBe(true); // Should load despite validation errors

      if (loadResult.isOk()) {
        const state = loadResult.value;
        expect(state.metadata.valid).toBe(false);
        expect(state.metadata.validationErrors.length).toBeGreaterThan(0);
        expect(state.resolved.app.name).toBe('partial-app'); // Partial data should be available
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large schemas efficiently', () => {
      // Create a schema with many fields
      const fields: Record<string, any> = {};
      for (let i = 0; i < 100; i++) {
        fields[`field${i}`] = string().required().minLength(1).maxLength(100);
      }

      const largeSchema = defineConfigSchema<any>().object(fields).optional({}).build();

      const config: any = {};
      for (let i = 0; i < 100; i++) {
        config[`field${i}`] = `value${i}`;
      }

      const startTime = Date.now();
      const result = validateWithSchema(config, largeSchema);
      const endTime = Date.now();

      expect(result.isOk()).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast (< 100ms)
    });

    it('should handle deep nesting efficiently', () => {
      // Create deeply nested schema
      const deepSchema = defineConfigSchema<{
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: string;
                };
              };
            };
          };
        };
      }>()
        .object({
          level1: {
            type: 'object',
            required: true,
            properties: {
              level2: {
                type: 'object',
                required: true,
                properties: {
                  level3: {
                    type: 'object',
                    required: true,
                    properties: {
                      level4: {
                        type: 'object',
                        required: true,
                        properties: {
                          level5: {
                            type: 'object',
                            required: true,
                            properties: {
                              value: string().required(),
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          } as any,
        })
        .optional({})
        .build();

      const deepConfig = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: 'deep-value',
                },
              },
            },
          },
        },
      };

      const startTime = Date.now();
      const result = validateWithSchema(deepConfig, deepSchema);
      const endTime = Date.now();

      expect(result.isOk()).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // Should handle deep nesting efficiently
    });
  });
});
