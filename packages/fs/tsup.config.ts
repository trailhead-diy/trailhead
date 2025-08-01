import { defineConfig } from 'tsup'
import { tsupProfiles } from '@repo/tsup-config/shared'

export default defineConfig(
  tsupProfiles.node({
    entry: {
      index: 'src/index.ts',
      'testing/index': 'src/testing/index.ts',
      'utils/index': 'src/utils/index.ts',
    },
    dts: true,
  })
)
