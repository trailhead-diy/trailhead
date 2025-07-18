import { createVitestConfig } from '@repo/vitest-config'

export default createVitestConfig({
  environment: 'node',
  coverage: {
    enabled: true,
    threshold: 80,
  },
  useTsconfigPaths: true,
})
