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
    // Setup: Authentication (runs before UI tests)
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

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
      dependencies: ['setup'], // Run setup before UI tests
    },

    // UI Tests with Authentication - Chrome
    {
      name: 'ui-tests-chromium-authenticated',
      testDir: './tests/ui/e2e',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json', // Reuse authenticated state
      },
      dependencies: ['setup'],
    },

    // Cross-browser UI Tests (for nightly runs)
    {
      name: 'ui-tests-firefox',
      testDir: './tests/ui/e2e',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    {
      name: 'ui-tests-firefox-authenticated',
      testDir: './tests/ui/e2e',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },

    {
      name: 'ui-tests-webkit',
      testDir: './tests/ui/e2e',
      use: { 
        ...devices['Desktop Safari'],
        // Extended timeouts for WebKit in CI environments
        actionTimeout: process.env.CI ? 15000 : 10000,
        navigationTimeout: process.env.CI ? 30000 : 20000,
      },
      dependencies: ['setup'],
    },

    {
      name: 'ui-tests-webkit-authenticated',
      testDir: './tests/ui/e2e',
      use: { 
        ...devices['Desktop Safari'],
        storageState: '.auth/user.json',
        actionTimeout: process.env.CI ? 15000 : 10000,
        navigationTimeout: process.env.CI ? 30000 : 20000,
      },
      dependencies: ['setup'],
    },
  ],
});