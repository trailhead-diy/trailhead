import { describe, it, expect } from 'vitest'
import { fs } from '../index.js'

describe('Filesystem Index Exports', () => {
  it('should export convenience fs object with all operations', () => {
    expect(fs).toBeDefined()
    expect(typeof fs.readFile).toBe('function')
    expect(typeof fs.writeFile).toBe('function')
    expect(typeof fs.exists).toBe('function')
    expect(typeof fs.stat).toBe('function')
    expect(typeof fs.mkdir).toBe('function')
    expect(typeof fs.readDir).toBe('function')
    expect(typeof fs.copy).toBe('function')
    expect(typeof fs.move).toBe('function')
    expect(typeof fs.remove).toBe('function')
    expect(typeof fs.readJson).toBe('function')
    expect(typeof fs.writeJson).toBe('function')
    expect(typeof fs.ensureDir).toBe('function')
    expect(typeof fs.outputFile).toBe('function')
    expect(typeof fs.emptyDir).toBe('function')
    expect(typeof fs.findFiles).toBe('function')
    expect(typeof fs.readIfExists).toBe('function')
    expect(typeof fs.copyIfExists).toBe('function')
  })

  it('should provide functions that return promises', () => {
    // Test that the convenience functions are properly curried with default config
    const result = fs.exists('/tmp/test')
    expect(result).toBeInstanceOf(Promise)
  })
})
