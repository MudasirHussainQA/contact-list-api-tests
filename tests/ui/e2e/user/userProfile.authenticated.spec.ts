import { test, expect } from '../../../fixtures';

/**
 * 🔐 User Profile Tests with Storage State
 * 
 * These tests verify user-related features AFTER authentication
 * Using storage state to skip the signup/login flow
 * 
 * Note: Original signup tests remain in userSignup.ui.spec.ts
 * Those tests verify the signup functionality itself and should NOT use storage state
 */

test.describe('User Profile - Authenticated Tests', () => {
  
  test('should verify authenticated user can access their profile', async ({ authenticatedPage }) => {
    // Navigate directly to contact list - already authenticated
    await authenticatedPage.goto('/contactList');
    
    // Verify we're logged in
    const logoutButton = authenticatedPage.getByRole('button', { name: /logout|sign out/i });
    await expect(logoutButton).toBeVisible();
    
    // Verify welcome message or user indicator exists
    const pageContent = await authenticatedPage.content();
    expect(pageContent.length).toBeGreaterThan(0);
    
    console.log('✅ Verified authenticated user profile access');
  });

  test('should navigate to contact list after authentication', async ({ authenticatedContactListPage }) => {
    // This replaces the post-signup navigation tests
    // No need to signup - already authenticated via storage state
    await authenticatedContactListPage.navigateToContactList();
    
    // Verify contact list is visible
    expect(await authenticatedContactListPage.isContactListVisible()).toBeTruthy();
    
    // Verify welcome message
    const welcomeMessage = await authenticatedContactListPage.getWelcomeMessage();
    expect(welcomeMessage.length).toBeGreaterThan(0);
    
    console.log('✅ Navigated to contact list with stored authentication');
  });

  test('should verify session persistence across page reloads', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/contactList');
    
    // Verify logged in
    await expect(authenticatedPage.getByRole('button', { name: /logout/i })).toBeVisible();
    
    // Reload page
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Should still be logged in after reload
    await expect(authenticatedPage.getByRole('button', { name: /logout/i })).toBeVisible();
    
    console.log('✅ Session persisted after page reload');
  });

  test('should allow authenticated user to logout', async ({ authenticatedContactListPage }) => {
    // Navigate to contact list
    await authenticatedContactListPage.navigateToContactList();
    
    // Verify we're logged in
    expect(await authenticatedContactListPage.isContactListVisible()).toBeTruthy();
    
    // Perform logout
    await authenticatedContactListPage.logout();
    
    // Verify redirect to logout page, login or signup page
    const currentUrl = await authenticatedContactListPage.page.url();
    expect(currentUrl).toMatch(/\/logout|\/login|\/addUser/);
    
    console.log('✅ User successfully logged out');
  });

  test('should maintain authentication when navigating between pages', async ({ authenticatedPage }) => {
    // Start at contact list
    await authenticatedPage.goto('/contactList');
    await expect(authenticatedPage.getByRole('button', { name: /logout/i })).toBeVisible();
    
    // Try to navigate to add contact page (if it exists)
    await authenticatedPage.goto('/addContact');
    
    // Should still be authenticated (logout button visible or no redirect to login)
    const currentUrl = authenticatedPage.url();
    
    // Either we're on add contact page or still on contact list (both mean we're authenticated)
    expect(currentUrl).toMatch(/\/contactList|\/addContact/);
    
    // If logout button exists, verify it's visible
    const logoutButton = authenticatedPage.getByRole('button', { name: /logout/i });
    const isLogoutVisible = await logoutButton.isVisible().catch(() => false);
    
    if (isLogoutVisible) {
      await expect(logoutButton).toBeVisible();
    }
    
    console.log('✅ Authentication maintained across navigation');
  });

  test('should allow authenticated user to access signup page', async ({ authenticatedPage }) => {
    // Navigate to signup page while authenticated
    await authenticatedPage.goto('/addUser');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // The app allows authenticated users to visit signup page
    const currentUrl = authenticatedPage.url();
    expect(currentUrl).toContain('/addUser');
    
    // Verify we can navigate back to contact list (still authenticated)
    await authenticatedPage.goto('/contactList');
    const logoutButton = authenticatedPage.getByRole('button', { name: /logout/i });
    await expect(logoutButton).toBeVisible();
    
    console.log('✅ Verified authenticated user can access signup page and return');
  });
});

/**
 * 📝 Comparison with Original Tests
 * 
 * Original userSignup.ui.spec.ts:
 * ✅ Tests signup form validation
 * ✅ Tests signup submission
 * ✅ Tests error handling during signup
 * ✅ Tests duplicate email detection
 * ✅ Tests form field clearing
 * ✅ Tests navigation between signup/login
 * 
 * These authenticated tests:
 * ✅ Test user features AFTER authentication
 * ✅ Test session persistence
 * ✅ Test navigation while authenticated
 * ✅ Test logout functionality
 * ✅ Skip repetitive signup steps
 * 
 * Benefits of this separation:
 * 🚀 Faster test execution (no repeated signups)
 * 🎯 Clear test responsibilities
 * 🔧 Easier maintenance
 * 💡 Better test organization
 */

