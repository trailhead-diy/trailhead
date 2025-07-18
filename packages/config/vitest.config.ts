import { createVitestConfig } from '@repo/vitest-config'

export default createVitestConfig({
  environment: 'node',
  useTsconfigPaths: true,
})
