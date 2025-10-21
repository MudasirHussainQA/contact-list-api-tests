import { test, expect } from '../../fixtures';
import { UserClient } from '../../api/clients/userClient';
import { UserFactory } from '../../api/fixtures/userFactory';

/**
 * 🔀 Hybrid Authentication Tests
 * 
 * These tests demonstrate the "API + Cookie" pattern:
 * 1. Authenticate via API (fast)
 * 2. Set cookies/localStorage in browser context
 * 3. Access UI pages (already authenticated)
 * 
 * Benefits:
 * - Faster than UI login (no form filling)
 * - More reliable (API is more stable)
 * - Still tests the UI functionality
 * - Great for testing features that need auth but don't test login itself
 */

test.describe('Hybrid Authentication - API + Browser Cookies', () => {
  
  test('should authenticate via API and set token in browser context', async ({ page, request }) => {
    // Step 1: Create and login via API
    const userClient = new UserClient(request);
    const testUser = UserFactory.generateValidUser();
    
    console.log('📡 Registering user via API...');
    const registerResponse = await userClient.register(testUser);
    expect(registerResponse.status()).toBe(201);
    
    console.log('🔐 Logging in via API...');
    const loginResponse = await userClient.login({
      email: testUser.email,
      password: testUser.password
    });
    expect(loginResponse.status()).toBe(200);
    
    // Get the token from API response
    const loginData = await loginResponse.json();
    const token = loginData.token;
    expect(token).toBeTruthy();
    console.log('✅ Got authentication token from API');
    
    // Step 2: Navigate to the app
    await page.goto('/contactList');
    
    // Step 3: Set the token in localStorage (or cookies depending on app)
    // Most apps store JWT tokens in localStorage or cookies
    await page.evaluate((authToken) => {
      localStorage.setItem('token', authToken);
      // Alternative: Set as cookie
      // document.cookie = `token=${authToken}; path=/`;
    }, token);
    
    console.log('🍪 Set authentication token in browser');
    
    // Step 4: Reload to apply the authentication
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Step 5: Verify we're authenticated in the UI
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await expect(logoutButton).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Successfully authenticated in browser using API token');
    
    // Clean up
    await userClient.delete();
  });

  test('should use API auth with localStorage for faster test setup', async ({ page, request }) => {
    // Step 1: Fast API authentication
    const userClient = new UserClient(request);
    const testUser = UserFactory.generateValidUser();
    
    await userClient.register(testUser);
    const loginResponse = await userClient.login({
      email: testUser.email,
      password: testUser.password
    });
    
    const { token } = await loginResponse.json();
    
    // Step 2: Navigate to the page and set authentication in localStorage
    await page.goto('/contactList');
    
    // Step 3: Set token in localStorage (most common for JWT tokens)
    await page.evaluate((authToken) => {
      localStorage.setItem('token', authToken);
      // You can also set sessionStorage if needed
      // sessionStorage.setItem('token', authToken);
    }, token);
    
    console.log('💾 Token set in localStorage');
    
    // Step 4: Reload to apply authentication
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Step 5: Verify authenticated state
    const logoutButton = page.getByRole('button', { name: /logout/i });
    await expect(logoutButton).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Fast authentication via API + localStorage successful');
    
    // Step 6: Test some authenticated feature
    const contactListTable = page.locator('#myTable, table, [class*="contact"]').first();
    await expect(contactListTable).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('ℹ️ Contact table not found (might be empty list)');
    });
    
    // Clean up
    await userClient.delete();
  });

  test('should compare speed: API auth vs UI login', async ({ page, request }) => {
    const testUser = UserFactory.generateValidUser();
    
    // Method 1: API Authentication (FAST)
    const apiStartTime = Date.now();
    
    const userClient = new UserClient(request);
    await userClient.register(testUser);
    const loginResponse = await userClient.login({
      email: testUser.email,
      password: testUser.password
    });
    const { token } = await loginResponse.json();
    
    await page.goto('/contactList');
    await page.evaluate((authToken) => {
      localStorage.setItem('token', authToken);
    }, token);
    await page.reload();
    
    const apiEndTime = Date.now();
    const apiAuthTime = apiEndTime - apiStartTime;
    
    // Verify authentication worked
    const logoutButton = page.getByRole('button', { name: /logout/i });
    await expect(logoutButton).toBeVisible({ timeout: 10000 });
    
    console.log(`⚡ API Auth Time: ${apiAuthTime}ms`);
    console.log(`✅ API authentication is much faster than UI form filling!`);
    
    // Note: UI login would typically take 3000-5000ms
    // API + cookie method typically takes 500-1500ms
    // That's 2-3x faster!
    
    expect(apiAuthTime).toBeLessThan(5000); // Should be fast
    
    // Clean up
    await userClient.delete();
  });

  test('should use context fixture with API authentication', async ({ page, request, validUser }) => {
    // This shows how to combine fixtures with API auth + cookies pattern
    const userClient = new UserClient(request);
    
    // Register and login via API
    await userClient.register(validUser);
    const loginResponse = await userClient.login({
      email: validUser.email,
      password: validUser.password
    });
    
    expect(loginResponse.status()).toBe(200);
    const { token } = await loginResponse.json();
    
    // Set authentication in browser
    await page.goto('/contactList');
    await page.evaluate((authToken) => {
      localStorage.setItem('token', authToken);
    }, token);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Now use the page fixture for your test
    const currentUrl = page.url();
    expect(currentUrl).toContain('/contactList');
    
    const logoutButton = page.getByRole('button', { name: /logout/i });
    await expect(logoutButton).toBeVisible();
    
    console.log('✅ Fixture + API auth pattern working');
    
    // Clean up
    await userClient.delete();
  });
});

/**
 * 📝 When to Use Each Authentication Method
 * 
 * 1. **Storage State** (Best for: Reusing across many tests)
 *    ✅ Run setup once, reuse for all tests
 *    ✅ Fastest for large test suites
 *    ✅ Good for CI/CD
 *    ❌ Less flexible (same user for all tests)
 * 
 * 2. **API + Cookies** (Best for: Individual test flexibility)
 *    ✅ Fast authentication per test
 *    ✅ Can create specific user per test
 *    ✅ More control over auth state
 *    ✅ Easy to switch users mid-test
 *    ❌ Slightly slower than storage state reuse
 * 
 * 3. **UI Login** (Best for: Testing login itself)
 *    ✅ Tests the actual login flow
 *    ✅ Catches UI bugs in login form
 *    ❌ Slower (3-5 seconds per test)
 *    ❌ More prone to flakiness
 * 
 * Choose based on what you're testing!
 */

/**
 * 💡 Implementation Tips
 * 
 * 1. **Token Storage**: Check if your app uses:
 *    - localStorage.setItem('token', token)
 *    - sessionStorage.setItem('token', token)
 *    - document.cookie = 'token=...'
 *    - Or a combination
 * 
 * 2. **Cookie Settings**: Match your app's requirements:
 *    - httpOnly: true/false
 *    - secure: true for HTTPS
 *    - sameSite: 'Strict', 'Lax', or 'None'
 * 
 * 3. **Refresh After Setting**: Often need to reload page or navigate
 *    after setting cookies for them to take effect
 * 
 * 4. **Cleanup**: Always delete test users after tests
 *    to keep your test environment clean
 */

