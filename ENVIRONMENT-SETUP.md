# 🌍 Environment Setup & Configuration Guide

This guide explains how to configure and run tests in different environments: **Local**, **QA**, **Staging**, and **Production**.

## Table of Contents

1. [Environment Overview](#environment-overview)
2. [Environment Files](#environment-files)
3. [Running Tests by Environment](#running-tests-by-environment)
4. [Using Environment Manager](#using-environment-manager)
5. [Configuration Details](#configuration-details)
6. [Troubleshooting](#troubleshooting)

---

## Environment Overview

### 🏠 Local (Development)

**Purpose:** Development and manual testing  
**URL:** `http://localhost:3000`  
**Timeout:** 30 seconds (lenient)  
**Retries:** 0 (fail fast)  
**Headless:** No (see browser)  
**Best For:** Writing and debugging tests

```bash
npm run test:local          # Run all tests
npm run test:local:api      # Run API tests only
TEST_ENV=local npm test     # Manual
```

### 🧪 QA (Quality Assurance)

**Purpose:** Integration & acceptance testing  
**URL:** `https://qa-api.example.com`  
**Timeout:** 20 seconds (balanced)  
**Retries:** 1 (catch occasional flakiness)  
**Headless:** Yes  
**Best For:** Testing new features before staging

```bash
npm run test:qa             # Run all tests
npm run test:qa:api         # Run API tests only
TEST_ENV=qa npm test        # Manual
```

### 📦 Staging (Pre-Production)

**Purpose:** Final testing before production  
**URL:** `https://staging-thinking-tester-contact-list.herokuapp.com`  
**Timeout:** 15 seconds (strict)  
**Retries:** 2 (catch intermittent issues)  
**Headless:** Yes  
**Best For:** Smoke tests before release

```bash
npm run test:staging        # Run all tests
npm run test:staging:api    # Run API tests only
npm run test:staging:ui     # Run UI tests only
TEST_ENV=staging npm test   # Manual
```

### 🚀 Production (Live)

**Purpose:** Smoke tests and critical path validation  
**URL:** `https://api.example.com`  
**Timeout:** 10 seconds (very strict)  
**Retries:** 3 (extremely reliable)  
**Headless:** Yes  
**Screenshots:** Off (logs only)  
**Best For:** Production monitoring

```bash
npm run test:production     # Run all tests
npm run test:production:api # Run API tests only
TEST_ENV=production npm test # Manual
```

---

## Environment Files

All environment configurations are stored in the `environments/` directory:

```
environments/
├── local.env              # Development configuration
├── qa.env                 # QA testing configuration
├── staging.env            # Pre-production configuration
└── production.env         # Production configuration
```

### File Format

Each `.env` file contains key-value pairs:

```env
BASE_URL=https://example.com
API_TIMEOUT=20000
RETRY_COUNT=2
HEADLESS=true
SLOW_MO=0

TEST_USER_EMAIL_PREFIX=qa-test
TEST_USER_PASSWORD=QATest@123

REPORT_TITLE=QA Test Results
SLACK_CHANNEL=#qa-alerts

ENABLE_SCREENSHOTS=true
ENABLE_VIDEOS=true
ENABLE_TRACES=true
```

### Configuration Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `BASE_URL` | API endpoint | `https://qa-api.example.com` |
| `API_TIMEOUT` | Request timeout (ms) | `20000` |
| `RETRY_COUNT` | Test retries | `1` |
| `HEADLESS` | Run headless mode | `true` or `false` |
| `SLOW_MO` | Slow down interactions (ms) | `0` or `1000` |
| `TEST_USER_EMAIL_PREFIX` | Email prefix for tests | `qa-test` |
| `TEST_USER_PASSWORD` | Password for tests | `QATest@123` |
| `REPORT_TITLE` | Report heading | `QA Test Results` |
| `SLACK_CHANNEL` | Slack notification channel | `#qa-alerts` |
| `ENABLE_SCREENSHOTS` | Capture screenshots | `true` or `false` |
| `ENABLE_VIDEOS` | Record videos | `true` or `false` |
| `ENABLE_TRACES` | Capture traces | `true` or `false` |

---

## Running Tests by Environment

### Quick Commands

```bash
# Run all tests in QA
npm run test:qa

# Run API tests in staging
npm run test:staging:api

# Run UI tests in local (with browser visible)
npm run test:local

# Run specific test file
TEST_ENV=qa npx playwright test path/to/test.spec.ts

# Run with custom workers
TEST_ENV=staging npx playwright test --workers=8
```

### Environment Variables

Set environment before running tests:

```bash
# Bash/Zsh
export TEST_ENV=qa
npm test

# One-liner
TEST_ENV=qa npm test

# Windows (PowerShell)
$env:TEST_ENV="qa"
npm test
```

---

## Using Environment Manager

The `EnvironmentManager` class handles all environment configuration.

### In Test Files

```typescript
import { getEnvironmentConfig, setEnvironment } from '../../config/environmentManager';

test('example test', async ({ page }) => {
  const config = getEnvironmentConfig();
  
  // Access configuration
  await page.goto(config.baseURL);
  console.log(`Testing in ${config.environment}`);
  console.log(`Base URL: ${config.baseURL}`);
});
```

### Switching Environments

```typescript
import { setEnvironment, getEnvironmentConfig } from '../../config/environmentManager';

test.beforeAll(() => {
  // Switch to QA environment
  setEnvironment('qa');
});

test('run in QA', async () => {
  const config = getEnvironmentConfig();
  console.log(`Running in: ${config.environment}`);
});
```

### Validating Environment

```typescript
import { environmentManager } from '../../config/environmentManager';

test.beforeAll(async () => {
  // Validate current environment
  await environmentManager.validateEnvironment();
  
  // Log configuration
  environmentManager.logEnvironmentInfo();
});
```

---

## Configuration Details

### Local Environment

- **Development:** Set `HEADLESS=false` to see the browser
- **Quick Feedback:** `RETRY_COUNT=0` fails fast
- **Debug Info:** All recordings and screenshots enabled
- **URL:** Point to local dev server

### QA Environment

- **Balance:** Moderate retries and timeouts
- **Feature Testing:** All new features tested here
- **Recording:** Videos enabled for debugging
- **Notifications:** Sends to `#qa-alerts` Slack channel

### Staging Environment

- **Pre-Production:** Tests production-like scenario
- **Retries:** 2 retries to catch intermittent issues
- **Strict Timeouts:** Closer to production timeouts
- **Release Gate:** Final check before production

### Production Environment

- **Monitoring:** Smoke tests and critical paths only
- **Strict:** Highest retry count for reliability
- **Quiet:** Screenshots disabled, traces only
- **Alert:** Failures immediately notify `#production-alerts`

---

## Troubleshooting

### Environment Not Found

**Error:** `Environment file not found: /path/to/local.env`

**Solution:**
```bash
# Check environment files exist
ls -la environments/

# Create missing file
touch environments/qa.env
```

### Wrong Environment Running

**Problem:** Tests running against wrong URL

**Solution:**
```bash
# Check current environment
npm run env:validate

# Set explicit environment
TEST_ENV=qa npm test

# Verify in test
console.log(getEnvironmentConfig().baseURL);
```

### Timeout Issues

**Problem:** Tests timing out

**Solution:**
1. Check `API_TIMEOUT` in `.env` file
2. Increase timeout for slow environments:
   ```env
   API_TIMEOUT=30000  # 30 seconds
   ```
3. Or override in tests:
   ```typescript
   test.setTimeout(60000); // 60 seconds
   ```

### Environment Variables Not Loading

**Problem:** Configuration not being read

**Solution:**
```bash
# Restart test runner
npm run test:qa

# Or manually set
TEST_ENV=qa npm test

# Debug
node -e "require('./tests/config/environmentManager').environmentManager.logEnvironmentInfo()"
```

---

## Best Practices

1. **Always specify environment** - Don't rely on defaults
   ```bash
   TEST_ENV=staging npm test  # Good
   npm test                    # Risky - uses default staging
   ```

2. **Use npm scripts** - Easier and less error-prone
   ```bash
   npm run test:qa            # Good
   TEST_ENV=qa npm test       # Also OK
   ```

3. **Match environment to purpose**
   - Local: Writing tests
   - QA: Feature validation
   - Staging: Release candidate
   - Production: Smoke tests only

4. **Monitor notifications** - Slack channels help track test health
   - Check `#qa-alerts` for QA test failures
   - Check `#staging-alerts` for pre-release issues
   - Check `#production-alerts` for production issues

5. **Review configuration** before running critical tests
   ```bash
   npm run env:validate
   ```

---

## Configuration Precedence

Tests load configuration in this order:

1. `TEST_ENV` or `ENVIRONMENT` environment variable
2. Environment file in `environments/` directory
3. Fall back to `staging` if nothing specified
4. Override with process.env for CI/CD

---

## Examples

### Run QA Tests with Custom Workers

```bash
TEST_ENV=qa npx playwright test --workers=8
```

### Run Production API Tests Only

```bash
npm run test:production:api
```

### Run Local Tests with UI Debug

```bash
npm run test:local -- tests/ui/e2e/userSignup.ui.spec.ts --debug
```

### Validate Staging Configuration

```bash
TEST_ENV=staging npm run env:validate
```

---

## Environment Matrix

| Aspect | Local | QA | Staging | Production |
|--------|-------|-----|---------|-----------|
| **URL** | localhost:3000 | qa-api | staging-api | api |
| **Timeout** | 30s | 20s | 15s | 10s |
| **Retries** | 0 | 1 | 2 | 3 |
| **Headless** | No | Yes | Yes | Yes |
| **Recording** | Full | Full | Fail only | Off |
| **Use Case** | Dev | QA | Release | Monitor |

---

For more information, see [TESTING-GUIDE.md](./TESTING-GUIDE.md).
