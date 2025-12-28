---
type: how-to
title: 'File Operations'
description: 'Perform common filesystem tasks with Result-based error handling'
prerequisites:
  - 'Understanding of Result types'
  - 'Basic TypeScript knowledge'
  - 'Node.js filesystem concepts'
related:
  - /packages/cli/docs/reference/core.md
  - /docs/how-to/apply-functional-patterns
  - /packages/data/docs/how-to/process-data-files
---

# File Operations

This guide shows you how to perform common filesystem tasks using Result-based error handling and functional patterns.

## Basic File Operations

### Read Files

```typescript
import { fs } from '@trailhead/fs'

async const readConfigFile = async (configPath: string) => {
  const result = await fs.readFile(configPath)
  if (!result.success) {
    console.error('Failed to read config:', result.error.message)
    return result
  }

  console.log('Config content:', result.value)
  return result
}
```

### Write Files

```typescript
import { fs } from '@trailhead/fs'

async const saveUserData = async (filePath: string, data: string) => {
  const result = await fs.writeFile(filePath, data)
  if (!result.success) {
    console.error('Failed to save data:', result.error.message)
    return result
  }

  console.log('Data saved successfully')
  return result
}
```

### Check File Existence

```typescript
import { fs } from '@trailhead/fs'

async const processIfExists = async (filePath: string) => {
  const existsResult = await fs.exists(filePath)
  if (!existsResult.success) {
    return existsResult
  }

  if (!existsResult.value) {
    return err(new Error(`File not found: ${filePath}`))
  }

  // File exists, proceed with processing
  const readResult = await fs.readFile(filePath)
  return readResult
}
```

## JSON Operations

### Read and Parse JSON

```typescript
import { fs } from '@trailhead/fs'

interface Config {
  port: number
  host: string
  features: string[]
}

async const loadConfig = async (configPath: string) => {
  const result = await fs.readJson<Config>(configPath)
  if (!result.success) {
    console.error('Failed to load config:', result.error.message)
    return result
  }

  const config = result.value
  console.log(`Server will run on ${config.host}:${config.port}`)
  return result
}
```

### Write JSON Files

```typescript
import { fs } from '@trailhead/fs'

async const saveAppState = async (statePath: string, state: any) => {
  const result = await fs.writeJson(statePath, state)
  if (!result.success) {
    console.error('Failed to save state:', result.error.message)
    return result
  }

  console.log('Application state saved')
  return result
}
```

### Update JSON Configuration

```typescript
import { fs } from '@trailhead/fs'

async const updateConfig = async (configPath: string, updates: Partial<Config>) => {
  // Read existing config
  const readResult = await fs.readJson<Config>(configPath)
  if (!readResult.success) {
    return readResult
  }

  // Merge updates
  const updatedConfig = {
    ...readResult.value,
    ...updates,
    lastUpdated: new Date().toISOString(),
  }

  // Write back to file
  const writeResult = await fs.writeJson(configPath, updatedConfig)
  if (!writeResult.success) {
    return writeResult
  }

  console.log('Configuration updated')
  return writeResult
}
```

## Directory Operations

### Create Directories

```typescript
import { fs } from '@trailhead/fs'

async const setupProjectStructure = async (projectPath: string) => {
  // Create main project directory
  const projectResult = await fs.mkdir(projectPath)
  if (!projectResult.success) {
    return projectResult
  }

  // Create subdirectories
  const directories = ['src', 'tests', 'docs', 'build']

  for (const dir of directories) {
    const dirPath = join(projectPath, dir)
    const dirResult = await fs.mkdir(dirPath)
    if (!dirResult.success) {
      console.error(`Failed to create ${dir}:`, dirResult.error.message)
      return dirResult
    }
  }

  console.log('Project structure created')
  return ok(undefined)
}
```

### Ensure Directory Exists

```typescript
import { fs } from '@trailhead/fs'

async const ensureOutputDirectory = async (outputPath: string) => {
  const result = await fs.ensureDir(outputPath)
  if (!result.success) {
    console.error('Failed to ensure directory:', result.error.message)
    return result
  }

  console.log(`Directory ready: ${outputPath}`)
  return result
}
```

### List Directory Contents

```typescript
import { fs } from '@trailhead/fs'

async const listProjectFiles = async (projectPath: string) => {
  const result = await fs.readDir(projectPath)
  if (!result.success) {
    console.error('Failed to read directory:', result.error.message)
    return result
  }

  const files = result.value
  console.log('Project files:')
  files.forEach((file) => console.log(`  - ${file}`))

  return result
}
```

## File System Utilities

### Copy Files and Directories

```typescript
import { fs } from '@trailhead/fs'

async const backupConfig = async (configPath: string) => {
  const backupPath = `${configPath}.backup`

  const result = await fs.copy(configPath, backupPath)
  if (!result.success) {
    console.error('Backup failed:', result.error.message)
    return result
  }

  console.log(`Config backed up to ${backupPath}`)
  return result
}
```

### Move/Rename Files

```typescript
import { fs } from '@trailhead/fs'

async const organizeFiles = async (tempDir: string, finalDir: string) => {
  // Ensure destination directory exists
  const ensureResult = await fs.ensureDir(finalDir)
  if (!ensureResult.success) {
    return ensureResult
  }

  // List files in temp directory
  const listResult = await fs.readDir(tempDir)
  if (!listResult.success) {
    return listResult
  }

  // Move each file
  for (const file of listResult.value) {
    const srcPath = join(tempDir, file)
    const destPath = join(finalDir, file)

    const moveResult = await fs.move(srcPath, destPath)
    if (!moveResult.success) {
      console.error(`Failed to move ${file}:`, moveResult.error.message)
      return moveResult
    }
  }

  console.log(`Moved ${listResult.value.length} files`)
  return ok(undefined)
}
```

### Remove Files and Directories

```typescript
import { fs } from '@trailhead/fs'

async const cleanupTempFiles = async (tempDir: string) => {
  // Check if directory exists
  const existsResult = await fs.exists(tempDir)
  if (!existsResult.success) {
    return existsResult
  }

  if (!existsResult.value) {
    console.log('Temp directory does not exist')
    return ok(undefined)
  }

  // Remove directory and all contents
  const removeResult = await fs.remove(tempDir)
  if (!removeResult.success) {
    console.error('Failed to cleanup:', removeResult.error.message)
    return removeResult
  }

  console.log('Temp files cleaned up')
  return removeResult
}
```

## Advanced File Operations

### Find Files by Pattern

```typescript
import { fs } from '@trailhead/fs'

async const findSourceFiles = async (projectPath: string) => {
  // Find all TypeScript files
  const tsResult = await fs.findFiles(join(projectPath, '**/*.ts'))
  if (!tsResult.success) {
    return tsResult
  }

  console.log('TypeScript files:')
  tsResult.value.forEach((file) => console.log(`  - ${file}`))

  // Find all test files
  const testResult = await fs.findFiles(join(projectPath, '**/*.test.{ts,js}'))
  if (!testResult.success) {
    return testResult
  }

  console.log('Test files:')
  testResult.value.forEach((file) => console.log(`  - ${file}`))

  return ok({
    sourceFiles: tsResult.value,
    testFiles: testResult.value,
  })
}
```

### Get File Statistics

```typescript
import { fs } from '@trailhead/fs'

async const analyzeFile = async (filePath: string) => {
  const statResult = await fs.stat(filePath)
  if (!statResult.success) {
    console.error('Failed to get file stats:', statResult.error.message)
    return statResult
  }

  const stats = statResult.value
  console.log(`File: ${filePath}`)
  console.log(`  Size: ${stats.size} bytes`)
  console.log(`  Type: ${stats.isFile() ? 'File' : 'Directory'}`)
  console.log(`  Modified: ${stats.mtime.toISOString()}`)
  console.log(`  Created: ${stats.birthtime.toISOString()}`)

  return statResult
}
```

### Output File with Directory Creation

```typescript
import { fs } from '@trailhead/fs'

async const saveReport = async (reportPath: string, reportData: string) => {
  // This will create parent directories if they don't exist
  const result = await fs.outputFile(reportPath, reportData)
  if (!result.success) {
    console.error('Failed to save report:', result.error.message)
    return result
  }

  console.log(`Report saved to ${reportPath}`)
  return result
}
```

## Error Handling Patterns

### Graceful Fallbacks

```typescript
import { fs } from '@trailhead/fs'

async const readConfigWithDefaults = async (configPath: string) => {
  const result = await fs.readJson(configPath)

  if (result.success) {
    console.log('Using custom configuration')
    return result
  }

  // Log warning but continue with defaults
  console.warn(`Config file not found, using defaults: ${result.error.message}`)

  const defaultConfig = {
    port: 3000,
    host: 'localhost',
    debug: false,
  }

  return ok(defaultConfig)
}
```

### Conditional Operations

```typescript
import { fs } from '@trailhead/fs'

async const conditionalCopy = async (srcPath: string, destPath: string, overwrite = false) => {
  // Check if source exists
  const srcExistsResult = await fs.exists(srcPath)
  if (!srcExistsResult.success) {
    return srcExistsResult
  }

  if (!srcExistsResult.value) {
    return err(new Error(`Source file not found: ${srcPath}`))
  }

  // Check if destination exists
  const destExistsResult = await fs.exists(destPath)
  if (!destExistsResult.success) {
    return destExistsResult
  }

  if (destExistsResult.value && !overwrite) {
    return err(new Error(`Destination exists and overwrite is false: ${destPath}`))
  }

  // Perform the copy
  const copyResult = await fs.copy(srcPath, destPath)
  if (!copyResult.success) {
    return copyResult
  }

  console.log(`Copied ${srcPath} → ${destPath}`)
  return copyResult
}
```

### Multiple Operation Chains

```typescript
import { fs } from '@trailhead/fs'

async const processConfigFile = async (configPath: string, outputPath: string) => {
  // Chain multiple operations with error propagation

  // 1. Read config file
  const readResult = await fs.readJson(configPath)
  if (!readResult.success) {
    console.error('Failed to read config:', readResult.error.message)
    return readResult
  }

  // 2. Transform config data
  const config = readResult.value
  const transformedConfig = {
    ...config,
    environment: 'production',
    processed: true,
    processedAt: new Date().toISOString(),
  }

  // 3. Ensure output directory exists
  const outputDir = dirname(outputPath)
  const ensureDirResult = await fs.ensureDir(outputDir)
  if (!ensureDirResult.success) {
    console.error('Failed to create output directory:', ensureDirResult.error.message)
    return ensureDirResult
  }

  // 4. Write transformed config
  const writeResult = await fs.writeJson(outputPath, transformedConfig)
  if (!writeResult.success) {
    console.error('Failed to write output:', writeResult.error.message)
    return writeResult
  }

  console.log('Config processing completed successfully')
  return ok({ inputPath: configPath, outputPath, processed: true })
}
```

## Path Manipulation

### Working with Paths

```typescript
import { join, dirname, basename, extname, resolve } from '@trailhead/fs/utils'

const analyzeFilePath = (inputPath: string) => {
  const absolutePath = resolve(inputPath)
  const directory = dirname(absolutePath)
  const filename = basename(absolutePath)
  const extension = extname(absolutePath)
  const nameWithoutExt = basename(absolutePath, extension)

  console.log('Path analysis:')
  console.log(`  Original: ${inputPath}`)
  console.log(`  Absolute: ${absolutePath}`)
  console.log(`  Directory: ${directory}`)
  console.log(`  Filename: ${filename}`)
  console.log(`  Name: ${nameWithoutExt}`)
  console.log(`  Extension: ${extension}`)

  return {
    original: inputPath,
    absolute: absolutePath,
    directory,
    filename,
    name: nameWithoutExt,
    extension,
  }
}
```

### Build Dynamic Paths

```typescript
import { join } from '@trailhead/fs/utils'
import { fs } from '@trailhead/fs'

async const setupProjectLayout = async (projectName: string, baseDir: string) => {
  const projectPath = join(baseDir, projectName)

  const layout = {
    root: projectPath,
    src: join(projectPath, 'src'),
    tests: join(projectPath, 'tests'),
    docs: join(projectPath, 'docs'),
    build: join(projectPath, 'build'),
    config: join(projectPath, 'config'),
  }

  // Create all directories
  for (const [name, path] of Object.entries(layout)) {
    const result = await fs.ensureDir(path)
    if (!result.success) {
      console.error(`Failed to create ${name} directory:`, result.error.message)
      return result
    }
  }

  // Create initial files
  const packageJsonPath = join(layout.root, 'package.json')
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    main: 'src/index.js',
    scripts: {
      build: 'tsc',
      test: 'jest',
    },
  }

  const packageResult = await fs.writeJson(packageJsonPath, packageJson)
  if (!packageResult.success) {
    return packageResult
  }

  console.log('Project layout created:', layout)
  return ok(layout)
}
```

## Batch Operations

### Process Multiple Files

```typescript
import { fs } from '@trailhead/fs'

async const processMultipleFiles = async (filePaths: string[]) => {
  const results = []
  const errors = []

  for (const filePath of filePaths) {
    const readResult = await fs.readFile(filePath)

    if (readResult.success) {
      // Process file content
      const processed = readResult.value.toUpperCase()
      const outputPath = filePath.replace(/\.txt$/, '.processed.txt')

      const writeResult = await fs.writeFile(outputPath, processed)
      if (writeResult.success) {
        results.push({ input: filePath, output: outputPath })
      } else {
        errors.push({ file: filePath, error: writeResult.error.message })
      }
    } else {
      errors.push({ file: filePath, error: readResult.error.message })
    }
  }

  return ok({
    successful: results.length,
    failed: errors.length,
    results,
    errors,
  })
}
```

### Parallel File Operations

```typescript
import { fs } from '@trailhead/fs'

async const copyMultipleFiles = async (fileMappings: Array<{ src: string; dest: string }>) => {
  // Process all copies in parallel
  const copyPromises = fileMappings.map(async ({ src, dest }) => {
    const result = await fs.copy(src, dest)
    return { src, dest, success: result.success, error: result.success ? null : result.error }
  })

  const results = await Promise.all(copyPromises)

  const successful = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  if (failed.length > 0) {
    console.error('Some copies failed:')
    failed.forEach(({ src, dest, error }) => {
      console.error(`  ${src} → ${dest}: ${error?.message}`)
    })
  }

  console.log(`Copied ${successful.length}/${results.length} files`)

  return ok({
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    results,
  })
}
```

## Integration with Other Packages

### With Data Processing

```typescript
import { fs } from '@trailhead/fs'
import { data } from '@trailhead/data'

async const convertDataFiles = async (inputDir: string, outputDir: string) => {
  // Find all data files
  const patterns = ['**/*.csv', '**/*.json', '**/*.xlsx']
  const allFiles = []

  for (const pattern of patterns) {
    const findResult = await fs.findFiles(join(inputDir, pattern))
    if (findResult.success) {
      allFiles.push(...findResult.value)
    }
  }

  // Ensure output directory exists
  const ensureResult = await fs.ensureDir(outputDir)
  if (!ensureResult.success) {
    return ensureResult
  }

  // Process each file
  for (const filePath of allFiles) {
    const relativePath = relative(inputDir, filePath)
    const outputPath = join(outputDir, relativePath.replace(/\.[^.]+$/, '.json'))

    // Parse with auto-detection
    const parseResult = await data.parseAuto(filePath)
    if (!parseResult.success) {
      console.error(`Failed to parse ${filePath}:`, parseResult.error.message)
      continue
    }

    // Write as JSON
    const writeResult = await data.writeAuto(outputPath, parseResult.value)
    if (!writeResult.success) {
      console.error(`Failed to write ${outputPath}:`, writeResult.error.message)
      continue
    }

    console.log(`Converted ${filePath} → ${outputPath}`)
  }

  return ok({ processed: allFiles.length })
}
```

### With Validation

```typescript
import { fs } from '@trailhead/fs'
import { z } from 'zod'

const configSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean(),
  }),
})

type UserConfig = z.infer<typeof configSchema>

const loadUserConfig = async (configPath: string) => {
  // Read config file
  const readResult = await fs.readJson(configPath)
  if (!readResult.success) {
    return readResult
  }

  // Validate config structure
  const validationResult = configSchema.safeParse(readResult.value)
  if (!validationResult.success) {
    return err(new Error(`Invalid config: ${validationResult.error.message}`))
  }

  const config = validationResult.data
  console.log(`Loaded config for ${config.name}`)

  return ok(config)
}
```

## Next Steps

- Review [FileSystem API Documentation](/docs/@trailhead.fs.md) for detailed function documentation
- Learn about [Result Patterns](../../explanation/result-patterns.md)for advanced error handling
- Explore [Data Processing](../../../data/how-to/process-data-files.md)for working with data files
