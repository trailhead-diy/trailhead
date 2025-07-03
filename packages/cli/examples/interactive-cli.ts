#!/usr/bin/env node
import { createCLI, Ok, Err } from '@esteban-url/trailhead-cli';
import { createCommand, executeInteractive, type CommandContext } from '@esteban-url/trailhead-cli/command';
import { prompt, select, confirm, multiselect } from '@esteban-url/trailhead-cli/prompts';

// Example: Interactive CLI with prompts

interface ProjectOptions {
  name?: string;
  template?: string;
  features?: string[];
  typescript?: boolean;
  install?: boolean;
  interactive?: boolean;
}

const initCommand = createCommand<ProjectOptions>({
  name: 'init',
  description: 'Initialize a new project interactively\n\nExamples:\n  init my-project\n  init my-project --template react --typescript\n  init --interactive',
  arguments: '[name]',
  options: [
    {
      flags: '-t, --template <template>',
      description: 'Project template',
      type: 'string',
    },
    {
      flags: '--typescript',
      description: 'Use TypeScript',
      type: 'boolean',
    },
    {
      flags: '--no-install',
      description: 'Skip dependency installation',
      type: 'boolean',
    },
    {
      flags: '-i, --interactive',
      description: 'Run in interactive mode',
      type: 'boolean',
    },
  ],
  examples: [
    'init my-project',
    'init --interactive',
    'init my-app --template react --typescript',
  ],
  action: async (options, context) => {
    // Get project name from args if provided
    if (context.args[0]) {
      options.name = context.args[0];
    }
    
    // Use interactive execution if requested
    return executeInteractive(
      options,
      async () => {
        // Prompt for missing options
        const responses: ProjectOptions = {};
        
        if (!options.name) {
          responses.name = await prompt({
            message: 'What is your project name?',
            default: 'my-project',
            validate: (value) => {
              if (!value || value.trim().length === 0) {
                return 'Project name cannot be empty';
              }
              if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
                return 'Project name can only contain letters, numbers, hyphens, and underscores';
              }
              return true;
            },
          });
        }
        
        if (!options.template) {
          responses.template = await select({
            message: 'Select a project template:',
            choices: [
              { title: 'React', value: 'react' },
              { title: 'Vue', value: 'vue' },
              { title: 'Node.js API', value: 'node' },
              { title: 'CLI Application', value: 'cli' },
              { title: 'Library', value: 'library' },
            ],
          });
        }
        
        // Ask about features based on template
        const template = options.template || responses.template;
        if (template && ['react', 'vue'].includes(template)) {
          responses.features = await multiselect({
            message: 'Select additional features:',
            choices: [
              { title: 'CSS Preprocessor', value: 'css-preprocessor' },
              { title: 'Linting', value: 'linting' },
              { title: 'Testing', value: 'testing' },
              { title: 'Router', value: 'router' },
              { title: 'State Management', value: 'state' },
            ],
          });
        }
        
        if (options.typescript === undefined) {
          responses.typescript = await confirm({
            message: 'Would you like to use TypeScript?',
            default: true,
          });
        }
        
        if (options.install === undefined) {
          responses.install = await confirm({
            message: 'Install dependencies now?',
            default: true,
          });
        }
        
        return responses;
      },
      async (finalOptions) => {
        // Execute with final options
        const projectName = finalOptions.name || 'my-project';
        const template = finalOptions.template || 'node';
        const useTypescript = finalOptions.typescript ?? true;
        const features = finalOptions.features || [];
        const shouldInstall = finalOptions.install ?? true;
        
        context.logger.step(`Creating project: ${projectName}`);
        context.logger.info(`Template: ${template}`);
        context.logger.info(`TypeScript: ${useTypescript ? 'Yes' : 'No'}`);
        
        if (features.length > 0) {
          context.logger.info(`Features: ${features.join(', ')}`);
        }
        
        // Simulate project creation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        context.logger.success(`Project ${projectName} created successfully!`);
        
        if (shouldInstall) {
          context.logger.step('Installing dependencies...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          context.logger.success('Dependencies installed!');
        }
        
        context.logger.info('\nNext steps:');
        context.logger.info(`  cd ${projectName}`);
        context.logger.info(`  ${shouldInstall ? 'npm start' : 'npm install && npm start'}`);
        
        return Ok(undefined);
      },
      context,
    );
  },
});

// Configuration command with complex prompts
const configCommand = createCommand({
  name: 'config',
  description: 'Configure application settings',
  options: [
    {
      flags: '-i, --interactive',
      description: 'Interactive configuration',
      type: 'boolean',
    },
  ],
  action: async (options, context) => {
    if (!options.interactive) {
      context.logger.info('Use --interactive flag to configure interactively');
      return Ok(undefined);
    }
    
    context.logger.info('Welcome to the configuration wizard!\n');
    
    // Database configuration
    const dbType = await select({
      message: 'Select database type:',
      choices: [
        { title: 'PostgreSQL', value: 'postgres' },
        { title: 'MySQL', value: 'mysql' },
        { title: 'MongoDB', value: 'mongodb' },
        { title: 'SQLite', value: 'sqlite' },
      ],
    });
    
    let dbConfig: any = { type: dbType };
    
    if (dbType !== 'sqlite') {
      dbConfig.host = await prompt({
        message: 'Database host:',
        default: 'localhost',
      });
      
      dbConfig.port = await prompt({
        message: 'Database port:',
        default: dbType === 'postgres' ? '5432' : dbType === 'mysql' ? '3306' : '27017',
        validate: (value) => {
          const port = parseInt(value, 10);
          if (isNaN(port) || port < 1 || port > 65535) {
            return 'Please enter a valid port number (1-65535)';
          }
          return true;
        },
      });
      
      dbConfig.username = await prompt({
        message: 'Database username:',
        default: 'admin',
      });
      
      dbConfig.password = await prompt({
        message: 'Database password:',
        type: 'password',
      });
      
      dbConfig.database = await prompt({
        message: 'Database name:',
        default: 'myapp',
      });
    } else {
      dbConfig.path = await prompt({
        message: 'Database file path:',
        default: './database.sqlite',
      });
    }
    
    // API configuration
    const enableApi = await confirm({
      message: 'Enable REST API?',
      default: true,
    });
    
    let apiConfig: any = { enabled: enableApi };
    
    if (enableApi) {
      apiConfig.port = await prompt({
        message: 'API port:',
        default: '3000',
        validate: (value) => {
          const port = parseInt(value, 10);
          if (isNaN(port) || port < 1 || port > 65535) {
            return 'Please enter a valid port number (1-65535)';
          }
          return true;
        },
      });
      
      apiConfig.cors = await confirm({
        message: 'Enable CORS?',
        default: true,
      });
      
      apiConfig.rateLimit = await confirm({
        message: 'Enable rate limiting?',
        default: true,
      });
      
      if (apiConfig.rateLimit) {
        apiConfig.rateLimitMax = await prompt({
          message: 'Max requests per minute:',
          default: '100',
          validate: (value) => {
            const num = parseInt(value, 10);
            if (isNaN(num) || num < 1) {
              return 'Please enter a positive number';
            }
            return true;
          },
        });
      }
    }
    
    // Save configuration
    const config = {
      database: dbConfig,
      api: apiConfig,
      createdAt: new Date().toISOString(),
    };
    
    context.logger.info('\nConfiguration summary:');
    context.logger.info(JSON.stringify(config, null, 2));
    
    const shouldSave = await confirm({
      message: '\nSave this configuration?',
      default: true,
    });
    
    if (shouldSave) {
      // In a real app, you would save to a config file here
      context.logger.success('Configuration saved successfully!');
    } else {
      context.logger.warning('Configuration discarded');
    }
    
    return Ok(undefined);
  },
});

// Create CLI
const cli = createCLI({
  name: 'interactive-example',
  version: '1.0.0',
  description: 'Interactive CLI example with prompts and user input',
  commands: [initCommand, configCommand],
});

// Run CLI
cli.run(process.argv);