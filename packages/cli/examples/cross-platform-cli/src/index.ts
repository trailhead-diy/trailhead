#!/usr/bin/env node

import { createCLI } from '@trailhead/cli';
import { createCommand } from '@trailhead/cli/command';
import { Ok } from '@trailhead/cli';
import { platform, homedir, tmpdir } from 'os';
import { join } from 'path';

const infoCommand = createCommand({
  name: 'info',
  description: 'Display system information',
  action: async (options, context) => {
    const info = {
      platform: platform(),
      homeDirectory: homedir(),
      tempDirectory: tmpdir(),
      nodeVersion: process.version,
      cwd: process.cwd(),
    };

    console.log('System Information:');
    console.log(`Platform: ${info.platform}`);
    console.log(`Home: ${info.homeDirectory}`);
    console.log(`Temp: ${info.tempDirectory}`);
    console.log(`Node: ${info.nodeVersion}`);
    console.log(`Working Directory: ${info.cwd}`);

    return Ok(undefined);
  },
});

const cli = createCLI({
  name: 'cross-platform',
  version: '1.0.0',
  description: 'A cross-platform CLI example',
  commands: [infoCommand],
});

cli.run();