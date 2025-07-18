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
      'packages/git',
      'packages/validation',
      'packages/dependency-analysis',
      'packages/web-ui',
      'packages/create-cli',
    ],
  },
})
