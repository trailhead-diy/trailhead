[**Trailhead API Documentation v1.0.0**](README.md)

---

[Trailhead API Documentation](README.md) / @esteban-url/cli

# @esteban-url/cli

## Description

Foundation CLI orchestrator for the Trailhead System providing a complete CLI framework.

This package provides a modern foundation for CLI applications using functional programming patterns,
explicit error handling with Result types, and comprehensive command management. Built on top of
Commander.js with enhanced type safety and validation.

## Example

```typescript
import { createCLI, createCommand } from '@esteban-url/cli'

const testCommand = createCommand({
  name: 'test',
  description: 'Run tests',
  action: async (options, context) => {
    context.logger.info('Running tests...')
    return ok(undefined)
  },
})

const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My CLI application',
  commands: [testCommand],
})

await cli.run()
```

## Since

0.1.0

## Interfaces

### CLI

CLI application interface

#### Methods

##### run()

> **run**(`argv?`): [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`void`\>

Run the CLI with provided arguments

###### Parameters

###### argv?

`string`[]

Command line arguments (defaults to process.argv)

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`void`\>

---

### CLIConfig

Configuration object for creating a CLI application

#### Properties

##### commands?

> `optional` **commands**: `Command`\<`any`\>[]

Array of commands to register with the CLI

##### description

> **description**: `string`

Description shown in help text

##### name

> **name**: `string`

CLI application name (used in help text and version output)

##### version

> **version**: `string`

Version string for the CLI application

---

### CoreError

Foundation error interface providing comprehensive error information.
All errors in the Trailhead ecosystem should implement this interface.

#### Example

```typescript
const error: CoreError = {
  type: 'ValidationError',
  code: 'INVALID_INPUT',
  message: 'Username must be at least 3 characters',
  component: 'user-service',
  operation: 'validateUsername',
  timestamp: new Date(),
  severity: 'medium',
  recoverable: true,
  suggestion: 'Please provide a longer username',
}
```

#### Since

0.1.0

#### Extended by

- [`FileSystemError`](@esteban-url.fs.md#filesystemerror)
- [`ValidationError`](@esteban-url.validation.md#validationerror)

#### Properties

##### cause?

> `readonly` `optional` **cause**: `unknown`

Original error that caused this error

##### code

> `readonly` **code**: `string`

Unique error code for programmatic handling (e.g., 'INVALID_INPUT', 'TIMEOUT')

##### component

> `readonly` **component**: `string`

Component where the error occurred

##### context?

> `readonly` `optional` **context**: `Record`\<`string`, `unknown`\>

Additional context data for debugging

##### details?

> `readonly` `optional` **details**: `string`

Additional error details for debugging

##### message

> `readonly` **message**: `string`

Human-readable error message

##### operation

> `readonly` **operation**: `string`

Operation that was being performed when error occurred

##### recoverable

> `readonly` **recoverable**: `boolean`

Whether the error is recoverable through retry or user action

##### severity

> `readonly` **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Error severity level for prioritization

##### suggestion?

> `readonly` `optional` **suggestion**: `string`

Helpful suggestion for error recovery

##### timestamp

> `readonly` **timestamp**: `Date`

When the error occurred

##### type

> `readonly` **type**: `string`

Error type for categorization (e.g., 'ValidationError', 'NetworkError')

## Functions

### createCLI()

> **createCLI**(`config`): [`CLI`](#cli)

Create a CLI application with the specified configuration

Creates a complete CLI application that can parse command line arguments,
register commands, and execute them with proper error handling and validation.

#### Parameters

##### config

[`CLIConfig`](#cliconfig)

CLI configuration object

#### Returns

[`CLI`](#cli)

CLI instance with run() method

#### Examples

Basic CLI with single command:

```typescript
const testCommand = createCommand({
  name: 'test',
  description: 'Run tests',
  action: async (options, context) => {
    context.logger.info('Tests completed')
    return { success: true, value: undefined }
  },
})

const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My CLI application',
  commands: [testCommand],
})

// Run with process arguments
await cli.run()

// Or run with custom arguments
await cli.run(['node', 'cli.js', 'test', '--verbose'])
```

CLI with multiple commands:

```typescript
const buildCommand = createCommand({
  name: 'build',
  description: 'Build the project',
  action: async (options, context) => {
    // Build implementation
    return { success: true, value: undefined }
  },
})

const testCommand = createCommand({
  name: 'test',
  description: 'Run tests',
  action: async (options, context) => {
    // Test implementation
    return { success: true, value: undefined }
  },
})

const cli = createCLI({
  name: 'project-tools',
  version: '2.1.0',
  description: 'Project development tools',
  commands: [buildCommand, testCommand],
})

await cli.run()
```
