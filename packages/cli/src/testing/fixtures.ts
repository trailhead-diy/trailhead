/**
 * Fixture management system for test data
 * Provides organized, reusable test data management
 */

export interface FixtureManager {
  get(path: string): string
  has(path: string): boolean
  list(): string[]
  setup(fs: any): Promise<void>
  cleanup(fs: any): Promise<void>
}

/**
 * Create a fixture manager for organizing test data
 */
export function createFixtureManager(fixtures: Record<string, string>): FixtureManager {
  return {
    get(path: string): string {
      if (!(path in fixtures)) {
        throw new Error(`Fixture not found: ${path}`)
      }
      return fixtures[path]
    },

    has(path: string): boolean {
      return path in fixtures
    },

    list(): string[] {
      return Object.keys(fixtures)
    },

    async setup(fs: any): Promise<void> {
      for (const [path, content] of Object.entries(fixtures)) {
        await fs.writeFile(path, content)
      }
    },

    async cleanup(fs: any): Promise<void> {
      for (const path of Object.keys(fixtures)) {
        try {
          await fs.remove(path)
        } catch {
          // Ignore cleanup errors
        }
      }
    },
  }
}

/**
 * Predefined fixture collections for common data types
 */
export const fixtures = {
  /**
   * CSV fixtures for data processing tests
   */
  csv: (data: Record<string, string>) => createFixtureManager(data),

  /**
   * JSON fixtures for configuration tests
   */
  json: (data: Record<string, object>) =>
    createFixtureManager(
      Object.fromEntries(
        Object.entries(data).map(([path, obj]) => [path, JSON.stringify(obj, null, 2)])
      )
    ),

  /**
   * YAML fixtures for configuration tests
   */
  yaml: (data: Record<string, object>) => {
    try {
      const yaml = require('yaml')
      return createFixtureManager(
        Object.fromEntries(Object.entries(data).map(([path, obj]) => [path, yaml.stringify(obj)]))
      )
    } catch {
      // Fallback to JSON if yaml package is not available
      return createFixtureManager(
        Object.fromEntries(
          Object.entries(data).map(([path, obj]) => [path, JSON.stringify(obj, null, 2)])
        )
      )
    }
  },

  /**
   * Text fixtures for general content
   */
  text: (data: Record<string, string>) => createFixtureManager(data),

  /**
   * Binary fixtures (base64 encoded)
   */
  binary: (data: Record<string, string>) =>
    createFixtureManager(
      Object.fromEntries(
        Object.entries(data).map(([path, base64]) => [
          path,
          Buffer.from(base64, 'base64').toString(),
        ])
      )
    ),

  /**
   * Package.json fixtures for CLI testing
   */
  packageJson: (
    configs: Record<
      string,
      Partial<{
        name: string
        version: string
        scripts: Record<string, string>
        dependencies: Record<string, string>
        devDependencies: Record<string, string>
      }>
    >
  ) => {
    const defaultPackageJson = {
      name: 'test-package',
      version: '1.0.0',
      scripts: {},
      dependencies: {},
      devDependencies: {},
    }

    return createFixtureManager(
      Object.fromEntries(
        Object.entries(configs).map(([path, config]) => [
          path,
          JSON.stringify({ ...defaultPackageJson, ...config }, null, 2),
        ])
      )
    )
  },

  /**
   * TypeScript config fixtures
   */
  tsconfig: (configs: Record<string, object>) =>
    createFixtureManager(
      Object.fromEntries(
        Object.entries(configs).map(([path, config]) => [path, JSON.stringify(config, null, 2)])
      )
    ),

  /**
   * Error fixtures for testing error scenarios
   */
  errors: {
    malformedCsv: createFixtureManager({
      'malformed.csv': 'name,age\n"John,25\nJane,"invalid',
    }),

    malformedJson: createFixtureManager({
      'malformed.json': '{ "name": "test", "invalid": }',
    }),

    emptyFiles: createFixtureManager({
      'empty.txt': '',
      'empty.csv': '',
      'empty.json': '',
    }),

    largeCsv: createFixtureManager({
      'large.csv':
        'name,value\n' + Array.from({ length: 10000 }, (_, i) => `item${i},${i}`).join('\n'),
    }),
  },
}

/**
 * Test data factories for common CLI testing scenarios
 */
export const testData = {
  /**
   * Generate CSV test data
   */
  csv: {
    simple: () => 'name,age,city\nJohn,25,NYC\nJane,30,LA',

    withHeaders: (headers: string[], rows: string[][]) => {
      return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    },

    largeCsv: (rows: number = 1000) => {
      const headers = 'id,name,email,age,city'
      const data = Array.from(
        { length: rows },
        (_, i) => `${i},User${i},user${i}@example.com,${20 + (i % 60)},City${i % 10}`
      ).join('\n')
      return `${headers}\n${data}`
    },
  },

  /**
   * Generate JSON test data
   */
  json: {
    simple: () => ({ name: 'test', version: '1.0.0' }),

    config: (overrides: Record<string, any> = {}) => ({
      name: 'test-config',
      version: '1.0.0',
      options: {
        debug: false,
        verbose: true,
      },
      ...overrides,
    }),

    array: (items: any[]) => items,

    nested: (depth: number = 3) => {
      let obj: any = { value: 'leaf' }
      for (let i = 0; i < depth; i++) {
        obj = { [`level${i}`]: obj }
      }
      return obj
    },
  },

  /**
   * Generate error scenarios
   */
  errors: {
    fileNotFound: () => ({ code: 'ENOENT', message: 'File not found' }),

    permissionDenied: () => ({ code: 'EACCES', message: 'Permission denied' }),

    invalidFormat: (format: string) => ({
      code: 'INVALID_FORMAT',
      message: `Unsupported format: ${format}`,
    }),

    validationError: (field: string, value: any) => ({
      code: 'VALIDATION_ERROR',
      message: `Invalid value for ${field}: ${value}`,
    }),
  },
}

/**
 * Factory for creating temporary test files
 */
export function createTempFixture(content: string, extension: string = '.txt') {
  const path = `/tmp/test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${extension}`

  return {
    path,
    content,

    async setup(fs: any) {
      await fs.writeFile(path, content)
      return path
    },

    async cleanup(fs: any) {
      try {
        await fs.remove(path)
      } catch {
        // Ignore cleanup errors
      }
    },
  }
}

/**
 * Fixture builder state
 */
export interface FixtureBuilderState {
  readonly fixtures: Record<string, string>
}

/**
 * Create initial fixture builder state
 */
export function createFixtureBuilder(): FixtureBuilderState {
  return { fixtures: {} }
}

/**
 * Add a file to the fixture builder
 */
export function addFile(
  state: FixtureBuilderState,
  path: string,
  content: string
): FixtureBuilderState {
  return {
    fixtures: { ...state.fixtures, [path]: content },
  }
}

/**
 * Add a CSV file to the fixture builder
 */
export function addCsv(
  state: FixtureBuilderState,
  path: string,
  headers: string[],
  rows: string[][]
): FixtureBuilderState {
  const content = testData.csv.withHeaders(headers, rows)
  return addFile(state, path, content)
}

/**
 * Add a JSON file to the fixture builder
 */
export function addJson(
  state: FixtureBuilderState,
  path: string,
  data: object
): FixtureBuilderState {
  return addFile(state, path, JSON.stringify(data, null, 2))
}

/**
 * Add a package.json file to the fixture builder
 */
export function addPackageJson(
  state: FixtureBuilderState,
  path: string = 'package.json',
  config: object = {}
): FixtureBuilderState {
  const defaultConfig = {
    name: 'test-package',
    version: '1.0.0',
    scripts: {},
  }
  return addJson(state, path, { ...defaultConfig, ...config })
}

/**
 * Add a directory with files to the fixture builder
 */
export function addDirectory(
  state: FixtureBuilderState,
  dirPath: string,
  files: Record<string, string>
): FixtureBuilderState {
  let newState = state
  for (const [fileName, content] of Object.entries(files)) {
    newState = addFile(newState, `${dirPath}/${fileName}`, content)
  }
  return newState
}

/**
 * Build the fixture manager from the builder state
 */
export function buildFixtures(state: FixtureBuilderState): FixtureManager {
  return createFixtureManager(state.fixtures)
}

/**
 * Convenience function for fluent fixture building
 */
export function fixtureBuilder() {
  return {
    create: createFixtureBuilder,
    addFile,
    addCsv,
    addJson,
    addPackageJson,
    addDirectory,
    build: buildFixtures,
  }
}
