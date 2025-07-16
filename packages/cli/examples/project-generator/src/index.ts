#!/usr/bin/env node

import { createCLI } from '@esteban-url/trailhead-cli'
import { createCommand } from '@esteban-url/trailhead-cli/command'
import { FileSystem } from '@esteban-url/trailhead-cli/filesystem'
import { Ok, Err } from '@esteban-url/trailhead-cli'
import { join } from 'path'

const generateCommand = createCommand({
  name: 'generate',
  description: 'Generate a new project from template',
  options: [
    {
      name: 'template',
      alias: 't',
      type: 'string',
      choices: ['basic', 'cli', 'web'],
      default: 'basic',
      description: 'Project template to use',
    },
    {
      name: 'name',
      alias: 'n',
      type: 'string',
      required: true,
      description: 'Project name',
    },
  ],
  action: async (options, context) => {
    const fs = new FileSystem()
    const projectPath = join(process.cwd(), options.name)

    context.logger.info(`Creating project: ${options.name}`)

    // Create project directory
    const mkdirResult = await fs.mkdir(projectPath)
    if (!mkdirResult.success) {
      return Err(new Error(`Failed to create directory: ${mkdirResult.error.message}`))
    }

    // Generate package.json
    const packageJson = {
      name: options.name,
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'node src/index.js',
        build: 'echo "Add build script here"',
      },
    }

    const writeResult = await fs.writeFile(
      join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )

    if (!writeResult.success) {
      return Err(new Error(`Failed to write package.json: ${writeResult.error.message}`))
    }

    // Create src directory and index file
    await fs.mkdir(join(projectPath, 'src'))
    await fs.writeFile(
      join(projectPath, 'src', 'index.js'),
      `console.log('Hello from ${options.name}!');`
    )

    context.logger.success(`Project ${options.name} created successfully!`)
    return Ok(undefined)
  },
})

const cli = createCLI({
  name: 'project-generator',
  version: '1.0.0',
  description: 'Project scaffolding and template CLI',
  commands: [generateCommand],
})

cli.run()
