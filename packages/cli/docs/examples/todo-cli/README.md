# Todo CLI Example

A complete example of a todo management CLI built with @trailhead/cli, demonstrating all major features of the framework.

## Features

- ✅ Add, list, complete, and remove todos
- 📁 Persistent storage using JSON file
- 🎨 Beautiful terminal output with colors
- 🔍 Filter todos by status
- 📊 Statistics and progress tracking
- ⚡ Interactive mode for bulk operations
- 🧪 Comprehensive test suite

## Project Structure

```
todo-cli/
├── src/
│   ├── cli.ts              # Main CLI setup
│   ├── commands/           # Command implementations
│   │   ├── add.ts
│   │   ├── list.ts
│   │   ├── complete.ts
│   │   ├── remove.ts
│   │   └── stats.ts
│   ├── services/           # Business logic
│   │   └── todo-service.ts
│   ├── types/              # Type definitions
│   │   └── todo.ts
│   └── index.ts           # Entry point
├── tests/
│   ├── commands/          # Command tests
│   └── services/          # Service tests
├── package.json
└── tsconfig.json
```

## Installation

Since @trailhead/cli is a private package, install directly from GitHub:

```bash
# Clone/create your todo-cli project directory
mkdir todo-cli && cd todo-cli

# Initialize package.json
npm init -y

# Install @trailhead/cli from GitHub
npm install github:esteban-url/trailhead#packages/cli

# Install other dependencies
npm install @inquirer/prompts table

# Install dev dependencies
npm install -D typescript tsx @types/node

# Build the project
npm run build

# Run the CLI
npm start -- --help
```

> **Note**: You need access to the private repository. Ensure your Git/GitHub authentication is configured correctly.

## Usage

### Adding Todos

```bash
# Add a simple todo
todo add "Buy groceries"

# Add with priority
todo add "Finish report" --priority high

# Add with due date
todo add "Pay bills" --due "2024-01-15"

# Add with tags
todo add "Read book" --tags "personal,learning"
```

### Listing Todos

```bash
# List all todos
todo list

# List only pending todos
todo list --status pending

# List high priority todos
todo list --priority high

# List with specific tag
todo list --tag work
```

### Completing Todos

```bash
# Complete by ID
todo complete abc123

# Complete interactively
todo complete --interactive

# Complete all todos with tag
todo complete --tag "shopping"
```

### Statistics

```bash
# Show statistics
todo stats

# Show weekly progress
todo stats --period week

# Export stats as JSON
todo stats --format json
```

## Implementation Details

### Todo Type Definition

```typescript
// src/types/todo.ts
export interface Todo {
  id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  dueDate?: Date
  createdAt: Date
  completedAt?: Date
}
```

### Add Command Implementation

```typescript
// src/commands/add.ts
import { createCommand } from '@trailhead/cli/command'
import { ok } from '@trailhead/cli/core'
import { TodoService } from '../services/todo-service'

export const addCommand = createCommand({
  name: 'add',
  description: 'Add a new todo',
  options: [
    {
      name: 'priority',
      alias: 'p',
      type: 'string',
      default: 'medium',
      description: 'Priority level (low, medium, high)'
    },
    {
      name: 'tags',
      alias: 't',
      type: 'string',
      description: 'Comma-separated tags'
    },
    {
      name: 'due',
      alias: 'd',
      type: 'string',
      description: 'Due date (YYYY-MM-DD)'
    }
  ],
  action: async (options, context) => {
    const [title, ...args] = context.args
    
    if (!title) {
      return err(createError({
        code: 'MISSING_TITLE',
        message: 'Todo title is required',
        suggestion: 'Usage: todo add "Your todo title"'
      }))
    }

    const service = new TodoService(context.fs)
    
    const todo = {
      title,
      priority: options.priority as Todo['priority'],
      tags: options.tags ? options.tags.split(',').map(t => t.trim()) : [],
      dueDate: options.due ? new Date(options.due) : undefined
    }

    const result = await service.addTodo(todo)
    
    if (result.success) {
      context.logger.success(`✅ Added: "${result.value.title}" [${result.value.id}]`)
    }
    
    return result.success ? ok(undefined) : result
  }
})
```

### List Command with Formatting

```typescript
// src/commands/list.ts
import { createCommand } from '@trailhead/cli/command'
import { table } from 'table'

export const listCommand = createCommand({
  name: 'list',
  description: 'List todos',
  options: [
    {
      name: 'status',
      alias: 's',
      type: 'string',
      description: 'Filter by status (all, pending, completed)'
    },
    {
      name: 'priority',
      alias: 'p',
      type: 'string',
      description: 'Filter by priority'
    },
    {
      name: 'tag',
      type: 'string',
      description: 'Filter by tag'
    },
    {
      name: 'format',
      alias: 'f',
      type: 'string',
      default: 'table',
      description: 'Output format (table, json, simple)'
    }
  ],
  action: async (options, context) => {
    const service = new TodoService(context.fs)
    const result = await service.listTodos({
      status: options.status,
      priority: options.priority,
      tag: options.tag
    })

    if (!result.success) {
      return result
    }

    const todos = result.value

    if (todos.length === 0) {
      context.logger.info('No todos found')
      return ok(undefined)
    }

    switch (options.format) {
      case 'json':
        console.log(JSON.stringify(todos, null, 2))
        break
        
      case 'simple':
        todos.forEach(todo => {
          const status = todo.completed ? '✓' : '○'
          const priority = getPriorityIcon(todo.priority)
          context.logger.info(`${status} ${priority} ${todo.title}`)
        })
        break
        
      default: // table
        const data = [
          ['Status', 'Priority', 'Title', 'Tags', 'Due Date'],
          ...todos.map(todo => [
            todo.completed ? '✓' : '○',
            getPriorityIcon(todo.priority),
            todo.title,
            todo.tags.join(', '),
            todo.dueDate ? formatDate(todo.dueDate) : '-'
          ])
        ]
        
        console.log(table(data, {
          border: getBorderCharacters('norc')
        }))
    }

    return ok(undefined)
  }
})

function getPriorityIcon(priority: Todo['priority']): string {
  switch (priority) {
    case 'high': return '🔴'
    case 'medium': return '🟡'
    case 'low': return '🟢'
  }
}
```

### Todo Service with Persistence

```typescript
// src/services/todo-service.ts
import { FileSystem } from '@trailhead/cli/filesystem'
import { Result, ok, err } from '@trailhead/cli/core'
import { Todo } from '../types/todo'

export class TodoService {
  private readonly todoFile = '.todos.json'

  constructor(private fs: FileSystem) {}

  async addTodo(data: Partial<Todo>): Promise<Result<Todo>> {
    const todos = await this.loadTodos()
    
    const newTodo: Todo = {
      id: generateId(),
      title: data.title || '',
      completed: false,
      priority: data.priority || 'medium',
      tags: data.tags || [],
      dueDate: data.dueDate,
      createdAt: new Date(),
      completedAt: undefined
    }

    todos.push(newTodo)
    
    const saveResult = await this.saveTodos(todos)
    if (!saveResult.success) {
      return saveResult
    }

    return ok(newTodo)
  }

  async listTodos(filters?: {
    status?: string
    priority?: string
    tag?: string
  }): Promise<Result<Todo[]>> {
    const todos = await this.loadTodos()
    
    let filtered = todos

    if (filters?.status === 'pending') {
      filtered = filtered.filter(t => !t.completed)
    } else if (filters?.status === 'completed') {
      filtered = filtered.filter(t => t.completed)
    }

    if (filters?.priority) {
      filtered = filtered.filter(t => t.priority === filters.priority)
    }

    if (filters?.tag) {
      filtered = filtered.filter(t => t.tags.includes(filters.tag))
    }

    return ok(filtered)
  }

  async completeTodo(id: string): Promise<Result<Todo>> {
    const todos = await this.loadTodos()
    const todo = todos.find(t => t.id === id)
    
    if (!todo) {
      return err(createError({
        code: 'TODO_NOT_FOUND',
        message: `Todo with id ${id} not found`
      }))
    }

    if (todo.completed) {
      return err(createError({
        code: 'ALREADY_COMPLETED',
        message: 'Todo is already completed'
      }))
    }

    todo.completed = true
    todo.completedAt = new Date()

    const saveResult = await this.saveTodos(todos)
    if (!saveResult.success) {
      return saveResult
    }

    return ok(todo)
  }

  async getStats(): Promise<Result<TodoStats>> {
    const todos = await this.loadTodos()
    
    const stats: TodoStats = {
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      pending: todos.filter(t => !t.completed).length,
      byPriority: {
        high: todos.filter(t => t.priority === 'high').length,
        medium: todos.filter(t => t.priority === 'medium').length,
        low: todos.filter(t => t.priority === 'low').length
      },
      overdue: todos.filter(t => 
        !t.completed && 
        t.dueDate && 
        new Date(t.dueDate) < new Date()
      ).length,
      completionRate: todos.length > 0 
        ? (todos.filter(t => t.completed).length / todos.length) * 100
        : 0
    }

    return ok(stats)
  }

  private async loadTodos(): Promise<Todo[]> {
    const result = await this.fs.readJson<Todo[]>(this.todoFile)
    if (!result.success) {
      if (result.error.code === 'ENOENT') {
        return []
      }
      throw new Error(result.error.message)
    }
    return result.value
  }

  private async saveTodos(todos: Todo[]): Promise<Result<void>> {
    return this.fs.writeJson(this.todoFile, todos, { spaces: 2 })
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
```

### Interactive Complete Command

```typescript
// src/commands/complete.ts
import { createCommand } from '@trailhead/cli/command'
import { select, multiselect } from '@trailhead/cli/prompts'

export const completeCommand = createCommand({
  name: 'complete',
  description: 'Mark todos as completed',
  options: [
    {
      name: 'interactive',
      alias: 'i',
      type: 'boolean',
      description: 'Interactive mode'
    },
    {
      name: 'all',
      type: 'boolean',
      description: 'Complete all pending todos'
    },
    {
      name: 'tag',
      type: 'string',
      description: 'Complete all todos with specific tag'
    }
  ],
  action: async (options, context) => {
    const service = new TodoService(context.fs)
    const [todoId] = context.args

    // Interactive mode
    if (options.interactive) {
      const pendingResult = await service.listTodos({ status: 'pending' })
      if (!pendingResult.success) return pendingResult

      const pending = pendingResult.value
      if (pending.length === 0) {
        context.logger.info('No pending todos')
        return ok(undefined)
      }

      const selected = await multiselect({
        message: 'Select todos to complete:',
        choices: pending.map(todo => ({
          name: `${getPriorityIcon(todo.priority)} ${todo.title}`,
          value: todo.id
        }))
      })

      for (const id of selected) {
        const result = await service.completeTodo(id)
        if (result.success) {
          context.logger.success(`✓ Completed: ${result.value.title}`)
        }
      }

      return ok(undefined)
    }

    // Complete by tag
    if (options.tag) {
      const todosResult = await service.listTodos({ 
        status: 'pending',
        tag: options.tag 
      })
      if (!todosResult.success) return todosResult

      const todos = todosResult.value
      let completed = 0

      for (const todo of todos) {
        const result = await service.completeTodo(todo.id)
        if (result.success) {
          completed++
        }
      }

      context.logger.success(`Completed ${completed} todos with tag "${options.tag}"`)
      return ok(undefined)
    }

    // Complete specific todo
    if (!todoId) {
      return err(createError({
        code: 'MISSING_TODO_ID',
        message: 'Todo ID is required',
        suggestion: 'Use todo complete <id> or todo complete --interactive'
      }))
    }

    const result = await service.completeTodo(todoId)
    if (result.success) {
      context.logger.success(`✓ Completed: ${result.value.title}`)
    }

    return result.success ? ok(undefined) : result
  }
})
```

### Testing the Todo CLI

```typescript
// tests/commands/add.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestContext, createMemoryFileSystem } from '@trailhead/cli/testing'
import { addCommand } from '../../src/commands/add'

describe('Add Command', () => {
  let context: CommandContext
  let fs: FileSystem

  beforeEach(() => {
    fs = createMemoryFileSystem()
    context = createTestContext({ 
      filesystem: fs,
      args: ['Buy groceries'] 
    })
  })

  it('should add a new todo', async () => {
    const result = await addCommand.execute({}, context)

    expect(result.success).toBe(true)
    
    // Verify todo was saved
    const todos = await fs.readJson('.todos.json')
    expect(todos.value).toHaveLength(1)
    expect(todos.value[0].title).toBe('Buy groceries')
  })

  it('should add todo with priority', async () => {
    const result = await addCommand.execute(
      { priority: 'high' },
      context
    )

    expect(result.success).toBe(true)
    
    const todos = await fs.readJson('.todos.json')
    expect(todos.value[0].priority).toBe('high')
  })

  it('should add todo with tags', async () => {
    const result = await addCommand.execute(
      { tags: 'shopping,urgent' },
      context
    )

    expect(result.success).toBe(true)
    
    const todos = await fs.readJson('.todos.json')
    expect(todos.value[0].tags).toEqual(['shopping', 'urgent'])
  })

  it('should require title', async () => {
    context.args = [] // No title provided
    
    const result = await addCommand.execute({}, context)

    expect(result.success).toBe(false)
    expect(result.error.code).toBe('MISSING_TITLE')
  })
})
```

### Integration Test

```typescript
// tests/integration/todo-workflow.test.ts
describe('Todo Workflow', () => {
  it('should handle complete todo lifecycle', async () => {
    const fs = createMemoryFileSystem()
    const service = new TodoService(fs)

    // Add todos
    await service.addTodo({ 
      title: 'Task 1', 
      priority: 'high',
      tags: ['work'] 
    })
    await service.addTodo({ 
      title: 'Task 2', 
      priority: 'low',
      tags: ['personal'] 
    })

    // List pending todos
    const pendingResult = await service.listTodos({ status: 'pending' })
    expect(pendingResult.value).toHaveLength(2)

    // Complete one todo
    const todos = pendingResult.value
    await service.completeTodo(todos[0].id)

    // Check stats
    const statsResult = await service.getStats()
    expect(statsResult.value.completed).toBe(1)
    expect(statsResult.value.pending).toBe(1)
    expect(statsResult.value.completionRate).toBe(50)

    // Filter by tag
    const workTodos = await service.listTodos({ tag: 'work' })
    expect(workTodos.value).toHaveLength(1)
  })
})
```

## Running the Example

```bash
# Development
npm run dev -- add "My first todo"
npm run dev -- list
npm run dev -- complete --interactive
npm run dev -- stats

# Production
npm run build
npm start -- add "Production todo" --priority high
npm start -- list --format json
```

## Key Takeaways

This example demonstrates:

1. **Command Structure** - Organizing commands in separate files
2. **Service Layer** - Separating business logic from commands
3. **File Persistence** - Using FileSystem abstraction for storage
4. **Interactive Mode** - Using prompts for user interaction
5. **Filtering & Formatting** - Flexible output options
6. **Error Handling** - Consistent error messages with suggestions
7. **Testing** - Unit and integration tests with memory filesystem
8. **Type Safety** - Full TypeScript support throughout

## Next Steps

- Add todo editing functionality
- Implement recurring todos
- Add export/import features
- Create a web UI companion
- Add cloud sync capabilities