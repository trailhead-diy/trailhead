import { describe, it, expect } from 'vitest'
import { cn } from '../../../src/components/utils/cn'

describe('Utils - cn function', () => {
  it('should merge class names correctly', () => {
    const result = cn('class1', 'class2')
    expect(result).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    // eslint-disable-next-line no-constant-binary-expression
    const result = cn('base', true && 'conditional', false && 'hidden')
    expect(result).toBe('base conditional')
  })

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'end')
    expect(result).toBe('base end')
  })

  it('should handle arrays', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(result).toBe('class1 class2 class3')
  })

  it('should handle objects', () => {
    const result = cn({
      class1: true,
      class2: false,
      class3: true,
    })
    expect(result).toBe('class1 class3')
  })

  it('should handle Tailwind merge conflicts', () => {
    const result = cn('p-4', 'p-2')
    // Should merge Tailwind classes properly, keeping the last one
    expect(result).toContain('p-2')
    expect(result).not.toContain('p-4')
  })

  it('should handle empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle complex combinations', () => {
    const isActive = true
    const isDisabled = false
    const size = 'large'

    const result = cn(
      'btn',
      {
        'btn-active': isActive,
        'btn-disabled': isDisabled,
      },
      size && `btn-${size}`,
      ['extra', 'classes']
    )

    expect(result).toContain('btn')
    expect(result).toContain('btn-active')
    expect(result).toContain('btn-large')
    expect(result).toContain('extra')
    expect(result).toContain('classes')
    expect(result).not.toContain('btn-disabled')
  })
})
