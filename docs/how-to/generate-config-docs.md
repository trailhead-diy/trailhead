---
title: Generate Configuration Documentation
type: how-to
description: Generate documentation from your configuration schemas
---

# Generate Configuration Documentation

This guide shows how to generate documentation from your configuration schemas, including markdown files, JSON schemas, and environment variable references.

## Generate Markdown Documentation

```typescript
import { generateDocs } from '@repo/config'
import { appSchema } from './schema'

// Generate markdown documentation
const markdown = generateDocs(appSchema, {
  format: 'markdown',
  title: 'Application Configuration',
})

// Write to file
import { writeFileSync } from 'fs'
writeFileSync('CONFIG.md', markdown)
```

## Generate JSON Schema

```typescript
const jsonSchema = generateDocs(appSchema, {
  format: 'json-schema',
})

writeFileSync('config-schema.json', JSON.stringify(jsonSchema, null, 2))
```

## Generate Environment Variables Reference

```typescript
const envVars = generateDocs(appSchema, {
  format: 'env',
  envPrefix: 'APP_',
})

writeFileSync('ENV_VARS.md', envVars)
```

## Customize Documentation Output

### Include Examples and Descriptions

```typescript
const schema = createConfigSchema({
  apiUrl: z.string().url(),
  retries: z.number().min(0).max(10),
})
  .describe('apiUrl', 'External API endpoint')
  .example('apiUrl', 'https://api.example.com/v1')
  .describe('retries', 'Number of retry attempts for failed requests')
  .example('retries', 3)

const docs = generateDocs(schema, {
  format: 'markdown',
  includeExamples: true,
  includeDefaults: true,
})
```

### Group by Categories

```typescript
const docs = generateDocs(schema, {
  format: 'markdown',
  groupBy: 'category',
  categories: {
    server: ['port', 'host', 'ssl'],
    database: ['database.url', 'database.poolSize'],
    features: ['features.*'],
  },
})
```

## Create a Documentation Script

Create `scripts/generate-config-docs.ts`:

```typescript
import { generateDocs } from '@repo/config'
import { appSchema } from '../src/config/schema'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const docsDir = join(__dirname, '../docs/config')
mkdirSync(docsDir, { recursive: true })

// Generate multiple formats
const formats = [
  {
    format: 'markdown' as const,
    file: 'README.md',
    options: {
      title: 'Configuration Reference',
      includeExamples: true,
    },
  },
  {
    format: 'json-schema' as const,
    file: 'schema.json',
    options: {},
  },
  {
    format: 'env' as const,
    file: 'environment-variables.md',
    options: {
      envPrefix: 'APP_',
      title: 'Environment Variables',
    },
  },
]

formats.forEach(({ format, file, options }) => {
  const content = generateDocs(appSchema, { format, ...options })
  const path = join(docsDir, file)

  if (format === 'json-schema') {
    writeFileSync(path, JSON.stringify(content, null, 2))
  } else {
    writeFileSync(path, content)
  }

  console.log(`Generated ${path}`)
})
```

Add to `package.json`:

```json
{
  "scripts": {
    "docs:config": "tsx scripts/generate-config-docs.ts"
  }
}
```

## Generate HTML Documentation

```typescript
const html = generateDocs(schema, {
  format: 'html',
  theme: 'minimal',
  includeSearch: true,
})

writeFileSync('config-docs.html', html)
```

## Generate for Multiple Environments

```typescript
const environments = ['development', 'staging', 'production']

environments.forEach((env) => {
  const docs = generateDocs(schema, {
    format: 'markdown',
    title: `${env} Configuration`,
    filter: (key, field) => {
      // Only include environment-specific fields
      return !field.metadata?.environments || field.metadata.environments.includes(env)
    },
  })

  writeFileSync(`CONFIG.${env}.md`, docs)
})
```

## Add to CI/CD Pipeline

```yaml
# .github/workflows/docs.yml
name: Generate Config Docs

on:
  push:
    paths:
      - 'src/config/schema.ts'

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm docs:config

      - uses: peter-evans/create-pull-request@v5
        with:
          title: 'docs: update configuration documentation'
          commit-message: 'docs: update auto-generated config docs'
          branch: update-config-docs
```

## Validate Documentation

```typescript
import { validateDocs } from '@repo/config'

// Ensure documentation matches schema
const validation = validateDocs(schema, {
  checkExamples: true,
  checkDescriptions: true,
  checkSensitive: true,
})

if (!validation.valid) {
  console.error('Documentation issues:', validation.issues)
  process.exit(1)
}
```

## See Also

- [Define Configuration Schemas](/docs/how-to/define-schemas.md)
- [Configuration API Reference](/packages/config/docs/reference/api.md)
- [Understanding Configuration Sources](/docs/explanation/config-sources.md)
