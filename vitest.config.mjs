import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Define all package projects
    projects: [
      'packages/core',
      'packages/cli',
      'packages/config',
      'packages/data',
      'packages/fs',
      'packages/validation',
      'packages/create-cli',
    ],
  },
})
