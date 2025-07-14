/**
 * Filesystem test fixtures
 *
 * Predefined file structures and content for testing.
 */

/**
 * Basic project structure fixture
 */
export const basicProject = {
  'package.json': JSON.stringify(
    {
      name: 'test-project',
      version: '1.0.0',
      main: 'dist/index.js',
      scripts: {
        build: 'tsc',
        test: 'jest',
      },
      dependencies: {
        typescript: '^5.0.0',
      },
    },
    null,
    2
  ),
  'tsconfig.json': JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'node',
        strict: true,
        outDir: 'dist',
        rootDir: 'src',
      },
      include: ['src/**/*'],
    },
    null,
    2
  ),
  'src/index.ts': `export const greeting = 'Hello, World!'

export function add(a: number, b: number): number {
  return a + b
}

export function multiply(a: number, b: number): number {
  return a * b
}`,
  'src/utils.ts': `export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}`,
  'tests/index.test.ts': `import { add, multiply, greeting } from '../src/index'

test('add function', () => {
  expect(add(2, 3)).toBe(5)
})

test('multiply function', () => {
  expect(multiply(2, 3)).toBe(6)
})

test('greeting constant', () => {
  expect(greeting).toBe('Hello, World!')
})`,
  'tests/utils.test.ts': `import { formatDate, capitalize } from '../src/utils'

test('formatDate function', () => {
  const date = new Date('2023-01-01T12:00:00Z')
  expect(formatDate(date)).toBe('2023-01-01')
})

test('capitalize function', () => {
  expect(capitalize('hello')).toBe('Hello')
  expect(capitalize('WORLD')).toBe('WORLD')
})`,
  'README.md': `# Test Project

This is a test project for demonstrating filesystem operations.

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`typescript
import { greeting, add } from './src/index'

console.log(greeting)
console.log(add(1, 2))
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\``,
  '.gitignore': `node_modules/
dist/
*.log
.DS_Store
coverage/`,
}

/**
 * Configuration files fixture
 */
export const configFiles = {
  'eslint.config.js': `module.exports = {
  extends: ['eslint:recommended', '@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
  },
}`,
  'prettier.config.js': `module.exports = {
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  printWidth: 80,
}`,
  'vitest.config.ts': `import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})`,
  '.env': `NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/test
API_KEY=test-key-12345`,
  '.env.example': `NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/your-db
API_KEY=your-api-key`,
}

/**
 * Documentation structure fixture
 */
export const docsStructure = {
  'docs/README.md': `# Documentation

This directory contains the project documentation.`,
  'docs/api/index.md': `# API Reference

## Functions

### add(a: number, b: number): number

Adds two numbers together.

**Parameters:**
- \`a\`: First number
- \`b\`: Second number

**Returns:** The sum of a and b`,
  'docs/api/utils.md': `# Utility Functions

## formatDate(date: Date): string

Formats a date to YYYY-MM-DD format.

## capitalize(str: string): string

Capitalizes the first letter of a string.`,
  'docs/guides/getting-started.md': `# Getting Started

## Installation

1. Clone the repository
2. Install dependencies
3. Run tests

## Development

Use the following commands for development:

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run test\` - Run tests`,
  'docs/guides/deployment.md': `# Deployment Guide

## Build Process

1. Run \`npm run build\`
2. Deploy \`dist/\` directory
3. Set environment variables

## Environment Variables

- \`NODE_ENV\`: production
- \`PORT\`: Server port
- \`DATABASE_URL\`: Database connection string`,
}

/**
 * Monorepo structure fixture
 */
export const monorepoStructure = {
  'package.json': JSON.stringify(
    {
      name: 'monorepo-test',
      private: true,
      workspaces: ['packages/*'],
      scripts: {
        build: 'lerna run build',
        test: 'lerna run test',
      },
    },
    null,
    2
  ),
  'lerna.json': JSON.stringify(
    {
      version: '1.0.0',
      npmClient: 'pnpm',
      command: {
        publish: {
          registry: 'https://registry.npmjs.org/',
        },
      },
    },
    null,
    2
  ),
  'packages/core/package.json': JSON.stringify(
    {
      name: '@test/core',
      version: '1.0.0',
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
    },
    null,
    2
  ),
  'packages/core/src/index.ts': `export const VERSION = '1.0.0'

export interface User {
  id: string
  name: string
  email: string
}

export function createUser(name: string, email: string): User {
  return {
    id: Math.random().toString(36),
    name,
    email,
  }
}`,
  'packages/utils/package.json': JSON.stringify(
    {
      name: '@test/utils',
      version: '1.0.0',
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      dependencies: {
        '@test/core': '1.0.0',
      },
    },
    null,
    2
  ),
  'packages/utils/src/index.ts': `import { User } from '@test/core'

export function getUserDisplayName(user: User): string {
  return \`\${user.name} <\${user.email}>\`
}

export function validateEmail(email: string): boolean {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)
}`,
}

/**
 * Error scenarios fixture
 */
export const errorScenarios = {
  'invalid-json/package.json': `{
  "name": "invalid-json",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.21"
  }
  // Missing closing brace`,
  'circular-deps/a.js': `const b = require('./b.js')
module.exports = { name: 'a', b }`,
  'circular-deps/b.js': `const a = require('./a.js')
module.exports = { name: 'b', a }`,
  'syntax-error/index.ts': `export function broken() {
  const x = 1
  const y = 2
  return x + y
} // Missing closing brace`,
  'missing-deps/index.ts': `import { nonExistentFunction } from 'non-existent-package'

export function useNonExistent() {
  return nonExistentFunction()
}`,
}

/**
 * Performance test fixtures
 */
export const performanceFixtures = {
  /**
   * Creates a large file structure for performance testing
   */
  createLargeStructure: (fileCount: number = 1000): Record<string, string> => {
    const structure: Record<string, string> = {}

    for (let i = 0; i < fileCount; i++) {
      const dirIndex = Math.floor(i / 50)
      const fileName = `file${i}.txt`
      const content = `This is file ${i} with some content to make it realistic. `.repeat(10)
      structure[`dir${dirIndex}/${fileName}`] = content
    }

    return structure
  },

  /**
   * Creates a deeply nested structure
   */
  createDeepStructure: (depth: number = 20): Record<string, string> => {
    const structure: Record<string, string> = {}
    let currentPath = ''

    for (let i = 0; i < depth; i++) {
      currentPath += `level${i}/`
      structure[`${currentPath}file.txt`] = `Content at depth ${i}`
    }

    return structure
  },

  /**
   * Creates a wide structure (many files in one directory)
   */
  createWideStructure: (fileCount: number = 500): Record<string, string> => {
    const structure: Record<string, string> = {}

    for (let i = 0; i < fileCount; i++) {
      structure[`file${i}.txt`] = `Content of file ${i}`
    }

    return structure
  },
}

/**
 * Binary file fixtures (simulated)
 */
export const binaryFixtures = {
  'images/logo.png': Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9hB+',
    'base64'
  ).toString('binary'),
  'fonts/custom.woff2': Buffer.from(
    'd09GMgABAAAAAANcAAoAAAAABXwAAAMPAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAABmAAgkIK',
    'base64'
  ).toString('binary'),
  'data/test.zip': Buffer.from(
    'UEsDBAoAAAAAAF9W7UAAAAAAAAAAAAAAAAASAAAAZGF0YS50eHRIZWxsbyBXb3JsZCE=',
    'base64'
  ).toString('binary'),
}

/**
 * Common file extensions and their content
 */
export const fileExtensions = {
  '.js': `module.exports = { test: true }`,
  '.ts': `export const test: boolean = true`,
  '.json': `{ "test": true }`,
  '.md': `# Test\n\nThis is a test file.`,
  '.txt': `This is a plain text file.`,
  '.html': `<!DOCTYPE html><html><body><h1>Test</h1></body></html>`,
  '.css': `body { margin: 0; padding: 0; }`,
  '.yml': `test: true\nversion: 1.0.0`,
  '.yaml': `test: true\nversion: 1.0.0`,
  '.xml': `<?xml version="1.0"?><root><test>true</test></root>`,
}

/**
 * Temporary file utilities
 */
export const tempFixtures = {
  /**
   * Creates a temporary file structure
   */
  createTempStructure: (prefix: string = 'temp'): Record<string, string> => {
    const timestamp = Date.now()
    return {
      [`${prefix}-${timestamp}/file1.txt`]: 'Temporary file 1',
      [`${prefix}-${timestamp}/file2.txt`]: 'Temporary file 2',
      [`${prefix}-${timestamp}/subdir/file3.txt`]: 'Temporary file 3',
    }
  },

  /**
   * Creates a structure with various timestamps
   */
  createTimestampedStructure: (): Record<string, string> => {
    return {
      'old-file.txt': 'Old file content',
      'recent-file.txt': 'Recent file content',
      'new-file.txt': 'New file content',
    }
  },
}

/**
 * All fixtures combined
 */
export const allFixtures = {
  basic: basicProject,
  config: configFiles,
  docs: docsStructure,
  monorepo: monorepoStructure,
  errors: errorScenarios,
  binary: binaryFixtures,
  extensions: fileExtensions,
  ...performanceFixtures,
  ...tempFixtures,
}

/**
 * Fixture utilities
 */
export const fixtureUtils = {
  /**
   * Merges multiple fixtures
   */
  merge: (...fixtures: Record<string, string>[]): Record<string, string> => {
    return Object.assign({}, ...fixtures)
  },

  /**
   * Filters fixtures by pattern
   */
  filter: (fixture: Record<string, string>, pattern: RegExp): Record<string, string> => {
    return Object.fromEntries(Object.entries(fixture).filter(([path]) => pattern.test(path)))
  },

  /**
   * Transforms fixture paths
   */
  transform: (
    fixture: Record<string, string>,
    transformer: (path: string) => string
  ): Record<string, string> => {
    return Object.fromEntries(
      Object.entries(fixture).map(([path, content]) => [transformer(path), content])
    )
  },

  /**
   * Adds prefix to all fixture paths
   */
  prefix: (fixture: Record<string, string>, prefix: string): Record<string, string> => {
    return fixtureUtils.transform(fixture, (path) => `${prefix}/${path}`)
  },
}
