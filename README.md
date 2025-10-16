# Contact List Playwright Tests (API + UI with POM Pattern)

> **Latest Update**: Enhanced with comprehensive GitHub Pages reporting and Slack notifications

## Setup

```bash
npm install
npx playwright install
```

## Run Tests

### All Tests
```bash
npm test
```

### API Tests Only
```bash
npm run test:api
```

### UI Tests
```bash
npm run test:ui          # Chrome UI tests
npm run test:headed      # Chrome with UI visible
npm run test:debug       # Debug mode
```

### View Reports
```bash
npm run report
```

### 🤖 AI-Powered Testing
```bash
npm run ai:help        # View available AI agents
npm run ai:plan        # Get test planning guidance
npm run ai:generate    # Get test generation guidance
npm run ai:heal        # Get test healing guidance
```

## Folder Structure

### API Tests
- `tests/api/clients/` - API Client classes following Single Responsibility Principle
- `tests/api/fixtures/` - Test Data Factory classes with enhanced UserFactory
- `tests/api/e2e/` - API End-to-End test suites

### UI Tests (Page Object Model)
- `tests/ui/pages/` - Page Object classes following POM pattern
  - `basePage.ts` - Base page with common functionality
  - `signupPage.ts` - Signup page object
  - `loginPage.ts` - Login page object  
  - `contactListPage.ts` - Contact list page object
- `tests/ui/e2e/` - UI End-to-End test suites

### Configuration
- `playwright.config.ts` - Multi-project Playwright configuration
- `.github/workflows/playwright.yml` - CI pipeline

## Design Patterns Used

1. **Factory Pattern** - UserFactory for test data generation
2. **Page Object Model (POM)** - UI test organization and maintainability
3. **Single Responsibility Principle** - Separate clients for different API endpoints
4. **Inheritance** - BasePage for common page functionality
5. **Composition** - Page objects composed in test files

## 🤖 AI-Powered Testing (NEW!)

This framework now includes **Playwright AI Agents** - revolutionary AI-powered testing capabilities:

- 🧠 **Planner Agent** - Intelligent test scenario discovery
- ⚡ **Generator Agent** - Automated test code generation  
- 🔧 **Healer Agent** - Self-healing test maintenance

See [README-AI-AGENTS.md](README-AI-AGENTS.md) for complete AI documentation.

## Test Features

### API Tests
- User registration with comprehensive validations
- Duplicate email handling
- Invalid data validation
- Required field validation
- Proper cleanup and teardown

### UI Tests
- Complete signup flow testing
- Form validation testing
- Navigation between pages
- Error message verification
- Chrome browser testing
- Screenshot and video capture on failures