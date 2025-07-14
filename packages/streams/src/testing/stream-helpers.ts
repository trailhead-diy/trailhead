/**
 * Stream testing helpers
 */

import { Readable, Writable, Transform } from 'stream'

/**
 * Creates a readable stream from an array
 */
export const createReadableFromArray = <T>(items: T[]): Readable => {
  let index = 0
  return new Readable({
    objectMode: true,
    read() {
      if (index < items.length) {
        this.push(items[index++])
      } else {
        this.push(null)
      }
    },
  })
}

/**
 * Creates a writable stream that collects items
 */
export const createCollectorStream = <T>(): Writable & { items: T[] } => {
  const items: T[] = []
  const stream = new Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      items.push(chunk)
      callback()
    },
  })

  return Object.assign(stream, { items })
}

/**
 * Creates a transform stream for testing
 */
export const createTestTransform = <T, U>(transform: (item: T) => U): Transform => {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      try {
        const result = transform(chunk)
        callback(null, result)
      } catch (error) {
        callback(error as Error)
      }
    },
  })
}
