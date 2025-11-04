import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Define all package projects
    projects: [
      'packages/cli',
      'packages/config',
      'packages/core',
      'packages/create-cli',
      'packages/data',
      'packages/fs',
      'packages/sort',
      'packages/validation',
    ],
  },
})
