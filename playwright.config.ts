import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Global test configuration
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  
  use: {
    baseURL: 'https://thinking-tester-contact-list.herokuapp.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // API Tests
    {
      name: 'api-tests',
      testDir: './tests/api/e2e',
      use: {
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
        },
      },
    },

    // UI Tests - Chrome Only (default)
    {
      name: 'ui-tests-chromium',
      testDir: './tests/ui/e2e',
      use: { ...devices['Desktop Chrome'] },
    },

    // Cross-browser UI Tests (for nightly runs)
    {
      name: 'ui-tests-firefox',
      testDir: './tests/ui/e2e',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'ui-tests-webkit',
      testDir: './tests/ui/e2e',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});