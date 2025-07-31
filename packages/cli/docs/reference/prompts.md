---
type: reference
title: 'Prompts Module API Reference'
description: 'Interactive user input functionality with inquirer prompts integration'
related:
  - ./core.md
  - /packages/cli/tutorials/getting-started
---

# Prompts Module API Reference

Interactive user input functionality through a re-export of [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js/tree/master/packages/prompts).

## Overview

| Property    | Value                      |
| ----------- | -------------------------- |
| **Package** | `@esteban-url/cli`         |
| **Module**  | `@esteban-url/cli/prompts` |
| **Since**   | `v1.0.0`                   |

## Import

```typescript
import { prompt, select, confirm, multiselect } from '@esteban-url/cli/prompts'
```

## Basic Usage

```typescript
import { prompt, select, confirm, multiselect } from '@esteban-url/cli/prompts'
```

## Prompt Functions

### `prompt` (Text Input)

Get text input from the user.

```typescript
const name = await prompt({
  message: 'What is your name?',
  default: 'Anonymous',
  validate: (input) => input.length > 0 || 'Name is required',
})

// With transformation
const email = await prompt({
  message: 'Enter your email:',
  validate: (input) => {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
    return valid || 'Please enter a valid email'
  },
  transformer: (input) => input.toLowerCase(),
})
```

### `select` (Single Choice)

Choose one option from a list.

```typescript
const color = await select({
  message: 'Pick a color',
  choices: [
    { name: 'Red', value: '#ff0000' },
    { name: 'Green', value: '#00ff00' },
    { name: 'Blue', value: '#0000ff' },
  ],
})

// With descriptions
const framework = await select({
  message: 'Choose a framework',
  choices: [
    {
      name: 'React',
      value: 'react',
      description: 'A JavaScript library for building user interfaces',
    },
    {
      name: 'Vue',
      value: 'vue',
      description: 'The Progressive JavaScript Framework',
    },
    {
      name: 'Angular',
      value: 'angular',
      description: 'Platform for building mobile and desktop apps',
    },
  ],
})
```

### `confirm` (Yes/No)

Get a boolean confirmation.

```typescript
const proceed = await confirm({
  message: 'Do you want to continue?',
  default: true,
})

if (!proceed) {
  console.log('Operation cancelled')
  process.exit(0)
}
```

### `multiselect` (Multiple Choice)

Choose multiple options from a list.

```typescript
const features = await multiselect({
  message: 'Select features to include:',
  choices: [
    { name: 'TypeScript', value: 'typescript', checked: true },
    { name: 'ESLint', value: 'eslint', checked: true },
    { name: 'Prettier', value: 'prettier', checked: true },
    { name: 'Testing', value: 'testing' },
    { name: 'CI/CD', value: 'cicd' },
  ],
  required: true,
})

// Result: ['typescript', 'eslint', 'prettier']
```

### `password` (Hidden Input)

Get sensitive input with masking.

```typescript
import { password } from '@esteban-url/trailhead-cli/prompts'

const secret = await password({
  message: 'Enter your password:',
  mask: '*',
  validate: (input) => input.length >= 8 || 'Password must be at least 8 characters',
})
```

### `number` (Numeric Input)

Get numeric input with validation.

```typescript
import { number } from '@esteban-url/trailhead-cli/prompts'

const port = await number({
  message: 'Enter port number:',
  default: 3000,
  min: 1,
  max: 65535,
  validate: (value) => {
    if (value < 1024 && value !== 80 && value !== 443) {
      return 'Ports below 1024 require admin privileges'
    }
    return true
  },
})
```

### `editor` (Text Editor)

Open the user's default text editor.

```typescript
import { editor } from '@esteban-url/trailhead-cli/prompts'

const content = await editor({
  message: 'Edit the configuration:',
  default: '# Enter your configuration here\n',
  postfix: '.yaml', // File extension for syntax highlighting
  waitForUseInput: true,
})
```

## Common Options

### Shared Options

Most prompt types accept these common options:

```typescript
interface CommonOptions {
  message: string // The question to ask
  default?: any // Default value
  theme?: Theme // Custom theme
}
```

### Validation

All prompts support validation:

```typescript
const result = await prompt({
  message: 'Enter project name:',
  validate: (input) => {
    // Return true if valid
    if (/^[a-z0-9-]+$/.test(input)) {
      return true
    }
    // Return error message if invalid
    return 'Project name must be lowercase with hyphens only'
  },
})
```

## Advanced Usage

### Custom Choices

```typescript
interface Choice<T> {
  name: string // Display name
  value: T // Returned value
  description?: string // Optional description
  disabled?: boolean | string // Disable with optional reason
  type?: 'separator' // Visual separator
}

const option = await select({
  message: 'Select an option:',
  choices: [
    { type: 'separator', name: '--- Basic Options ---' },
    { name: 'Option 1', value: 1 },
    { name: 'Option 2', value: 2 },
    { type: 'separator', name: '--- Advanced Options ---' },
    { name: 'Option 3', value: 3, description: 'Recommended' },
    { name: 'Option 4', value: 4, disabled: 'Coming soon' },
  ],
})
```

### Conditional Prompts

```typescript
const type = await select({
  message: 'Project type:',
  choices: ['library', 'application'],
})

let entryPoint = 'src/index.ts'
if (type === 'library') {
  entryPoint = await prompt({
    message: 'Entry point:',
    default: 'src/index.ts',
  })
}
```

### Dynamic Choices

```typescript
import { createFileSystem } from '@esteban-url/trailhead-cli/filesystem'

const fs = createFileSystem()
const templatesResult = await fs.readdir('/docs/reference/templates/tutorial-template')

if (templatesResult.success) {
  const template = await select({
    message: 'Choose a template:',
    choices: templatesResult.value.map((name) => ({
      name: name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: name,
    })),
  })
}
```

## Error Handling

Prompts can be cancelled by the user (Ctrl+C):

```typescript
try {
  const name = await prompt({
    message: 'Your name:',
  })
  console.log(`Hello, ${name}!`)
} catch (error) {
  if (error.message === 'Prompt was cancelled') {
    console.log('\nOperation cancelled by user')
    process.exit(0)
  }
  throw error
}
```

## Testing Prompts

Use mock prompts for testing:

```typescript
import { createTestContext, mockPrompts } from '@esteban-url/trailhead-cli/testing'

test('interactive command', async () => {
  const prompts = mockPrompts({
    'Project name:': 'my-project',
    'Choose a template:': 'typescript',
    'Initialize git?': true,
  })

  const context = createTestContext({ prompts })

  const result = await initCommand.execute({}, context)
  expect(result.success).toBe(true)
})
```

## Styling

Prompts use the terminal's default colors and can be themed:

```typescript
const answer = await prompt({
  message: 'Question:',
  theme: {
    prefix: '❯',
    style: {
      message: (text) => chalk.cyan(text),
      answer: (text) => chalk.green(text),
      defaultAnswer: (text) => chalk.dim(text),
    },
  },
})
```

## Best Practices

1. **Provide defaults** - Make it easy to proceed
2. **Validate input** - Catch errors early
3. **Use descriptions** - Help users understand choices
4. **Group related prompts** - Logical flow
5. **Handle cancellation** - Graceful exit

## Type Reference

```typescript
// Re-exported from @inquirer/prompts
export {
  prompt, // Text input
  input, // Alias for prompt
  select, // Single choice
  confirm, // Yes/no
  checkbox as multiselect, // Multiple choice
  password, // Hidden input
  editor, // Text editor
  expand, // Expand choices
  rawlist, // Numbered list
  number, // Numeric input
} from '@inquirer/prompts'

// Common types
interface PromptOptions {
  message: string
  default?: any
  validate?: (input: any) => boolean | string | Promise<boolean | string>
  theme?: Theme
}

interface Choice<T = string> {
  name: string
  value: T
  description?: string
  disabled?: boolean | string
  checked?: boolean
  type?: 'separator'
}
```

## See Also

- [Getting Started](/packages/cli/tutorials/getting-started) - Interactive CLI example
- [Common Patterns](/packages/cli/how-to/use-result-pipelines) - Prompt patterns
- [Testing Guide](/packages/cli/how-to/test-cli-applications) - Testing interactive CLIs
