// ========================================
// Complete Usage Example - Zod-Enhanced @trailhead/config
// ========================================

import {
  // Enhanced Zod-powered schema builders
  defineSchema,
  string,
  number,
  boolean,
  array,
  object,
  validate,

  // Enhanced documentation generation
  generateDocs,
  generateJsonSchemaFromZod,

  // Configuration operations
  createConfigOperations,
  createConfigManager,

  // Types
  type ZodConfigSchema,
  type ZodConfigDocs,
} from '../index.js';

// ========================================
// Example 1: Complete Server Configuration
// ========================================

const serverConfigSchema = defineSchema()
  .object({
    // App configuration with validation
    app: object({
      name: string()
        .description('Application name')
        .minLength(3)
        .maxLength(50)
        .examples('my-server', 'awesome-api'),

      version: string()
        .description('Application version')
        .pattern(/^\d+\.\d+\.\d+$/, 'Must be valid semver')
        .examples('1.0.0', '2.1.3'),

      environment: string()
        .enum('development', 'staging', 'production')
        .description('Deployment environment')
        .default('development'),
    }),

    // Server settings with constraints
    server: object({
      host: string()
        .description('Server host')
        .default('0.0.0.0')
        .examples('localhost', '0.0.0.0', '127.0.0.1'),

      port: number().description('Server port').int().range(1000, 65535).default(3000),

      ssl: object({
        enabled: boolean().default(false),
        cert: string().optional(),
        key: string().optional(),
      }).optional(),
    }),

    // Database configuration
    database: object({
      url: string()
        .url()
        .description('Database connection URL')
        .examples('postgresql://user:pass@localhost:5432/db'),

      pool: object({
        min: number().int().nonNegative().default(0),
        max: number().int().positive().default(10),
        idle: number().int().positive().default(30000),
      }).optional(),
    }),

    // Logging configuration
    logging: object({
      level: string()
        .enum('debug', 'info', 'warn', 'error')
        .default('info')
        .description('Log level'),

      format: string().enum('json', 'pretty').default('pretty').description('Log format'),

      outputs: array(string().enum('console', 'file', 'remote'))
        .default(['console'])
        .description('Log output destinations'),
    }).optional(),

    // Feature flags
    features: object({
      auth: boolean().default(true),
      metrics: boolean().default(false),
      tracing: boolean().default(false),
      rateLimiting: boolean().default(true),
    }).optional(),

    // External services
    services: object({
      redis: object({
        url: string().url().optional(),
        enabled: boolean().default(false),
      }).optional(),

      elasticsearch: object({
        url: string().url().optional(),
        enabled: boolean().default(false),
      }).optional(),
    }).optional(),
  })
  .name('ServerConfiguration')
  .description('Complete server configuration with validation and defaults')
  .version('2.0.0')
  .strict()
  .build();

// ========================================
// Example 2: Configuration Validation
// ========================================

// Valid configuration
const validConfig = {
  app: {
    name: 'my-awesome-server',
    version: '1.2.3',
    environment: 'production' as const,
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    ssl: {
      enabled: true,
      cert: '/path/to/cert.pem',
      key: '/path/to/key.pem',
    },
  },
  database: {
    url: 'postgresql://user:pass@localhost:5432/mydb',
    pool: {
      min: 2,
      max: 20,
      idle: 10000,
    },
  },
  logging: {
    level: 'info' as const,
    format: 'json' as const,
    outputs: ['console', 'file'] as const,
  },
  features: {
    auth: true,
    metrics: true,
    tracing: false,
    rateLimiting: true,
  },
  services: {
    redis: {
      url: 'redis://localhost:6379',
      enabled: true,
    },
  },
};

// Validate configuration
const validationResult = validate(validConfig, serverConfigSchema);

if (validationResult.isOk()) {
  console.log('✅ Configuration is valid!');
  const config = validationResult.value;

  // TypeScript knows the exact type structure
  console.log(`Starting ${config.app.name} v${config.app.version}`);
  console.log(`Server running on ${config.server.host}:${config.server.port}`);

  if (config.features?.metrics) {
    console.log('📊 Metrics enabled');
  }
} else {
  console.error('❌ Configuration validation failed:');
  console.error(validationResult.error.message);

  // Enhanced error details with suggestions and fix commands
  if (validationResult.error.context?.errors) {
    validationResult.error.context.errors.forEach((error: any, index: number) => {
      console.error(`\n${index + 1}. ${error.field}: ${error.suggestion}`);
      if (error.fixCommand) {
        console.error(`   Fix: ${error.fixCommand}`);
      }
    });
  }
}

// ========================================
// Example 3: Documentation Generation
// ========================================

async function generateDocumentation() {
  // Generate comprehensive documentation
  const docsResult = generateDocs(serverConfigSchema, {
    title: 'Server Configuration Guide',
    includeExamples: true,
    includeConstraints: true,
    includeValidation: true,
    includeJsonSchema: true,
  });

  if (docsResult.isOk()) {
    const docs = docsResult.value;

    console.log('📚 Generated documentation:');
    console.log(`- Title: ${docs.title}`);
    console.log(`- Fields: ${docs.metadata.fieldCount}`);
    console.log(`- Required: ${docs.metadata.requiredFieldCount}`);
    console.log(`- Optional: ${docs.metadata.optionalFieldCount}`);
    console.log(`- Generated: ${docs.generatedAt}`);

    // The docs include comprehensive field documentation
    docs.sections[0].fields.forEach(field => {
      console.log(`\n${field.name} (${field.type})`);
      if (field.description) {
        console.log(`  Description: ${field.description}`);
      }
      if (field.constraints) {
        console.log(`  Constraints: ${JSON.stringify(field.constraints)}`);
      }
      if (field.examples.length > 0) {
        console.log(`  Examples: ${field.examples.join(', ')}`);
      }
    });
  }

  // Generate JSON Schema
  const jsonSchema = generateJsonSchemaFromZod(
    serverConfigSchema.zodSchema,
    'ServerConfiguration',
    'Complete server configuration schema'
  );

  console.log('\n🔗 JSON Schema generated:');
  console.log(JSON.stringify(jsonSchema, null, 2));
}

// ========================================
// Example 4: Configuration Management
// ========================================

async function setupConfigurationManagement() {
  // Create configuration operations with the schema
  const configOps = createConfigOperations();

  // Create configuration manager
  const configManager = createConfigManager({
    schema: serverConfigSchema,
    sources: [
      { type: 'file', path: './config.json' },
      { type: 'env', prefix: 'SERVER_' },
      { type: 'cli', args: process.argv },
    ],
    // Enhanced validation with beautiful error messages
    validation: {
      enabled: true,
      strict: true,
      formatErrors: true,
    },
  });

  // Load and validate configuration
  const loadResult = await configManager.load();

  if (loadResult.isOk()) {
    const config = loadResult.value;
    console.log('✅ Configuration loaded and validated successfully');

    // Watch for changes
    const watchResult = await configManager.watch(change => {
      console.log(`🔄 Configuration changed: ${change.path.join('.')} = ${change.newValue}`);
    });

    if (watchResult.isOk()) {
      console.log('👀 Watching for configuration changes...');
    }
  } else {
    console.error('❌ Failed to load configuration:');
    console.error(loadResult.error.message);
  }
}

// ========================================
// Example 5: Invalid Configuration (Error Handling)
// ========================================

const invalidConfig = {
  app: {
    name: 'ab', // Too short (min 3 chars)
    version: '1.0', // Invalid semver
    environment: 'testing', // Not in enum
  },
  server: {
    host: '',
    port: 99999, // Out of range
  },
  database: {
    url: 'not-a-valid-url', // Invalid URL
    pool: {
      min: -1, // Negative not allowed
      max: 0, // Must be positive
    },
  },
  logging: {
    level: 'verbose', // Not in enum
    outputs: [], // Empty array not allowed
  },
  unknown_field: 'this will fail in strict mode',
};

console.log('\n🔍 Testing invalid configuration:');
const invalidResult = validate(invalidConfig, serverConfigSchema);

if (invalidResult.isErr()) {
  console.log('✅ Correctly caught validation errors:');

  // Enhanced error formatting with suggestions and examples
  if (invalidResult.error.context?.errors) {
    invalidResult.error.context.errors.forEach((error: any, index: number) => {
      console.log(`\n${index + 1}. Field: ${error.field}`);
      console.log(`   Error: ${error.suggestion}`);
      console.log(`   Received: ${JSON.stringify(error.value)}`);
      if (error.examples?.length > 0) {
        console.log(
          `   Examples: ${error.examples.map((ex: any) => JSON.stringify(ex)).join(', ')}`
        );
      }
      if (error.fixCommand) {
        console.log(`   Fix: ${error.fixCommand}`);
      }
      if (error.learnMoreUrl) {
        console.log(`   Learn more: ${error.learnMoreUrl}`);
      }
    });
  }
}

// ========================================
// Run Examples
// ========================================

export {
  serverConfigSchema,
  validConfig,
  invalidConfig,
  generateDocumentation,
  setupConfigurationManagement,
};

// Export the enhanced type for use elsewhere
export type ServerConfig = typeof serverConfigSchema.zodSchema._type;
