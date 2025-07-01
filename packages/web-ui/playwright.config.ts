import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration
 * 
 * - Type safety with TypeScript
 * - Clear separation of concerns (E2E vs unit tests)
 * - Performance optimization (parallel execution, smart retries)
 * - Comprehensive reporting for debugging
 */

// Read environment variables
const CI = !!process.env.CI

export default defineConfig({
  // Test directory for E2E tests
  testDir: './tests/e2e',

  // Run tests in parallel for performance
  fullyParallel: true,

  // Prevent accidental test.only in CI
  forbidOnly: CI,

  // Retry failed tests in CI for reliability
  retries: CI ? 2 : 0,

  // Number of workers (50% of CPU cores in CI, full locally)
  workers: CI ? '50%' : undefined,

  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }], // outputFolder controlled by PLAYWRIGHT_HTML_OUTPUT_DIR
    ['list'], // Console output
  ],

  // Global test configuration
  use: {
    // Base URL for relative navigation
    baseURL: 'http://localhost:3000',

    
    // Collect trace on first retry for debugging
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on first retry
    video: 'on-first-retry',
    
    // Viewport size (standard desktop)
    viewport: { width: 1280, height: 720 },
    
    // Action timeout (30 seconds)
    actionTimeout: 30 * 1000,
    
    // Navigation timeout (30 seconds)
    navigationTimeout: 30 * 1000,
  },
  
  // Test timeout (2 minutes per test)
  timeout: 2 * 60 * 1000,
  
  // Global setup/teardown timeout
  globalTimeout: 10 * 60 * 1000,
  
  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  // Configure web server to run the demo app
  webServer: {
    command: 'cd demo && npm run dev',
    url: 'http://localhost:3000',
    timeout: 120 * 1000, // 2 minutes to start
    reuseExistingServer: !CI,
    stdout: 'ignore',
    stderr: 'ignore',
  },

  // Output folder for test artifacts
  outputDir: 'temp/test-results/',
})