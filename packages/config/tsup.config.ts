import { defineConfig } from 'tsup'
import { tsupProfiles } from '@repo/tsup-config/shared'

export default defineConfig(
  tsupProfiles.node({
    entry: {
      index: 'src/index.ts',
      'core/index': 'src/core/operations.ts',
      'loaders/index': 'src/loaders/operations.ts',
      'validators/index': 'src/validators/operations.ts',
      'transformers/index': 'src/transformers/operations.ts',
      'testing/index': 'src/testing/index.ts',
    },
    dts: true,
    splitting: true,
    external: ['@trailhead/core', '@trailhead/validation', '@trailhead/fs', '@trailhead/cli'],
  })
)
