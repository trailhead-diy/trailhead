import {
  defineSchema,
  createSchema,
  validate,
  string,
  number,
  boolean,
  array,
  object,
} from '../core/zod-schema.js';

// ========================================
// Example 1: Basic Schema Definition
// ========================================

const appConfigSchema = defineSchema()
  .object({
    name: string()
      .description('Application name')
      .minLength(3)
      .maxLength(50)
      .examples('my-app', 'awesome-tool'),

    version: string()
      .description('Application version')
      .pattern(/^\d+\.\d+\.\d+$/, 'Must be valid semver')
      .examples('1.0.0', '2.1.3'),

    port: number().description('Server port').int().range(1000, 65535).default(3000),

    debug: boolean().description('Enable debug mode').default(false),

    features: array(string())
      .description('Enabled features')
      .minLength(1)
      .examples(['auth', 'api'], ['logging', 'metrics']),
  })
  .name('AppConfig')
  .description('Main application configuration')
  .version('1.0.0')
  .build();

// ========================================
// Example 2: Nested Object Schema
// ========================================

const databaseConfigSchema = createSchema({
  host: string().description('Database host').default('localhost'),

  port: number().int().positive().default(5432),

  database: string().description('Database name').minLength(1),

  ssl: boolean().default(false),

  pool: object({
    min: number().int().nonNegative().default(0),
    max: number().int().positive().default(10),
    idle: number().int().positive().default(30000),
  }).optional(),
})
  .name('DatabaseConfig')
  .description('Database connection configuration')
  .build();

// ========================================
// Example 3: Complex Nested Schema
// ========================================

const serverConfigSchema = createSchema({
  app: object({
    name: string().minLength(3),
    version: string().pattern(/^\d+\.\d+\.\d+$/),
    environment: string().enum('development', 'staging', 'production'),
  }),

  server: object({
    host: string().default('0.0.0.0'),
    port: number().int().range(1000, 65535).default(3000),
    cors: object({
      enabled: boolean().default(true),
      origins: array(string().url()).default(['http://localhost:3000']),
    }).optional(),
  }),

  database: object({
    url: string().url(),
    pool: object({
      min: number().int().nonNegative().default(0),
      max: number().int().positive().default(10),
    }).optional(),
  }),

  logging: object({
    level: string().enum('debug', 'info', 'warn', 'error').default('info'),
    format: string().enum('json', 'pretty').default('pretty'),
    outputs: array(string().enum('console', 'file', 'remote')).default(['console']),
  }).optional(),

  features: object({
    auth: boolean().default(true),
    metrics: boolean().default(false),
    tracing: boolean().default(false),
  }).optional(),
})
  .name('ServerConfig')
  .description('Complete server configuration')
  .version('2.0.0')
  .strict()
  .build();

// ========================================
// Example 4: Email & URL Validation
// ========================================

const userConfigSchema = createSchema({
  email: string().email().description('User email address'),

  website: string().url().optional().description('User website'),

  avatar: string().url().optional().description('Avatar image URL'),

  notifications: object({
    email: boolean().default(true),
    push: boolean().default(false),
    sms: boolean().default(false),
  }),
})
  .name('UserConfig')
  .build();

// ========================================
// Example 5: Advanced String Transformations
// ========================================

const cleanConfigSchema = createSchema({
  title: string().trim().minLength(1).description('Document title'),

  slug: string()
    .toLowerCase()
    .pattern(/^[a-z0-9-]+$/, 'Must be kebab-case')
    .description('URL slug'),

  tags: array(string().trim().toLowerCase()).description('Content tags'),
})
  .name('CleanConfig')
  .build();

// ========================================
// Example Usage & Validation
// ========================================

// Valid data
const validAppConfig = {
  name: 'my-awesome-app',
  version: '1.2.3',
  port: 8080,
  debug: true,
  features: ['auth', 'logging'],
};

// Validate the configuration
const appResult = validate(validAppConfig, appConfigSchema);
if (appResult.isOk()) {
  // ✓ App config is valid
  const config = appResult.value;
  void config; // Use config
} else {
  // ✗ App config validation failed
  const error = appResult.error;
  void error; // Handle error
}

// Invalid data (demonstrating error handling)
const invalidConfig = {
  name: 'ab', // too short
  version: '1.0', // invalid semver
  port: 99999, // out of range
  features: [], // empty array not allowed
};

const invalidResult = validate(invalidConfig, appConfigSchema);
if (invalidResult.isErr()) {
  // This will contain beautiful, detailed error messages with suggestions
  const error = invalidResult.error;
  void error; // Handle validation errors
}

// ========================================
// Example 6: Schema Composition
// ========================================

const createServiceSchema = (serviceName: string) =>
  createSchema({
    name: string().default(serviceName),
    enabled: boolean().default(true),
    config: object({}).passthrough(), // Allow any additional config
  })
    .name(`${serviceName}ServiceConfig`)
    .build();

const authServiceSchema = createServiceSchema('auth');
const loggingServiceSchema = createServiceSchema('logging');

// ========================================
// Type Inference Examples
// ========================================

// TypeScript will automatically infer these types
type AppConfig = typeof appConfigSchema.zodSchema._type;

// Example usage with inferred types
function processAppConfig(config: AppConfig) {
  // Process configuration
  const { name, version, port, debug } = config;
  (void name, version, port, debug); // Use config properties
}

export {
  appConfigSchema,
  databaseConfigSchema,
  serverConfigSchema,
  userConfigSchema,
  cleanConfigSchema,
  authServiceSchema,
  loggingServiceSchema,
};
