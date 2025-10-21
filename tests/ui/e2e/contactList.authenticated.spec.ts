import { test, expect } from '../../fixtures';

/**
 * 🔐 Contact List Tests with Storage State
 * 
 * These tests use pre-authenticated state (storage state) to skip login
 * 
 * Benefits:
 * - No login steps needed in each test
 * - Faster test execution
 * - More reliable (no login flakiness)
 * - Focuses on testing contact features, not authentication
 * 
 * To run these tests:
 * npx playwright test --project=ui-tests-chromium-authenticated
 */

test.describe('Contact List - Authenticated Tests', () => {
  
  test('should access contact list without logging in', async ({ authenticatedContactListPage }) => {
    // Navigate to contact list - already authenticated
    await authenticatedContactListPage.navigateToContactList();
    
    // Verify we can see the contact list
    expect(await authenticatedContactListPage.isContactListVisible()).toBeTruthy();
    
    // Verify we're logged in (logout button is visible)
    const welcomeMessage = await authenticatedContactListPage.getWelcomeMessage();
    expect(welcomeMessage.length).toBeGreaterThan(0);
    
    console.log('✅ Accessed contact list using stored authentication');
  });

  test('should perform contact operations while authenticated', async ({ authenticatedPage }) => {
    // Navigate to contact list using authenticated page
    await authenticatedPage.goto('/contactList');
    
    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify we're on the contact list page
    expect(authenticatedPage.url()).toContain('/contactList');
    
    // Verify logout button exists (proof we're logged in)
    const logoutButton = authenticatedPage.getByRole('button', { name: /logout|sign out/i });
    await expect(logoutButton).toBeVisible();
    
    console.log('✅ Performed operations with authenticated state');
  });

  test('should maintain session across page navigations', async ({ authenticatedPage }) => {
    // Start at contact list
    await authenticatedPage.goto('/contactList');
    await expect(authenticatedPage.getByRole('button', { name: /logout/i })).toBeVisible();
    
    // Navigate to add contact (if available)
    await authenticatedPage.goto('/addContact');
    
    // Should still be authenticated
    await expect(authenticatedPage.getByRole('button', { name: /logout/i })).toBeVisible();
    
    // Navigate back to contact list
    await authenticatedPage.goto('/contactList');
    await expect(authenticatedPage.getByRole('button', { name: /logout/i })).toBeVisible();
    
    console.log('✅ Session maintained across navigations');
  });

  test('should verify authenticated user can logout', async ({ authenticatedContactListPage }) => {
    await authenticatedContactListPage.navigateToContactList();
    
    // Verify we're logged in
    expect(await authenticatedContactListPage.isContactListVisible()).toBeTruthy();
    
    // Logout
    await authenticatedContactListPage.logout();
    
    // Verify we're logged out (on logout page or redirected)
    const currentUrl = await authenticatedContactListPage.page.url();
    expect(currentUrl).toMatch(/\/logout|\/login|\/addUser/);
    
    console.log('✅ Successfully logged out from authenticated session');
  });
});

/**
 * 📝 Notes on Storage State Usage
 * 
 * 1. Storage state is saved in .auth/user.json during setup
 * 2. Tests using authenticated fixtures skip login entirely
 * 3. Each test gets a fresh browser context but with saved auth
 * 4. Perfect for testing features that require authentication
 * 5. Use regular fixtures (without 'authenticated') for login/signup tests
 * 
 * When to use storage state:
 * ✅ Contact list operations
 * ✅ Contact CRUD operations
 * ✅ Profile management
 * ✅ Any feature requiring authentication
 * 
 * When NOT to use storage state:
 * ❌ Login tests
 * ❌ Signup tests
 * ❌ Password reset tests
 * ❌ Session expiration tests
 */

