# Getting Started with @trailhead/cli

This guide will help you create your first CLI application using @trailhead/cli in just a few minutes.

## Prerequisites

- Node.js 18.0.0 or higher
- TypeScript 5.0 or higher
- Basic understanding of TypeScript and async/await

## Installation

### For Monorepo Development

Since @trailhead/cli is part of the Trailhead monorepo, install it as a workspace dependency:

```bash
# From within the Trailhead monorepo
pnpm add @trailhead/cli --workspace

# Or in your package.json
{
  "dependencies": {
    "@trailhead/cli": "workspace:*"
  }
}
```

### For External Projects

Since this package is private and not published to NPM, install directly from the GitHub repository:

```bash
# Using pnpm
pnpm add github:esteban-url/trailhead#packages/cli

# Using npm
npm install github:esteban-url/trailhead#packages/cli

# Using yarn
yarn add github:esteban-url/trailhead#packages/cli
```

Or add to your `package.json`:

```json
{
  "dependencies": {
    "@trailhead/cli": "github:esteban-url/trailhead#packages/cli"
  }
}
```

> **Important**: You need access to the private repository. Ensure your Git/GitHub authentication is configured correctly.

## Your First CLI Application

Let's build a simple CLI tool that greets users and manages a todo list.

### 1. Create the Main CLI File

Create `src/cli.ts`:

```typescript
import { createCLI } from '@trailhead/cli'

// Create the CLI instance
export const cli = createCLI({
  name: 'my-todo',
  version: '1.0.0',
  description: 'A simple todo management CLI'
})
```

### 2. Create Your First Command

Create `src/commands/greet.ts`:

```typescript
import { createCommand } from '@trailhead/cli/command'
import { ok } from '@trailhead/cli/core'

export const greetCommand = createCommand({
  name: 'greet',
  description: 'Greet a user',
  options: [
    {
      name: 'name',
      alias: 'n',
      type: 'string',
      description: 'Name to greet',
      required: true
    },
    {
      name: 'enthusiastic',
      alias: 'e',
      type: 'boolean',
      description: 'Show enthusiasm',
      default: false
    }
  ],
  action: async (options, context) => {
    const greeting = `Hello, ${options.name}${options.enthusiastic ? '!!!' : '!'}`
    context.logger.success(greeting)
    return ok(undefined)
  }
})
```

### 3. Add File-Based Todo Management

Create `src/commands/todo.ts`:

```typescript
import { createCommand } from '@trailhead/cli/command'
import { ok, err } from '@trailhead/cli/core'
import { prompt, select } from '@trailhead/cli/prompts'
import type { CommandContext } from '@trailhead/cli/command'

interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: Date
}

interface TodoStore {
  todos: Todo[]
}

// Helper functions
async function loadTodos(context: CommandContext): Promise<Result<TodoStore>> {
  const result = await context.fs.readJson<TodoStore>('.todos.json')
  if (!result.success) {
    // If file doesn't exist, return empty store
    return ok({ todos: [] })
  }
  return result
}

async function saveTodos(store: TodoStore, context: CommandContext): Promise<Result<void>> {
  return context.fs.writeJson('.todos.json', store, { spaces: 2 })
}

// List command
export const listCommand = createCommand({
  name: 'list',
  description: 'List all todos',
  action: async (_, context) => {
    const result = await loadTodos(context)
    if (!result.success) {
      return result
    }

    const { todos } = result.value
    if (todos.length === 0) {
      context.logger.info('No todos found. Create one with "todo add"')
      return ok(undefined)
    }

    context.logger.info('Your todos:')
    todos.forEach((todo, index) => {
      const status = todo.completed ? '✓' : '○'
      const style = todo.completed ? context.logger.chalk.dim : context.logger.chalk.white
      context.logger.info(style(`  ${status} ${index + 1}. ${todo.title}`))
    })

    return ok(undefined)
  }
})

// Add command
export const addCommand = createCommand({
  name: 'add',
  description: 'Add a new todo',
  options: [
    {
      name: 'title',
      alias: 't',
      type: 'string',
      description: 'Todo title'
    }
  ],
  action: async (options, context) => {
    // Get title interactively if not provided
    const title = options.title || await prompt({
      message: 'What do you need to do?',
      validate: (value) => value.length > 0 || 'Please enter a todo title'
    })

    // Load existing todos
    const loadResult = await loadTodos(context)
    if (!loadResult.success) {
      return loadResult
    }

    // Add new todo
    const store = loadResult.value
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date()
    }
    store.todos.push(newTodo)

    // Save todos
    const saveResult = await saveTodos(store, context)
    if (!saveResult.success) {
      return saveResult
    }

    context.logger.success(`Added: "${title}"`)
    return ok(undefined)
  }
})

// Complete command
export const completeCommand = createCommand({
  name: 'complete',
  description: 'Mark a todo as completed',
  action: async (_, context) => {
    // Load todos
    const loadResult = await loadTodos(context)
    if (!loadResult.success) {
      return loadResult
    }

    const store = loadResult.value
    const incompleteTodos = store.todos.filter(t => !t.completed)
    
    if (incompleteTodos.length === 0) {
      context.logger.info('No incomplete todos!')
      return ok(undefined)
    }

    // Let user select a todo
    const selected = await select({
      message: 'Which todo did you complete?',
      choices: incompleteTodos.map(todo => ({
        name: todo.title,
        value: todo.id
      }))
    })

    // Mark as completed
    const todo = store.todos.find(t => t.id === selected)
    if (!todo) {
      return err(new Error('Todo not found'))
    }
    todo.completed = true

    // Save
    const saveResult = await saveTodos(store, context)
    if (!saveResult.success) {
      return saveResult
    }

    context.logger.success(`Completed: "${todo.title}"`)
    return ok(undefined)
  }
})

// Create parent todo command
export const todoCommand = createCommand({
  name: 'todo',
  description: 'Manage todos',
  subcommands: [listCommand, addCommand, completeCommand]
})
```

### 4. Wire Everything Together

Update `src/cli.ts`:

```typescript
import { createCLI } from '@trailhead/cli'
import { greetCommand } from './commands/greet'
import { todoCommand } from './commands/todo'

const cli = createCLI({
  name: 'my-todo',
  version: '1.0.0',
  description: 'A simple todo management CLI'
})

// Add commands
cli
  .addCommand(greetCommand)
  .addCommand(todoCommand)

// Export for bin script
export { cli }
```

### 5. Create the Executable

Create `src/index.ts`:

```typescript
#!/usr/bin/env node
import { cli } from './cli'

// Run the CLI
cli.run(process.argv)
```

### 6. Configure package.json

Add to your `package.json`:

```json
{
  "name": "my-todo-cli",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "my-todo": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@trailhead/cli": "github:esteban-url/trailhead#packages/cli"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### 7. TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Running Your CLI

### Development Mode

```bash
# Using tsx for development
npm run dev -- greet -n "World"
npm run dev -- todo add -t "Learn @trailhead/cli"
npm run dev -- todo list
npm run dev -- todo complete
```

### Production Mode

```bash
# Build the project
npm run build

# Run the compiled version
npm start -- greet -n "World" -e

# Or if installed globally
my-todo greet -n "World"
my-todo todo add
my-todo todo list
```

## Key Concepts Demonstrated

1. **Result Pattern**: All operations return `Result<T>` for explicit error handling
2. **Dependency Injection**: FileSystem and Logger are injected via context
3. **Interactive Prompts**: Using the prompts module for user interaction
4. **Subcommands**: Organizing related commands under a parent
5. **Type Safety**: Full TypeScript support throughout

## Next Steps

Now that you have a working CLI application, explore these topics:

1. **[Error Handling Guide](./guides/error-handling.md)** - Deep dive into the Result pattern
2. **[Testing Your CLI](./guides/testing-cli-apps.md)** - Write tests for your commands
3. **[Configuration Management](./api/config.md)** - Add configuration file support
4. **[Advanced Commands](./api/command.md)** - Phased execution, dry-run mode
5. **[Custom Validation](./api/validation.md)** - Build validation pipelines

## Common Patterns

### Error Propagation
```typescript
const configResult = await loadConfig(context)
if (!configResult.success) {
  return configResult // Propagate the error
}

const dataResult = await processData(configResult.value)
if (!dataResult.success) {
  return dataResult
}

return ok(dataResult.value)
```

### Validation Pipeline
```typescript
import { createValidationPipeline, createRule } from '@trailhead/cli/core'

const validateEmail = createValidationPipeline([
  createRule('required', (value: string) => 
    value.length > 0 || 'Email is required'
  ),
  createRule('format', (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email format'
  )
])

// In your command
const result = validateEmail(options.email)
if (!result.success) {
  context.logger.error(result.error.message)
  return err(result.error)
}
```

### Progress Tracking
```typescript
import { createSpinner } from '@trailhead/cli/utils'

const spinner = createSpinner('Processing files...')
spinner.start()

try {
  const result = await processFiles()
  if (result.success) {
    spinner.succeed('Files processed successfully')
  } else {
    spinner.fail(`Failed: ${result.error.message}`)
  }
} catch (error) {
  spinner.fail('Unexpected error occurred')
}
```

## Troubleshooting

### Common Issues

**Issue**: Command not found
```bash
# Make sure to build first
npm run build

# Check bin configuration in package.json
```

**Issue**: Module not found errors
```bash
# Ensure all dependencies are installed
pnpm install

# Check TypeScript module resolution
```

**Issue**: Async operations not completing
```typescript
// Always await async operations
const result = await someAsyncOperation() // ✓
const result = someAsyncOperation() // ✗ Missing await
```

## Summary

You've now created a functional CLI application with:
- Command parsing and execution
- Interactive prompts
- File system operations
- Error handling
- Beautiful terminal output

Continue exploring the framework's features to build more sophisticated CLI tools!