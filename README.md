# Contact List Playwright Tests (API + UI with POM Pattern)

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