#!/usr/bin/env node

import { createCLI } from '@esteban-url/trailhead-cli';
import { getCommand } from './commands/get.js';

const cli = createCLI({
  name: 'api-client',
  version: '1.0.0',
  description: 'A robust HTTP client CLI with retry logic and authentication',
  commands: [getCommand],
});

cli.run();
