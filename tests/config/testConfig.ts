/**
 * 🎯 Global Test Configuration
 * 
 * Centralized configuration for all tests
 * Environment: staging/production
 * Can be overridden via environment variables
 */

export const testConfig = {
  // Base Configuration
  baseURL: process.env.BASE_URL || 'https://thinking-tester-contact-list.herokuapp.com',
  environment: process.env.TEST_ENV || 'staging',
  
  // Timeouts
  timeouts: {
    short: 5000,
    medium: 15000,
    long: 30000,
    navigation: process.env.PLAYWRIGHT_NAVIGATION_TIMEOUT ? parseInt(process.env.PLAYWRIGHT_NAVIGATION_TIMEOUT) : 30000,
    action: process.env.PLAYWRIGHT_ACTION_TIMEOUT ? parseInt(process.env.PLAYWRIGHT_ACTION_TIMEOUT) : 15000,
  },
  
  // Retry Settings
  retries: {
    api: process.env.API_RETRIES ? parseInt(process.env.API_RETRIES) : 2,
    ui: process.env.PLAYWRIGHT_RETRIES ? parseInt(process.env.PLAYWRIGHT_RETRIES) : 1,
  },
  
  // Parallel Execution
  workers: process.env.PLAYWRIGHT_WORKERS ? parseInt(process.env.PLAYWRIGHT_WORKERS) : 4,
  
  // Reporting
  reporting: {
    format: process.env.REPORT_FORMAT || 'html',
    open: process.env.REPORT_OPEN as 'always' | 'never' | 'fail-on-flake' || 'never',
    outputDir: './playwright-report',
  },
  
  // Performance
  performance: {
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    headless: process.env.HEADLESS !== 'false',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    verbose: process.env.VERBOSE === 'true',
  },
  
  // CI/CD Environment
  ci: {
    isCI: !!process.env.CI,
    runNumber: process.env.GITHUB_RUN_NUMBER || 'local',
    runId: process.env.GITHUB_RUN_ID || 'local',
    sha: process.env.GITHUB_SHA || 'local',
    ref: process.env.GITHUB_REF || 'local',
  },
  
  // Test Data
  data: {
    faker: {
      seed: process.env.FAKER_SEED ? parseInt(process.env.FAKER_SEED) : undefined,
    },
  },
  
  // API Settings
  api: {
    timeout: process.env.API_TIMEOUT ? parseInt(process.env.API_TIMEOUT) : 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
  
  // UI Settings
  ui: {
    takeScreenshots: process.env.CI ? 'only-on-failure' : 'off',
    recordVideos: process.env.CI ? 'retain-on-failure' : 'off',
    traceOnFailure: true,
  },
};

export default testConfig;
