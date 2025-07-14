import { defineConfig } from 'vitest/config'

export const createVitestConfig = () => {
  return defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      environmentOptions: {
        jsdom: {
          resources: 'usable',
          runScripts: 'dangerously',
          pretendToBeVisual: true,
        },
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        exclude: [
          'node_modules',
          'dist',
          'coverage',
          '**/*.config.ts',
          '**/*.config.js',
          'tests/setup',
        ],
      },
    },
  })
}
