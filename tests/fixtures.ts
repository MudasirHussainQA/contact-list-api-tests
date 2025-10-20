import { test as base, Page, APIRequestContext } from '@playwright/test';
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
 * - UI Tests: test('description', async ({ signupPage, loginPage, contactListPage }) => { ... })
 * - API Tests: test('description', async ({ userClient, validUser }) => { ... })
 */

type UIFixtures = {
  signupPage: SignupPage;
  loginPage: LoginPage;
  contactListPage: ContactListPage;
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

export const test = base.extend<UIFixtures & APIFixtures & DataFixtures>({
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
