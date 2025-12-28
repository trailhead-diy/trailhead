---
type: tutorial
title: 'Build a Complete CLI Application'
description: 'Create a feature-rich task management CLI with commands, configuration, and testing'
prerequisites:
  - 'Completed getting-started tutorial'
  - 'Understanding of Result types'
  - 'Basic file system knowledge'
related:
  - /packages/cli/docs/tutorials/getting-started.md
  - /packages/cli/docs/reference/command.md
  - /packages/cli/docs/how-to/test-cli-applications.md
---

# Build a Complete CLI Application

In this tutorial, you'll build a complete task management CLI application that demonstrates real-world patterns and best practices.

## What You'll Build

A task management CLI called `taskly` with these features:

- Add, list, and complete tasks
- Persistent storage in JSON
- Configuration management
- Interactive prompts
- Comprehensive error handling
- Full test coverage

## Project Setup

### Step 1: Initialize Project

```bash
mkdir taskly && cd taskly
npm init -y
npm install @trailhead/cli zod
npm install -D typescript tsx @types/node vitest
```

### Step 2: Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 3: Create Project Structure

```bash
mkdir -p src/{commands,lib,config}
touch src/index.ts
```

## Define Data Models

Create `src/lib/types.ts`:

```typescript
export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  createdAt: string
  completedAt?: string
  tags?: string[]
}

export interface TaskStore {
  tasks: Task[]
  lastId: number
}

export interface Config {
  dataPath: string
  defaultTags: string[]
  showCompleted: boolean
}
```

## Create Task Storage

Create `src/lib/storage.ts`:

```typescript
import { ok, err, Result } from '@trailhead/core'
import { fs } from '@trailhead/fs'
import type { Task, TaskStore } from './types'

export class TaskStorage {
  constructor(private dataPath: string) {}

  async load(): Promise<Result<TaskStore>> {
    const exists = await fs.exists(this.dataPath)
    if (!exists) {
      // Initialize empty store
      const emptyStore: TaskStore = { tasks: [], lastId: 0 }
      return ok(emptyStore)
    }

    const result = await fs.readJSON<TaskStore>(this.dataPath)
    if (result.isErr()) {
      return err(new Error(`Failed to load tasks: ${result.error.message}`))
    }

    return ok(result.value)
  }

  async save(store: TaskStore): Promise<Result<void>> {
    const result = await fs.writeJSON(this.dataPath, store, { pretty: true })
    if (result.isErr()) {
      return err(new Error(`Failed to save tasks: ${result.error.message}`))
    }

    return ok(undefined)
  }

  async addTask(task: Omit<Task, 'id'>): Promise<Result<Task>> {
    const storeResult = await this.load()
    if (storeResult.isErr()) {
      return storeResult
    }

    const store = storeResult.value
    const newTask: Task = {
      ...task,
      id: String(++store.lastId),
    }

    store.tasks.push(newTask)

    const saveResult = await this.save(store)
    if (saveResult.isErr()) {
      return saveResult
    }

    return ok(newTask)
  }

  async getTasks(includeCompleted = true): Promise<Result<Task[]>> {
    const storeResult = await this.load()
    if (storeResult.isErr()) {
      return storeResult
    }

    const tasks = storeResult.value.tasks
    if (includeCompleted) {
      return ok(tasks)
    }

    return ok(tasks.filter((t) => !t.completed))
  }

  async completeTask(id: string): Promise<Result<Task>> {
    const storeResult = await this.load()
    if (storeResult.isErr()) {
      return storeResult
    }

    const store = storeResult.value
    const task = store.tasks.find((t) => t.id === id)

    if (!task) {
      return err(new Error(`Task not found: ${id}`))
    }

    if (task.completed) {
      return err(new Error(`Task already completed: ${id}`))
    }

    task.completed = true
    task.completedAt = new Date().toISOString()

    const saveResult = await this.save(store)
    if (saveResult.isErr()) {
      return saveResult
    }

    return ok(task)
  }
}
```

## Create Configuration

Create `src/config/schema.ts`:

```typescript
import { z } from 'zod'
import type { Config } from '../lib/types'

const configSchema = z.object({
  dataPath: z.string().default('./tasks.json'),
  defaultTags: z.array(z.string()).default([]),
  showCompleted: z.boolean().default(true),
})

export type AppConfig = z.infer<typeof configSchema>

export const loadConfig = (data: unknown): AppConfig => configSchema.parse(data)
```

## Create Commands

### Add Command

Create `src/commands/add.ts`:

```typescript
import { ok, err } from '@trailhead/core'
import { createCommand } from '@trailhead/cli/command'
import { prompt, select } from '@trailhead/cli/prompts'
import { TaskStorage } from '../lib/storage'
import { config } from '../config/schema'

export const addCommand = createCommand({
  name: 'add',
  description: 'Add a new task',
  options: [
    {
      name: 'title',
      alias: 't',
      type: 'string',
      description: 'Task title',
    },
    {
      name: 'description',
      alias: 'd',
      type: 'string',
      description: 'Task description',
    },
    {
      name: 'tags',
      type: 'string',
      description: 'Comma-separated tags',
    },
  ],
  action: async (options, context) => {
    // Load configuration
    const configResult = await config.load()
    if (configResult.isErr()) {
      context.logger.error('Failed to load config')
      return configResult
    }

    const cfg = configResult.value
    const storage = new TaskStorage(cfg.dataPath)

    // Get task details interactively if not provided
    let title = options.title
    if (!title) {
      title = await prompt({
        message: 'Task title:',
        validate: (input) => input.length > 0 || 'Title is required',
      })
    }

    let description = options.description
    if (!description) {
      const wantsDescription = await select({
        message: 'Add description?',
        choices: ['Yes', 'No'],
      })

      if (wantsDescription === 'Yes') {
        description = await prompt({
          message: 'Description:',
        })
      }
    }

    // Parse tags
    const tags = options.tags ? options.tags.split(',').map((t) => t.trim()) : cfg.defaultTags

    // Create task
    const result = await storage.addTask({
      title,
      description,
      completed: false,
      createdAt: new Date().toISOString(),
      tags,
    })

    if (result.isErr()) {
      context.logger.error(`Failed to add task: ${result.error.message}`)
      return result
    }

    context.logger.info(`✓ Added task: ${result.value.title} (ID: ${result.value.id})`)
    return ok(undefined)
  },
})
```

### List Command

Create `src/commands/list.ts`:

```typescript
import { ok } from '@trailhead/core'
import { createCommand } from '@trailhead/cli/command'
import { displaySummary } from '@trailhead/cli/command'
import { TaskStorage } from '../lib/storage'
import { config } from '../config/schema'
import { colors } from '@trailhead/cli/utils'

export const listCommand = createCommand({
  name: 'list',
  description: 'List all tasks',
  options: [
    {
      name: 'all',
      alias: 'a',
      type: 'boolean',
      description: 'Show completed tasks',
      default: false,
    },
    {
      name: 'tag',
      type: 'string',
      description: 'Filter by tag',
    },
  ],
  action: async (options, context) => {
    const configResult = await config.load()
    if (configResult.isErr()) {
      context.logger.error('Failed to load config')
      return configResult
    }

    const cfg = configResult.value
    const storage = new TaskStorage(cfg.dataPath)

    const tasksResult = await storage.getTasks(options.all || cfg.showCompleted)
    if (!tasksResult.success) {
      context.logger.error('Failed to load tasks')
      return tasksResult
    }

    let tasks = tasksResult.value

    // Filter by tag if specified
    if (options.tag) {
      tasks = tasks.filter((t) => t.tags?.includes(options.tag))
    }

    if (tasks.length === 0) {
      context.logger.info('No tasks found')
      return ok(undefined)
    }

    // Group by status
    const pending = tasks.filter((t) => !t.completed)
    const completed = tasks.filter((t) => t.completed)

    // Display pending tasks
    if (pending.length > 0) {
      context.logger.info(colors.bold('\n📋 Pending Tasks:\n'))
      pending.forEach((task) => {
        const tags = task.tags?.length ? colors.dim(` [${task.tags.join(', ')}]`) : ''
        context.logger.info(`  ${colors.yellow('○')} [${task.id}] ${task.title}${tags}`)
        if (task.description) {
          context.logger.info(`    ${colors.dim(task.description)}`)
        }
      })
    }

    // Display completed tasks
    if (completed.length > 0 && (options.all || cfg.showCompleted)) {
      context.logger.info(colors.bold('\n✅ Completed Tasks:\n'))
      completed.forEach((task) => {
        const tags = task.tags?.length ? colors.dim(` [${task.tags.join(', ')}]`) : ''
        context.logger.info(
          `  ${colors.green('✓')} [${task.id}] ${colors.strikethrough(task.title)}${tags}`
        )
      })
    }

    // Summary
    displaySummary(
      'Task Summary',
      [
        { label: 'Total', value: tasks.length },
        { label: 'Pending', value: pending.length },
        { label: 'Completed', value: completed.length },
      ],
      context
    )

    return ok(undefined)
  },
})
```

### Complete Command

Create `src/commands/complete.ts`:

```typescript
import { ok, err } from '@trailhead/core'
import { createCommand } from '@trailhead/cli/command'
import { select } from '@trailhead/cli/prompts'
import { TaskStorage } from '../lib/storage'
import { config } from '../config/schema'

export const completeCommand = createCommand({
  name: 'complete',
  description: 'Mark a task as completed',
  options: [
    {
      name: 'id',
      type: 'string',
      description: 'Task ID to complete',
    },
  ],
  action: async (options, context) => {
    const configResult = await config.load()
    if (configResult.isErr()) {
      context.logger.error('Failed to load config')
      return configResult
    }

    const cfg = configResult.value
    const storage = new TaskStorage(cfg.dataPath)

    let taskId = options.id

    // If no ID provided, show interactive list
    if (!taskId) {
      const tasksResult = await storage.getTasks(false)
      if (!tasksResult.success) {
        return tasksResult
      }

      const pendingTasks = tasksResult.value
      if (pendingTasks.length === 0) {
        context.logger.info('No pending tasks')
        return ok(undefined)
      }

      const choices = pendingTasks.map((t) => ({
        name: `[${t.id}] ${t.title}`,
        value: t.id,
      }))

      taskId = await select({
        message: 'Select task to complete:',
        choices,
      })
    }

    const result = await storage.completeTask(taskId)
    if (result.isErr()) {
      context.logger.error(result.error.message)
      return result
    }

    context.logger.info(`✓ Completed: ${result.value.title}`)
    return ok(undefined)
  },
})
```

### Config Command

Create `src/commands/config.ts`:

```typescript
import { ok } from '@trailhead/core'
import { createCommand } from '@trailhead/cli/command'
import { prompt, select } from '@trailhead/cli/prompts'
import { config } from '../config/schema'

export const configCommand = createCommand({
  name: 'config',
  description: 'Manage taskly configuration',
  options: [
    {
      name: 'init',
      type: 'boolean',
      description: 'Initialize configuration',
    },
  ],
  action: async (options, context) => {
    if (options.init) {
      const dataPath = await prompt({
        message: 'Data file path:',
        default: './tasks.json',
      })

      const showCompleted =
        (await select({
          message: 'Show completed tasks by default?',
          choices: ['Yes', 'No'],
        })) === 'Yes'

      const defaultTags = await prompt({
        message: 'Default tags (comma-separated):',
        default: '',
      })

      const newConfig = {
        dataPath,
        showCompleted,
        defaultTags: defaultTags ? defaultTags.split(',').map((t) => t.trim()) : [],
      }

      const result = await config.save(newConfig)
      if (result.isErr()) {
        context.logger.error('Failed to save config')
        return result
      }

      context.logger.info('Configuration saved!')
      return ok(undefined)
    }

    // Show current config
    const result = await config.load()
    if (result.isErr()) {
      context.logger.info('No configuration found. Run with --init to create one.')
      return ok(undefined)
    }

    context.logger.info('Current configuration:')
    context.logger.info(JSON.stringify(result.value, null, 2))
    return ok(undefined)
  },
})
```

## Create CLI Entry Point

Create `src/index.ts`:

```typescript
#!/usr/bin/env node
import { createCLI } from '@trailhead/cli'
import { addCommand } from './commands/add'
import { listCommand } from './commands/list'
import { completeCommand } from './commands/complete'
import { configCommand } from './commands/config'

const cli = createCLI({
  name: 'taskly',
  version: '1.0.0',
  description: 'Simple task management from the command line',
  commands: [addCommand, listCommand, completeCommand, configCommand],
})

cli.run(process.argv)
```

Update `package.json`:

```json
{
  "name": "taskly",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "taskly": "./dist/index.js"
  },
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "test": "vitest"
  }
}
```

## Add Tests

Create `src/lib/storage.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { TaskStorage } from './storage'
import { mockFileSystem } from '@trailhead/cli/testing'

describe('TaskStorage', () => {
  let storage: TaskStorage
  let fs: ReturnType<typeof mockFileSystem>

  beforeEach(() => {
    fs = mockFileSystem()
    storage = new TaskStorage('/tasks.json')
  })

  it('initializes empty store', async () => {
    const result = await storage.load()

    expect(result.success).toBe(true)
    expect(result.value).toEqual({
      tasks: [],
      lastId: 0,
    })
  })

  it('adds tasks with incrementing IDs', async () => {
    const task1 = await storage.addTask({
      title: 'First task',
      completed: false,
      createdAt: new Date().toISOString(),
    })

    expect(task1.success).toBe(true)
    expect(task1.value.id).toBe('1')

    const task2 = await storage.addTask({
      title: 'Second task',
      completed: false,
      createdAt: new Date().toISOString(),
    })

    expect(task2.success).toBe(true)
    expect(task2.value.id).toBe('2')
  })

  it('filters completed tasks', async () => {
    await storage.addTask({
      title: 'Pending task',
      completed: false,
      createdAt: new Date().toISOString(),
    })

    await storage.addTask({
      title: 'Completed task',
      completed: true,
      createdAt: new Date().toISOString(),
    })

    const allTasks = await storage.getTasks(true)
    expect(allTasks.value).toHaveLength(2)

    const pendingOnly = await storage.getTasks(false)
    expect(pendingOnly.value).toHaveLength(1)
    expect(pendingOnly.value[0].title).toBe('Pending task')
  })

  it('completes tasks', async () => {
    const addResult = await storage.addTask({
      title: 'Test task',
      completed: false,
      createdAt: new Date().toISOString(),
    })

    const taskId = addResult.value.id
    const completeResult = await storage.completeTask(taskId)

    expect(completeResult.success).toBe(true)
    expect(completeResult.value.completed).toBe(true)
    expect(completeResult.value.completedAt).toBeDefined()
  })

  it('prevents completing already completed tasks', async () => {
    const addResult = await storage.addTask({
      title: 'Test task',
      completed: true,
      createdAt: new Date().toISOString(),
    })

    const result = await storage.completeTask(addResult.value.id)

    expect(result.success).toBe(false)
    expect(result.error.message).toContain('already completed')
  })
})
```

Create `src/commands/add.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { addCommand } from './add'
import { createTestContext, mockFileSystem, mockPrompts } from '@trailhead/cli/testing'

describe('add command', () => {
  it('adds task with provided options', async () => {
    const fs = mockFileSystem({
      '.tasklyrc.json': JSON.stringify({
        dataPath: './tasks.json',
        defaultTags: [],
        showCompleted: true,
      }),
    })

    const context = createTestContext({ fs })

    const result = await addCommand.execute(
      {
        title: 'Test task',
        description: 'Test description',
        tags: 'urgent,work',
      },
      context
    )

    expect(result.success).toBe(true)

    const tasks = await fs.readJSON('./tasks.json')
    expect(tasks.value.tasks).toHaveLength(1)
    expect(tasks.value.tasks[0]).toMatchObject({
      title: 'Test task',
      description: 'Test description',
      tags: ['urgent', 'work'],
    })
  })

  it('prompts for missing title', async () => {
    const fs = mockFileSystem({
      '.tasklyrc.json': JSON.stringify({
        dataPath: './tasks.json',
        defaultTags: ['personal'],
        showCompleted: true,
      }),
    })

    const prompts = mockPrompts({
      'Task title:': 'My new task',
      'Add description?': 'No',
    })

    const context = createTestContext({ fs, prompts })

    const result = await addCommand.execute({}, context)

    expect(result.success).toBe(true)
    expect(prompts.wasAsked('Task title:')).toBe(true)
  })
})
```

## Using the CLI

### Build and Link

```bash
npm run build
npm link
```

### Initialize Configuration

```bash
taskly config --init
```

### Add Tasks

```bash
# With options
taskly add -t "Write documentation" -d "Update README and API docs" --tags work,docs

# Interactive
taskly add
```

### List Tasks

```bash
# Show pending tasks only
taskly list

# Show all tasks including completed
taskly list --all

# Filter by tag
taskly list --tag work
```

### Complete Tasks

```bash
# By ID
taskly complete --id 1

# Interactive selection
taskly complete
```

## Advanced Features

### Add Phased Execution

Enhance commands with phased execution for better progress tracking:

````typescript
import { executeWithPhases } from '@trailhead/cli/command'
import type { CommandPhase } from '@trailhead/cli/command'

action: async (options, context) => {
  const phases: CommandPhase<TaskContext>[] = [
    {
      name: 'Load config',
      weight: 10,
      action: async (data) => {
        const config = await loadConfig()
        return ok({ ...data, config })
      },
    },
    {
      name: 'Validate input',
      weight: 20,
      action: async (data) => {
        const validated = await validateTaskInput(options)
        if (validated.isErr()) return validated
        return ok({ ...data, validated: validated.value })
      },
    },
    {
      name: 'Create task',
      weight: 70,
      action: async (data) => {
        const storage = new TaskStorage(data.config.dataPath)
        const result = await storage.addTask(data.validated)
        return result.isOk() ? ok(data) : result
      },
    },
  ]

  return executeWithPhases(phases, { options }, context)
}

### Add Export Command

Create an export command for backups:

```typescript
export const exportCommand = createCommand({
  name: 'export',
  description: 'Export tasks to different formats',
  options: [
    {
      name: 'format',
      alias: 'f',
      type: 'string',
      choices: ['json', 'csv', 'markdown'],
      default: 'json',
    },
    {
      name: 'output',
      alias: 'o',
      type: 'string',
      required: true,
    },
  ],
  action: async (options, context) => {
    const tasks = await loadTasks()

    const formatted = formatTasks(tasks, options.format)
    const writeResult = await fs.writeFile(options.output, formatted)

    if (!writeResult.success) {
      return writeResult
    }

    context.logger.info(`Exported ${tasks.length} tasks to ${options.output}`)
    return ok(undefined)
  },
})
````

## Summary

You've built a complete CLI application with:

- Multiple commands with options
- Persistent storage
- Configuration management
- Interactive prompts
- Error handling
- Test coverage
- Type safety throughout

Key patterns demonstrated:

- Result-based error handling
- Command composition
- File system abstraction
- Configuration schemas
- Testing strategies

## Next Steps

- Add more features (tags, due dates, priorities)
- Implement search and filtering
- Add import functionality
- Create bash completion scripts
- Package and publish to npm

## Further Learning

- Review [CLI API Documentation](/docs/@trailhead.cli.md) for command enhancements
- Explore [Pipeline Patterns](../../how-to/use-result-pipelines)
- Learn about [Testing Strategies](../../how-to/test-cli-applications)
