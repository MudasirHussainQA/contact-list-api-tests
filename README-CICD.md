# 🚀 CI/CD Pipeline Documentation

## 🎯 Overview

This project includes a comprehensive CI/CD pipeline with multiple workflows for different scenarios:

## 📋 Workflows

### 1. 🎭 Main Playwright Test Suite (`playwright.yml`)
**Triggers**: Push to main/develop, PR, daily schedule, manual dispatch

**Features**:
- ✅ **Parallel Execution** - UI tests run in 3 shards for faster feedback
- ✅ **Separate API/UI Jobs** - API tests run first for quick feedback
- ✅ **Report Merging** - Combines all test results into unified report
- ✅ **GitHub Pages Deployment** - Auto-deploys reports to GitHub Pages
- ✅ **Slack Notifications** - Real-time alerts with test status

### 2. 🔍 PR Quality Checks (`pr-checks.yml`)
**Triggers**: Pull requests

**Features**:
- ✅ **Smoke Tests** - Quick API validation for PRs
- ✅ **Code Quality** - TypeScript, ESLint, Prettier checks
- ✅ **PR Comments** - Automated feedback on PR status

### 3. 🌙 Nightly Full Suite (`nightly.yml`)
**Triggers**: Daily at 2 AM UTC, manual dispatch

**Features**:
- ✅ **Cross-Browser Testing** - Chrome, Firefox, Safari
- ✅ **Performance Tests** - Load and performance validation
- ✅ **Security Scanning** - npm audit + CodeQL analysis
- ✅ **Comprehensive Reports** - Full nightly summary

## 🛠️ Setup Instructions

### 1. GitHub Secrets Configuration
Add these secrets to your GitHub repository:

```bash
# Slack Integration (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### 2. GitHub Pages Setup
1. Go to Repository Settings → Pages
2. Source: GitHub Actions
3. Reports will be available at: `https://username.github.io/repo-name/test-reports/`

### 3. Environment Configuration
Create environment-specific configurations:

```bash
# Staging
npm run test:staging

# Production  
npm run test:production

# Smoke tests
npm run test:smoke
```

## 📊 Available Commands

### Local Development
```bash
npm run test              # All tests
npm run test:api          # API tests only
npm run test:ui           # UI tests only
npm run test:parallel     # Parallel execution
npm run test:headed       # Visual debugging
npm run test:debug        # Step-by-step debugging
```

### Environment-Specific
```bash
npm run test:staging      # Staging environment
npm run test:production   # Production environment
npm run test:smoke        # Smoke tests only
```

### Code Quality
```bash
npm run lint              # ESLint check
npm run format            # Format code
npm run format:check      # Check formatting
```

### CI/CD
```bash
npm run test:ci           # CI-optimized execution
```

## 🎯 Workflow Triggers

### Automatic Triggers
- **Push to main/develop**: Full test suite
- **Pull Request**: Smoke tests + code quality
- **Daily 2 AM UTC**: Nightly comprehensive tests

### Manual Triggers
- **Workflow Dispatch**: Run any workflow manually
- **Test Type Selection**: Choose specific test types

## 📈 Reports & Artifacts

### Test Reports
- **HTML Reports**: Interactive Playwright reports
- **GitHub Pages**: Auto-deployed at each run
- **Artifacts**: 7-30 day retention based on importance

### Notifications
- **Slack Integration**: Real-time test status
- **PR Comments**: Automated feedback
- **GitHub Summaries**: Detailed execution summaries

## 🔧 Advanced Features

### Parallel Execution
- UI tests split into 3 shards
- Configurable worker count
- Optimal resource utilization

### Environment Management
- Staging/Production configurations
- Environment-specific test data
- Dynamic base URL switching

### Quality Gates
- TypeScript compilation checks
- ESLint code quality validation
- Prettier formatting enforcement
- Security vulnerability scanning

## 🚨 Troubleshooting

### Common Issues
1. **Browser Installation**: Ensure `npx playwright install` runs in CI
2. **Permissions**: Check GitHub token permissions for Pages deployment
3. **Slack**: Verify webhook URL is correctly configured
4. **Timeouts**: Adjust timeout values in environment configs

### Debug Commands
```bash
# Local debugging
npm run test:debug

# CI debugging
npm run test:ci -- --headed

# Specific test debugging
npx playwright test --grep "test name" --debug
```

## 🎉 Benefits

✅ **Fast Feedback** - API tests complete in ~2 minutes  
✅ **Comprehensive Coverage** - API + UI + Cross-browser  
✅ **Quality Gates** - Prevent bad code from merging  
✅ **Automated Reports** - No manual report generation  
✅ **Team Notifications** - Everyone stays informed  
✅ **Scalable** - Easy to add more tests and environments  

This CI/CD pipeline ensures high-quality releases with minimal manual intervention! 🚀
