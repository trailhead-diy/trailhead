#!/usr/bin/env node

import { createCLI } from '@esteban-url/trailhead-cli';
import { createCommand } from '@esteban-url/trailhead-cli/command';
import { FileSystem } from '@esteban-url/trailhead-cli/filesystem';
import { Ok, Err } from '@esteban-url/trailhead-cli';
import { join } from 'path';
import { homedir } from 'os';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
}

const TODO_FILE = join(homedir(), '.todos.json');

async function loadTodos(fs: FileSystem): Promise<Todo[]> {
  const result = await fs.readFile(TODO_FILE);
  if (!result.success) return [];

  try {
    return JSON.parse(result.value);
  } catch {
    return [];
  }
}

async function saveTodos(fs: FileSystem, todos: Todo[]): Promise<void> {
  await fs.writeFile(TODO_FILE, JSON.stringify(todos, null, 2));
}

const addCommand = createCommand({
  name: 'add',
  description: 'Add a new todo item',
  action: async (options, context) => {
    const [text] = context.args;
    if (!text) {
      return Err(new Error('Todo text required. Usage: todo add <text>'));
    }

    const fs = new FileSystem();
    const todos = await loadTodos(fs);

    const newTodo: Todo = {
      id: Math.max(0, ...todos.map((t) => t.id)) + 1,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    todos.push(newTodo);
    await saveTodos(fs, todos);

    context.logger.success(`Added todo: ${text}`);
    return Ok(undefined);
  },
});

const listCommand = createCommand({
  name: 'list',
  description: 'List all todos',
  action: async (options, context) => {
    const fs = new FileSystem();
    const todos = await loadTodos(fs);

    if (todos.length === 0) {
      console.log('No todos found.');
      return Ok(undefined);
    }

    console.log('\nTodos:');
    todos.forEach((todo) => {
      const status = todo.completed ? '✓' : '○';
      console.log(`  ${status} ${todo.id}: ${todo.text}`);
    });

    return Ok(undefined);
  },
});

const cli = createCLI({
  name: 'todo',
  version: '1.0.0',
  description: 'A simple todo CLI application',
  commands: [addCommand, listCommand],
});

cli.run(process.argv);
