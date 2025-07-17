import { defineConfig } from 'tsup'
import { tsupProfiles } from '@repo/tsup-config'

export default defineConfig(
  tsupProfiles.node({
    entry: {
      index: 'src/index.ts',
      'csv/index': 'src/csv/index.ts',
      'json/index': 'src/json/index.ts',
      'excel/index': 'src/excel/index.ts',
      'detection/index': 'src/detection/index.ts',
      'mime/index': 'src/mime/index.ts',
      'conversion/index': 'src/conversion/index.ts',
      'testing/index': 'src/testing/index.ts',
    },
  })
)
