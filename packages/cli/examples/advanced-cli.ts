#!/usr/bin/env node
import { createCLI, Ok, Err, isOk } from '@esteban-url/trailhead-cli';
import { createCommand } from '@esteban-url/trailhead-cli/command';
import {
  unwrap,
  match,
  tryCatch,
  tryCatchAsync,
  all,
} from '@esteban-url/trailhead-cli/core';
import {
  filterUndefined,
  mergeOptionsWithDefaults,
} from '@esteban-url/trailhead-cli/utils';
import { promises as fs } from 'fs';
import path from 'path';

// Example: File processing CLI with advanced Result handling

interface ProcessOptions {
  input: string;
  output?: string;
  format?: 'json' | 'csv' | 'text';
  verbose?: boolean;
  dryRun?: boolean;
}

// Helper function using Result utilities
async function readFileContent(filePath: string) {
  return tryCatchAsync(
    async () => {
      const content = await fs.readFile(filePath, 'utf-8');
      return content || ''; // Return empty string for empty files
    },
    (error) => ({
      code: 'FILE_READ_ERROR',
      message: `Failed to read file: ${error}`,
      path: filePath,
    }),
  );
}

async function writeFileContent(
  filePath: string,
  content: string,
  dryRun: boolean,
) {
  if (dryRun) {
    console.log(`[DRY RUN] Would write to: ${filePath}`);
    return Ok(undefined);
  }

  return tryCatchAsync(
    async () => {
      await fs.writeFile(filePath, content, 'utf-8');
    },
    (error) => ({
      code: 'FILE_WRITE_ERROR',
      message: `Failed to write file: ${error}`,
      path: filePath,
    }),
  );
}

const processCommand = createCommand<ProcessOptions>({
  name: 'process',
  description:
    'Process files with various transformations\n\nExamples:\n  process input.txt\n  process data.json --output result.csv --format csv\n  process config.yml --dry-run',
  arguments: '<input>',
  options: [
    {
      flags: '-o, --output <path>',
      description: 'Output file path',
      type: 'string',
    },
    {
      flags: '-f, --format <format>',
      description: 'Output format',
      default: 'text',
      type: 'string',
    },
    {
      flags: '--dry-run',
      description: 'Preview changes without writing',
      type: 'boolean',
    },
  ],
  examples: [
    'process input.txt',
    'process data.json --output result.csv --format csv',
    'process config.yml --dry-run',
  ],
  action: async (rawOptions, context) => {
    // Use our option utilities to handle defaults properly
    const defaults: ProcessOptions = {
      input: context.args[0],
      format: 'text',
      verbose: false,
      dryRun: false,
    };

    const options = mergeOptionsWithDefaults(
      defaults,
      filterUndefined(rawOptions),
    );

    // Read file content
    const fileContent = await readFileContent(options.input);

    if (!isOk(fileContent)) {
      context.logger.error(`Error: ${fileContent.error.message}`);
      return fileContent;
    }

    const content = unwrap(fileContent);
    context.logger.info(`→ Processing ${content.length} characters...`);

    // Transform content based on format
    const result = tryCatch(
      () => {
        switch (options.format) {
          case 'json':
            return JSON.stringify({ content, timestamp: new Date() }, null, 2);
          case 'csv':
            return content
              .split('\n')
              .map((line) => `"${line}"`)
              .join(',\n');
          case 'text':
          default:
            return content.toUpperCase();
        }
      },
      (error) => ({
        code: 'TRANSFORM_ERROR',
        message: `Failed to transform content: ${error}`,
      }),
    );

    // Handle the result
    if (!isOk(result)) {
      context.logger.error(`Error: ${result.error.message}`);
      return result;
    }

    // Write output
    const outputPath = options.output || `${options.input}.processed`;
    const writeResult = await writeFileContent(
      outputPath,
      unwrap(result),
      options.dryRun || false,
    );

    if (isOk(writeResult)) {
      context.logger.success(
        `Successfully processed file${options.dryRun ? ' (dry run)' : ''}`,
      );
    }

    return writeResult;
  },
});

// Batch processing command demonstrating 'all' utility
const batchCommand = createCommand({
  name: 'batch',
  description: 'Process multiple files at once',
  arguments: '<pattern>',
  options: [
    {
      flags: '--prefix <prefix>',
      description: 'Output file prefix',
      default: 'processed_',
    },
  ],
  action: async (options, context) => {
    const pattern = context.args[0];

    // Find files matching pattern
    const dir = path.dirname(pattern);
    const basename = path.basename(pattern);

    const files = await tryCatchAsync(
      async () => {
        const entries = await fs.readdir(dir);
        return entries.filter((entry) =>
          entry.includes(basename.replace('*', '')),
        );
      },
      (error) => ({
        code: 'PATTERN_ERROR',
        message: `Failed to find files: ${error}`,
      }),
    );

    if (!isOk(files)) {
      context.logger.error(files.error.message);
      return files;
    }

    const fileList = unwrap(files);

    if (!Array.isArray(fileList)) {
      return Err({
        code: 'INVALID_RESULT',
        message: 'Expected array of files but got: ' + typeof fileList,
      });
    }

    // Process all files
    const results = await Promise.all(
      fileList.map(async (file) => {
        const fullPath = path.join(dir, file);
        const content = await readFileContent(fullPath);
        if (!isOk(content)) return content;

        const output = path.join(dir, `${options.prefix}${file}`);
        return writeFileContent(output, unwrap(content).toUpperCase(), false);
      }),
    );

    // Combine all results
    const combined = all(results);

    match(combined, {
      ok: () => context.logger.success(`Processed ${results.length} files`),
      err: (error) =>
        context.logger.error(`Batch processing failed: ${error.message}`),
    });

    return combined;
  },
});

// Create and configure CLI
const cli = createCLI({
  name: 'file-processor',
  version: '2.0.0',
  description: 'Advanced file processing CLI with Result type handling',
  commands: [processCommand, batchCommand],
});

// Add global error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Run CLI
cli.run(process.argv);
