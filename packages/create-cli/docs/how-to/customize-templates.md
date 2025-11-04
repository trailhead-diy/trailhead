---
type: how-to
title: 'Customize Project Templates'
description: 'Modify existing templates or create new ones for your team'
prerequisites:
  - Understanding of Handlebars templating
  - Basic knowledge of the module system
  - Familiarity with project structure
related:
  - /packages/create-cli/docs/reference/templates.md
  - /packages/cli/docs/reference/config.md
  - /packages/create-cli/docs/how-to/custom-prompts.md
---

# Customize Project Templates

This guide shows you how to modify existing templates or create entirely new ones for your specific needs.

## Understanding Template Structure

Before customizing, understand how templates are organized:

```
templates/
├── modules/          # Feature-based modules
│   ├── core/        # Required base functionality
│   ├── config/      # Optional features
│   └── custom/      # Your custom modules
└── shared/          # Shared infrastructure
```

## Modifying Existing Templates

### Step 1: Locate the Template

Find the template file you want to modify:

```bash
# List all template files
find templates -name "*.hbs" -type f

# Find specific file type
find templates -name "*package.json*" -type f
```

### Step 2: Edit the Template

Open the template file and make your changes:

```handlebars
{{! templates/shared/package.json.hbs }}
{ "name": "{{projectName}}", "version": "0.1.0", "description": "{{projectDescription}}",
{{! Add your custom field }}
"company": "@your-company", "scripts": {
{{! Add custom script }}
"custom": "echo 'Custom script'", "dev": "tsx src/index.ts", "build": "tsup" } }
```

### Step 3: Test Your Changes

Generate a project to test your modifications:

```bash
# Test locally
npm run dev -- generate test-project --type standalone-cli

# Check the generated file
cat test-project/package.json
```

## Creating New Feature Modules

### Step 1: Create Module Directory

```bash
mkdir -p templates/modules/analytics
```

### Step 2: Add Template Files

Create your module templates:

```handlebars
{{!-- templates/modules/analytics/src/lib/analytics.ts.hbs --}}
import { ok, err } from '@trailhead/core'
import type { Result } from '@trailhead/core'

export interface AnalyticsConfig {
  apiKey: string
  endpoint: string
  {{#if features.testing}}
  testMode?: boolean
  {{/if}}
}

export function trackEvent(
  event: string,
  properties?: Record<string, any>
): Result<void> {
  try {
    // Your analytics implementation
    console.log(`Tracking: ${event}`, properties)
    return ok(undefined)
  } catch (error) {
    return err(error as Error)
  }
}
```

### Step 3: Define the Module

Add your module to `src/lib/templates/modules.ts`:

```typescript
export const FEATURE_MODULES: Record<string, FeatureModule> = {
  // ... existing modules ...

  analytics: {
    name: 'analytics',
    description: 'Analytics tracking functionality',
    dependencies: ['core'], // Requires core module
    conflicts: [], // No conflicts
    files: [
      {
        source: 'modules/analytics/src/lib/analytics.ts.hbs',
        destination: 'src/lib/analytics.ts',
        isTemplate: true,
        executable: false,
      },
      {
        source: 'modules/analytics/src/commands/track.ts.hbs',
        destination: 'src/commands/track.ts',
        isTemplate: true,
        executable: false,
      },
    ],
    packageDependencies: ['axios'], // External dependencies
    scripts: {
      'analytics:test': 'echo "Testing analytics"',
    },
  },
}
```

### Step 4: Update Configuration Schema

If your module needs new configuration options, update the schema:

```typescript
// In src/lib/config/schema.ts
export const featuresSchema = z.object({
  core: z.literal(true),
  config: z.boolean().optional(),
  validation: z.boolean().optional(),
  testing: z.boolean().optional(),
  docs: z.boolean().optional(),
  cicd: z.boolean().optional(),
  analytics: z.boolean().optional(), // Add your feature
})
```

## Creating Custom Presets

### Step 1: Define Your Preset

Create a preset configuration:

```typescript
// In src/lib/config/presets.ts
export const CUSTOM_PRESETS = {
  'enterprise-cli': {
    name: 'enterprise-cli',
    description: 'Enterprise-ready CLI with monitoring',
    projectType: 'standalone-cli',
    features: {
      config: true,
      validation: true,
      testing: true,
      docs: true,
      cicd: true,
      analytics: true, // Your custom feature
    },
    packageManager: 'pnpm',
    nodeVersion: '20',
    ide: 'vscode',
    includeDocs: true,
  },
}
```

### Step 2: Register the Preset

Add your preset to the available options:

```typescript
// Update getAvailablePresets function
export function getAvailablePresets(): PresetInfo[] {
  return [
    // ... existing presets ...
    {
      name: 'enterprise-cli',
      description: 'Enterprise-ready CLI with monitoring',
      recommended: false,
    },
  ]
}
```

## Using Custom Helpers

### Step 1: Create Helper Function

Add custom Handlebars helpers:

```typescript
// In src/lib/templates/helpers.ts
export function registerCustomHelpers(handlebars: typeof Handlebars) {
  // Uppercase helper
  handlebars.registerHelper('upper', (str: string) => {
    return str?.toUpperCase() || ''
  })

  // Date formatting helper
  handlebars.registerHelper('formatDate', (date: Date) => {
    return new Intl.DateTimeFormat('en-US').format(date)
  })

  // Custom logic helper
  handlebars.registerHelper('isEnterprise', (projectType: string) => {
    return projectType === 'enterprise-cli'
  })
}
```

### Step 2: Use in Templates

```handlebars
{{! Using custom helpers }}
#
{{upper projectName}}

Generated on:
{{formatDate timestamp}}

{{#if (isEnterprise projectType)}}
  ## Enterprise Features This project includes enterprise monitoring and analytics.
{{/if}}
```

## Template Variables

### Adding New Variables

Extend the template context:

```typescript
// In src/lib/templates/context.ts
export function createTemplateContext(config: ProjectConfig): TemplateContext {
  return {
    ...config,
    // Add custom computed variables
    orgName: extractOrgName(config.projectName),
    isPrivate: config.projectType === 'enterprise-cli',
    copyrightYear: new Date().getFullYear(),
    generatorVersion: getPackageVersion(),
  }
}
```

### Using Environment Variables

Access environment variables in templates:

```typescript
// Add to context
export function createTemplateContext(config: ProjectConfig) {
  return {
    ...config,
    env: {
      CI: process.env.CI === 'true',
      USER: process.env.USER || 'unknown',
      ORG_NAME: process.env.ORG_NAME || config.orgName,
    },
  }
}
```

## Testing Custom Templates

### Unit Testing

Test your template compilation:

```typescript
import { compileTemplate } from '../lib/templates/compiler'

test('custom template compiles correctly', () => {
  const template = '# {{upper projectName}}'
  const context = { projectName: 'my-cli' }

  const result = compileTemplate(template, context)

  expect(result).toBe('# MY-CLI')
})
```

### Integration Testing

Test the full generation:

```typescript
test('generates project with custom module', async () => {
  const config: ProjectConfig = {
    projectName: 'test-cli',
    projectType: 'standalone-cli',
    features: {
      core: true,
      analytics: true, // Your custom feature
    },
    // ... other config
  }

  const result = await generateProject(config, context)

  expect(result.isOk()).toBe(true)
  expect(existsSync('test-cli/src/lib/analytics.ts')).toBe(true)
})
```

## Best Practices

### 1. Maintain Compatibility

When modifying core templates:

- Keep existing variables
- Add new features conditionally
- Test with all project types

### 2. Document Your Changes

Add comments to explain customizations:

```handlebars
{{! 
  Custom: Added company-specific configuration
  This section configures our internal registry
}}
{{#if (eq company '@your-company')}}
  registry=https://registry.your-company.com
{{/if}}
```

### 3. Version Your Templates

Track template versions:

```handlebars
{ "name": "{{projectName}}", "templateVersion": "2.0.0-custom",
{{! Rest of package.json }}
}
```

### 4. Create Upgrade Paths

When changing templates significantly:

- Document migration steps
- Provide upgrade scripts
- Test with existing projects

## Common Customizations

### Adding Company Standards

```handlebars
{{! .eslintrc.json.hbs }}
{ "extends": [
{{#if company}}
  "@{{company}}/eslint-config",
{{/if}}
"@trailhead/eslint-config" ] }
```

### Custom Directory Structure

```typescript
// In module definition
files: [
  {
    source: 'modules/custom/src/index.ts.hbs',
    destination: 'source/main.ts', // Custom path
    isTemplate: true,
    executable: false,
  },
]
```

### Environment-Specific Configuration

```handlebars
{{! config/default.json.hbs }}
{ "app": { "name": "{{projectName}}",
{{#if (eq NODE_ENV 'production')}}
  "logLevel": "error",
{{else}}
  "logLevel": "debug",
{{/if}}
} }
```

## Troubleshooting

### Template Not Found

```
Error: Template file not found: modules/custom/template.hbs
```

**Solution**: Check file path and ensure it exists in templates directory

### Variable Undefined

```
Error: "customVar" not defined in [object Object]
```

**Solution**: Add variable to template context or provide default

### Invalid Syntax

```
Error: Parse error on line 10
```

**Solution**: Check for unclosed blocks or invalid Handlebars syntax

## Next Steps

- Learn about [Custom Prompts](../../how-to/custom-prompts)
- Explore [Template Reference](../../reference/templates)
- Configure [Default Settings](../../how-to/configure-defaults)
