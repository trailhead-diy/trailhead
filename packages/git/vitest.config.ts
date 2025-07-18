import { createVitestConfig } from '@repo/vitest-config'
import { defineConfig, mergeConfig } from 'vitest/config'

const baseConfig = createVitestConfig({
  environment: 'node',
})

const packageSpecificConfig = defineConfig({
  test: {
    name: '@esteban-url/git',
  },
})

export default mergeConfig(baseConfig, packageSpecificConfig)
