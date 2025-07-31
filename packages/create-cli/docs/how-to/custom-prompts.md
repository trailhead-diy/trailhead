---
type: how-to
title: 'Add Custom Interactive Prompts'
description: 'Extend the CLI generator with custom questions and validation'
prerequisites:
  - Understanding of the prompt system
  - Basic TypeScript knowledge
  - Familiarity with inquirer/prompts
related:
  - ./customize-templates.md
  - /packages/cli/reference/config.md
  - /packages/cli/reference/core.md
---

# Add Custom Interactive Prompts

This guide shows you how to extend the interactive prompt system to gather additional information during project generation.

## Understanding the Prompt System

The generator uses @inquirer/prompts for interactive questions. Prompts are displayed when:

1. Running without CLI arguments
2. Missing required configuration
3. Explicitly requesting interactive mode

## Adding Simple Prompts

### Step 1: Define Your Prompt

Add a new prompt to the prompt sequence:

```typescript
// In src/lib/cli/prompts.ts
import { input, confirm, select } from '@inquirer/prompts'

export async function promptForCustomField(): Promise<string> {
  return await input({
    message: 'Enter your organization name:',
    default: '@my-org',
    validate: (value) => {
      if (!value.startsWith('@')) {
        return 'Organization must start with @'
      }
      return true
    },
  })
}
```

### Step 2: Integrate into Prompt Flow

Add your prompt to the main prompt sequence:

```typescript
export async function getProjectConfig(partial: Partial<ProjectConfig>): Promise<ProjectConfig> {
  // Existing prompts...

  // Add custom prompt
  if (!partial.organization) {
    const organization = await promptForCustomField()
    partial.organization = organization
  }

  return partial as ProjectConfig
}
```

### Step 3: Update Configuration Type

Extend the ProjectConfig interface:

```typescript
// In src/lib/config/types.ts
export interface ProjectConfig {
  // ... existing fields ...
  organization?: string // Your custom field
}
```

## Creating Complex Prompts

### Multi-Step Prompts

Create prompts that depend on previous answers:

```typescript
export async function promptForDeploymentConfig(): Promise<DeploymentConfig> {
  // Step 1: Deployment target
  const target = await select({
    message: 'Select deployment target:',
    choices: [
      { name: 'npm registry', value: 'npm' },
      { name: 'GitHub Packages', value: 'github' },
      { name: 'Private registry', value: 'private' },
    ],
  })

  // Step 2: Conditional prompts based on target
  let registryUrl: string | undefined

  if (target === 'private') {
    registryUrl = await input({
      message: 'Enter private registry URL:',
      validate: (value) => {
        try {
          new URL(value)
          return true
        } catch {
          return 'Please enter a valid URL'
        }
      },
    })
  }

  // Step 3: Authentication
  const needsAuth = await confirm({
    message: 'Does the registry require authentication?',
    default: target === 'private',
  })

  return {
    target,
    registryUrl,
    needsAuth,
  }
}
```

### Dynamic Choices

Generate choices based on system state:

```typescript
import { detectInstalledPackageManagers } from '../utils/package-manager'

export async function promptForPackageManager(): Promise<PackageManager> {
  const installed = await detectInstalledPackageManagers()

  const choices = installed.map((pm) => ({
    name: pm === 'pnpm' ? `${pm} (recommended)` : pm,
    value: pm,
  }))

  if (choices.length === 0) {
    throw new Error('No package manager found. Please install npm or pnpm.')
  }

  if (choices.length === 1) {
    // Skip prompt if only one option
    return choices[0].value
  }

  return await select({
    message: 'Choose package manager:',
    choices,
    default: 'pnpm',
  })
}
```

## Custom Validation

### Async Validation

Validate against external resources:

```typescript
async function validateProjectName(name: string): Promise<boolean | string> {
  // Check basic format
  if (!/^[a-z0-9-]+$/.test(name)) {
    return 'Project name must be lowercase with hyphens only'
  }

  // Check npm registry
  try {
    const response = await fetch(`https://registry.npmjs.org/${name}`)
    if (response.ok) {
      return 'Package name already exists on npm'
    }
  } catch {
    // Ignore network errors
  }

  // Check local directory
  if (existsSync(name)) {
    return 'Directory already exists'
  }

  return true
}

// Use in prompt
const projectName = await input({
  message: 'Project name:',
  validate: validateProjectName,
})
```

### Composed Validation

Combine multiple validation rules:

```typescript
import { z } from 'zod'

function createValidator(schema: z.ZodSchema) {
  return (value: string) => {
    const result = schema.safeParse(value)
    if (!result.success) {
      return result.error.errors[0].message
    }
    return true
  }
}

// Use with Zod schema
const emailValidator = createValidator(z.string().email('Please enter a valid email'))

const email = await input({
  message: 'Your email:',
  validate: emailValidator,
})
```

## Conditional Prompts

### Feature-Based Prompts

Show prompts based on selected features:

```typescript
export async function promptForFeatureConfig(
  features: ProjectConfig['features']
): Promise<FeatureConfig> {
  const config: FeatureConfig = {}

  // Config feature prompts
  if (features.config) {
    config.configFormat = await select({
      message: 'Configuration file format:',
      choices: [
        { name: 'JSON', value: 'json' },
        { name: 'YAML', value: 'yaml' },
        { name: 'TOML', value: 'toml' },
      ],
    })
  }

  // Testing feature prompts
  if (features.testing) {
    config.testRunner = await select({
      message: 'Test runner:',
      choices: [
        { name: 'Vitest (recommended)', value: 'vitest' },
        { name: 'Jest', value: 'jest' },
      ],
    })

    config.coverage = await confirm({
      message: 'Include coverage reporting?',
      default: true,
    })
  }

  // CI/CD feature prompts
  if (features.cicd) {
    config.ciPlatforms = await checkbox({
      message: 'Select CI platforms:',
      choices: [
        { name: 'GitHub Actions', value: 'github', checked: true },
        { name: 'GitLab CI', value: 'gitlab' },
        { name: 'CircleCI', value: 'circle' },
      ],
    })
  }

  return config
}
```

### Skip Logic

Implement smart skip conditions:

```typescript
export async function promptWithSkipLogic(
  existing: Partial<ProjectConfig>
): Promise<ProjectConfig> {
  const config = { ...existing }

  // Skip if running in CI
  if (process.env.CI) {
    return applyDefaults(config)
  }

  // Skip if all required fields present
  const required = ['projectName', 'projectType', 'packageManager']
  const hasAllRequired = required.every((field) => config[field])

  if (hasAllRequired && !config.interactive) {
    return config as ProjectConfig
  }

  // Continue with prompts...
}
```

## Custom Prompt Types

### File/Directory Selection

```typescript
import { access } from 'fs/promises'
import { resolve } from 'path'

export async function promptForDirectory(): Promise<string> {
  return await input({
    message: 'Project directory:',
    default: './my-cli',
    validate: async (value) => {
      const path = resolve(value)
      const parent = resolve(path, '..')

      try {
        await access(parent)
        return true
      } catch {
        return 'Parent directory does not exist'
      }
    },
    transformer: (value) => resolve(value), // Show absolute path
  })
}
```

### Multi-Select with Validation

```typescript
import { checkbox } from '@inquirer/prompts'

export async function promptForFeatures(): Promise<string[]> {
  const selected = await checkbox({
    message: 'Select features:',
    choices: [
      { name: 'Configuration Management', value: 'config' },
      { name: 'Input Validation', value: 'validation' },
      { name: 'Testing Framework', value: 'testing' },
      { name: 'Documentation', value: 'docs' },
      { name: 'CI/CD Pipelines', value: 'cicd' },
    ],
    validate: (answer) => {
      if (answer.length === 0) {
        return 'Please select at least one feature'
      }

      // Check for incompatible combinations
      if (answer.includes('minimal') && answer.includes('kitchen-sink')) {
        return 'Cannot select both minimal and kitchen-sink'
      }

      return true
    },
  })

  return selected
}
```

## Prompt Flow Control

### Saving and Resuming

Save prompt progress for later:

```typescript
interface PromptSession {
  completed: string[]
  answers: Partial<ProjectConfig>
  timestamp: number
}

export async function promptWithSession(): Promise<ProjectConfig> {
  const sessionFile = '.create-cli-session.json'
  let session: PromptSession | null = null

  // Try to load existing session
  try {
    const data = await readFile(sessionFile, 'utf-8')
    session = JSON.parse(data)

    // Check if session is recent (< 1 hour)
    if (Date.now() - session.timestamp > 3600000) {
      session = null
    }
  } catch {
    // No session file
  }

  if (session) {
    const resume = await confirm({
      message: 'Resume previous session?',
      default: true,
    })

    if (!resume) {
      session = null
    }
  }

  // Continue prompting...
  const config = await runPrompts(session?.answers)

  // Clean up session
  try {
    await unlink(sessionFile)
  } catch {
    // Ignore
  }

  return config
}
```

### Confirmation and Summary

Show summary before proceeding:

```typescript
export async function confirmConfiguration(config: ProjectConfig): Promise<boolean> {
  console.log('\n📋 Configuration Summary:\n')
  console.log(`  Project: ${config.projectName}`)
  console.log(`  Type: ${config.projectType}`)
  console.log(`  Package Manager: ${config.packageManager}`)
  console.log(`  Features: ${Object.keys(config.features).join(', ')}`)
  console.log(`  Node Version: ${config.nodeVersion}`)

  return await confirm({
    message: '\nProceed with this configuration?',
    default: true,
  })
}
```

## Testing Custom Prompts

### Mock Prompt Inputs

```typescript
import { mockPrompts } from '@inquirer/testing'

test('custom prompts work correctly', async () => {
  mockPrompts([
    '@my-org', // organization
    'private', // deployment target
    'https://reg.co', // registry URL
    true, // needs auth
  ])

  const config = await getProjectConfig({})

  expect(config.organization).toBe('@my-org')
  expect(config.deployment.target).toBe('private')
  expect(config.deployment.registryUrl).toBe('https://reg.co')
})
```

### Validation Testing

```typescript
test('validates organization name', async () => {
  const validator = createOrganizationValidator()

  expect(validator('my-org')).toBe('Organization must start with @')
  expect(validator('@my-org')).toBe(true)
  expect(validator('@')).toBe('Organization name too short')
})
```

## Best Practices

### 1. Progressive Disclosure

Start with essential questions:

```typescript
// Good: Essential first, advanced later
const projectName = await promptProjectName()
const projectType = await promptProjectType()

if (projectType === 'advanced') {
  // Show advanced options only when needed
  const advancedConfig = await promptAdvancedOptions()
}
```

### 2. Smart Defaults

Provide intelligent defaults:

```typescript
const projectName = await input({
  message: 'Project name:',
  default: path.basename(process.cwd()),
  transformer: (input) => input.toLowerCase().replace(/\s+/g, '-'),
})
```

### 3. Clear Validation Messages

Be specific about what's wrong:

```typescript
// Bad
validate: (value) => value.length > 0 || 'Invalid'

// Good
validate: (value) => {
  if (!value) return 'Project name is required'
  if (value.length < 3) return 'Project name must be at least 3 characters'
  if (!/^[a-z0-9-]+$/.test(value)) {
    return 'Project name must be lowercase letters, numbers, and hyphens only'
  }
  return true
}
```

### 4. Grouping Related Prompts

Group related questions:

```typescript
console.log('\n🎯 Project Configuration\n')
const projectConfig = await promptProjectDetails()

console.log('\n🔧 Technical Setup\n')
const techConfig = await promptTechnicalDetails()

console.log('\n📦 Dependencies\n')
const depConfig = await promptDependencies()
```

## Troubleshooting

### Prompt Not Showing

Check skip conditions and ensure the field isn't already set.

### Validation Always Fails

Test validator function independently and check return types.

### Terminal Issues

Some terminals may have issues with Unicode characters or colors.

## Next Steps

- Learn about [Configuration Defaults](/packages/create-cli/how-to/configure-defaults)
- Explore [Template Customization](/packages/create-cli/how-to/customize-templates)
- Review [API Reference](/packages/cli/reference/core)
