import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import { existsSync } from 'fs'
import { runMainPipeline } from '../../../../src/transforms/pipelines/main.js'
import {
  createTempPath,
  createAbsoluteTestPath,
  safeJoin,
} from '../../../utils/cross-platform-paths.js'

describe('transforms pipeline integration', () => {
  let tempDir: string
  const catalystSource = createAbsoluteTestPath('catalyst-ui-kit', 'typescript')

  // Skip tests in CI where catalyst-ui-kit is not available
  const skipInCI = !existsSync(catalystSource)

  beforeEach(async () => {
    tempDir = createTempPath('transforms2-test')
    await fs.mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  describe('full pipeline transformation', () => {
    it.skipIf(skipInCI).fails('transforms Button component with all enhancements', async () => {
      const buttonSource = safeJoin(catalystSource, 'button.tsx')
      const buttonDest = safeJoin(tempDir, 'button.tsx')
      await fs.copyFile(buttonSource, buttonDest)

      await runMainPipeline({
        srcDir: tempDir,
        outDir: tempDir,
        verbose: false,
        dryRun: false,
      })

      const transformed = await fs.readFile(buttonDest, 'utf-8')

      expect(transformed).toContain("import { cn } from '../utils/cn.js'")
      expect(transformed).not.toContain('import clsx')

      // Verify semantic enhancement was applied
      expect(transformed).toContain('resolvedColorClasses')
      expect(transformed).toContain('isSemanticToken')

      // Verify color transformations
      expect(transformed).not.toContain('zinc-950')
      expect(transformed).not.toContain('white/80')
      expect(transformed).toContain('foreground')
      expect(transformed).toContain('background')

      // Verify the code is still valid TypeScript
      expect(transformed).toContain('export')
      expect(transformed).toContain('function Button')

      // Verify className handling
      expect(transformed).toMatch(/className.*cn\(/)
    })

    it.skipIf(skipInCI).fails(
      'transforms multiple components maintaining consistency',
      async () => {
        // Copy multiple components
        const components = ['button.tsx', 'badge.tsx', 'checkbox.tsx', 'input.tsx']
        for (const component of components) {
          await fs.copyFile(safeJoin(catalystSource, component), safeJoin(tempDir, component))
        }

        // Run pipeline
        await runMainPipeline({
          srcDir: tempDir,
          outDir: tempDir,
          verbose: false,
          dryRun: false,
        })

        // Verify all components were transformed
        for (const component of components) {
          const content = await fs.readFile(safeJoin(tempDir, component), 'utf-8')

          // All should use cn utility
          expect(content).toContain('import { cn }')

          // All should have consistent color tokens
          expect(content).not.toContain('zinc-950')
          expect(content).not.toContain('zinc-900')
        }
      }
    )

    it.skipIf(skipInCI)('preserves component functionality after transformation', async () => {
      // Copy a complex component
      const tableSource = safeJoin(catalystSource, 'table.tsx')
      const tableDest = safeJoin(tempDir, 'table.tsx')
      await fs.copyFile(tableSource, tableDest)

      const originalContent = await fs.readFile(tableDest, 'utf-8')

      // Run pipeline
      await runMainPipeline({
        srcDir: tempDir,
        outDir: tempDir,
        verbose: false,
        dryRun: false,
      })

      const transformedContent = await fs.readFile(tableDest, 'utf-8')

      // Verify structure is preserved
      expect(transformedContent).toContain('export function Table')
      expect(transformedContent).toContain('export function TableHead')
      expect(transformedContent).toContain('export function TableBody')

      // Verify props are preserved
      if (originalContent.includes('bleed?:')) {
        expect(transformedContent).toContain('bleed?:')
      }
      if (originalContent.includes('dense?:')) {
        expect(transformedContent).toContain('dense?:')
      }

      // Verify no syntax errors (basic check)
      expect(transformedContent.split('{').length).toBe(transformedContent.split('}').length)
      expect(transformedContent.split('(').length).toBe(transformedContent.split(')').length)
      expect(transformedContent.split('[').length).toBe(transformedContent.split(']').length)
    })

    it('handles components with existing semantic tokens gracefully', async () => {
      // Create a component that already uses semantic tokens
      const mockComponent = `
import * as Headless from '@headlessui/react'
import { cn } from '../utils/cn.js'

export function MockComponent({ className }: { className?: string }) {
  return (
    <div className={cn('bg-background text-foreground', className)}>
      Already using semantic tokens
    </div>
  )
}
`
      const mockPath = safeJoin(tempDir, 'mock.tsx')
      await fs.writeFile(mockPath, mockComponent)

      // Run pipeline
      await runMainPipeline({
        srcDir: tempDir,
        outDir: tempDir,
        verbose: false,
        dryRun: false,
      })

      const transformed = await fs.readFile(mockPath, 'utf-8')

      // Should not double-transform
      expect(transformed).toContain('bg-background')
      expect(transformed).toContain('text-foreground')
      expect(transformed).not.toContain('bg-background-background')
      expect(transformed).not.toContain('text-foreground-foreground')
    })

    it.skipIf(skipInCI)('handles errors gracefully without corrupting files', async () => {
      // Create a malformed component
      const malformedComponent = `
export function Broken({ className }) {
  // Missing closing brace intentionally
  return <div className={cn('bg-zinc-900'}>
}
`
      const brokenPath = safeJoin(tempDir, 'broken.tsx')
      await fs.writeFile(brokenPath, malformedComponent)

      // Also add a valid component
      const validPath = safeJoin(tempDir, 'valid.tsx')
      await fs.copyFile(safeJoin(catalystSource, 'badge.tsx'), validPath)

      // Run pipeline - should not crash
      await runMainPipeline({
        srcDir: tempDir,
        outDir: tempDir,
        verbose: false,
        dryRun: false,
      })

      // Valid component should still be transformed
      const validContent = await fs.readFile(validPath, 'utf-8')
      expect(validContent).toContain('cn(')

      // Broken component should still exist (not deleted)
      const brokenExists = await fs
        .access(brokenPath)
        .then(() => true)
        .catch(() => false)
      expect(brokenExists).toBe(true)
    })
  })

  describe('pipeline phases', () => {
    it.skipIf(skipInCI).fails('executes transforms in correct dependency order', async () => {
      // This test verifies that transforms run in the correct order
      // by checking that later transforms can depend on earlier ones

      // Copy a component that needs all transform phases
      const dropdownSource = safeJoin(catalystSource, 'dropdown.tsx')
      const dropdownDest = safeJoin(tempDir, 'dropdown.tsx')
      await fs.copyFile(dropdownSource, dropdownDest)

      await runMainPipeline({
        srcDir: tempDir,
        outDir: tempDir,
        verbose: false,
        dryRun: false,
      })

      const transformed = await fs.readFile(dropdownDest, 'utf-8')

      // Phase 1: Import transforms should run first
      expect(transformed).toContain('import { cn }')
      expect(transformed).not.toContain('import clsx')

      // Phase 2: Structure transforms (className handling)
      expect(transformed).toMatch(/className[?:]?\s*[:=]/)

      // Phase 3: Color transforms
      expect(transformed).not.toContain('zinc-')
      expect(transformed).not.toContain('gray-')

      // Phase 4: Edge cases
      expect(transformed).not.toContain('text-white')

      // Phase 6: Formatting (check for consistent structure)
      const lines = transformed.split('\n')
      const hasBlankLineAfterImports = lines.some(
        (line, i) =>
          line.trim() === '' &&
          lines[i - 1]?.includes('import') &&
          !lines[i + 1]?.includes('import')
      )
      expect(hasBlankLineAfterImports).toBe(true)
    })
  })
})
