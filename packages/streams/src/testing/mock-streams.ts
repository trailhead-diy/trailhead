/**
 * Mock streams for testing
 */

import { Readable, Writable, Transform } from 'stream'

/**
 * Mock readable stream
 */
export class MockReadable extends Readable {
  private items: any[]
  private index = 0
  private shouldError = false
  private errorAfter = -1

  constructor(items: any[] = [], options: any = {}) {
    super({ objectMode: true, ...options })
    this.items = items
  }

  _read() {
    if (this.shouldError && this.index === this.errorAfter) {
      this.emit('error', new Error('Mock stream error'))
      return
    }

    if (this.index < this.items.length) {
      this.push(this.items[this.index++])
    } else {
      this.push(null)
    }
  }

  setError(afterItems: number = 0) {
    this.shouldError = true
    this.errorAfter = afterItems
  }
}

/**
 * Mock writable stream
 */
export class MockWritable extends Writable {
  public written: any[] = []
  private shouldError = false
  private errorAfter = -1

  constructor(options: any = {}) {
    super({ objectMode: true, ...options })
  }

  _write(chunk: any, encoding: string, callback: Function) {
    if (this.shouldError && this.written.length === this.errorAfter) {
      callback(new Error('Mock stream error'))
      return
    }

    this.written.push(chunk)
    callback()
  }

  setError(afterItems: number = 0) {
    this.shouldError = true
    this.errorAfter = afterItems
  }
}

/**
 * Mock transform stream
 */
export class MockTransform extends Transform {
  private transformFn: (chunk: any) => any
  private shouldError = false
  private errorAfter = -1
  private processedCount = 0

  constructor(transformFn: (chunk: any) => any, options: any = {}) {
    super({ objectMode: true, ...options })
    this.transformFn = transformFn
  }

  _transform(chunk: any, encoding: string, callback: Function) {
    if (this.shouldError && this.processedCount === this.errorAfter) {
      callback(new Error('Mock stream error'))
      return
    }

    try {
      const result = this.transformFn(chunk)
      this.processedCount++
      callback(null, result)
    } catch (error) {
      callback(error)
    }
  }

  setError(afterItems: number = 0) {
    this.shouldError = true
    this.errorAfter = afterItems
  }
}

/**
 * Creates a mock stream pipeline
 */
export const createMockPipeline = (items: any[], transforms: Array<(chunk: any) => any> = []) => {
  const readable = new MockReadable(items)
  const writable = new MockWritable()
  const transformStreams = transforms.map((fn) => new MockTransform(fn))

  return {
    readable,
    writable,
    transformStreams,
    pipe: () => {
      let current = readable
      for (const transform of transformStreams) {
        current = current.pipe(transform) as any
      }
      return current.pipe(writable)
    },
  }
}
