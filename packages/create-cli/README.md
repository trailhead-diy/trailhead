# @trailhead/create-cli

> Modern CLI generator built with functional programming principles and the @trailhead/cli framework

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/trailhead-diy/trailhead/blob/main/LICENSE)

Generate well-structured, type-safe CLI applications using the @trailhead/cli framework with Result types, functional patterns, and comprehensive testing utilities.

## Installation

```bash
# Run directly with npx (no installation required)
npx @trailhead/create-cli my-awesome-cli

# Or install globally
npm install -g @trailhead/create-cli
create-trailhead-cli my-awesome-cli
```

## Quick Example

```bash
# Generate a new CLI project
npx @trailhead/create-cli my-cli

# With options
npx @trailhead/create-cli my-cli --package-manager pnpm

# See all options
npx @trailhead/create-cli --help
```

Generated projects include:

```typescript
import { createCommand } from '@trailhead/cli'
import { ok } from '@trailhead/core'

const helloCommand = createCommand({
  name: 'hello',
  description: 'Say hello',
  action: async (options, context) => {
    context.logger.info('Hello, World!')
    return ok(undefined)
  },
})
```

## Key Features

- **CLI Framework foundation** - Built on @trailhead/cli for robust command handling
- **Functional programming** - Pure functions, immutable data, composition patterns
- **Template system** - Handlebars-based templates with intelligent caching
- **Testing ready** - Vitest setup with high-ROI test patterns
- **Type-safe** - Full TypeScript support with Result types

## Documentation

- **[API Documentation](../../docs/@trailhead.create-cli.md)** - Complete API reference
- **[Getting Started](./docs/tutorials/getting-started.md)** - Generate your first CLI in 5 minutes
- **[Customize Templates](./docs/how-to/customize-templates.md)** - Modify or create templates
- **[Template Architecture](./docs/explanation/templates.md)** - Understanding the design

## License

MIT © [esteban-url](https://github.com/esteban-url)
