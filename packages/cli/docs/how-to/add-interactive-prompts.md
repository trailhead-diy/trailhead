---
type: how-to
title: 'How to Add Interactive Prompts to Your CLI'
description: 'Make your CLI interactive with user prompts, selections, and confirmations'
prerequisites:
  - Completed the getting started tutorial
  - Basic CLI command structure
  - Understanding of async/await
related:
  - /packages/cli/docs/reference/prompts
  - /packages/cli/docs/reference/command
  - /packages/cli/docs/tutorials/getting-started
---

# How to Add Interactive Prompts to Your CLI

This guide shows various ways to add interactivity to your CLI commands using the prompts module.

## Prerequisites

- A working CLI application
- Basic understanding of async/await
- The prompts module from @esteban-url/cli

## Basic Text Input

Add simple text prompts to gather user input:

```typescript
import { ok } from '@esteban-url/cli'
import { createCommand } from '@esteban-url/cli/command'
import { prompt } from '@esteban-url/cli/prompts'

const initCommand = createCommand({
  name: 'init',
  description: 'Initialize a project',
  action: async (options, context) => {
    const name = await prompt({
      message: 'Project name:',
      default: 'my-project',
    })

    context.logger.success(`Creating project: ${name}`)
    return ok(undefined)
  },
})
```

## Selection Lists

Let users choose from predefined options:

```typescript
import { select } from '@esteban-url/cli/prompts'

const template = await select({
  message: 'Choose a template:',
  choices: ['basic', 'advanced', 'minimal'],
})

// With custom display values
const framework = await select({
  message: 'Select framework:',
  choices: [
    { title: 'React', value: 'react' },
    { title: 'Vue', value: 'vue' },
    { title: 'Angular', value: 'angular' },
  ],
})
```

## Multiple Selection

Allow multiple choices:

```typescript
import { multiselect } from '@esteban-url/cli/prompts'

const features = await multiselect({
  message: 'Select features to include:',
  choices: [
    { title: 'TypeScript', value: 'typescript', selected: true },
    { title: 'ESLint', value: 'eslint' },
    { title: 'Testing', value: 'testing' },
    { title: 'GitHub Actions', value: 'ci' },
  ],
  min: 1,
  max: 3,
})
```

## Confirmations

Get yes/no responses:

```typescript
import { confirm } from '@esteban-url/cli/prompts'

const shouldContinue = await confirm({
  message: 'Do you want to continue?',
  initial: true, // default value
})

if (!shouldContinue) {
  return ok(undefined)
}
```

## Password Input

Securely collect sensitive information:

```typescript
import { password } from '@esteban-url/cli/prompts'

const token = await password({
  message: 'Enter your API token:',
  validate: (value) => value.length >= 20 || 'Token must be at least 20 characters',
})
```

## Input Validation

Add validation to any prompt:

```typescript
const email = await prompt({
  message: 'Email address:',
  validate: (value) => {
    if (!value.includes('@')) {
      return 'Please enter a valid email'
    }
    return true
  },
})

const port = await prompt({
  message: 'Port number:',
  validate: (value) => {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 1 || num > 65535) {
      return 'Port must be between 1 and 65535'
    }
    return true
  },
})
```

## Complex Workflows

Build multi-step interactive flows:

```typescript
const setupCommand = createCommand({
  name: 'setup',
  description: 'Interactive project setup',
  action: async (options, context) => {
    // Step 1: Basic info
    const projectName = await prompt({
      message: 'Project name:',
      default: path.basename(process.cwd()),
    })

    // Step 2: Configuration type
    const configType = await select({
      message: 'Configuration complexity:',
      choices: ['simple', 'advanced'],
    })

    // Step 3: Conditional prompts
    let features = []
    if (configType === 'advanced') {
      features = await multiselect({
        message: 'Select features:',
        choices: ['auth', 'database', 'api', 'testing'],
      })
    }

    // Step 4: Confirmation
    const proceed = await confirm({
      message: `Create ${projectName} with ${features.length} features?`,
    })

    if (!proceed) {
      context.logger.info('Setup cancelled')
      return ok(undefined)
    }

    // Continue with setup...
    return ok(undefined)
  },
})
```

## Error Handling

Handle prompt cancellation:

```typescript
try {
  const answer = await prompt({
    message: 'Your name:',
  })
} catch (error) {
  if (error.message === 'Prompt was cancelled') {
    context.logger.info('Operation cancelled by user')
    return ok(undefined)
  }
  return err(error)
}
```

## Spinner During Long Operations

Show progress during async operations:

```typescript
import { spinner } from '@esteban-url/cli/prompts'

const spin = spinner()
spin.start('Loading configuration...')

try {
  await someAsyncOperation()
  spin.stop('Configuration loaded')
} catch (error) {
  spin.stop('Failed to load configuration')
  return err(error)
}
```

## Best Practices

1. **Provide Defaults**: Always offer sensible defaults when possible
2. **Validate Early**: Use validation functions to catch errors immediately
3. **Clear Messages**: Write concise, clear prompt messages
4. **Handle Cancellation**: Always handle when users cancel prompts
5. **Group Related Prompts**: Keep related questions together

## See Also

- [Prompts API Reference](/packages/cli/docs/reference/prompts)
- [Command Patterns](/packages/cli/docs/reference/command)
- [Error Handling Guide](/packages/cli/docs/how-to/handle-errors-in-cli)
