---
type: tutorial
title: 'Generate Your First CLI Application'
description: 'Create a functional CLI tool in 5 minutes using @trailhead/create-cli'
prerequisites:
  - Node.js 18+ installed
  - Basic command line knowledge
  - npm or pnpm installed
related:
  - /packages/cli/docs/reference/config.md
  - /packages/create-cli/docs/how-to/customize-templates.md
  - /packages/create-cli/docs/explanation/templates.md
---

# Generate Your First CLI Application

In this tutorial, you'll use @trailhead/create-cli to generate a fully functional command-line application. By the end, you'll have a working CLI tool with TypeScript, testing, and best practices built-in.

## What You'll Build

A CLI application that includes:

- TypeScript configuration for type safety
- Command structure with help documentation
- Testing setup with Vitest
- Linting and formatting tools
- Build configuration for distribution

## Before You Begin

Make sure you have:

- Node.js 18.0.0 or higher (`node --version`)
- npm or pnpm package manager
- 5 minutes of time

## Step 1: Run the Generator

Open your terminal and run:

```bash
npx @trailhead/create-cli my-awesome-cli
```

This command will start an interactive setup process.

## Step 2: Answer the Prompts

The generator will ask you several questions:

### Project Name

```
? Project name: my-awesome-cli
```

Press Enter to accept the default or type a new name.

### Template Selection

```
? Select a template:
  ❯ basic     - Essential CLI structure with TypeScript
    advanced  - Full-featured with examples and utilities
```

For your first CLI, select **basic** by pressing Enter.

### Package Manager

```
? Package manager:
  ❯ npm   - Node Package Manager (default)
    pnpm  - Performant npm (recommended)
```

Choose your preferred package manager. We recommend pnpm for better performance.

### Optional Features

```
? Include documentation? (y/N)
? Initialize git repository? (Y/n)
```

For this tutorial, answer **No** to documentation and **Yes** to git.

## Step 3: Explore Your Generated Project

After generation completes, navigate to your project:

```bash
cd my-awesome-cli
```

You'll see this structure:

```
my-awesome-cli/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── commands/
│   │   ├── help.ts        # Help command
│   │   └── version.ts     # Version command
│   └── __tests__/         # Test files
├── bin/
│   └── cli.js             # Executable script
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript config
├── vitest.config.ts       # Test configuration
└── README.md              # Project documentation
```

## Step 4: Install Dependencies

Install the project dependencies:

```bash
# If you chose npm
npm install

# If you chose pnpm
pnpm install
```

## Step 5: Test Your CLI

Run your CLI in development mode:

```bash
# Run with npm
npm run dev -- --help

# Run with pnpm
pnpm dev --help
```

You should see:

```
my-awesome-cli v0.1.0

Usage: my-awesome-cli [options] [command]

A CLI built with @trailhead/cli framework

Options:
  -V, --version    output the version number
  -h, --help       display help for command

Commands:
  help             Display help information
  version          Display version information
```

## Step 6: Add Your First Command

Create a new command in `src/commands/greet.ts`:

```typescript
import { createCommand } from '@trailhead/cli/command'
import { ok } from '@trailhead/core'

export const greetCommand = createCommand({
  name: 'greet',
  description: 'Greet someone',
  options: {
    name: {
      type: 'string',
      description: 'Name to greet',
      required: true,
      short: 'n',
    },
  },
  action: async ({ name }, context) => {
    context.logger.info(`Hello, ${name}! 👋`)
    return ok(undefined)
  },
})
```

## Step 7: Register the Command

Update `src/index.ts` to include your new command:

```typescript
import { createCLI } from '@trailhead/cli'
import { helpCommand } from './commands/help'
import { versionCommand } from './commands/version'
import { greetCommand } from './commands/greet'

const cli = createCLI({
  name: 'my-awesome-cli',
  version: '0.1.0',
  description: 'A CLI built with @trailhead/cli framework',
  commands: [helpCommand, versionCommand, greetCommand],
})

cli.run()
```

## Step 8: Test Your New Command

Run your new greet command:

```bash
# With npm
npm run dev -- greet --name World

# With pnpm
pnpm dev greet --name World
```

You should see:

```
Hello, World! 👋
```

## Step 9: Run Tests

The generated project includes a test setup. Run the tests:

```bash
# With npm
npm test

# With pnpm
pnpm test
```

## Step 10: Build for Production

When you're ready to distribute your CLI:

```bash
# With npm
npm run build

# With pnpm
pnpm build
```

This creates optimized JavaScript files in the `dist/` directory.

## What You've Learned

You've successfully:

1. ✅ Generated a CLI project with @trailhead/create-cli
2. ✅ Explored the project structure
3. ✅ Added a custom command
4. ✅ Tested your CLI locally
5. ✅ Built for production

## Next Steps

### Make It Executable Globally

To use your CLI from anywhere:

```bash
npm link
# or
pnpm link --global
```

Now you can run:

```bash
my-awesome-cli greet --name "Your Name"
```

### Add More Features

- Add configuration file support
- Create interactive prompts
- Add file operations
- Implement API calls

### Learn More

- [Template Options](../../explanation/templates.md)- Understand the different templates
- [Customize Templates](../../how-to/customize-templates.md)- Modify templates for your team
- [API Reference](../../../cli/reference/core.md)- Use the generator programmatically

## Troubleshooting

### Command Not Found

If you get "command not found" after linking:

1. Check your PATH includes npm/pnpm global bin directory
2. Try using the full path: `npx my-awesome-cli`

### TypeScript Errors

If you see TypeScript errors:

1. Ensure all dependencies are installed
2. Run `npm run types` or `pnpm types` to check for type issues

### Need Help?

- Check the [GitHub Issues](https://github.com/esteban-url/trailhead/issues)
- Read the [@trailhead/cli documentation](../../../cli/)
- Ask in [GitHub Discussions](https://github.com/esteban-url/trailhead/discussions)
