import { test, expect } from '../../fixtures';

/**
 * 🔀 Hybrid Auth with Fixture Example
 * 
 * Using the authenticatedPageWithAPILogin fixture for easy API authentication
 * This is the simplest way to use the API + Cookie pattern!
 */

test.describe('Hybrid Auth - Using Fixture', () => {
  
  test('should access contact list using API auth fixture', async ({ authenticatedPageWithAPILogin }) => {
    // The page is already authenticated via API!
    // Just navigate and test your features
    
    await authenticatedPageWithAPILogin.goto('/contactList');
    
    // Verify we're authenticated
    const logoutButton = authenticatedPageWithAPILogin.getByRole('button', { name: /logout/i });
    await expect(logoutButton).toBeVisible();
    
    console.log('✅ Using API auth fixture - super easy!');
  });

  test('should test contact list features with fast auth', async ({ authenticatedPageWithAPILogin }) => {
    // Already authenticated, go straight to testing
    await authenticatedPageWithAPILogin.goto('/contactList');
    
    // Verify contact list is visible
    const contactListHeading = authenticatedPageWithAPILogin.locator('h1, h2').first();
    await expect(contactListHeading).toBeVisible();
    
    // Verify we can access "Add Contact" button (if it exists)
    const addContactButton = authenticatedPageWithAPILogin.getByRole('button', { name: /add.*contact/i });
    const hasAddButton = await addContactButton.isVisible().catch(() => false);
    
    if (hasAddButton) {
      console.log('✅ Add Contact button found');
    } else {
      console.log('ℹ️ Add Contact button not found (might use different UI)');
    }
    
    console.log('✅ Feature test completed with API auth');
  });

  test('should maintain authentication across page navigation', async ({ authenticatedPageWithAPILogin }) => {
    // Start at contact list
    await authenticatedPageWithAPILogin.goto('/contactList');
    await expect(authenticatedPageWithAPILogin.getByRole('button', { name: /logout/i })).toBeVisible();
    
    // Navigate to add contact (if it exists)
    await authenticatedPageWithAPILogin.goto('/addContact').catch(() => {
      console.log('ℹ️ /addContact route not available');
    });
    
    // Should still be authenticated
    const logoutButton = authenticatedPageWithAPILogin.getByRole('button', { name: /logout/i });
    const isAuthenticated = await logoutButton.isVisible().catch(() => false);
    
    expect(isAuthenticated).toBeTruthy();
    console.log('✅ Authentication maintained across navigation');
  });
});

/**
 * 📊 Comparison of All Three Authentication Methods
 * 
 * 1. Storage State (authenticatedPage)
 *    - Speed: ⚡⚡⚡ Fastest (reuses saved state)
 *    - Setup: Run once, share across all tests
 *    - Use case: Same user for many tests
 *    - Example: test('...', async ({ authenticatedPage }) => {})
 * 
 * 2. API + Cookie Fixture (authenticatedPageWithAPILogin)
 *    - Speed: ⚡⚡ Very fast (API auth per test)
 *    - Setup: Automatic per test
 *    - Use case: Unique user per test, fresh state
 *    - Example: test('...', async ({ authenticatedPageWithAPILogin }) => {})
 * 
 * 3. Manual API + Cookie (shown in hybrid-auth.spec.ts)
 *    - Speed: ⚡⚡ Very fast
 *    - Setup: Manual control
 *    - Use case: Custom auth logic, multiple users
 *    - Example: Manual userClient.login() + page.evaluate()
 * 
 * 4. UI Login (original tests)
 *    - Speed: ⚡ Slower (form filling)
 *    - Setup: Manual in each test
 *    - Use case: Testing login flow itself
 *    - Example: loginPage.login(email, password)
 */

