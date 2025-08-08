---
type: reference
sidebar: true
description: |-
  Foundation CLI orchestrator for the Trailhead System providing a complete CLI framework.

  This package provides a modern foundation for CLI applications using functional programming patterns,
  explicit error handling with Result types, and comprehensive command management. Built on top of
  Commander.js with enhanced type safety and validation.
example: 0
since: 0.1.0
---

[**Trailhead API Documentation v1.0.0**](README.md)

***

[Trailhead API Documentation](README.md) / @esteban-url/cli

# @esteban-url/cli

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

***

### CLIConfig

Configuration object for creating a CLI application

#### Properties

##### commands?

> `optional` **commands**: [`Command`](#command)\<`any`\>[]

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

***

### Command\<T\>

Command interface object for CLI registration

Represents a complete command that can be registered with a CLI instance.
Created by the createCommand() function and consumed by createCLI().

#### Type Parameters

##### T

`T` = `any`

Type of options object passed to the execute function

#### Properties

##### arguments?

> `optional` **arguments**: `string` \| `CommandArgument`[]

Commander.js style arguments specification (e.g., '\<input\> [output]')

##### description

> **description**: `string`

Description shown in help text

##### execute()

> **execute**: (`options`, `context`) => [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`Result`\<`void`, [`CoreError`](#coreerror)\>\>

Function that implements the command logic

###### Parameters

###### options

`T`

###### context

[`CommandContext`](#commandcontext)

###### Returns

[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<`Result`\<`void`, [`CoreError`](#coreerror)\>\>

##### name

> **name**: `string`

Command name used for CLI invocation

##### options?

> `optional` **options**: [`CommandOption`](#commandoption)[]

Array of command options/flags

***

### CommandContext

Context object provided to command actions during execution

Contains all the runtime context needed for command execution including
project information, logging utilities, filesystem access, and parsed arguments.

#### Properties

##### args

> `readonly` **args**: `string`[]

Positional arguments passed to the command

##### fs

> `readonly` **fs**: `FileSystem`

Filesystem abstraction for file operations

##### logger

> `readonly` **logger**: `Logger`

Logger instance for command output

##### projectRoot

> `readonly` **projectRoot**: `string`

Absolute path to the project root directory

##### verbose

> `readonly` **verbose**: `boolean`

Whether verbose logging is enabled

***

### CommandOption

Configuration for a command option/flag

Defines the structure for command-line options that can be passed to commands.
Supports both Commander.js style flags and programmatic name/alias definitions.

#### Properties

##### alias?

> `optional` **alias**: `string`

Single character alias for the option (e.g., 'v' for verbose)

##### default?

> `optional` **default**: `any`

Default value when option is not provided

##### description

> **description**: `string`

Description shown in help text

##### flags?

> `optional` **flags**: `string`

Commander.js style flags string (e.g., '-v, --verbose' or '--output \<dir\>')

##### name?

> `optional` **name**: `string`

Option name for programmatic access (extracted from flags if not provided)

##### required?

> `optional` **required**: `boolean`

Whether the option is required

##### type?

> `optional` **type**: `"string"` \| `"number"` \| `"boolean"`

Expected value type for the option

***

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
  suggestion: 'Please provide a longer username'
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
    context.logger.info('Tests completed');
    return { success: true, value: undefined };
  }
});

const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My CLI application',
  commands: [testCommand]
});

// Run with process arguments
await cli.run();

// Or run with custom arguments
await cli.run(['node', 'cli.js', 'test', '--verbose']);
```

CLI with multiple commands:
```typescript
const buildCommand = createCommand({
  name: 'build',
  description: 'Build the project',
  action: async (options, context) => {
    // Build implementation
    return { success: true, value: undefined };
  }
});

const testCommand = createCommand({
  name: 'test',
  description: 'Run tests',
  action: async (options, context) => {
    // Test implementation
    return { success: true, value: undefined };
  }
});

const cli = createCLI({
  name: 'project-tools',
  version: '2.1.0',
  description: 'Project development tools',
  commands: [buildCommand, testCommand]
});

await cli.run();
```

***

### createCommand()

> **createCommand**\<`T`\>(`config`): [`Command`](#command)\<`T`\>

Create a command object for use with createCLI

Creates a command interface object that can be registered with a CLI instance.
The command configuration is validated at creation time to ensure proper structure.

#### Type Parameters

##### T

`T` *extends* `CommandOptions`

Command options type extending CommandOptions

#### Parameters

##### config

`CommandConfig`\<`T`\>

Command configuration object

#### Returns

[`Command`](#command)\<`T`\>

Command interface object ready for CLI registration

#### Throws

When command configuration is invalid

#### Examples

Basic command without options:
```typescript
const testCommand = createCommand({
  name: 'test',
  description: 'Run tests',
  action: async (options, context) => {
    context.logger.info('Running tests...');
    return { success: true, value: undefined };
  }
});
```

Command with options and arguments:
```typescript
interface BuildOptions extends CommandOptions {
  output?: string;
  watch?: boolean;
}

const buildCommand = createCommand<BuildOptions>({
  name: 'build',
  description: 'Build the project',
  arguments: '[source-dir]',
  options: [
    {
      flags: '-o, --output <dir>',
      description: 'Output directory',
      type: 'string'
    },
    {
      flags: '--watch',
      description: 'Watch for changes',
      type: 'boolean'
    }
  ],
  examples: [
    'build src',
    'build --output dist --watch'
  ],
  action: async (options, context) => {
    // Implementation
    return { success: true, value: undefined };
  }
});
```
