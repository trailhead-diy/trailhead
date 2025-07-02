#!/usr/bin/env node

import { createCLI } from '@trailhead/cli';
import { createCommand } from '@trailhead/cli/command';
import { createFileSystem } from '@trailhead/cli/filesystem';
import { Ok, Err } from '@trailhead/cli';

const processCommand = createCommand({
  name: 'process',
  description: 'Process files with various operations',
  options: [
    {
      name: 'operation',
      alias: 'o',
      type: 'string',
      choices: ['count-lines', 'word-count', 'uppercase'],
      default: 'count-lines',
      description: 'Processing operation to perform',
    },
  ],
  action: async (options, context) => {
    const [filePath] = context.args;
    
    if (!filePath) {
      return Err(new Error('File path required. Usage: file-processor process <file>'));
    }

    const fs = createFileSystem();
    const result = await fs.readFile(filePath);
    
    if (!result.success) {
      return Err(new Error(`Failed to read file: ${result.error.message}`));
    }

    const content = result.value;
    
    switch (options.operation) {
      case 'count-lines':
        const lines = content.split('\n').length;
        console.log(`Lines: ${lines}`);
        break;
      case 'word-count':
        const words = content.split(/\s+/).filter(w => w.length > 0).length;
        console.log(`Words: ${words}`);
        break;
      case 'uppercase':
        console.log(content.toUpperCase());
        break;
    }

    return Ok(undefined);
  },
});

const backupCommand = createCommand({
  name: 'backup',
  description: 'Create backup copies of files and directories',
  options: [
    {
      name: 'destination',
      alias: 'd',
      type: 'string',
      required: true,
      description: 'Backup destination directory',
    },
    {
      name: 'move',
      alias: 'm',
      type: 'boolean',
      default: false,
      description: 'Move files instead of copying',
    },
  ],
  action: async (options, context) => {
    const [sourcePath] = context.args;
    
    if (!sourcePath) {
      return Err(new Error('Source path required. Usage: file-processor backup <source> -d <destination>'));
    }

    const fs = createFileSystem();
    
    // Check if source exists
    const sourceExists = await fs.exists(sourcePath);
    if (!sourceExists.success || !sourceExists.value) {
      return Err(new Error(`Source path does not exist: ${sourcePath}`));
    }

    // Ensure destination directory exists
    const ensureResult = await fs.ensureDir(options.destination);
    if (!ensureResult.success) {
      return Err(new Error(`Failed to create destination directory: ${ensureResult.error.message}`));
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${options.destination}/backup-${timestamp}`;

    // Use move or copy based on option
    const operation = options.move ? 'move' : 'copy';
    const result = options.move 
      ? await fs.move(sourcePath, backupPath)
      : await fs.copy(sourcePath, backupPath, { recursive: true });

    if (!result.success) {
      return Err(new Error(`Failed to ${operation} files: ${result.error.message}`));
    }

    console.log(`✅ ${operation === 'move' ? 'Moved' : 'Copied'} ${sourcePath} to ${backupPath}`);
    return Ok(undefined);
  },
});

const cleanupCommand = createCommand({
  name: 'cleanup',
  description: 'Clean up temporary files and empty directories',
  options: [
    {
      name: 'pattern',
      alias: 'p',
      type: 'string',
      default: '*.tmp',
      description: 'File pattern to remove',
    },
    {
      name: 'empty-dirs',
      alias: 'e',
      type: 'boolean',
      default: false,
      description: 'Remove empty directories',
    },
  ],
  action: async (options, context) => {
    const [targetPath] = context.args;
    
    if (!targetPath) {
      return Err(new Error('Target path required. Usage: file-processor cleanup <path>'));
    }

    const fs = createFileSystem();
    
    if (options['empty-dirs']) {
      // Empty the directory but keep it
      const emptyResult = await fs.emptyDir(targetPath);
      if (!emptyResult.success) {
        return Err(new Error(`Failed to empty directory: ${emptyResult.error.message}`));
      }
      console.log(`✅ Emptied directory: ${targetPath}`);
    } else {
      // Remove the entire path
      const removeResult = await fs.remove(targetPath);
      if (!removeResult.success) {
        return Err(new Error(`Failed to remove path: ${removeResult.error.message}`));
      }
      console.log(`✅ Removed: ${targetPath}`);
    }

    return Ok(undefined);
  },
});

const cli = createCLI({
  name: 'file-processor',
  version: '1.0.0',
  description: 'Advanced file processing CLI with fs-extra capabilities',
  commands: [processCommand, backupCommand, cleanupCommand],
});

cli.run();