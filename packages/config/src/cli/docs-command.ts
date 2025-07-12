import { fs } from '@trailhead/fs';
import type { Result } from '@trailhead/core';
import type { CoreError } from '@trailhead/core';
import { ok, err, createCoreError } from '@trailhead/core';
import { generateConfigDocs, generateMarkdown, generateJsonSchema } from '../docs/generator.js';
import { introspectSchema } from '../docs/introspection.js';
import type { ConfigSchema, DocsGeneratorOptions, MarkdownOptions } from '../docs/generator.js';
import type { IntrospectionOptions } from '../docs/introspection.js';
import * as path from 'node:path';

// ========================================
// CLI Command Types
// ========================================

export interface DocsCommandOptions {
  readonly schema?: string;
  readonly output?: string;
  readonly format?: 'markdown' | 'json' | 'html' | 'json-schema';
  readonly title?: string;
  readonly includeExamples?: boolean;
  readonly includeConstraints?: boolean;
  readonly includeValidation?: boolean;
  readonly includeMetadata?: boolean;
  readonly template?: string;
  readonly watch?: boolean;
  readonly verbose?: boolean;
}

export interface DocsCommandContext {
  readonly schema: ConfigSchema;
  readonly options: DocsCommandOptions;
  readonly outputPath: string;
  readonly workingDirectory: string;
}

// ========================================
// CLI Command Implementation
// ========================================

// CLI Command stub - requires CLI framework to be implemented
export const createDocsCommand = () => {
  throw new Error(
    'CLI commands require @trailhead/cli framework - not implemented in this package'
  );
};

// ========================================
// Context Resolution
// ========================================

const resolveCommandContext = async (
  options: DocsCommandOptions
): Promise<Result<DocsCommandContext, CoreError>> => {
  try {
    // Resolve working directory
    const workingDirectory = process.cwd();

    // Resolve schema
    const schemaResult = await resolveSchema(options.schema, workingDirectory);
    if (schemaResult.isErr()) {
      return schemaResult;
    }

    const schema = schemaResult.value;

    // Resolve output path
    const outputPath = resolveOutputPath(options, workingDirectory);

    const context: DocsCommandContext = {
      schema,
      options,
      outputPath,
      workingDirectory,
    };

    return ok(context);
  } catch (error) {
    return err(
      createCoreError('CONTEXT_RESOLUTION_FAILED', 'Failed to resolve command context', {
        component: '@trailhead/config',
        operation: 'resolve-context',
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
};

const resolveSchema = async (
  schemaPath: string | undefined,
  workingDirectory: string
): Promise<Result<ConfigSchema, CoreError>> => {
  try {
    let resolvedPath: string;

    if (schemaPath) {
      // Use provided path
      resolvedPath = path.resolve(workingDirectory, schemaPath);
    } else {
      // Auto-detect schema file
      const autoDetectResult = await autoDetectSchemaFile(workingDirectory);
      if (autoDetectResult.isErr()) {
        return autoDetectResult;
      }
      resolvedPath = autoDetectResult.value;
    }

    // Check if file exists
    const existsResult = await fs.exists(resolvedPath);
    if (existsResult.isErr()) {
      return err(existsResult.error);
    }

    if (!existsResult.value) {
      return err(
        createCoreError('SCHEMA_FILE_NOT_FOUND', `Schema file not found: ${resolvedPath}`, {
          component: '@trailhead/config',
          operation: 'resolve-schema',
          context: { path: resolvedPath },
        })
      );
    }

    // Load and parse schema
    const loadResult = await loadSchemaFile(resolvedPath);
    if (loadResult.isErr()) {
      return loadResult;
    }

    return ok(loadResult.value);
  } catch (error) {
    return err(
      createCoreError('SCHEMA_RESOLUTION_FAILED', 'Failed to resolve schema', {
        component: '@trailhead/config',
        operation: 'resolve-schema',
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
};

const autoDetectSchemaFile = async (
  workingDirectory: string
): Promise<Result<string, CoreError>> => {
  const candidates = [
    'config.schema.ts',
    'config.schema.js',
    'schema.config.ts',
    'schema.config.js',
    'config/schema.ts',
    'config/schema.js',
    'src/config/schema.ts',
    'src/config/schema.js',
  ];

  for (const candidate of candidates) {
    const candidatePath = path.resolve(workingDirectory, candidate);
    const existsResult = await fs.exists(candidatePath);

    if (existsResult.isOk() && existsResult.value) {
      return ok(candidatePath);
    }
  }

  return err(
    createCoreError('SCHEMA_AUTO_DETECT_FAILED', 'Could not auto-detect schema file', {
      component: '@trailhead/config',
      operation: 'auto-detect-schema',
      context: {
        workingDirectory,
        candidates: candidates.map(c => path.resolve(workingDirectory, c)),
      },
    })
  );
};

const loadSchemaFile = async (filePath: string): Promise<Result<ConfigSchema, CoreError>> => {
  try {
    // For now, we'll require the schema to be exported as a CommonJS module
    // In a real implementation, we'd need to handle ES modules, TypeScript compilation, etc.

    const schema = await import(filePath);

    // Look for default export or named export 'schema'
    const configSchema = schema.default || schema.schema;

    if (!configSchema) {
      return err(
        createCoreError(
          'INVALID_SCHEMA_EXPORT',
          'Schema file must export a default schema or named "schema" export',
          {
            component: '@trailhead/config',
            operation: 'load-schema',
            context: { filePath },
          }
        )
      );
    }

    // Validate that it's a proper ConfigSchema
    if (!isValidConfigSchema(configSchema)) {
      return err(
        createCoreError('INVALID_SCHEMA_FORMAT', 'Exported schema is not a valid ConfigSchema', {
          component: '@trailhead/config',
          operation: 'load-schema',
          context: { filePath },
        })
      );
    }

    return ok(configSchema);
  } catch (error) {
    return err(
      createCoreError('SCHEMA_LOAD_FAILED', `Failed to load schema file: ${filePath}`, {
        component: '@trailhead/config',
        operation: 'load-schema',
        context: { filePath },
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
};

const isValidConfigSchema = (schema: unknown): schema is ConfigSchema => {
  return (
    typeof schema === 'object' &&
    schema !== null &&
    'fields' in schema &&
    typeof (schema as any).fields === 'object'
  );
};

const resolveOutputPath = (options: DocsCommandOptions, workingDirectory: string): string => {
  if (options.output) {
    return path.resolve(workingDirectory, options.output);
  }

  // Default output path based on format
  const format = options.format || 'markdown';
  const extension = getFileExtension(format);
  return path.resolve(workingDirectory, 'docs', `config.${extension}`);
};

const getFileExtension = (format: string): string => {
  switch (format) {
    case 'markdown':
      return 'md';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'json-schema':
      return 'schema.json';
    default:
      return 'md';
  }
};

// ========================================
// Documentation Generation
// ========================================

const generateDocumentation = async (
  context: DocsCommandContext
): Promise<Result<void, CoreError>> => {
  try {
    const { schema, options, outputPath } = context;

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    const ensureDirResult = await fs.ensureDir(outputDir);
    if (ensureDirResult.isErr()) {
      return err(ensureDirResult.error);
    }

    const format = options.format || 'markdown';

    // Generate based on format
    switch (format) {
      case 'markdown':
        return generateMarkdownDocs(schema, options, outputPath);
      case 'json':
        return generateJsonDocs(schema, options, outputPath);
      case 'json-schema':
        return generateJsonSchemaDocs(schema, options, outputPath);
      case 'html':
        return generateHtmlDocs(schema, options, outputPath);
      default:
        return err(
          createCoreError('UNSUPPORTED_FORMAT', `Unsupported format: ${format}`, {
            component: '@trailhead/config',
            operation: 'generate-docs',
            context: { format },
          })
        );
    }
  } catch (error) {
    return err(
      createCoreError('DOCUMENTATION_GENERATION_FAILED', 'Failed to generate documentation', {
        component: '@trailhead/config',
        operation: 'generate-docs',
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
};

const generateMarkdownDocs = async (
  schema: ConfigSchema,
  options: DocsCommandOptions,
  outputPath: string
): Promise<Result<void, CoreError>> => {
  const docsOptions: DocsGeneratorOptions = {
    title: options.title,
    includeExamples: options.includeExamples !== false,
    includeConstraints: options.includeConstraints !== false,
    includeValidation: options.includeValidation !== false,
    format: 'markdown',
  };

  // Generate docs structure
  const docsResult = generateConfigDocs(schema, docsOptions);
  if (docsResult.isErr()) {
    return err(docsResult.error);
  }

  const docs = docsResult.value;

  // Convert to markdown
  const markdownOptions: MarkdownOptions = {
    includeTableOfContents: true,
    includeTimestamp: true,
    includeMetadata: options.includeMetadata !== false,
    codeLanguage: 'json',
  };

  const markdownResult = generateMarkdown(docs, markdownOptions);
  if (markdownResult.isErr()) {
    return err(markdownResult.error);
  }

  const markdown = markdownResult.value;

  // Write to file
  const writeResult = await fs.writeFile(outputPath, markdown);
  if (writeResult.isErr()) {
    return err(writeResult.error);
  }

  return ok(undefined);
};

const generateJsonDocs = async (
  schema: ConfigSchema,
  options: DocsCommandOptions,
  outputPath: string
): Promise<Result<void, CoreError>> => {
  const docsOptions: DocsGeneratorOptions = {
    title: options.title,
    includeExamples: options.includeExamples !== false,
    includeConstraints: options.includeConstraints !== false,
    includeValidation: options.includeValidation !== false,
    format: 'json',
  };

  // Generate docs structure
  const docsResult = generateConfigDocs(schema, docsOptions);
  if (docsResult.isErr()) {
    return err(docsResult.error);
  }

  const docs = docsResult.value;

  // Convert to JSON
  const json = JSON.stringify(docs, null, 2);

  // Write to file
  const writeResult = await fs.writeFile(outputPath, json);
  if (writeResult.isErr()) {
    return err(writeResult.error);
  }

  return ok(undefined);
};

const generateJsonSchemaDocs = async (
  schema: ConfigSchema,
  options: DocsCommandOptions,
  outputPath: string
): Promise<Result<void, CoreError>> => {
  // Generate JSON Schema
  const jsonSchemaResult = generateJsonSchema(schema);
  if (jsonSchemaResult.isErr()) {
    return err(jsonSchemaResult.error);
  }

  const jsonSchema = jsonSchemaResult.value;

  // Convert to JSON
  const json = JSON.stringify(jsonSchema, null, 2);

  // Write to file
  const writeResult = await fs.writeFile(outputPath, json);
  if (writeResult.isErr()) {
    return err(writeResult.error);
  }

  return ok(undefined);
};

const generateHtmlDocs = async (
  schema: ConfigSchema,
  options: DocsCommandOptions,
  outputPath: string
): Promise<Result<void, CoreError>> => {
  // First generate markdown
  const docsOptions: DocsGeneratorOptions = {
    title: options.title,
    includeExamples: options.includeExamples !== false,
    includeConstraints: options.includeConstraints !== false,
    includeValidation: options.includeValidation !== false,
    format: 'html',
  };

  const docsResult = generateConfigDocs(schema, docsOptions);
  if (docsResult.isErr()) {
    return err(docsResult.error);
  }

  const docs = docsResult.value;

  const markdownResult = generateMarkdown(docs, {
    includeTableOfContents: true,
    includeTimestamp: true,
    includeMetadata: options.includeMetadata !== false,
  });

  if (markdownResult.isErr()) {
    return err(markdownResult.error);
  }

  const markdown = markdownResult.value;

  // Convert markdown to HTML (simplified - in practice would use a markdown parser)
  const html = convertMarkdownToHtml(markdown, docs.title);

  // Write to file
  const writeResult = await fs.writeFile(outputPath, html);
  if (writeResult.isErr()) {
    return err(writeResult.error);
  }

  return ok(undefined);
};

const convertMarkdownToHtml = (markdown: string, title: string): string => {
  // Very basic markdown to HTML conversion
  // In practice, you'd use a proper markdown parser like marked or markdown-it

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
        h1, h2, h3 { color: #333; }
        code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; }
        pre { background: #f5f5f5; padding: 1rem; border-radius: 6px; overflow: auto; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
        th { background: #f9f9f9; }
    </style>
</head>
<body>
    <pre>${markdown}</pre>
</body>
</html>`;

  return html;
};

// ========================================
// File Watching
// ========================================

const setupWatching = async (context: DocsCommandContext): Promise<Result<void, CoreError>> => {
  try {
    if (!context.options.schema) {
      return err(
        createCoreError('WATCH_SETUP_FAILED', 'Cannot watch without explicit schema path', {
          component: '@trailhead/config',
          operation: 'setup-watching',
        })
      );
    }

    const schemaPath = path.resolve(context.workingDirectory, context.options.schema);

    console.log(`👀 Watching schema file: ${schemaPath}`);
    console.log('Press Ctrl+C to stop watching...');

    // File watching not implemented - would require additional dependencies
    console.log('File watching not implemented in this package');

    return ok(undefined);

    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping file watcher...');
      process.exit(0);
    });

    return ok(undefined);
  } catch (error) {
    return err(
      createCoreError('WATCH_SETUP_FAILED', 'Failed to setup file watching', {
        component: '@trailhead/config',
        operation: 'setup-watching',
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
};

// ========================================
// Introspection Command (Bonus)
// ========================================

export const createIntrospectCommand = () => {
  throw new Error(
    'CLI commands require @trailhead/cli framework - not implemented in this package'
  );
};
