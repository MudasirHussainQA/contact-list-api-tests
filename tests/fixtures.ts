import { test as base, Page, APIRequestContext, Browser } from '@playwright/test';
import { SignupPage } from './ui/pages/signupPage';
import { LoginPage } from './ui/pages/loginPage';
import { ContactListPage } from './ui/pages/contactListPage';
import { UserClient } from './api/clients/userClient';
import { ContactClient } from './api/clients/contactClient';
import { UserFactory } from './api/fixtures/userFactory';
import { ContactFactory } from './api/fixtures/contactFactory';

/**
 * 🎭 Playwright Fixtures
 * 
 * Provides reusable fixtures for both UI and API tests
 * 
 * Usage:
 * - UI Tests (regular): test('description', async ({ signupPage, loginPage }) => { ... })
 * - UI Tests (authenticated): test('description', async ({ authenticatedPage, contactListPage }) => { ... })
 * - API Tests: test('description', async ({ userClient, validUser }) => { ... })
 * 
 * 🔐 Storage State Feature:
 * - Use 'authenticatedPage' fixture for tests that need pre-authenticated state
 * - Use 'authenticatedContactListPage' for direct access to contact list when logged in
 * - Skips login steps, making tests faster and more reliable
 */

type UIFixtures = {
  signupPage: SignupPage;
  loginPage: LoginPage;
  contactListPage: ContactListPage;
};

type AuthenticatedUIFixtures = {
  authenticatedPage: Page;
  authenticatedContactListPage: ContactListPage;
  authenticatedPageWithAPILogin: Page;
};

type APIFixtures = {
  userClient: UserClient;
  contactClient: ContactClient;
};

type DataFixtures = {
  validUser: any;
  validContact: any;
};

/**
 * 📊 Test Data Helper Functions
 */
const testDataHelpers = {
  /**
   * Create a user with overrides
   * @param overrides Partial user properties to override defaults
   */
  createUser: (overrides: Partial<any> = {}) => ({
    ...UserFactory.generateValidUser(),
    ...overrides,
  }),

  /**
   * Create a contact with overrides
   * @param overrides Partial contact properties to override defaults
   */
  createContact: (overrides: Partial<any> = {}) => ({
    ...ContactFactory.generateReliableContact(),
    ...overrides,
  }),
};

export const test = base.extend<UIFixtures & AuthenticatedUIFixtures & APIFixtures & DataFixtures>({
  /**
   * 📄 Signup Page Fixture
   * 
   * Provides a ready-to-use SignupPage instance
   * 
   * @example
   * test('signup flow', async ({ signupPage }) => {
   *   await signupPage.navigateToSignup();
   *   await signupPage.signupUser(validUser);
   * });
   */
  signupPage: async ({ page }, use: (value: SignupPage) => Promise<void>) => {
    const signupPage = new SignupPage(page);
    await use(signupPage);
  },

  /**
   * 📄 Login Page Fixture
   * 
   * Provides a ready-to-use LoginPage instance
   * 
   * @example
   * test('login flow', async ({ loginPage }) => {
   *   await loginPage.navigateToLogin();
   *   await loginPage.loginUser(email, password);
   * });
   */
  loginPage: async ({ page }, use: (value: LoginPage) => Promise<void>) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /**
   * 📄 Contact List Page Fixture
   * 
   * Provides a ready-to-use ContactListPage instance
   * 
   * @example
   * test('contact list', async ({ contactListPage }) => {
   *   await contactListPage.navigateToContactList();
   *   const count = await contactListPage.getContactCount();
   * });
   */
  contactListPage: async ({ page }, use: (value: ContactListPage) => Promise<void>) => {
    const contactListPage = new ContactListPage(page);
    await use(contactListPage);
  },

  /**
   * 🔐 Authenticated Page Fixture
   * 
   * Provides a page with pre-authenticated state from storage
   * Uses the storage state saved during setup to skip login
   * 
   * Note: Requires running the 'setup' project first or using a project
   * with storageState configured
   * 
   * @example
   * test('contact operations', async ({ authenticatedPage }) => {
   *   await authenticatedPage.goto('/contactList');
   *   // Already logged in, no need for login steps
   * });
   */
  authenticatedPage: async ({ browser }, use: (value: Page) => Promise<void>) => {
    // Create a new context with stored authentication state
    const context = await browser.newContext({
      storageState: '.auth/user.json',
    });
    const page = await context.newPage();
    
    await use(page);
    
    // Cleanup
    await context.close();
  },

  /**
   * 🔐 Authenticated Contact List Page Fixture
   * 
   * Provides a ContactListPage instance with pre-authenticated state
   * Perfect for tests that work with contacts and don't need to test login
   * 
   * @example
   * test('add contact', async ({ authenticatedContactListPage }) => {
   *   await authenticatedContactListPage.navigateToContactList();
   *   // Already logged in
   *   await authenticatedContactListPage.addContact(contactData);
   * });
   */
  authenticatedContactListPage: async ({ browser }, use: (value: ContactListPage) => Promise<void>) => {
    // Create a new context with stored authentication state
    const context = await browser.newContext({
      storageState: '.auth/user.json',
    });
    const page = await context.newPage();
    const contactListPage = new ContactListPage(page);
    
    await use(contactListPage);
    
    // Cleanup
    await context.close();
  },

  /**
   * 🔀 Authenticated Page with API Login Fixture
   * 
   * Hybrid approach: Authenticates via API, sets token in browser
   * Faster than UI login, more flexible than storage state
   * 
   * Perfect for:
   * - Tests that need unique users
   * - Tests that need fresh auth state
   * - Tests that want speed without shared state
   * 
   * @example
   * test('feature test', async ({ authenticatedPageWithAPILogin, validUser }) => {
   *   // Page is already authenticated via API
   *   await authenticatedPageWithAPILogin.goto('/contactList');
   *   // Test your feature
   * });
   */
  authenticatedPageWithAPILogin: async ({ browser, request, validUser }, use: (value: Page) => Promise<void>) => {
    // Create a new context and page
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Authenticate via API
    const userClient = new UserClient(request);
    await userClient.register(validUser);
    const loginResponse = await userClient.login({
      email: validUser.email,
      password: validUser.password
    });
    
    const { token } = await loginResponse.json();
    
    // Navigate to app first
    await page.goto('/contactList');
    
    // Set token in localStorage
    await page.evaluate((authToken) => {
      localStorage.setItem('token', authToken);
    }, token);
    
    // Reload to apply authentication
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Provide the authenticated page
    await use(page);
    
    // Cleanup
    await userClient.delete().catch(() => {
      // User might already be deleted in test
    });
    await context.close();
  },

  /**
   * 🔌 User Client Fixture
   * 
   * Provides a ready-to-use UserClient for API testing
   * Automatically handles authentication and cleanup
   * 
   * @example
   * test('user operations', async ({ userClient, validUser }) => {
   *   const res = await userClient.register(validUser);
   *   expect(res.status()).toBe(201);
   * });
   */
  userClient: async ({ request }, use: (value: UserClient) => Promise<void>) => {
    const userClient = new UserClient(request);
    
    await use(userClient);
    
    // Cleanup: Delete user after test
    try {
      await userClient.delete();
    } catch (error) {
      // User might have already been deleted in the test
    }
  },

  /**
   * 🔌 Contact Client Fixture
   * 
   * Provides a ready-to-use ContactClient for API testing
   * Automatically handles authentication
   * 
   * Requirements:
   * - User must be authenticated via userClient first
   * - Pass userClient.token to contactClient
   * 
   * @example
   * test('contact operations', async ({ userClient, contactClient, validUser }) => {
   *   await userClient.register(validUser);
   *   await userClient.login({ email: validUser.email, password: validUser.password });
   *   
   *   contactClient = new ContactClient(request, userClient.token);
   *   const res = await contactClient.add(validContact);
   * });
   */
  contactClient: async ({ request }, use: (value: ContactClient) => Promise<void>) => {
    const contactClient = new ContactClient(request, '');
    await use(contactClient);
  },

  /**
   * 📊 Valid User Fixture
   * 
   * Generates a valid user object for testing
   * Each test gets a fresh, unique user
   * 
   * @example
   * test('user signup', async ({ validUser, userClient }) => {
   *   const res = await userClient.register(validUser);
   *   expect(res.status()).toBe(201);
   * });
   */
  validUser: async ({}, use: (value: any) => Promise<void>) => {
    const user = testDataHelpers.createUser();
    await use(user);
  },

  /**
   * 📋 Valid Contact Fixture
   * 
   * Generates a valid contact object for testing
   * Each test gets a fresh, unique contact
   * 
   * @example
   * test('add contact', async ({ validContact, contactClient }) => {
   *   const res = await contactClient.add(validContact);
   *   expect(res.status()).toBe(201);
   * });
   */
  validContact: async ({}, use: (value: any) => Promise<void>) => {
    const contact = testDataHelpers.createContact();
    await use(contact);
  },
});

/**
 * 🛠️ Export test data helpers for inline use in tests
 * Usage: const user = testDataHelpers.createUser({ firstName: 'Custom' })
 */
export { testDataHelpers };

export { expect } from '@playwright/test';
