---
type: reference
title: 'CLI Build Configuration Reference'
description: 'Complete reference for build configuration options, bundler settings, and optimization parameters for CLI applications'
related:
  - /docs/reference/core-api
  - /packages/cli/docs/how-to/import-patterns.md
  - /packages/cli/docs/how-to/optimization-guide.md
---

# CLI Build Configuration Reference

Complete reference for build configuration options, bundler settings, and optimization parameters for CLI applications built with `@esteban-url/cli`.

## Configuration Files

### `tsup.config.ts`

Primary build configuration file using tsup bundler.

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: 'node18',
  external: [],
  noExternal: [],
  banner: {},
  footer: {},
  define: {},
  env: {},
  publicDir: false,
  shims: true,
  keepNames: true,
  treeshake: true,
})
```

### `package.json` Build Configuration

Build-related package.json configuration.

```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "pnpm clean && tsup",
    "build:prod": "NODE_ENV=production tsup",
    "dev": "tsup --watch",
    "clean": "rm -rf dist"
  },
  "files": ["dist", "README.md"],
  "sideEffects": false
}
```

## Build Options

### Entry Points

#### `entry`

Specifies the entry points for the build.

```typescript
entry: string | string[] | Record<string, string>
```

**Options**:

- `string` - Single entry point
- `string[]` - Multiple entry points
- `Record<string, string>` - Named entry points

**Examples**:

```typescript
// Single entry
entry: 'src/index.ts'

// Multiple entries
entry: ['src/index.ts', 'src/cli.ts']

// Named entries
entry: {
  index: 'src/index.ts',
  cli: 'src/cli.ts'
}
```

### Output Configuration

#### `format`

Output format for the bundle.

```typescript
format: ('cjs' | 'esm' | 'iife')[]
```

**Options**:

- `'cjs'` - CommonJS format
- `'esm'` - ES Modules format (recommended)
- `'iife'` - Immediately Invoked Function Expression

#### `outDir`

Output directory for built files.

```typescript
outDir: string
```

**Default**: `'dist'`

#### `outExtension`

File extension mapping for outputs.

```typescript
outExtension: (ctx: { format: string }) => Record<string, string>
```

**Example**:

```typescript
outExtension: ({ format }) => ({
  js: format === 'cjs' ? '.cjs' : '.js',
})
```

### TypeScript Configuration

#### `dts`

Generate TypeScript declaration files.

```typescript
dts: boolean | DtsConfig
```

**Options**:

- `true` - Generate .d.ts files
- `false` - Skip declaration generation
- `DtsConfig` - Advanced configuration

**DtsConfig**:

```typescript
interface DtsConfig {
  entry?: string | string[]
  resolve?: boolean
  only?: boolean
  banner?: string
  footer?: string
}
```

#### `target`

Target JavaScript version/environment.

```typescript
target: string | string[]
```

**Common Values**:

- `'node18'` - Node.js 18+ (recommended for CLI)
- `'node16'` - Node.js 16+
- `'es2022'` - ECMAScript 2022
- `'esnext'` - Latest ECMAScript features

### Optimization Options

#### `minify`

Enable code minification.

```typescript
minify: boolean | 'terser' | 'esbuild'
```

**Options**:

- `false` - No minification (recommended for CLI)
- `true` - Use esbuild minifier
- `'terser'` - Use Terser minifier
- `'esbuild'` - Use esbuild minifier

#### `treeshake`

Enable tree shaking for dead code elimination.

```typescript
treeshake: boolean | TreeshakeOptions
```

**TreeshakeOptions**:

```typescript
interface TreeshakeOptions {
  moduleSideEffects?: boolean | string[]
  propertyReadSideEffects?: boolean
  tryCatchDeoptimization?: boolean
}
```

#### `splitting`

Enable code splitting.

```typescript
splitting: boolean
```

**Note**: Generally set to `false` for CLI applications to avoid multiple output files.

### Source Maps

#### `sourcemap`

Generate source maps for debugging.

```typescript
sourcemap: boolean | 'inline'
```

**Options**:

- `true` - Generate separate .map files
- `false` - No source maps
- `'inline'` - Inline source maps in output

### External Dependencies

#### `external`

Mark dependencies as external (not bundled).

```typescript
external: string[]
```

**Example**:

```typescript
external: ['fs', 'path', 'crypto']
```

#### `noExternal`

Override external dependencies to be bundled.

```typescript
noExternal: string[] | RegExp[]
```

**Example**:

```typescript
noExternal: ['chalk', 'commander']
```

### Environment Configuration

#### `env`

Define environment variables at build time.

```typescript
env: Record<string, string>
```

**Example**:

```typescript
env: {
  NODE_ENV: 'production',
  VERSION: process.env.npm_package_version
}
```

#### `define`

Define compile-time constants.

```typescript
define: Record<string, string>
```

**Example**:

```typescript
define: {
  __VERSION__: JSON.stringify(process.env.npm_package_version),
  __DEV__: 'false'
}
```

### Advanced Options

#### `banner` and `footer`

Add code to the beginning or end of output files.

```typescript
banner: Record<string, string>
footer: Record<string, string>
```

**Example**:

```typescript
banner: {
  js: '#!/usr/bin/env node'
}
```

#### `shims`

Enable Node.js shims for browser compatibility.

```typescript
shims: boolean
```

**Note**: Set to `true` for CLI applications.

#### `keepNames`

Preserve function and class names.

```typescript
keepNames: boolean
```

**Note**: Recommended `true` for CLI debugging.

#### `clean`

Clean output directory before build.

```typescript
clean: boolean
```

#### `watch`

Watch mode configuration.

```typescript
watch: boolean | string[] | WatchOptions
```

**WatchOptions**:

```typescript
interface WatchOptions {
  include?: string[]
  exclude?: string[]
  clearScreen?: boolean
  onRebuild?: (error: Error | null, result: BuildResult | null) => void
}
```

## Build Profiles

### Development Profile

Optimized for development speed and debugging.

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'node18',
  shims: true,
  keepNames: true,
  treeshake: false,
  splitting: false,
  watch: process.env.NODE_ENV === 'development',
})
```

### Production Profile

Optimized for production size and performance.

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  minify: 'esbuild',
  target: 'node18',
  shims: true,
  keepNames: false,
  treeshake: true,
  splitting: false,
  external: ['fs', 'path', 'crypto', 'os', 'util'],
  env: {
    NODE_ENV: 'production',
  },
})
```

### Library Profile

Optimized for library distribution.

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  target: ['node16', 'node18'],
  shims: true,
  keepNames: true,
  treeshake: true,
  splitting: false,
  external: (id) => !id.startsWith('.') && !id.startsWith('/'),
})
```

## Package.json Configuration

### Export Maps

Modern export map configuration for better module resolution.

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./command": {
      "types": "./dist/command/index.d.ts",
      "import": "./dist/command/index.js"
    },
    "./testing": {
      "types": "./dist/testing/index.d.ts",
      "import": "./dist/testing/index.js"
    }
  }
}
```

### Binary Configuration

For CLI executables.

```json
{
  "bin": {
    "my-cli": "./dist/cli.js"
  }
}
```

### Files Configuration

Specify which files to include in npm package.

```json
{
  "files": ["dist", "README.md", "CHANGELOG.md"]
}
```

### Side Effects

Declare if package has side effects.

```json
{
  "sideEffects": false
}
```

## Environment-Specific Configuration

### Conditional Configuration

```typescript
import { defineConfig } from 'tsup'

const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: isDev,
  minify: isProd,
  target: 'node18',
  watch: isDev,
  external: isProd ? ['fs', 'path', 'crypto'] : [],
  define: {
    __DEV__: JSON.stringify(isDev),
    __PROD__: JSON.stringify(isProd),
  },
})
```

### Multiple Configurations

```typescript
import { defineConfig } from 'tsup'

export default defineConfig([
  // Main build
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    outDir: 'dist',
  },
  // CLI build
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    outDir: 'dist',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
])
```

## Build Scripts

### Basic Scripts

```json
{
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch",
    "build:prod": "NODE_ENV=production tsup",
    "clean": "rm -rf dist",
    "dev": "tsup --watch"
  }
}
```

### Advanced Scripts

```json
{
  "scripts": {
    "build": "pnpm clean && pnpm build:types && pnpm build:js",
    "build:types": "tsc --emitDeclarationOnly",
    "build:js": "tsup",
    "build:prod": "NODE_ENV=production pnpm build",
    "build:analyze": "tsup --metafile",
    "clean": "rm -rf dist *.tsbuildinfo",
    "dev": "tsup --watch --onSuccess \"node dist/index.js\"",
    "prebuild": "pnpm clean",
    "postbuild": "pnpm build:validate",
    "build:validate": "node -e \"require('./dist/index.js')\""
  }
}
```

## Troubleshooting

### Common Issues

#### Module Resolution

```typescript
// Fix: Ensure proper extensions
entry: ['src/index.ts'] // not 'src/index'

// Fix: Use proper target
target: 'node18' // for CLI apps
```

#### External Dependencies

```typescript
// Problem: Bundling Node.js built-ins
external: ['fs', 'path', 'crypto', 'os']

// Problem: Circular dependencies
splitting: false // for CLI apps
```

#### Type Generation

```typescript
// Ensure TypeScript configuration
dts: (true,
  // and proper tsconfig.json
  {
    compilerOptions: {
      declaration: true,
      declarationMap: true,
    },
  })
```

### Performance Optimization

#### Bundle Analysis

```bash
# Generate metafile for analysis
pnpm build --metafile

# Use bundle analyzer
npx esbuild-visualizer --metadata meta.json
```

#### Build Speed

```typescript
// Faster builds
{
  dts: false, // Skip in development
  sourcemap: false, // Skip in production
  minify: false, // Skip in development
  treeshake: false // Skip in development
}
```

## Related Configuration Files

### `tsconfig.json`

TypeScript compiler configuration.

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"]
}
```

### `.gitignore`

```
dist/
*.tsbuildinfo
.tsup/
meta.json
```

### `.npmignore`

```
src/
tests/
*.test.ts
tsconfig.json
tsup.config.ts
.github/
```

## Best Practices

### CLI Applications

1. **Use ESM format** for modern Node.js
2. **Disable splitting** to create single executable
3. **Enable shims** for Node.js compatibility
4. **External built-ins** to reduce bundle size
5. **Keep names** for better debugging
6. **Add shebang** for executable files

### Library Packages

1. **Support multiple formats** (ESM + CJS)
2. **Generate TypeScript declarations**
3. **Enable tree shaking**
4. **External peer dependencies**
5. **Provide source maps**
6. **Use semantic versioning**

### Development Workflow

1. **Watch mode** for development
2. **Source maps** for debugging
3. **Fast builds** over optimization
4. **Clean builds** for production
5. **Validate builds** in CI/CD
