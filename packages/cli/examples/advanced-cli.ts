#!/usr/bin/env node
import { createCLI, Ok, Err, isOk } from '@trailhead/cli';
import { createCommand } from '@trailhead/cli/command';
import { unwrap, match, tryCatch, chain, all } from '@trailhead/cli/core';
import { filterUndefined, mergeOptionsWithDefaults } from '@trailhead/cli/utils';
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
  return tryCatch(
    async () => {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    },
    (error) => ({
      code: 'FILE_READ_ERROR',
      message: `Failed to read file: ${error}`,
      path: filePath,
    }),
  );
}

async function writeFileContent(filePath: string, content: string, dryRun: boolean) {
  if (dryRun) {
    console.log(`[DRY RUN] Would write to: ${filePath}`);
    return Ok(undefined);
  }
  
  return tryCatch(
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
  description: 'Process files with various transformations',
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
      defaultValue: 'text',
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
    
    const options = mergeOptionsWithDefaults(defaults, filterUndefined(rawOptions));
    
    // Chain multiple operations using Result utilities
    const result = await chain(
      await readFileContent(options.input),
      async (content) => {
        context.logger.step(`Processing ${content.length} characters...`);
        
        // Transform content based on format
        const transformed = match(
          tryCatch(() => {
            switch (options.format) {
              case 'json':
                return JSON.stringify({ content, timestamp: new Date() }, null, 2);
              case 'csv':
                return content.split('\n').map(line => `"${line}"`).join(',\n');
              case 'text':
              default:
                return content.toUpperCase();
            }
          }),
          {
            ok: (value) => Ok(value),
            err: (error) => Err({
              code: 'TRANSFORM_ERROR',
              message: `Failed to transform content: ${error}`,
            }),
          },
        );
        
        return transformed;
      },
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
      context.logger.success(`Successfully processed file${options.dryRun ? ' (dry run)' : ''}`);
    }
    
    return writeResult;
  },
}, { projectRoot: process.cwd() });

// Batch processing command demonstrating 'all' utility
const batchCommand = createCommand({
  name: 'batch',
  description: 'Process multiple files at once',
  arguments: '<pattern>',
  options: [
    {
      flags: '--prefix <prefix>',
      description: 'Output file prefix',
      defaultValue: 'processed_',
    },
  ],
  action: async (options, context) => {
    const pattern = context.args[0];
    
    // Find files matching pattern
    const files = await tryCatch(
      async () => {
        const dir = path.dirname(pattern);
        const basename = path.basename(pattern);
        const entries = await fs.readdir(dir);
        return entries.filter(entry => entry.includes(basename.replace('*', '')));
      },
      (error) => ({
        code: 'PATTERN_ERROR',
        message: `Failed to find files: ${error}`,
      }),
    );
    
    if (!isOk(files)) {
      return files;
    }
    
    // Process all files
    const results = await Promise.all(
      unwrap(files).map(async (file) => {
        const content = await readFileContent(file);
        if (!isOk(content)) return content;
        
        const output = `${options.prefix}${file}`;
        return writeFileContent(output, unwrap(content).toUpperCase(), false);
      }),
    );
    
    // Combine all results
    const combined = all(results);
    
    match(combined, {
      ok: () => context.logger.success(`Processed ${results.length} files`),
      err: (error) => context.logger.error(`Batch processing failed: ${error.message}`),
    });
    
    return combined;
  },
}, { projectRoot: process.cwd() });

// Create and configure CLI
const cli = createCLI({
  name: 'file-processor',
  version: '2.0.0',
  description: 'Advanced file processing CLI with Result type handling',
});

cli.addCommand(processCommand);
cli.addCommand(batchCommand);

// Add global error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Run CLI
cli.run(process.argv);