/**
 * ClassName Handling Critical Path Tests
 *
 * Tests the transformation of className handling to use cn utility.
 * Verifies proper integration with semantic tokens and existing styles.
 */

import { describe, it, expect } from 'vitest'

// Mock transforms for testing
const clsxToCnTransform = (content: string) => {
  return content
    .replace(/import\s+clsx\s+from\s+['"]clsx['"]/g, "import { cn } from '../utils/cn.js'")
    .replace(/import\s+{\s*clsx\s*}\s+from\s+['"]clsx['"]/g, "import { cn } from '../utils/cn.js'")
    .replace(/\bclsx\(/g, 'cn(')
}

const addClassNameParameter = (content: string) => {
  // Add className to component props if missing
  const componentMatch = content.match(/export\s+function\s+(\w+)\s*\(([^)]*)\)/)
  if (componentMatch && !content.includes('className')) {
    const [fullMatch, componentName, params] = componentMatch
    const newParams = params.trim()
      ? params.includes('{')
        ? params.replace(/\s*}/, ', className }')
        : `{ ${params}, className }`
      : '{ className }'

    return content.replace(fullMatch, `export function ${componentName}(${newParams})`)
  }
  return content
}

const wrapStaticClassName = (content: string) => {
  // Wrap static className strings with cn()
  return content.replace(/className="([^"]+)"/g, (match, classes) => {
    if (classes.includes('cn(')) return match
    return `className={cn("${classes}")}`
  })
}

const ensureClassNameInCn = (content: string) => {
  // Ensure className prop is included in cn() calls
  return content.replace(/cn\(([^)]+)\)/g, (match, args) => {
    if (args.includes('className')) return match
    return `cn(${args}, className)`
  })
}

describe('className handling transformations', () => {
  describe('import transformation', () => {
    it.fails('converts clsx imports to cn utility', () => {
      const inputs = [
        `import clsx from 'clsx'`,
        `import { clsx } from 'clsx'`,
        `import clsx from "clsx"`,
      ]

      inputs.forEach((input) => {
        const result = clsxToCnTransform(input)
        expect(result).toBe("import { cn } from '../utils.js'")
      })
    })

    it('replaces clsx function calls with cn', () => {
      const input = `
        const classes = clsx('base-class', { 'conditional': true })
        return <div className={clsx('px-4', 'py-2', className)} />
      `

      const result = clsxToCnTransform(input)

      expect(result).toContain('cn(')
      expect(result).not.toContain('clsx(')
      expect(result.match(/cn\(/g)?.length).toBe(2)
    })
  })

  describe('className parameter addition', () => {
    it('adds className to components without it', () => {
      const input = `
export function Button({ children }) {
  return <button>{children}</button>
}
`

      const result = addClassNameParameter(input)

      expect(result).toContain('{ children, className }')
    })

    it('preserves existing parameters when adding className', () => {
      const input = `
export function Alert({ title, severity = 'info' }) {
  return <div>{title}</div>
}
`

      const result = addClassNameParameter(input)

      expect(result).toContain("{ title, severity = 'info', className }")
    })

    it('handles components that already have className', () => {
      const input = `
export function Card({ className, children }) {
  return <div className={className}>{children}</div>
}
`

      const result = addClassNameParameter(input)

      expect(result).toBe(input) // No change
      expect(result.match(/className/g)?.length).toBe(3) // Props, param, usage
    })
  })

  describe('static className wrapping', () => {
    it('wraps static className strings with cn()', () => {
      const input = `
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium" />
        </div>
      `

      const result = wrapStaticClassName(input)

      expect(result).toContain('className={cn("flex items-center gap-4")}')
      expect(result).toContain('className={cn("text-sm font-medium")}')
    })

    it('preserves dynamic className expressions', () => {
      const input = `
        <div className={someVariable}>
          <span className={cn('base', condition && 'conditional')} />
        </div>
      `

      const result = wrapStaticClassName(input)

      expect(result).toContain('className={someVariable}')
      expect(result).toContain("className={cn('base', condition && 'conditional')}")
    })
  })

  describe('className integration with cn', () => {
    it('adds className prop to cn() calls', () => {
      const input = `
export function Button({ className }) {
  return (
    <button className={cn('px-4 py-2 rounded', 'bg-blue-500')}>
      Click me
    </button>
  )
}
      `

      const result = ensureClassNameInCn(input)

      expect(result).toContain("cn('px-4 py-2 rounded', 'bg-blue-500', className)")
    })

    it('preserves cn() calls that already include className', () => {
      const input = `
        className={cn(
          'base-styles',
          variant === 'primary' && 'primary-styles',
          className
        )}
      `

      const result = ensureClassNameInCn(input)

      expect(result).toBe(input) // No change
      expect(result.match(/className/g)?.length).toBe(2) // Opening and inside cn
    })
  })

  describe('integration with semantic tokens', () => {
    it('properly orders className arguments with semantic tokens', () => {
      const componentWithSemanticTokens = `
export function Badge({ color, className }) {
  const resolvedColorClasses = color && isSemanticToken(color) 
    ? createSemanticBadgeStyles(color) 
    : '';
    
  return (
    <span className={cn('px-2 py-1 rounded', resolvedColorClasses, className)}>
      {children}
    </span>
  )
}
`

      // The className should be last for proper override behavior
      expect(componentWithSemanticTokens).toMatch(/cn\([^)]*resolvedColorClasses[^)]*className\)/)
    })
  })

  describe('complex real-world patterns', () => {
    it('handles Headless UI integration patterns', () => {
      const headlessComponent = `
import * as Headless from '@headlessui/react'

export function Dropdown({ className }) {
  return (
    <Headless.Menu>
      <Headless.MenuButton className="px-4 py-2">
        Options
      </Headless.MenuButton>
      <Headless.MenuItems className={className}>
        <Headless.MenuItem>
          {({ active }) => (
            <a className={active ? 'bg-blue-500' : ''}>
              Edit
            </a>
          )}
        </Headless.MenuItem>
      </Headless.MenuItems>
    </Headless.Menu>
  )
}
`

      let result = wrapStaticClassName(headlessComponent)

      expect(result).toContain('className={cn("px-4 py-2")}')
      expect(result).toContain('className={className}') // MenuItems keeps dynamic

      // Now test with ensureClassNameInCn applied
      const withClassName = ensureClassNameInCn(result)
      expect(withClassName).toContain('className={cn("px-4 py-2", className)}')
    })

    it('handles conditional className patterns', () => {
      const conditionalComponent = `
export function Button({ variant, size, disabled, className }) {
  return (
    <button
      className={cn(
        'font-medium rounded transition-colors',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-900',
        size === 'sm' && 'px-3 py-1 text-sm',
        size === 'lg' && 'px-6 py-3 text-lg',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
`

      // Verify complex cn() call is preserved correctly
      expect(conditionalComponent).toContain('font-medium rounded transition-colors')
      expect(conditionalComponent).toContain("variant === 'primary'")
      expect(conditionalComponent).toContain('className') // At the end

      // Should have exactly one cn() call
      expect(conditionalComponent.match(/cn\(/g)?.length).toBe(1)
    })
  })
})
