#!/usr/bin/env node
import { createCLI, Ok, Err, isOk } from '@esteban-url/trailhead-cli';
import { createCommand } from '@esteban-url/trailhead-cli/command';

// Example 1: Basic command with options
const greetCommand = createCommand({
  name: 'greet',
  description: 'Greet someone with a message',
  arguments: '<name>',
  options: [
    {
      flags: '-m, --message <message>',
      description: 'Custom greeting message',
      default: 'Hello',
    },
    {
      flags: '-u, --uppercase',
      description: 'Output in uppercase',
      type: 'boolean',
    },
  ],
  action: async (options, context) => {
    const name = context.args[0];
    const message = `${options.message}, ${name}!`;
    const output = options.uppercase ? message.toUpperCase() : message;

    context.logger.success(output);
    return Ok(undefined);
  },
});

// Example 2: Command with validation
const calculateCommand = createCommand({
  name: 'calculate',
  description: 'Perform basic calculations',
  arguments: '<operation> <num1> <num2>',
  action: async (options, context) => {
    const [operation, num1Str, num2Str] = context.args;

    // Validate operation
    if (
      !operation ||
      !['add', 'subtract', 'multiply', 'divide'].includes(operation)
    ) {
      return Err({
        code: 'INVALID_OPERATION',
        message: 'Operation must be: add, subtract, multiply, or divide',
      });
    }

    // Validate numbers
    if (
      !num1Str ||
      !num2Str ||
      isNaN(Number(num1Str)) ||
      isNaN(Number(num2Str))
    ) {
      return Err({
        code: 'INVALID_NUMBER',
        message: 'Both arguments must be valid numbers',
      });
    }

    const num1 = Number(num1Str);
    const num2 = Number(num2Str);

    // Check for Infinity and NaN
    if (!isFinite(num1) || !isFinite(num2) || isNaN(num1) || isNaN(num2)) {
      return Err({
        code: 'INVALID_NUMBER',
        message: 'Numbers must be finite values',
      });
    }

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
});

// Create the main CLI
const cli = createCLI({
  name: 'example-cli',
  version: '1.0.0',
  description: 'Example CLI demonstrating @esteban-url/trailhead-cli features',
  commands: [greetCommand, calculateCommand],
});

// Run the CLI
cli.run(process.argv);
