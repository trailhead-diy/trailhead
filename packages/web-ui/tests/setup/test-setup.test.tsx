import { describe, it, expect } from 'vitest'

describe('Test Setup Validation', () => {
  it('should have vitest configured correctly', () => {
    expect((import.meta as any).env).toBeDefined()
  })

  it('should support JSX', () => {
    const element = <div>Test</div>
    expect(element).toBeDefined()
    expect(element.type).toBe('div')
  })

  it('should support TypeScript', () => {
    interface TestInterface {
      name: string
      value: number
    }

    const testObject: TestInterface = {
      name: 'test',
      value: 42,
    }

    expect(testObject.name).toBe('test')
    expect(testObject.value).toBe(42)
  })

  it('should have testing utilities available', () => {
    expect(expect).toBeDefined()
    expect(describe).toBeDefined()
    expect(it).toBeDefined()
  })
})
