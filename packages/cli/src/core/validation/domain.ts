import type {
  Validator,
} from './types.js'
import { Ok, Err } from './types.js'
import { string, nonEmptyString, object, createValidator, enumValue, pattern } from './base.js'


export const directoryPath = (field?: string): Validator<string> =>
  createValidator(nonEmptyString(field)).validate

export const filePath = (field?: string): Validator<string> =>
  createValidator(nonEmptyString(field)).map((path) => {
    if (!path.includes('.')) {
      throw new Error('File path should include an extension')
    }
    return path
  }).validate

export const relativePath = (field?: string): Validator<string> =>
  createValidator(nonEmptyString(field)).map((path) => {
    if (path.startsWith('/')) {
      throw new Error('Path must be relative')
    }
    if (path.includes('..') && !path.startsWith('../')) {
      throw new Error('Path contains invalid segments')
    }
    return path
  }).validate


export interface SemVer {
  readonly major: number
  readonly minor: number
  readonly patch: number
  readonly prerelease?: string
  readonly build?: string
}

export const semver =
  (field?: string): Validator<SemVer> =>
  (value) => {
    const stringResult = string(field)(value)
    if (!stringResult.success) return stringResult

    const version = stringResult.value.replace(/^[~^]/, '')
    const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/
    const match = version.match(regex)

    if (!match) {
      return Err(`Invalid semantic version format: ${version}`, field)
    }

    const [, major, minor, patch, prerelease, build] = match
    return Ok({
      major: parseInt(major, 10),
      minor: parseInt(minor, 10),
      patch: parseInt(patch, 10),
      prerelease,
      build,
    })
  }


export interface TsConfig {
  readonly compilerOptions?: {
    readonly paths?: Record<string, readonly string[]>
    readonly target?: string
    readonly baseUrl?: string
    readonly typeRoots?: readonly string[]
    readonly moduleResolution?: string
    readonly [key: string]: unknown
  }
  readonly extends?: string
  readonly include?: readonly string[]
  readonly exclude?: readonly string[]
  readonly [key: string]: unknown
}

export const tsConfig: Validator<TsConfig> = createValidator(object()).map((obj) => {
  const config = obj as TsConfig

  // Validate compilerOptions if present
  if (config.compilerOptions) {
    const co = config.compilerOptions

    // Validate paths
    if (co.paths && typeof co.paths === 'object') {
      for (const [key, value] of Object.entries(co.paths)) {
        if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) {
          throw new Error(`Path mapping for "${key}" must be an array of strings`)
        }
      }
    }

    // Validate string fields
    const stringFields = ['target', 'baseUrl', 'moduleResolution'] as const
    for (const field of stringFields) {
      if (co[field] !== undefined && typeof co[field] !== 'string') {
        throw new Error(`compilerOptions.${field} must be a string`)
      }
    }
  }

  // Validate top-level arrays
  if (config.include && !Array.isArray(config.include)) {
    throw new Error('include must be an array')
  }

  if (config.exclude && !Array.isArray(config.exclude)) {
    throw new Error('exclude must be an array')
  }

  if (config.extends !== undefined && typeof config.extends !== 'string') {
    throw new Error('extends must be a string')
  }

  return config
}).validate

export interface PackageJson {
  readonly name?: string
  readonly version?: string
  readonly dependencies?: Record<string, string>
  readonly devDependencies?: Record<string, string>
  readonly scripts?: Record<string, string>
  readonly [key: string]: unknown
}

export const packageJson: Validator<PackageJson> = createValidator(object()).map((obj) => {
  const pkg = obj as PackageJson

  // Validate string fields
  if (pkg.name !== undefined && typeof pkg.name !== 'string') {
    throw new Error('name must be a string')
  }

  if (pkg.version !== undefined && typeof pkg.version !== 'string') {
    throw new Error('version must be a string')
  }

  // Validate dependency objects
  const depFields = ['dependencies', 'devDependencies', 'scripts'] as const
  for (const field of depFields) {
    const value = pkg[field]
    if (value !== undefined) {
      if (typeof value !== 'object' || value === null) {
        throw new Error(`${field} must be an object`)
      }

      for (const [key, val] of Object.entries(value)) {
        if (typeof val !== 'string') {
          throw new Error(`${field}.${key} must be a string`)
        }
      }
    }
  }

  return pkg
}).validate


export type Framework = 'redwood-sdk' | 'nextjs' | 'vite' | 'generic-react'

export const framework = enumValue<Framework>(
  ['redwood-sdk', 'nextjs', 'vite', 'generic-react'],
  'framework'
)

export interface InstallOptions {
  readonly framework?: Framework
  readonly destinationDir?: string
  readonly catalystDir?: string
  readonly force?: boolean
  readonly dryRun?: boolean
  readonly verbose?: boolean
}

export const installOptions: Validator<InstallOptions> = createValidator(object()).map((obj) => {
  // Validate and build options object immutably
  const validatedFramework =
    obj.framework !== undefined
      ? (() => {
          const result = framework(obj.framework)
          if (!result.success) throw new Error(result.error.message)
          return result.value
        })()
      : undefined

  const validatedDestinationDir =
    obj.destinationDir !== undefined
      ? (() => {
          const result = directoryPath('destinationDir')(obj.destinationDir)
          if (!result.success) throw new Error(result.error.message)
          return result.value
        })()
      : undefined

  const validatedCatalystDir =
    obj.catalystDir !== undefined
      ? (() => {
          const result = directoryPath('catalystDir')(obj.catalystDir)
          if (!result.success) throw new Error(result.error.message)
          return result.value
        })()
      : undefined

  // Validate boolean flags
  const booleanFields = ['force', 'dryRun', 'verbose'] as const
  for (const field of booleanFields) {
    if (obj[field] !== undefined && typeof obj[field] !== 'boolean') {
      throw new Error(`${field} must be a boolean`)
    }
  }

  // Return immutable options object
  return {
    ...(validatedFramework !== undefined && { framework: validatedFramework }),
    ...(validatedDestinationDir !== undefined && { destinationDir: validatedDestinationDir }),
    ...(validatedCatalystDir !== undefined && { catalystDir: validatedCatalystDir }),
    ...(obj.force !== undefined && { force: obj.force }),
    ...(obj.dryRun !== undefined && { dryRun: obj.dryRun }),
    ...(obj.verbose !== undefined && { verbose: obj.verbose }),
  } as InstallOptions
}).validate


export const jsonContent =
  <T = unknown>(field?: string): Validator<T> =>
  (value) => {
    const stringResult = string(field)(value)
    if (!stringResult.success) return stringResult

    try {
      const parsed = JSON.parse(stringResult.value)
      return Ok(parsed as T)
    } catch (error) {
      return Err(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`, field)
    }
  }

export interface ImportStatement {
  readonly module: string
  readonly imports: readonly string[]
  readonly isDefault: boolean
}

export const importStatement = createValidator(
  pattern(
    /^\s*import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/,
    'Invalid import statement format'
  )
).map((statement): ImportStatement => {
  const match = statement.match(
    /^\s*import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/
  )!

  const [, namedImports, defaultImport, module] = match
  const imports: string[] = []

  if (defaultImport) {
    imports.push(defaultImport.trim())
  }

  if (namedImports) {
    imports.push(...namedImports.split(',').map((imp) => imp.trim()))
  }

  return {
    module,
    imports,
    isDefault: !!defaultImport,
  }
})


export interface ProjectConfig {
  readonly projectRoot: string
  readonly componentsDir: string
  readonly libDir: string
  readonly catalystDir?: string
}

export const projectConfig: Validator<ProjectConfig> = createValidator(object()).map((obj) => {
  // Required fields
  const projectRoot = nonEmptyString('projectRoot')(obj.projectRoot)
  if (!projectRoot.success) throw new Error(projectRoot.error.message)

  const componentsDir = nonEmptyString('componentsDir')(obj.componentsDir)
  if (!componentsDir.success) throw new Error(componentsDir.error.message)

  const libDir = nonEmptyString('libDir')(obj.libDir)
  if (!libDir.success) throw new Error(libDir.error.message)

  // Optional fields
  let catalystDir: string | undefined
  if (obj.catalystDir !== undefined) {
    const result = nonEmptyString('catalystDir')(obj.catalystDir)
    if (!result.success) throw new Error(result.error.message)
    catalystDir = result.value
  }

  return {
    projectRoot: projectRoot.value,
    componentsDir: componentsDir.value,
    libDir: libDir.value,
    catalystDir,
  }
}).validate
