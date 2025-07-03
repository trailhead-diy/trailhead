# Trailhead CLI Framework Runtime Issue

## Summary

The `createCLI().run()` method fails with a TypeError when attempting to register commands with Commander.js. This appears to be a bug in the framework's CLI runner where a non-string value is being passed to Commander.js's `.command()` method.

## Error Details

### Stack Trace

```
TypeError: nameAndArgs.match is not a function or its return value is not iterable
    at Command.command (/Users/esteban/gh/esteban-url/trailhead/node_modules/.pnpm/commander@14.0.0/node_modules/commander/lib/command.js:163:40)
    at Object.run (file:///Users/esteban/gh/esteban-url/trailhead/packages/cli/dist/index.js:16:29)
    at file:///Users/esteban/gh/esteban-url/cc-expenses/dist/index.js:7:5
```

### Error Location

- **File**: `trailhead/packages/cli/src/cli.ts`
- **Method**: `CLI.run()` at line 39
- **Root Cause**: Commander.js expects `nameAndArgs` to be a string, but receiving something else

## Reproduction

### Minimal Test Case

```typescript
import { createCLI } from '@esteban-url/trailhead-cli'
import { createCommand } from '@esteban-url/trailhead-cli/command'

const testCommand = createCommand({
  name: 'test',
  description: 'Test command',
  action: async (options, context) => {
    context.logger.info('Test command works!')
    return { success: true, value: undefined }
  }
})

const cli = createCLI({
  name: 'test-cli',
  version: '1.0.0',
  description: 'Test CLI',
  commands: [testCommand]
})

// This line fails:
cli.run(process.argv)
```

### Steps to Reproduce

1. Create a minimal CLI with one command using `createCLI()`
2. Call `cli.run(process.argv)`
3. Error occurs immediately during command registration

## Environment

- **Node.js**: v20.11.0
- **Commander.js**: v14.0.0
- **Trailhead CLI**: v0.1.0
- **Platform**: macOS Darwin 24.5.0

## Analysis

Looking at the Trailhead CLI source (`packages/cli/src/cli.ts`), the issue appears to be in this section:

```typescript
// Register all commands
for (const command of commands) {
  const cmd = program
    .command(command.name)  // <- This line fails
    .description(command.description);
  // ...
}
```

The error suggests that `command.name` is not a string as expected by Commander.js's `.command()` method.

## Debugging Steps Attempted

1. ✅ Verified command structure follows Trailhead patterns
2. ✅ Confirmed `name` property is a string in command definition
3. ✅ Tested with minimal command (no options, simple action)
4. ✅ Checked TypeScript compilation (no errors)
5. ✅ Verified all imports use correct subpath exports

## Expected Behavior

The CLI should successfully register commands and display help when called with `--help`:

```bash
$ node dist/index.js --help
test-cli

Test CLI

Options:
  -V, --version   display version number
  -h, --help      display help for command

Commands:
  test            Test command
  help [command]  display help for command
```

## Workaround

Currently no workaround available. The issue prevents any CLI created with `createCLI()` from running.

## Migration Context

This issue was discovered while migrating from Commander.js to Trailhead CLI framework. The migration was successful in terms of:

- ✅ Code structure and patterns
- ✅ TypeScript compilation
- ✅ Test suite (114 tests passing)
- ✅ Import paths using subpath exports
- ✅ Functional programming patterns
- ✅ Result types and error handling

The only blocker is this runtime issue in the framework itself.

## Suggested Investigation

1. **Verify Command Registration**: Check if `command.name` is actually a string when passed to Commander.js
2. **Type Safety**: Ensure the `Command` interface and `createCommand()` are properly typed
3. **Commander.js Version**: Verify compatibility with Commander.js v14.0.0
4. **Build Process**: Check if the build process is correctly preserving command properties

## Priority

**High** - This completely blocks adoption of the Trailhead CLI framework for any CLI application.
