import { test, expect } from '../../fixtures';
import { UserFactory } from '../../api/fixtures/userFactory';

test.describe('User Signup UI Tests', () => {
  test('should successfully register a new user via UI', async ({ signupPage, loginPage, contactListPage, validUser }) => {
    // Navigate to signup page
    await signupPage.navigateToSignup();
    
    // Verify signup form is visible
    expect(await signupPage.isSignupFormVisible()).toBeTruthy();
    
    // Fill and submit signup form
    await signupPage.signupUser(validUser);
    
    // Check if we're redirected to contact list or if signup was successful
    const currentUrl = await signupPage.page.url();
    console.log('Current URL after signup:', currentUrl);
    
    // If we're on contact list page, verify it
    if (currentUrl.includes('/contactList')) {
      expect(await contactListPage.isContactListVisible()).toBeTruthy();
      const welcomeMessage = await contactListPage.getWelcomeMessage();
      console.log('Welcome message:', welcomeMessage);
      expect(welcomeMessage.length).toBeGreaterThan(0);
    } else {
      // If not redirected, navigate to contact list manually
      await contactListPage.navigateToContactList();
      expect(await contactListPage.isContactListVisible()).toBeTruthy();
    }
    
    // Cleanup: Logout
    await contactListPage.logout();
  });

  test('should show error for duplicate email registration', async ({ signupPage, validUser, page }) => {
    await signupPage.navigateToSignup();
    
    // First signup - this will succeed and redirect
    await signupPage.signupUser(validUser);
    await page.waitForTimeout(1500);
    
    // Check URL - if redirected to contact list, first signup succeeded
    let currentUrl = await page.url();
    if (currentUrl.includes('/contactList')) {
      // Go back to signup to try duplicate
      await page.goto('/addUser');
      await page.waitForTimeout(500);
    }
    
    // Now try duplicate email
    await signupPage.signupUser(validUser);
    await page.waitForTimeout(1500);
    
    // Check for error message with the debug method
    const debugResult = await signupPage.findAnyErrorMessage();
    expect(debugResult.found).toBeTruthy();
    expect(debugResult.message).toContain('already in use');
  });

  test('should show validation errors for invalid data', async ({ signupPage }) => {
    await signupPage.navigateToSignup();
    
    // Try submitting with invalid email
    const invalidUser = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
      password: 'Test123'
    };
    
    await signupPage.signupUser(invalidUser);
    
    // Should show validation error
    const hasError = await signupPage.isErrorMessageVisible();
    expect(hasError).toBeTruthy();
  });

  test('should show validation errors for empty required fields', async ({ signupPage }) => {
    // App renders validation errors in #error element
    await signupPage.navigateToSignup();
    
    // Try submitting without filling required fields
    await signupPage.page.getByRole('button', { name: /sign up|register|submit/i }).click();
    
    // Should show validation errors in #error element
    const errorMessages = await signupPage.page.locator('#error').count();
    expect(errorMessages).toBeGreaterThan(0);
  });

  test('should navigate between signup and login pages', async ({ signupPage, loginPage }) => {
    await signupPage.navigateToSignup();
    expect(await signupPage.isSignupFormVisible()).toBeTruthy();
    
    // Navigate to login by clicking the link
    await signupPage.clickLoginLink();
    expect(await loginPage.isLoginFormVisible()).toBeTruthy();
  });

  test('should clear form fields when needed', async ({ signupPage, page }) => {
    await signupPage.navigateToSignup();
    
    // Fill in form
    await signupPage.fillSignupForm({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'Password123'
    });
    
    // Clear form using placeholder selectors (as shown in HTML)
    await page.locator('input[placeholder="First Name"]').clear();
    await page.locator('input[placeholder="Last Name"]').clear();
    await page.locator('input[placeholder="Email"]').clear();
    await page.locator('input[placeholder="Password"]').clear();
    
    await page.waitForTimeout(300);
    
    // Verify fields are cleared using placeholder selectors
    const firstNameValue = await page.locator('input[placeholder="First Name"]').inputValue();
    const emailValue = await page.locator('input[placeholder="Email"]').inputValue();
    
    expect(firstNameValue).toBe('');
    expect(emailValue).toBe('');
  });

  test('should handle successful signup flow end-to-end', async ({ signupPage, contactListPage, validUser }) => {
    // Step 1: Navigate to signup
    await signupPage.navigateToSignup();
    expect(await signupPage.isSignupFormVisible()).toBeTruthy();
    
    // Step 2: Fill signup form
    await signupPage.signupUser(validUser);
    
    // Step 3: Verify redirect or navigation to contact list
    const currentUrl = await signupPage.page.url();
    if (currentUrl.includes('/contactList')) {
      expect(await contactListPage.isContactListVisible()).toBeTruthy();
    } else {
      await contactListPage.navigateToContactList();
      expect(await contactListPage.isContactListVisible()).toBeTruthy();
    }
    
    // Step 4: Verify welcome message
    const welcomeMessage = await contactListPage.getWelcomeMessage();
    expect(welcomeMessage.length).toBeGreaterThan(0);
    
    // Step 5: Logout
    await contactListPage.logout();
  });
});
