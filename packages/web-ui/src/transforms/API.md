# Transforms API Reference

## Overview

This document provides a comprehensive API reference for the transforms system. All interfaces follow TypeScript conventions and functional programming principles.

## Core Interfaces

### Transform

The base interface for all transforms in the system.

```typescript
interface Transform {
  name: string // Unique transform identifier
  description: string // Human-readable description
  type: 'ast' | 'regex' | 'hybrid' // Transform implementation type
  execute: (content: string, options?: TransformOptions) => TransformResult
}
```

### TransformResult

Represents the result of a transform execution with detailed metadata.

```typescript
interface TransformResult {
  name?: string // Transform identifier for tracking
  type?: 'ast' | 'regex' | 'hybrid' // Transform type metadata
  phase?: string // Pipeline phase (e.g., 'color', 'structure')
  content: string // Transformed content
  changes: Change[] // Structured change descriptions
  hasChanges: boolean // Quick change detection flag
}
```

### Change

Represents a single change made by a transform.

```typescript
interface Change {
  type: string // Change category (e.g., 'color-mapping')
  description: string // Human-readable change description
  line?: number // Optional line number reference
  before?: string // Optional before value
  after?: string // Optional after value
}
```

### TransformOptions

Optional configuration for transform execution.

```typescript
interface TransformOptions {
  verbose?: boolean // Enable detailed logging
  dryRun?: boolean // Preview changes without applying
}
```

## Factory Interfaces

### RegexTransformConfig

Configuration for creating regex-based transforms.

```typescript
interface RegexTransformConfig {
  name: string // Transform name
  description: string // Transform description
  mappings: ColorMapping[] // Modern color mapping interface
  changeType?: string // Optional change type for tracking
  contentFilter?: (content: string) => boolean // Optional content filtering
}

interface ColorMapping {
  pattern: RegExp // Regular expression pattern
  replacement: string // Replacement string (supports capture groups)
  description: string // Human-readable description of the mapping
}
```

**Usage:**

```typescript
import { createRegexTransform } from './utilities/regex-transform-factory.js'

const transform = createRegexTransform({
  name: 'zinc-to-semantic',
  description: 'Convert zinc colors to semantic tokens',
  mappings: [
    {
      pattern: /bg-zinc-950/g,
      replacement: 'bg-foreground',
      description: 'zinc-950 background → semantic foreground',
    },
    {
      pattern: /text-zinc-50/g,
      replacement: 'text-background',
      description: 'zinc-50 text → semantic background',
    },
  ],
})
```

### ProtectedRegexTransformConfig

Configuration for creating protected regex transforms that respect component contexts.

```typescript
interface ProtectedRegexTransformConfig {
  name: string // Transform name
  description: string // Transform description
  mappings: ProtectedColorMapping[] // Protected color mappings
  changeType?: string // Optional change type
  contentFilter?: (content: string) => boolean // Optional content filtering
  globalProtection?: boolean // Enable global protection (default: true)
}

interface ProtectedColorMapping {
  pattern: RegExp // Regular expression pattern
  replacement: string // Replacement string
  description: string // Mapping description
  respectStyleObjects?: boolean // Protect style objects (default: true)
  respectColorsObjects?: boolean // Protect colors objects (default: true)
}
```

**Usage:**

```typescript
import { createProtectedRegexTransform } from './utilities/protected-regex-transform-factory.js'

const transform = createProtectedRegexTransform({
  name: 'button-colors',
  description: 'Transform Button component colors with protection',
  mappings: [
    {
      pattern: /zinc-900/g,
      replacement: 'foreground',
      description: 'zinc-900 → foreground',
      respectStyleObjects: true,
      respectColorsObjects: true,
    },
  ],
})
```

### ResolutionConfig

Configuration for AST resolution builder system.

```typescript
interface ResolutionConfig {
  componentName: string // Component name (e.g., 'Button')
  variableName: string // Variable name (e.g., 'resolvedColorClasses')
  defaultColor?: string // Default color fallback
  useIIFE: boolean // Use IIFE pattern vs conditional
  hasColorsObject: boolean // Component has colors object
}
```

**Usage:**

```typescript
import { buildSemanticResolution } from './resolution-builder/ast-builders.js'

const resolution = buildSemanticResolution(j, {
  componentName: 'Badge',
  variableName: 'resolvedColorClasses',
  defaultColor: 'zinc',
  useIIFE: false,
  hasColorsObject: true,
})
```

## Factory Functions

### createRegexTransform

Creates a regex-based transform with full metadata support.

```typescript
function createRegexTransform(config: RegexTransformConfig): Transform
```

**Features:**

- Modern `mappings[]` interface with structured color mappings
- Backward compatibility with legacy `patterns[]`
- Optional content filtering for conditional processing
- Full metadata in `TransformResult` (`name`, `type`, `phase`)
- Structured change tracking with descriptions

### createProtectedRegexTransform

Creates a regex transform with component-aware protection.

```typescript
function createProtectedRegexTransform(config: ProtectedRegexTransformConfig): Transform
```

**Features:**

- Style object protection to prevent modifying component color schemes
- CSS variable preservation for complex component patterns
- Colors object protection for component-specific mappings
- Global and per-mapping protection controls
- Ensures idempotent transformations

### createNoOpTransform

Creates a placeholder transform for components already using semantic tokens.

```typescript
function createNoOpTransform(name: string, description: string): Transform
```

**Features:**

- Consistent `Transform` interface compliance
- No operations performed on content
- Maintains pipeline compatibility
- Documents semantic token usage

## Resolution Builder API

### Pattern Builders

**withIIFEAndColors**

```typescript
function withIIFEAndColors(j: JSCodeshift, config: Partial<ResolutionConfig>): VariableDeclaration
```

Creates IIFE pattern for components with colors object:

```typescript
const resolvedClasses = (() => {
  if (color && isSemanticToken(color)) {
    return createSemanticStyles(color)
  }
  return colors[color] || colors['default']
})()
```

**withConditionalAndColors**

```typescript
function withConditionalAndColors(
  j: JSCodeshift,
  config: Partial<ResolutionConfig>
): VariableDeclaration
```

Creates conditional pattern for components with colors object:

```typescript
const resolvedClasses =
  color && isSemanticToken(color)
    ? createSemanticStyles(color)
    : colors[color ?? 'default'] || colors['default']
```

**withSimpleConditional**

```typescript
function withSimpleConditional(
  j: JSCodeshift,
  config: Partial<ResolutionConfig>
): VariableDeclaration
```

Creates simple conditional for components without colors object:

```typescript
const resolvedClasses = color && isSemanticToken(color) ? createSemanticStyles(color) : ''
```

### Insertion Logic

**insertSemanticResolution**

```typescript
function insertSemanticResolution(
  j: JSCodeshift,
  functionBody: any,
  resolution: VariableDeclaration
): boolean
```

Inserts semantic resolution into component function body with conflict detection.

**checkVariableExists**

```typescript
function checkVariableExists(j: JSCodeshift, functionBody: any, variableName: string): boolean
```

Checks if a variable already exists in the given scope.

## Semantic Token Types

### SemanticColorToken

Union type of all available semantic color tokens.

```typescript
type SemanticColorToken =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'muted'
  | 'accent'
  | 'card'
  | 'popover'
  | 'border'
```

## Pipeline Configuration

### TransformPhase

Defines a transform phase in the execution pipeline.

```typescript
interface TransformPhase {
  path: string // Transform module path
  type: 'ast' | 'regex' // Transform execution type
  parallel?: boolean // Can run in parallel with others
  optional?: boolean // Won't fail pipeline if missing
}
```

**Example Pipeline Configuration:**

```typescript
export const TRANSFORM_ORDER: TransformPhase[] = [
  { path: 'common/imports/clsx-to-cn', type: 'ast' },
  { path: 'common/className/add-parameter', type: 'ast' },
  { path: 'components/*/semantic-enhancement', type: 'ast', parallel: true },
  { path: 'components/*/color-mappings', type: 'regex', parallel: true },
  { path: 'common/formatting/post-process', type: 'ast' },
]
```

## Component Configuration

### ComponentConfig

Configuration for semantic enhancement transforms.

```typescript
interface ComponentConfig {
  name: string // Component name
  detectPattern: (content: string) => boolean // Detection function
  defaultColor?: string // Default color value
  typePattern: 'alias' | 'prop' // Type update pattern
  hasColorsObject: boolean // Has colors object
  variableName: string // Resolution variable name
  useIIFE: boolean // Use IIFE pattern
}
```

## Error Handling

All factory functions include comprehensive error handling:

- **Non-critical AST parsing warnings** are suppressed
- **Transform failures** return original content with error tracking
- **Invalid configurations** throw descriptive errors
- **Missing dependencies** are handled gracefully

## Best Practices

### Transform Creation

1. **Always use factory functions** for consistency
2. **Provide clear descriptions** for all mappings
3. **Use content filters** to optimize performance
4. **Test with edge cases** including malformed input

### Pattern Matching

1. **Use global flags** (`/g`) for complete replacements
2. **Escape special characters** in regex patterns
3. **Test capture groups** thoroughly
4. **Consider word boundaries** for precise matching

### Error Recovery

1. **Handle malformed JSX** gracefully
2. **Validate AST operations** before applying
3. **Provide meaningful error messages**
4. **Fail fast** for configuration errors

## Migration Guide

### Updating from Legacy Patterns

**Before (Legacy):**

```typescript
const transform = createRegexTransform({
  name: 'colors',
  patterns: [{ pattern: /zinc-900/g, replacement: 'foreground' }],
})
```

**After (Modern):**

```typescript
const transform = createRegexTransform({
  name: 'colors',
  description: 'Convert zinc to semantic tokens',
  mappings: [
    {
      pattern: /zinc-900/g,
      replacement: 'foreground',
      description: 'zinc-900 → foreground',
    },
  ],
})
```

### Factory Signature Updates

**createProtectedRegexTransform:**

```typescript
// Before
createProtectedRegexTransform('component', mappings)

// After
createProtectedRegexTransform({
  name: 'component',
  description: 'Component description',
  mappings: mappings,
})
```

**createNoOpTransform:**

```typescript
// Before
createNoOpTransform('component')

// After
createNoOpTransform('component', 'Description of why no-op')
```

## Performance Notes

- **Regex transforms** are fastest for simple pattern replacements
- **Protected transforms** add minimal overhead for safety
- **AST transforms** are slower but provide structural safety
- **Parallel execution** improves overall pipeline performance
- **Content filtering** reduces unnecessary processing

## Version Compatibility

- **TypeScript 4.0+** required for advanced type features
- **Node.js 16+** required for ESM module support
- **jscodeshift 0.13+** required for AST transforms
- **All factory interfaces** are backward compatible with proper migration path
