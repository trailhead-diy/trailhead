/**
 * Code Preservation Regression Tests
 *
 * Ensures transforms don't break valid code or introduce regressions.
 * Tests that transformations are idempotent and preserve functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { baseMappingsTransform } from '../../../../src/transforms/components/common/colors/base-mappings.js'
import { runMainPipeline } from '../../../../src/transforms/pipelines/main.js'
import { promises as fs } from 'fs'
import { existsSync } from 'fs'
import {
  createTempPath,
  createAbsoluteTestPath,
  safeJoin,
} from '../../../utils/cross-platform-paths.js'

describe('code preservation and regression prevention', () => {
  describe('idempotent transformations', () => {
    it('running transforms multiple times produces same result', () => {
      const input = `
        className={cn(
          'bg-zinc-900 text-white',
          'hover:bg-zinc-800 focus:ring-zinc-950'
        )}
      `

      // First transformation
      const first = baseMappingsTransform.execute(input)

      // Second transformation on the result
      const second = baseMappingsTransform.execute(first.content)

      // Should be identical
      expect(second.content).toBe(first.content)
      expect(second.hasChanges).toBe(false)

      // Third transformation to be sure
      const third = baseMappingsTransform.execute(second.content)
      expect(third.content).toBe(first.content)
    })

    it('preserves already-transformed semantic tokens', () => {
      const alreadyTransformed = `
        className={cn(
          'bg-background text-foreground',
          'border-border hover:bg-muted',
          'focus:ring-primary dark:bg-card'
        )}
      `

      const result = baseMappingsTransform.execute(alreadyTransformed)

      expect(result.hasChanges).toBe(false)
      expect(result.content).toBe(alreadyTransformed)
    })
  })

  describe('syntax preservation', () => {
    it.fails('maintains valid JSX syntax after transformation', () => {
      const validJSX = `
export function Component() {
  return (
    <div className="bg-zinc-900">
      <span className={'text-white'} />
      <button className={\`hover:bg-zinc-800\`} />
      <input className={condition ? 'border-zinc-700' : 'border-zinc-300'} />
    </div>
  )
}
`

      const result = baseMappingsTransform.execute(validJSX)

      // Check balanced braces
      expect(result.content.split('{').length).toBe(result.content.split('}').length)

      // Check quotes are preserved
      expect(result.content).toContain('className="bg-foreground"')
      expect(result.content).toContain("className={'text-background'}")
      expect(result.content).toContain('className={`hover:bg-muted`}')

      // Check ternary is preserved
      expect(result.content).toContain('condition ?')
      expect(result.content).toContain(': ')
    })

    it.fails('preserves TypeScript types and interfaces', () => {
      const tsCode = `
interface ButtonProps {
  variant: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const colorMap: Record<string, string> = {
  zinc: 'zinc-900',
  gray: 'gray-900'
}

export function Button<T extends ButtonProps>({ variant, color }: T) {
  return <button className="bg-zinc-900">Click</button>
}
`

      const result = baseMappingsTransform.execute(tsCode)

      // Types should be unchanged
      expect(result.content).toContain("variant: 'primary' | 'secondary'")
      expect(result.content).toContain('Record<string, string>')
      expect(result.content).toContain('<T extends ButtonProps>')

      // Only className content should change
      expect(result.content).toContain('className="bg-foreground"')

      // Color values in objects should be preserved
      expect(result.content).toContain("zinc: 'zinc-900'")
    })
  })

  describe('non-className context preservation', () => {
    it('does not transform colors in string literals', () => {
      const stringLiterals = `
const message = 'Use zinc-900 for dark themes'
const error = "Background should be white"
const template = \`Color: \${color === 'dark' ? 'zinc-950' : 'white'}\`
`

      const result = baseMappingsTransform.execute(stringLiterals)

      expect(result.hasChanges).toBe(false)
      expect(result.content).toContain("'Use zinc-900 for dark themes'")
      expect(result.content).toContain('"Background should be white"')
      expect(result.content).toContain("'zinc-950'")
    })

    it.fails('does not transform colors in comments', () => {
      const withComments = `
// Use zinc-900 for primary text
/* Background should be white */
/**
 * @param color - Can be zinc-950 or white
 */
export function Component() {
  return <div className="bg-zinc-900" /> // This will be transformed
}
`

      const result = baseMappingsTransform.execute(withComments)

      // Comments preserved
      expect(result.content).toContain('// Use zinc-900 for primary text')
      expect(result.content).toContain('/* Background should be white */')
      expect(result.content).toContain('Can be zinc-950 or white')

      // Only className transformed
      expect(result.content).toContain('className="bg-foreground"')
    })

    it.fails('preserves colors in data attributes and aria labels', () => {
      const dataAttributes = `
<div
  data-color="zinc-900"
  aria-label="Select white theme"
  data-theme="zinc"
  className="bg-zinc-900"
>
  Content
</div>
`

      const result = baseMappingsTransform.execute(dataAttributes)

      expect(result.content).toContain('data-color="zinc-900"')
      expect(result.content).toContain('aria-label="Select white theme"')
      expect(result.content).toContain('data-theme="zinc"')
      expect(result.content).toContain('className="bg-foreground"')
    })
  })

  describe('full pipeline regression tests', () => {
    let tempDir: string
    const catalystSource = createAbsoluteTestPath('catalyst-ui-kit', 'typescript')
    const skipInCI = !existsSync(catalystSource)

    beforeEach(async () => {
      tempDir = createTempPath('regression-test')
      await fs.mkdir(tempDir, { recursive: true })
    })

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true })
    })

    it.fails('preserves component functionality after full transformation', async () => {
      const functionalComponent = `
import React, { useState, useEffect } from 'react'
import clsx from 'clsx'

interface DataItem {
  id: string
  name: string
  status: 'active' | 'inactive'
}

export function DataList({ items, onSelect }: { items: DataItem[], onSelect: (item: DataItem) => void }) {
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(filter.toLowerCase())
  )
  
  useEffect(() => {
    console.log('Filter changed:', filter)
  }, [filter])
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-zinc-200">
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter items..."
        className="w-full px-4 py-2 border-b border-zinc-200 focus:ring-2 focus:ring-zinc-950"
      />
      <ul className="divide-y divide-zinc-100">
        {filteredItems.map(item => (
          <li
            key={item.id}
            onClick={() => {
              setSelected(item.id)
              onSelect(item)
            }}
            className={clsx(
              'px-4 py-3 cursor-pointer transition-colors',
              'hover:bg-zinc-50',
              selected === item.id && 'bg-zinc-100',
              item.status === 'inactive' && 'opacity-50'
            )}
          >
            <span className="text-zinc-900">{item.name}</span>
            <span className={clsx(
              'ml-2 text-xs',
              item.status === 'active' ? 'text-green-600' : 'text-zinc-500'
            )}>
              {item.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
`

      const componentPath = safeJoin(tempDir, 'data-list.tsx')
      await fs.writeFile(componentPath, functionalComponent)

      await runMainPipeline({
        srcDir: tempDir,
        outDir: tempDir,
        verbose: false,
        dryRun: false,
      })

      const result = await fs.readFile(componentPath, 'utf-8')

      // All functionality should be preserved
      expect(result).toContain('useState')
      expect(result).toContain('useEffect')
      expect(result).toContain('filter.toLowerCase()')
      expect(result).toContain('onChange={(e) => setFilter(e.target.value)}')
      expect(result).toContain('onClick={() => {')
      expect(result).toContain('onSelect(item)')

      // Types should be preserved
      expect(result).toContain('interface DataItem')
      expect(result).toContain("status: 'active' | 'inactive'")
      expect(result).toContain('useState<string | null>(null)')

      // Conditional logic preserved
      expect(result).toContain('selected === item.id &&')
      expect(result).toContain("item.status === 'inactive' &&")
      expect(result).toContain("item.status === 'active' ?")

      // Colors should be transformed
      expect(result).toContain('bg-background')
      expect(result).toContain('border-border')
      expect(result).toContain('hover:bg-muted')
      expect(result).toContain('text-foreground')
      expect(result).toContain('focus:ring-primary')

      // cn should replace clsx
      expect(result).toContain('cn(')
      expect(result).not.toContain('clsx')
    })

    it.skipIf(skipInCI)('handles real Catalyst component without breaking', async () => {
      // Copy a real complex component
      const sourceFile = createAbsoluteTestPath('catalyst-ui-kit', 'typescript', 'navbar.tsx')
      const destFile = safeJoin(tempDir, 'navbar.tsx')

      if (
        await fs
          .access(sourceFile)
          .then(() => true)
          .catch(() => false)
      ) {
        await fs.copyFile(sourceFile, destFile)

        const original = await fs.readFile(destFile, 'utf-8')

        await runMainPipeline({
          srcDir: tempDir,
          outDir: tempDir,
          verbose: false,
          dryRun: false,
        })

        const transformed = await fs.readFile(destFile, 'utf-8')

        // Should have changes
        expect(transformed).not.toBe(original)

        // Should preserve all exports
        const originalExports = original.match(/export\s+(function|const)\s+(\w+)/g) || []
        const transformedExports = transformed.match(/export\s+(function|const)\s+(\w+)/g) || []
        expect(transformedExports.length).toBe(originalExports.length)

        // Should maintain component structure
        expect(transformed).toContain('Navbar')
        expect(transformed).toContain('NavbarSpacer')
        expect(transformed).toContain('NavbarSection')
        expect(transformed).toContain('NavbarItem')
      }
    })
  })
})
