# Transform System

A functional transform system for code modifications built on @esteban-url/trailhead-cli framework.

## Overview

The transform system provides a pipeline for applying code transformations to Catalyst UI components. It uses Result-based error handling and functional programming patterns for reliable, composable transformations.

## Architecture

```
src/transforms/
├── core/
│   └── transform-utils.ts      # Shared utility functions
├── transforms/                 # Individual transform implementations
│   ├── catalyst-prefix.ts      # Add Catalyst prefix to components
│   ├── clsx-to-cn.ts          # Convert clsx to cn utility
│   ├── file-headers.ts        # Add/update file headers
│   ├── semantic-colors.ts     # Add semantic color tokens
│   └── ts-nocheck.ts         # Add TypeScript nocheck directives
├── pipelines/
│   └── main.ts               # Main transform pipeline
└── __tests__/                # Transform tests
    ├── pipeline-integration.test.ts
    ├── semantic-colors.test.ts
    └── ts-nocheck.test.ts
```

## Core Concepts

### Transform Functions

Each transform is a pure function that takes input content and returns a Result:

```typescript
function transformName(input: string): Result<TransformResult, CLIError> {
  // Transform logic
  return Ok({ content: transformed, changed: true, warnings: [] });
}
```

### Transform Metadata

Each transform exports metadata describing its purpose:

```typescript
export const transformMetadata = {
  name: 'transform-name',
  description: 'Description of what the transform does',
  category: 'semantic' | 'format' | 'quality' | 'import' | 'ast',
};
```

### Transform Pipeline

The main pipeline applies transforms in sequence:

```typescript
const transforms = [
  { ...clsxToCnTransform, transform: transformClsxToCn },
  { ...catalystPrefixTransform, transform: transformCatalystPrefix },
  { ...semanticColorsTransform, transform: transformSemanticColors },
  { ...fileHeadersTransform, transform: transformFileHeaders },
  { ...tsNocheckTransform, transform: transformTsNocheck },
];
```

## Available Transforms

### 1. Catalyst Prefix Transform (`catalyst-prefix.ts`)

- Adds "Catalyst" prefix to component function names
- Ensures consistent naming across all components

### 2. Clsx to CN Transform (`clsx-to-cn.ts`)

- Converts `clsx()` function calls to `cn()` utility
- Maintains same functionality with project conventions

### 3. Semantic Colors Transform (`semantic-colors.ts`)

- Adds semantic color tokens (primary, secondary, destructive, accent, muted)
- Component-specific color patterns for theming consistency

### 4. File Headers Transform (`file-headers.ts`)

- Adds development warning headers to generated files
- Tracks generation metadata

### 5. TypeScript Nocheck Transform (`ts-nocheck.ts`)

- Adds `// @ts-nocheck` directives to specific files
- Bypasses TypeScript checking for generated code

## Usage

### CLI Commands

```bash
# Run all transforms on components
trailhead-ui transforms

# Run transforms with specific options
trailhead-ui transforms --dry-run --verbose

# Enhanced transform command
trailhead-ui enhance
```

### Programmatic Usage

```typescript
import { runMainPipeline } from './pipelines/main.js';

const result = await runMainPipeline('./src/components', {
  verbose: true,
  dryRun: false,
  filter: filename => filename.endsWith('.tsx'),
});
```

## Testing

All transforms include comprehensive tests:

```typescript
import { transformSemanticColors } from '../transforms/semantic-colors.js';
import { expectResult } from '@esteban-url/trailhead-cli/testing';

const result = transformSemanticColors(input);
expectResult(result);
expect(result.value.changed).toBe(true);
```

## Error Handling

All transforms use Result types for consistent error handling:

```typescript
if (result.success) {
  console.log(result.value.content);
} else {
  console.error(result.error.message);
}
```

## CLI Integration

The transform system integrates with these CLI commands:

- `src/cli/commands/transforms.ts` - Main transforms command
- `src/cli/commands/enhance.ts` - Simplified transforms
- `src/cli/commands/dev-refresh.ts` - Development refresh with transforms
