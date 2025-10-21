import { test as setup, expect } from '@playwright/test';
import { UserFactory } from './api/fixtures/userFactory';
import { UserClient } from './api/clients/userClient';

/**
 * 🔐 Authentication Setup
 * 
 * This file runs once before UI tests to:
 * 1. Create a test user via API
 * 2. Login via UI to get authenticated session
 * 3. Save storage state (cookies, localStorage) for reuse
 * 
 * Benefits:
 * - Tests don't need to login repeatedly
 * - Faster test execution
 * - More reliable (no login flakiness)
 */

const authFile = '.auth/user.json';

setup('authenticate and save storage state', async ({ page, request }) => {
  // Step 1: Create a user via API
  const userClient = new UserClient(request);
  const testUser = UserFactory.generateValidUser();
  
  console.log('🔧 Creating test user for authentication...');
  
  // Step 2: Register via UI (which also logs in automatically)
  console.log('🔐 Registering and logging in via UI...');
  await page.goto('/addUser');
  await page.waitForLoadState('networkidle');
  
  // Fill signup form
  await page.locator('input[placeholder="First Name"]').fill(testUser.firstName);
  await page.locator('input[placeholder="Last Name"]').fill(testUser.lastName);
  await page.locator('input[placeholder="Email"]').fill(testUser.email);
  await page.locator('input[placeholder="Password"]').fill(testUser.password);
  await page.getByRole('button', { name: /submit|sign up/i }).click();
  
  // Wait for successful registration and auto-login (redirect to contact list)
  await page.waitForURL('**/contactList', { timeout: 15000 });
  
  // Verify we're logged in
  const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
  await expect(logoutButton).toBeVisible({ timeout: 10000 });
  
  console.log('✅ Authentication successful');
  
  // Step 3: Save storage state to file
  await page.context().storageState({ path: authFile });
  console.log(`💾 Storage state saved to ${authFile}`);
  
  // Store user credentials in environment for cleanup later if needed
  process.env.AUTH_USER_EMAIL = testUser.email;
  process.env.AUTH_USER_PASSWORD = testUser.password;
});

