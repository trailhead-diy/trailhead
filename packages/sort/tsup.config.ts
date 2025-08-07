import { defineConfig } from 'tsup'
import { tsupProfiles } from '@repo/tsup-config/shared'

export default defineConfig(
  tsupProfiles.node({
    entry: {
      index: 'src/index.ts',
    },
    dts: true,
  })
)
