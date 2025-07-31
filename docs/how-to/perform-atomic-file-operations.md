---
type: how-to
title: 'How to Perform Atomic File Operations'
description: 'Ensure file operations complete fully or not at all to prevent data corruption'
related:
  - /packages/fs/docs/reference/api.md
  - /docs/tutorials/file-operations-basics.md
  - /docs/explanation/result-types-pattern.md
---

# How to Perform Atomic File Operations

Ensure file operations complete fully or not at all to prevent data corruption.

## Basic Atomic Write

```typescript
import { fs } from '@repo/fs'
import { ok } from '@repo/core'

const writeAtomic = async (path: string, content: string) => {
  const tempPath = `${path}.tmp`

  // Write to temporary file
  const writeResult = await fs.writeFile(tempPath, content)
  if (writeResult.isErr()) {
    await fs.remove(tempPath) // Clean up
    return writeResult
  }

  // Move to final location
  const moveResult = await fs.move(tempPath, path, { overwrite: true })
  if (moveResult.isErr()) {
    await fs.remove(tempPath) // Clean up
    return moveResult
  }

  return ok(undefined)
}
```

## Atomic JSON Updates

Update JSON files without risk of corruption:

```typescript
const updateJsonAtomic = async (path: string, updater: (data: any) => any) => {
  const tempPath = `${path}.tmp`

  // Read current data
  const readResult = await fs.readJson(path)
  if (readResult.isErr()) return readResult

  // Apply update
  const updated = updater(readResult.value)

  // Write to temp file
  const writeResult = await fs.writeJson(tempPath, updated)
  if (writeResult.isErr()) {
    await fs.remove(tempPath)
    return writeResult
  }

  // Atomic replace
  return fs.move(tempPath, path, { overwrite: true })
}

// Usage
await updateJsonAtomic('./config.json', (config) => ({
  ...config,
  lastModified: new Date().toISOString(),
}))
```

## Atomic Directory Operations

Replace entire directories atomically:

```typescript
const replaceDirAtomic = async (targetDir: string, sourceDir: string) => {
  const backupDir = `${targetDir}.backup`
  const tempDir = `${targetDir}.tmp`

  // Copy source to temp
  const copyResult = await fs.copy(sourceDir, tempDir)
  if (copyResult.isErr()) {
    await fs.remove(tempDir)
    return copyResult
  }

  // Move current to backup
  if ((await fs.exists(targetDir)).value) {
    const backupResult = await fs.move(targetDir, backupDir)
    if (backupResult.isErr()) {
      await fs.remove(tempDir)
      return backupResult
    }
  }

  // Move temp to target
  const moveResult = await fs.move(tempDir, targetDir)
  if (moveResult.isErr()) {
    // Restore backup
    await fs.move(backupDir, targetDir)
    await fs.remove(tempDir)
    return moveResult
  }

  // Clean up backup
  await fs.remove(backupDir)
  return ok(undefined)
}
```

## Lock File Pattern

Prevent concurrent modifications:

```typescript
const withFileLock = async <T>(path: string, operation: () => Promise<T>): Promise<Result<T>> => {
  const lockPath = `${path}.lock`

  // Try to create lock
  const lockResult = await fs.writeFile(lockPath, process.pid.toString(), {
    flag: 'wx', // Fail if exists
  })

  if (lockResult.isErr()) {
    return err(createFileSystemError('File is locked'))
  }

  try {
    const result = await operation()
    return ok(result)
  } finally {
    // Always remove lock
    await fs.remove(lockPath)
  }
}

// Usage
const result = await withFileLock('./data.json', async () => {
  // Perform operations with exclusive access
  const data = await fs.readJson('./data.json')
  // ... modify data ...
  await fs.writeJson('./data.json', data)
})
```

## Transaction Pattern

Group multiple operations:

```typescript
type FileOperation = {
  type: 'write' | 'move' | 'remove'
  path: string
  content?: string
  target?: string
}

const executeTransaction = async (operations: FileOperation[]) => {
  const rollback: Array<() => Promise<any>> = []

  for (const op of operations) {
    try {
      switch (op.type) {
        case 'write':
          // Backup existing file
          if ((await fs.exists(op.path)).value) {
            const backup = `${op.path}.txbackup`
            await fs.copy(op.path, backup)
            rollback.push(() => fs.move(backup, op.path, { overwrite: true }))
          }

          const writeResult = await fs.writeFile(op.path, op.content!)
          if (writeResult.isErr()) throw writeResult.error
          break

        case 'move':
          await fs.move(op.path, op.target!)
          rollback.push(() => fs.move(op.target!, op.path))
          break

        case 'remove':
          const backup = `${op.path}.txbackup`
          await fs.move(op.path, backup)
          rollback.push(() => fs.move(backup, op.path))
          break
      }
    } catch (error) {
      // Rollback all operations
      for (const undo of rollback.reverse()) {
        await undo().catch(() => {}) // Best effort
      }
      return err(error as any)
    }
  }

  // Clean up backups
  for (const op of operations) {
    await fs.remove(`${op.path}.txbackup`).catch(() => {})
  }

  return ok(undefined)
}
```

## Safe Configuration Updates

Update configuration files safely:

```typescript
class ConfigManager {
  constructor(private configPath: string) {}

  async update<T>(updater: (config: T) => T): Promise<Result<T>> {
    const lockPath = `${this.configPath}.lock`
    const tempPath = `${this.configPath}.tmp`
    const backupPath = `${this.configPath}.backup`

    // Acquire lock
    const lock = await fs.writeFile(lockPath, Date.now().toString(), {
      flag: 'wx',
    })
    if (lock.isErr()) {
      return err(createFileSystemError('Config locked'))
    }

    try {
      // Read current config
      const current = await fs.readJson(this.configPath)
      if (current.isErr()) return current

      // Apply update
      const updated = updater(current.value)

      // Write to temp
      const writeResult = await fs.writeJson(tempPath, updated)
      if (writeResult.isErr()) return writeResult

      // Backup current
      await fs.copy(this.configPath, backupPath)

      // Atomic replace
      const moveResult = await fs.move(tempPath, this.configPath, {
        overwrite: true,
      })

      if (moveResult.isErr()) {
        // Restore backup
        await fs.move(backupPath, this.configPath, { overwrite: true })
        return moveResult
      }

      // Success - remove backup
      await fs.remove(backupPath)
      return ok(updated)
    } finally {
      // Release lock
      await fs.remove(lockPath)
    }
  }
}
```

## Best Practices

1. **Always use temp files** - Write to `.tmp` then move
2. **Clean up on failure** - Remove temp files in error cases
3. **Consider locks** - Prevent concurrent modifications
4. **Keep backups** - Until operation completes successfully
5. **Test failure scenarios** - Ensure rollback works correctly

## Related Resources

- [File Operations Tutorial](/docs/tutorials/file-operations-basics.md)
- [@repo/fs API Reference](/packages/fs/docs/reference/api.md)
- [Error Handling Patterns](/docs/explanation/error-handling.md)
