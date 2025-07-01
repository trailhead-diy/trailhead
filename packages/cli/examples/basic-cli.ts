#!/usr/bin/env node
import { createCLI, Ok, Err, isOk } from '@trailhead/cli';
import { createCommand } from '@trailhead/cli/command';

// Example 1: Basic command with options
const greetCommand = createCommand({
  name: 'greet',
  description: 'Greet someone with a message',
  arguments: '<name>',  // Positional argument
  options: [
    {
      flags: '-m, --message <message>',
      description: 'Custom greeting message',
      defaultValue: 'Hello',
    },
    {
      flags: '-u, --uppercase',
      description: 'Output in uppercase',
      type: 'boolean',
    },
  ],
  examples: [
    'greet John',
    'greet Jane --message "Good morning"',
    'greet World --uppercase',
  ],
  action: async (options, context) => {
    const name = context.args[0];
    const message = `${options.message}, ${name}!`;
    const output = options.uppercase ? message.toUpperCase() : message;
    
    context.logger.success(output);
    return Ok(undefined);
  },
}, { projectRoot: process.cwd() });

// Example 2: Command with validation
const calculateCommand = createCommand({
  name: 'calculate',
  description: 'Perform basic calculations',
  arguments: '<operation> <num1> <num2>',
  validation: (options) => {
    const [operation, num1, num2] = process.argv.slice(3, 6);
    
    if (!['add', 'subtract', 'multiply', 'divide'].includes(operation)) {
      return Err({
        code: 'INVALID_OPERATION',
        message: 'Operation must be: add, subtract, multiply, or divide',
      });
    }
    
    if (isNaN(Number(num1)) || isNaN(Number(num2))) {
      return Err({
        code: 'INVALID_NUMBER',
        message: 'Both arguments must be valid numbers',
      });
    }
    
    return Ok(options);
  },
  action: async (options, context) => {
    const [operation, num1Str, num2Str] = context.args;
    const num1 = Number(num1Str);
    const num2 = Number(num2Str);
    
    let result: number;
    switch (operation) {
      case 'add':
        result = num1 + num2;
        break;
      case 'subtract':
        result = num1 - num2;
        break;
      case 'multiply':
        result = num1 * num2;
        break;
      case 'divide':
        if (num2 === 0) {
          return Err({
            code: 'DIVISION_BY_ZERO',
            message: 'Cannot divide by zero',
          });
        }
        result = num1 / num2;
        break;
      default:
        return Err({
          code: 'UNKNOWN_OPERATION',
          message: `Unknown operation: ${operation}`,
        });
    }
    
    context.logger.info(`${num1} ${operation} ${num2} = ${result}`);
    return Ok(undefined);
  },
}, { projectRoot: process.cwd() });

// Create the main CLI
const cli = createCLI({
  name: 'example-cli',
  version: '1.0.0',
  description: 'Example CLI demonstrating @trailhead/cli features',
});

// Add commands
cli.addCommand(greetCommand);
cli.addCommand(calculateCommand);

// Run the CLI
cli.run(process.argv);