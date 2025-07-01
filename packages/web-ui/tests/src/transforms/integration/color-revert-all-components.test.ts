/**
 * Color-only transform→revert tests for all components
 *
 * Tests each component individually with color transforms only
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { transformLogger } from '../../../../src/transforms/shared/transform-logger.js'

// Import only color-related transforms
import { interactiveStatesTransform } from '../../../../src/transforms/components/common/colors/interactive-states.js'
import { darkModeTransform } from '../../../../src/transforms/components/common/colors/dark-mode.js'
import { baseMappingsTransform } from '../../../../src/transforms/components/common/colors/base-mappings.js'
import { textColorsEdgeCaseTransform } from '../../../../src/transforms/components/common/edge-cases/text-colors.js'

// Define color transforms once
const COLOR_TRANSFORMS = [
  { name: 'base-mappings', fn: baseMappingsTransform },
  { name: 'interactive-states', fn: interactiveStatesTransform },
  { name: 'dark-mode', fn: darkModeTransform },
  { name: 'text-colors-edge-case', fn: textColorsEdgeCaseTransform },
]

// All components to test
const COMPONENTS = [
  'alert.tsx',
  'avatar.tsx',
  'badge.tsx',
  'button.tsx',
  'checkbox.tsx',
  'combobox.tsx',
  'description-list.tsx',
  'dialog.tsx',
  'divider.tsx',
  'dropdown.tsx',
  'fieldset.tsx',
  'heading.tsx',
  'input.tsx',
  'link.tsx',
  'listbox.tsx',
  'navbar.tsx',
  'pagination.tsx',
  'radio.tsx',
  'select.tsx',
  'sidebar.tsx',
  'switch.tsx',
  'table.tsx',
  'text.tsx',
  'textarea.tsx',
]

interface TransformResult {
  transformedContent: string
  changeCount: number
}

interface DirectoryPaths {
  componentDir: string
  originalDir: string
  transformedDir: string
  revertedDir: string
}

interface FilePaths {
  originalPath: string
  transformedPath: string
  revertedPath: string
}

// Utility functions following DRY
async function getFileHash(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath)
  return createHash('sha256').update(content).digest('hex')
}

async function createDirectoryStructure(
  tempDir: string,
  component: string
): Promise<DirectoryPaths> {
  const componentDir = path.join(tempDir, component.replace('.tsx', ''))
  const originalDir = path.join(componentDir, 'original')
  const transformedDir = path.join(componentDir, 'transformed')
  const revertedDir = path.join(componentDir, 'reverted')

  await Promise.all([
    fs.mkdir(componentDir, { recursive: true }),
    fs.mkdir(originalDir, { recursive: true }),
    fs.mkdir(transformedDir, { recursive: true }),
    fs.mkdir(revertedDir, { recursive: true }),
  ])

  return { componentDir, originalDir, transformedDir, revertedDir }
}

function getFilePaths(dirs: DirectoryPaths, transformedName: string): FilePaths {
  return {
    originalPath: path.join(dirs.originalDir, transformedName),
    transformedPath: path.join(dirs.transformedDir, transformedName),
    revertedPath: path.join(dirs.revertedDir, transformedName),
  }
}

async function applyTransform(
  transformObj: any,
  currentContent: string,
  filePath: string,
  transformName: string
): Promise<{ content: string; changes: number }> {
  const transformResult = await transformObj.execute(currentContent, filePath)

  if (transformResult.hasChanges) {
    transformLogger.logFileTransform(
      filePath,
      transformName,
      transformObj.description,
      transformObj.type,
      currentContent,
      transformResult.content,
      transformResult.changes.map((c) => ({
        from: c.before || '',
        to: c.after || '',
        type: transformObj.type,
        context: c.description,
      }))
    )

    return { content: transformResult.content, changes: transformResult.changes.length }
  }

  return { content: currentContent, changes: 0 }
}

async function runColorTransformsOnComponent(
  componentName: string,
  originalContent: string,
  filePath: string,
  _sessionId: string
): Promise<TransformResult> {
  let currentContent = originalContent
  let totalChanges = 0

  for (const { name, fn } of COLOR_TRANSFORMS) {
    const result = await applyTransform(fn, currentContent, filePath, name)
    currentContent = result.content
    totalChanges += result.changes
  }

  return { transformedContent: currentContent, changeCount: totalChanges }
}

async function createAndExecuteRevertScript(
  sessionId: string,
  transformedDir: string,
  revertedDir: string,
  componentDir: string
): Promise<void> {
  await transformLogger.endSession()
  const revertScriptPath = await transformLogger.generateRevertScript(sessionId)

  // Modify script to work on reverted directory
  const scriptContent = await fs.readFile(revertScriptPath, 'utf-8')
  const modifiedContent = scriptContent.replace(
    new RegExp(transformedDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
    revertedDir
  )
  const modifiedScriptPath = path.join(componentDir, 'revert.sh')
  await fs.writeFile(modifiedScriptPath, modifiedContent, { mode: 0o755 })

  // Execute revert script
  execSync(`bash ${modifiedScriptPath}`, { stdio: 'pipe' })
}

async function saveDebugFiles(
  componentDir: string,
  component: string,
  originalContent: string,
  revertedContent: string,
  transformedContent: string
): Promise<void> {
  console.error(`\n${component} revert failed:`)
  console.error(`  Original length: ${originalContent.length}`)
  console.error(`  Reverted length: ${revertedContent.length}`)

  await Promise.all([
    fs.writeFile(path.join(componentDir, 'diff-original.tsx'), originalContent),
    fs.writeFile(path.join(componentDir, 'diff-reverted.tsx'), revertedContent),
    fs.writeFile(path.join(componentDir, 'diff-transformed.tsx'), transformedContent),
  ])

  console.error(`  Debug files saved to: ${componentDir}`)
}

describe('Color Transform→Revert for All Components', () => {
  let tempDir: string
  let sessionId: string

  const catalystSource = path.join(process.cwd(), 'catalyst-ui-kit/typescript')

  // Skip tests in CI where catalyst-ui-kit is not available
  const skipInCI = !existsSync(catalystSource)

  beforeEach(async () => {
    tempDir = path.join(process.cwd(), 'temp', `color-revert-all-${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })

    // Start a new transform session
    sessionId = await transformLogger.startSession({
      colorTransformsOnly: true,
      testRun: true,
    })
  })

  afterEach(async () => {
    if (process.env.KEEP_TEMP !== 'true') {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })

  // Create individual test for each component
  COMPONENTS.forEach((component) => {
    it.skipIf(skipInCI)(`should revert color transforms on ${component}`, async () => {
      // Create directory structure
      const dirs = await createDirectoryStructure(tempDir, component)

      // Setup file paths
      const transformedName = `catalyst-${component}`
      const paths = getFilePaths(dirs, transformedName)

      // Read and prepare original content
      const source = path.join(catalystSource, component)
      const originalContent = await fs.readFile(source, 'utf-8')
      await Promise.all([
        fs.writeFile(paths.originalPath, originalContent),
        fs.writeFile(paths.transformedPath, originalContent),
      ])

      // Apply color transforms
      console.log(`\n${component}: Applying color transforms...`)
      const { transformedContent, changeCount } = await runColorTransformsOnComponent(
        component,
        originalContent,
        paths.transformedPath,
        sessionId
      )

      if (changeCount === 0) {
        console.log(`  No color changes in ${component}`)
        return // Skip components with no color changes
      }

      console.log(`  Applied ${changeCount} color changes`)
      await fs.writeFile(paths.transformedPath, transformedContent)

      // Copy to reverted directory
      await fs.copyFile(paths.transformedPath, paths.revertedPath)

      // Generate and execute revert script
      try {
        await createAndExecuteRevertScript(
          sessionId,
          dirs.transformedDir,
          dirs.revertedDir,
          dirs.componentDir
        )
      } catch (error: any) {
        console.error(`Failed to revert ${component}:`, error.message)
        throw error
      }

      // Compare hashes
      const originalHash = await getFileHash(paths.originalPath)
      const revertedHash = await getFileHash(paths.revertedPath)

      if (originalHash !== revertedHash) {
        const revertedContent = await fs.readFile(paths.revertedPath, 'utf-8')
        await saveDebugFiles(
          dirs.componentDir,
          component,
          originalContent,
          revertedContent,
          transformedContent
        )
      }

      expect(revertedHash).toBe(originalHash)
      console.log(`  ✅ ${component} reverted successfully`)
    })
  })

  // Summary test
  it.skipIf(skipInCI)('should track color transform statistics', async () => {
    interface ComponentStats {
      name: string
      changes: number
    }

    interface TransformStats {
      totalComponents: number
      componentsWithChanges: number
      totalColorChanges: number
      componentDetails: ComponentStats[]
    }

    const stats: TransformStats = {
      totalComponents: COMPONENTS.length,
      componentsWithChanges: 0,
      totalColorChanges: 0,
      componentDetails: [],
    }

    // Start a new session for statistics
    const statsSessionId = await transformLogger.startSession({
      colorTransformsOnly: true,
      statistics: true,
    })

    // Process each component
    const results = await Promise.all(
      COMPONENTS.map(async (component) => {
        const source = path.join(catalystSource, component)
        const transformedName = `catalyst-${component}`
        const tempPath = path.join(tempDir, transformedName)

        const originalContent = await fs.readFile(source, 'utf-8')
        await fs.writeFile(tempPath, originalContent)

        const { changeCount } = await runColorTransformsOnComponent(
          component,
          originalContent,
          tempPath,
          statsSessionId
        )

        return { name: component, changes: changeCount }
      })
    )

    // Aggregate results
    results.forEach(({ name, changes }) => {
      if (changes > 0) {
        stats.componentsWithChanges++
        stats.totalColorChanges += changes
        stats.componentDetails.push({ name, changes })
      }
    })

    await transformLogger.endSession()

    // Print statistics
    printStatistics(stats)

    // Save stats to file
    await fs.writeFile(
      path.join(tempDir, 'color-transform-stats.json'),
      JSON.stringify(stats, null, 2)
    )

    expect(stats.componentsWithChanges).toBeGreaterThan(0)
    expect(stats.totalColorChanges).toBeGreaterThan(0)
  })

  // Batch test - test components in smaller groups to avoid concurrency issues
  it.skip('should revert all components in batches (for future improvement)', async () => {
    // This test is skipped because the transform logger is not thread-safe
    // When multiple sessions run concurrently, they interfere with each other
    // Future improvement: Create a thread-safe version of the logger

    const batchSize = 5
    const batches = []
    for (let i = 0; i < COMPONENTS.length; i += batchSize) {
      batches.push(COMPONENTS.slice(i, i + batchSize))
    }

    console.log(
      `\nProcessing ${COMPONENTS.length} components in ${batches.length} batches of ${batchSize}`
    )

    let totalPassed = 0
    let totalFailed = 0
    let totalSkipped = 0

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      console.log(`\nProcessing batch ${batchIndex + 1}/${batches.length}: ${batch.join(', ')}`)

      // Process batch sequentially to avoid logger conflicts
      for (const component of batch) {
        const componentSessionId = await transformLogger.startSession({
          colorTransformsOnly: true,
          batchComponent: component,
        })

        const dirs = await createDirectoryStructure(tempDir, component)
        const transformedName = `catalyst-${component}`
        const paths = getFilePaths(dirs, transformedName)

        const source = path.join(catalystSource, component)
        const originalContent = await fs.readFile(source, 'utf-8')
        await Promise.all([
          fs.writeFile(paths.originalPath, originalContent),
          fs.writeFile(paths.transformedPath, originalContent),
        ])

        const { transformedContent, changeCount } = await runColorTransformsOnComponent(
          component,
          originalContent,
          paths.transformedPath,
          componentSessionId
        )

        if (changeCount === 0) {
          totalSkipped++
          continue
        }

        await fs.writeFile(paths.transformedPath, transformedContent)
        await fs.copyFile(paths.transformedPath, paths.revertedPath)

        try {
          await createAndExecuteRevertScript(
            componentSessionId,
            dirs.transformedDir,
            dirs.revertedDir,
            dirs.componentDir
          )

          const originalHash = await getFileHash(paths.originalPath)
          const revertedHash = await getFileHash(paths.revertedPath)

          if (originalHash === revertedHash) {
            totalPassed++
            console.log(`    ✅ ${component}`)
          } else {
            totalFailed++
            console.log(`    ❌ ${component}`)
          }
        } catch (error: any) {
          totalFailed++
          console.log(`    ❌ ${component}: ${error.message}`)
        }
      }
    }

    console.log(`\n=== Batch Test Results ===`)
    console.log(`✅ Passed: ${totalPassed}`)
    console.log(`❌ Failed: ${totalFailed}`)
    console.log(`⏭️  Skipped: ${totalSkipped}`)

    expect(totalFailed).toBe(0)
  })
})

function printStatistics(stats: any): void {
  console.log('\n=== Color Transform Statistics ===')
  console.log(`Total components: ${stats.totalComponents}`)
  console.log(`Components with color changes: ${stats.componentsWithChanges}`)
  console.log(`Total color changes: ${stats.totalColorChanges}`)
  console.log('\nComponents with changes:')
  stats.componentDetails
    .sort((a: any, b: any) => b.changes - a.changes)
    .forEach(({ name, changes }: any) => {
      console.log(`  ${name}: ${changes} changes`)
    })
}
