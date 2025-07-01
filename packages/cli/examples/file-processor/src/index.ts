#!/usr/bin/env node

import { createCLI } from '@trailhead/cli';
import { createCommand } from '@trailhead/cli/command';
import { FileSystem } from '@trailhead/cli/filesystem';
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

    const fs = new FileSystem();
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

const cli = createCLI({
  name: 'file-processor',
  version: '1.0.0',
  description: 'Advanced file processing CLI',
  commands: [processCommand],
});

cli.run();