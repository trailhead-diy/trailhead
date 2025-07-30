import { describe, it, expect } from 'vitest'
import {
  defineSchema,
  string,
  number,
  boolean,
  object,
  validate,
  generateDocs,
  generateJsonSchema,
  formatValidationError,
  formatValidationErrors,
  createConfigOperations,
} from '../index.js'
import {
  createEnvironmentValidator,
  createPortValidator,
  createUrlValidator,
  createSecurityValidator,
} from '../validators/operations.js'

// ========================================
// Complete Workflow Integration Tests
// ========================================

describe('Enhanced Configuration System - Integration Tests', () => {
  // Sample application configuration schema
  const appConfigSchema = defineSchema()
    .object({
      app: object({
        name: string()
          .description('Application name')
          .minLength(3)
          .maxLength(50)
          .examples('my-app', 'awesome-service'),
        version: string()
          .description('Application version')
          .pattern(/^\d+\.\d+\.\d+$/, 'Must be valid semver')
          .examples('1.0.0', '2.1.3'),
        environment: string().enum('development', 'staging', 'production').default('development'),
        debug: boolean().description('Debug mode').default(false),
      }).build(),
      server: object({
        port: number()
          .description('Server port')
          .int()
          .range(1, 65535)
          .default(3000)
          .examples(3000, 8080, 9000),
        host: string()
          .description('Server host')
          .default('localhost')
          .examples('localhost', '0.0.0.0'),
        baseUrl: string()
          .description('Base URL')
          .url()
          .examples('http://localhost:3000', 'https://api.example.com'),
      }).build(),
      database: object({
        url: string()
          .description('Database URL')
          .url()
          .examples('postgres://user:pass@localhost:5432/db'),
        maxConnections: number().description('Max connections').int().range(1, 100).default(10),
        timeout: number().description('Timeout in ms').int().range(1000, 30000).default(5000),
      }),
      security: object({
        apiKey: string().description('API key').minLength(32),
        jwtSecret: string().description('JWT secret').minLength(32),
      }),
    })
    .name('Application Configuration')
    .description('Complete application configuration schema')
    .version('1.0.0')
    .strict()
    .build()

  describe('Schema Definition and Validation', () => {
    it('should create a valid schema with builder pattern', () => {
      expect(appConfigSchema.name).toBe('Application Configuration')
      expect(appConfigSchema.description).toBe('Complete application configuration schema')
      expect(appConfigSchema.version).toBe('1.0.0')
      expect(appConfigSchema.strict).toBe(true)
      expect(appConfigSchema.zodSchema).toBeDefined()
    })

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
      }

      const result = validate(validConfig, appConfigSchema)
      expect(result.isOk()).toBe(true)
    })

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
      }

      const result = validate(invalidConfig as any, appConfigSchema)
      expect(result.isErr()).toBe(true)

      if (result.isErr()) {
        expect(result.error.type).toBe('SCHEMA_VALIDATION_FAILED')
        expect(result.error.context?.errors).toBeDefined()
        expect(result.error.context?.errors.length).toBeGreaterThan(5)
      }
    })

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
      }

      const result = validate(invalidConfig as any, appConfigSchema)
      expect(result.isErr()).toBe(true)

      if (result.isErr()) {
        const errors = result.error.context?.errors || []
        const formatted = formatValidationErrors(errors, { includeColors: false })

        expect(formatted).toContain('name')
        expect(formatted).toContain('port')
        expect(formatted).toContain('apiKey')
        expect(formatted).toContain('Suggestion:')
        expect(formatted).toContain('Examples:')
      }
    })
  })

  describe('Complete Configuration Operations', () => {
    it('should create and load configuration with validation', async () => {
      const configOps = createConfigOperations()

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
      }

      const loadResult = await configOps.load(definition)
      expect(loadResult.isOk()).toBe(true)

      if (loadResult.isOk()) {
        const state = loadResult.value
        expect(state.resolved.app.name).toBe('test-app')
        expect(state.metadata.valid).toBe(true)
        expect(state.metadata.validationErrors).toHaveLength(0)
      }
    })

    it('should fail validation with built-in validators', async () => {
      const configOps = createConfigOperations()

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
      }

      const loadResult = await configOps.load(definition)
      expect(loadResult.isOk()).toBe(true) // Should still load but with validation errors

      if (loadResult.isOk()) {
        const state = loadResult.value
        expect(state.metadata.valid).toBe(false)
        expect(state.metadata.validationErrors.length).toBeGreaterThan(0)
        expect(state.metadata.transformationErrors.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Documentation Generation', () => {
    it('should generate comprehensive documentation', () => {
      const docsResult = generateDocs(appConfigSchema, {
        title: 'My App Configuration',
        includeExamples: true,
        includeConstraints: true,
        includeValidation: true,
      })

      expect(docsResult.isOk()).toBe(true)

      if (docsResult.isOk()) {
        const docs = docsResult.value
        expect(docs.title).toBe('My App Configuration')
        expect(docs.description).toBe('Complete application configuration schema')
        expect(docs.version).toBe('1.0.0')
        expect(docs.sections).toHaveLength(1)
        expect(docs.sections[0].fields.length).toBeGreaterThan(0)
        expect(docs.metadata.fieldCount).toBeGreaterThan(0)
      }
    })

    it('should generate JSON Schema', () => {
      const jsonSchemaResult = generateJsonSchema(
        appConfigSchema,
        'Application Configuration',
        'Complete application configuration schema'
      )
      expect(jsonSchemaResult.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
      expect(jsonSchemaResult.type).toBe('object')
      expect(jsonSchemaResult.title).toBe('Application Configuration')
      expect(jsonSchemaResult.properties).toBeDefined()
      expect(jsonSchemaResult.required).toBeDefined()
      expect(jsonSchemaResult.additionalProperties).toBe(false) // strict mode
    })
  })

  // Schema Introspection tests removed - legacy introspection not supported in Zod API

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
      ]

      commonMistakes.forEach(({ name: _, config }) => {
        const result = validate(config as any, appConfigSchema)
        expect(result.isErr()).toBe(true)

        if (result.isErr()) {
          const errors = result.error.context?.errors || []
          expect(errors.length).toBeGreaterThan(0)

          const formatted = formatValidationError(errors[0], { includeColors: false })
          expect(formatted).toContain('Suggestion:')
          // Examples are optional for numeric validation errors
          expect(formatted).toMatch(/Examples:|Must be/)

          // Should contain helpful context
          expect(formatted.length).toBeGreaterThan(50) // Substantial error message
        }
      })
    })

    it('should handle partial configuration loading gracefully', async () => {
      const configOps = createConfigOperations()

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
      }

      const loadResult = await configOps.load(definition)
      expect(loadResult.isOk()).toBe(true) // Should load despite validation errors

      if (loadResult.isOk()) {
        const state = loadResult.value
        expect(state.metadata.valid).toBe(false)
        expect(state.metadata.validationErrors.length).toBeGreaterThan(0)
        expect(state.resolved.app.name).toBe('partial-app') // Partial data should be available
      }
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large schemas efficiently', () => {
      // Create a schema with many fields
      const fields: Record<string, any> = {}
      for (let i = 0; i < 100; i++) {
        fields[`field${i}`] = string().minLength(1).maxLength(100)
      }

      const largeSchema = defineSchema().object(fields).build()

      const config: any = {}
      for (let i = 0; i < 100; i++) {
        config[`field${i}`] = `value${i}`
      }

      const startTime = Date.now()
      const result = validate(config, largeSchema)
      const endTime = Date.now()

      expect(result.isOk()).toBe(true)
      expect(endTime - startTime).toBeLessThan(100) // Should be fast (< 100ms)
    })

    it('should handle deep nesting efficiently', () => {
      // Create deeply nested schema
      const deepSchema = defineSchema()
        .object({
          level1: object({
            level2: object({
              level3: object({
                level4: object({
                  level5: object({
                    value: string().description('Deep value'),
                  }),
                }),
              }),
            }),
          }),
        })
        .build()

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
      }

      const startTime = Date.now()
      const result = validate(deepConfig, deepSchema)
      const endTime = Date.now()

      expect(result.isOk()).toBe(true)
      expect(endTime - startTime).toBeLessThan(50) // Should handle deep nesting efficiently
    })
  })
})
