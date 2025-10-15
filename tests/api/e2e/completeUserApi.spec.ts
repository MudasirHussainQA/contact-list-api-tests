import { test, expect } from '@playwright/test';
import { UserClient } from '../clients/userClient';
import { UserFactory } from '../fixtures/userFactory';
import { faker } from '@faker-js/faker';

/**
 * Complete User Management API Tests
 * Based on Contact List API Documentation: https://documenter.getpostman.com/view/4012288/TzK2bEa8
 * 
 * Endpoints Covered:
 * - POST /users (Register User)
 * - POST /users/login (Login User)
 * - GET /users/me (Get User Profile)
 * - PATCH /users/me (Update User Profile)
 * - DELETE /users/me (Delete User)
 * - POST /users/logout (Logout User)
 */

test.describe('Complete User Management API Tests', () => {
  
  test.describe('User Registration (POST /users)', () => {
    test('should successfully register a new user with all required fields', async ({ request }) => {
      const userClient = new UserClient(request);
      const user = UserFactory.generateValidUser();

      const res = await userClient.register(user);
      
      expect(res.status()).toBe(201);
      expect(res.headers()['content-type']).toContain('application/json');

      const responseBody = await res.json();
      
      // Validate response structure according to API documentation
      expect(responseBody).toHaveProperty('user');
      expect(responseBody).toHaveProperty('token');
      
      // Validate user object
      expect(responseBody.user).toHaveProperty('_id');
      expect(responseBody.user).toHaveProperty('firstName');
      expect(responseBody.user).toHaveProperty('lastName');
      expect(responseBody.user).toHaveProperty('email');
      expect(responseBody.user).not.toHaveProperty('password'); // Password should not be returned
      
      // Validate data integrity
      expect(responseBody.user.firstName).toBe(user.firstName);
      expect(responseBody.user.lastName).toBe(user.lastName);
      expect(responseBody.user.email.toLowerCase()).toBe(user.email.toLowerCase());
      
      // Validate token
      expect(typeof responseBody.token).toBe('string');
      expect(responseBody.token.length).toBeGreaterThan(0);
      
      // Cleanup
      await userClient.login({ email: user.email, password: user.password });
      await userClient.delete();
    });

    test('should reject registration with missing firstName', async ({ request }) => {
      const userClient = new UserClient(request);
      const invalidUser = {
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        password: faker.internet.password({ length: 8 })
      };

      const res = await userClient.register(invalidUser);
      
      expect(res.status()).toBe(400);
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toMatch(/firstName|first name/i);
    });

    test('should reject registration with missing lastName', async ({ request }) => {
      const userClient = new UserClient(request);
      const invalidUser = {
        firstName: faker.person.firstName(),
        email: faker.internet.email(),
        password: faker.internet.password({ length: 8 })
      };

      const res = await userClient.register(invalidUser);
      
      expect(res.status()).toBe(400);
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toMatch(/lastName|last name/i);
    });

    test('should reject registration with missing email', async ({ request }) => {
      const userClient = new UserClient(request);
      const invalidUser = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password({ length: 8 })
      };

      const res = await userClient.register(invalidUser);
      
      expect(res.status()).toBe(400);
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toMatch(/email/i);
    });

    test('should reject registration with missing password', async ({ request }) => {
      const userClient = new UserClient(request);
      const invalidUser = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email()
      };

      const res = await userClient.register(invalidUser);
      
      expect(res.status()).toBe(400);
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toMatch(/password/i);
    });

    test('should reject registration with invalid email format', async ({ request }) => {
      const userClient = new UserClient(request);
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@domain.com',
        'test.domain.com',
        'test@domain',
        'test..test@domain.com'
      ];

      for (const invalidEmail of invalidEmails) {
        const user = UserFactory.generateValidUser({ email: invalidEmail });
        const res = await userClient.register(user);
        
        expect(res.status()).toBe(400);
        const errorBody = await res.json();
        expect(errorBody).toHaveProperty('message');
        expect(errorBody.message).toMatch(/email/i);
      }
    });

    test('should reject registration with password shorter than 7 characters', async ({ request }) => {
      const userClient = new UserClient(request);
      const user = UserFactory.generateValidUser({ password: '123456' }); // 6 characters

      const res = await userClient.register(user);
      
      expect(res.status()).toBe(400);
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toMatch(/password.*7/i);
    });

    test('should reject registration with duplicate email', async ({ request }) => {
      const userClient = new UserClient(request);
      const user1 = UserFactory.generateValidUser();
      const user2 = UserFactory.generateValidUser({ email: user1.email });

      // Register first user
      let res = await userClient.register(user1);
      expect(res.status()).toBe(201);

      // Try to register second user with same email
      res = await userClient.register(user2);
      expect(res.status()).toBe(400);
      
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toContain('Email address is already in use');

      // Cleanup
      await userClient.login({ email: user1.email, password: user1.password });
      await userClient.delete();
    });

    test('should handle case-insensitive email duplicates', async ({ request }) => {
      const userClient = new UserClient(request);
      const baseEmail = faker.internet.email().toLowerCase();
      const user1 = UserFactory.generateValidUser({ email: baseEmail });
      const user2 = UserFactory.generateValidUser({ email: baseEmail.toUpperCase() });

      // Register first user
      let res = await userClient.register(user1);
      expect(res.status()).toBe(201);

      // Try to register second user with same email in different case
      res = await userClient.register(user2);
      expect(res.status()).toBe(400);
      
      const errorBody = await res.json();
      expect(errorBody.message).toContain('Email address is already in use');

      // Cleanup
      await userClient.login({ email: user1.email, password: user1.password });
      await userClient.delete();
    });
  });

  test.describe('User Login (POST /users/login)', () => {
    let testUser: any;
    let userClient: UserClient;

    test.beforeEach(async ({ request }) => {
      userClient = new UserClient(request);
      testUser = UserFactory.generateValidUser();
      
      // Create test user
      const res = await userClient.register(testUser);
      expect(res.status()).toBe(201);
    });

    test.afterEach(async () => {
      // Cleanup test user
      try {
        await userClient.login({ email: testUser.email, password: testUser.password });
        await userClient.delete();
      } catch (error) {
        console.log('Cleanup error (expected if user already deleted):', error);
      }
    });

    test('should successfully login with valid credentials', async () => {
      const res = await userClient.login({ 
        email: testUser.email, 
        password: testUser.password 
      });
      
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('application/json');

      const responseBody = await res.json();
      
      // Validate response structure
      expect(responseBody).toHaveProperty('user');
      expect(responseBody).toHaveProperty('token');
      
      // Validate user object
      expect(responseBody.user.firstName).toBe(testUser.firstName);
      expect(responseBody.user.lastName).toBe(testUser.lastName);
      expect(responseBody.user.email.toLowerCase()).toBe(testUser.email.toLowerCase());
      expect(responseBody.user).not.toHaveProperty('password');
      
      // Validate token
      expect(typeof responseBody.token).toBe('string');
      expect(responseBody.token.length).toBeGreaterThan(0);
      expect(userClient.token).toBe(responseBody.token);
    });

    test('should reject login with invalid email', async () => {
      const res = await userClient.login({ 
        email: 'nonexistent@example.com', 
        password: testUser.password 
      });
      
      expect(res.status()).toBe(401);
      
      // Handle empty response body for 401 errors
      const responseText = await res.text();
      if (responseText) {
        try {
          const errorBody = JSON.parse(responseText);
          expect(errorBody).toHaveProperty('error');
        } catch (e) {
          // If response is not JSON, that's acceptable for 401
          console.log('401 response is not JSON:', responseText);
        }
      }
    });

    test('should reject login with invalid password', async () => {
      const res = await userClient.login({ 
        email: testUser.email, 
        password: 'wrongpassword' 
      });
      
      expect(res.status()).toBe(401);
      
      // Handle empty response body for 401 errors
      const responseText = await res.text();
      if (responseText) {
        try {
          const errorBody = JSON.parse(responseText);
          expect(errorBody).toHaveProperty('error');
        } catch (e) {
          // If response is not JSON, that's acceptable for 401
          console.log('401 response is not JSON:', responseText);
        }
      }
    });

    test('should reject login with missing email', async () => {
      const res = await userClient.login({ 
        password: testUser.password 
      } as any);
      
      // API behavior: Missing email returns 401 instead of 400
      expect(res.status()).toBe(401);
      
      const responseText = await res.text();
      if (responseText) {
        try {
          const errorBody = JSON.parse(responseText);
          expect(errorBody).toHaveProperty('error');
        } catch (e) {
          console.log('401 response is not JSON:', responseText);
        }
      }
    });

    test('should reject login with missing password', async () => {
      const res = await userClient.login({ 
        email: testUser.email 
      } as any);
      
      // API behavior: Missing password returns 401 instead of 400
      expect(res.status()).toBe(401);
      
      const responseText = await res.text();
      if (responseText) {
        try {
          const errorBody = JSON.parse(responseText);
          expect(errorBody).toHaveProperty('error');
        } catch (e) {
          console.log('401 response is not JSON:', responseText);
        }
      }
    });

    test('should handle case-insensitive email login', async () => {
      const res = await userClient.login({ 
        email: testUser.email.toUpperCase(), 
        password: testUser.password 
      });
      
      expect(res.status()).toBe(200);
      const responseBody = await res.json();
      expect(responseBody.user.email.toLowerCase()).toBe(testUser.email.toLowerCase());
    });
  });

  test.describe('User Profile Management (GET /users/me)', () => {
    let testUser: any;
    let userClient: UserClient;

    test.beforeEach(async ({ request }) => {
      userClient = new UserClient(request);
      testUser = UserFactory.generateValidUser();
      
      // Create and login test user
      await userClient.register(testUser);
      await userClient.login({ email: testUser.email, password: testUser.password });
    });

    test.afterEach(async () => {
      try {
        await userClient.delete();
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    });

    test('should successfully retrieve user profile', async () => {
      const res = await userClient.profile();
      
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('application/json');

      const profile = await res.json();
      
      // Validate profile structure
      expect(profile).toHaveProperty('_id');
      expect(profile).toHaveProperty('firstName');
      expect(profile).toHaveProperty('lastName');
      expect(profile).toHaveProperty('email');
      expect(profile).not.toHaveProperty('password');
      
      // Validate profile data
      expect(profile.firstName).toBe(testUser.firstName);
      expect(profile.lastName).toBe(testUser.lastName);
      expect(profile.email.toLowerCase()).toBe(testUser.email.toLowerCase());
    });

    test('should reject profile request without authentication', async ({ request }) => {
      const unauthenticatedClient = new UserClient(request);
      
      const res = await unauthenticatedClient.profile();
      expect(res.status()).toBe(401);
    });

    test('should reject profile request with invalid token', async ({ request }) => {
      const invalidTokenClient = new UserClient(request);
      invalidTokenClient.token = 'invalid-token-12345';
      
      const res = await invalidTokenClient.profile();
      expect(res.status()).toBe(401);
    });
  });

  test.describe('User Profile Update (PATCH /users/me)', () => {
    let testUser: any;
    let userClient: UserClient;

    test.beforeEach(async ({ request }) => {
      userClient = new UserClient(request);
      testUser = UserFactory.generateValidUser();
      
      // Create and login test user
      await userClient.register(testUser);
      await userClient.login({ email: testUser.email, password: testUser.password });
    });

    test.afterEach(async () => {
      try {
        await userClient.delete();
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    });

    test('should successfully update firstName', async () => {
      const updateData = { firstName: 'UpdatedFirstName' };
      
      const res = await userClient.updateProfile(updateData);
      expect(res.status()).toBe(200);

      const updatedProfile = await res.json();
      expect(updatedProfile.firstName).toBe(updateData.firstName);
      expect(updatedProfile.lastName).toBe(testUser.lastName); // Should remain unchanged
      expect(updatedProfile.email.toLowerCase()).toBe(testUser.email.toLowerCase());
    });

    test('should successfully update lastName', async () => {
      const updateData = { lastName: 'UpdatedLastName' };
      
      const res = await userClient.updateProfile(updateData);
      expect(res.status()).toBe(200);

      const updatedProfile = await res.json();
      expect(updatedProfile.firstName).toBe(testUser.firstName); // Should remain unchanged
      expect(updatedProfile.lastName).toBe(updateData.lastName);
      expect(updatedProfile.email.toLowerCase()).toBe(testUser.email.toLowerCase());
    });

    test('should successfully update both firstName and lastName', async () => {
      const updateData = { 
        firstName: 'NewFirstName',
        lastName: 'NewLastName'
      };
      
      const res = await userClient.updateProfile(updateData);
      expect(res.status()).toBe(200);

      const updatedProfile = await res.json();
      expect(updatedProfile.firstName).toBe(updateData.firstName);
      expect(updatedProfile.lastName).toBe(updateData.lastName);
      expect(updatedProfile.email.toLowerCase()).toBe(testUser.email.toLowerCase());
    });

    test('should reject update with invalid email format', async () => {
      const updateData = { email: 'invalid-email-format' };
      
      const res = await userClient.updateProfile(updateData);
      expect(res.status()).toBe(400);
      
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
    });

    test('should reject update without authentication', async ({ request }) => {
      const unauthenticatedClient = new UserClient(request);
      
      const res = await unauthenticatedClient.updateProfile({ firstName: 'Test' });
      expect(res.status()).toBe(401);
    });

    test('should handle empty update request', async () => {
      const res = await userClient.updateProfile({});
      expect(res.status()).toBe(200);
      
      const profile = await res.json();
      expect(profile.firstName).toBe(testUser.firstName);
      expect(profile.lastName).toBe(testUser.lastName);
    });
  });

  test.describe('User Logout (POST /users/logout)', () => {
    let testUser: any;
    let userClient: UserClient;

    test.beforeEach(async ({ request }) => {
      userClient = new UserClient(request);
      testUser = UserFactory.generateValidUser();
      
      // Create and login test user
      await userClient.register(testUser);
      await userClient.login({ email: testUser.email, password: testUser.password });
    });

    test.afterEach(async () => {
      try {
        await userClient.login({ email: testUser.email, password: testUser.password });
        await userClient.delete();
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    });

    test('should successfully logout user', async () => {
      const res = await userClient.logout();
      expect(res.status()).toBe(200);

      // Verify token is invalidated by trying to access profile
      const profileRes = await userClient.profile();
      expect(profileRes.status()).toBe(401);
    });

    test('should reject logout without authentication', async ({ request }) => {
      const unauthenticatedClient = new UserClient(request);
      
      const res = await unauthenticatedClient.logout();
      expect(res.status()).toBe(401);
    });

    test('should reject second logout attempt', async () => {
      // First logout should succeed
      let res = await userClient.logout();
      expect(res.status()).toBe(200);

      // Second logout should fail
      res = await userClient.logout();
      expect(res.status()).toBe(401);
    });
  });

  test.describe('User Deletion (DELETE /users/me)', () => {
    let testUser: any;
    let userClient: UserClient;

    test.beforeEach(async ({ request }) => {
      userClient = new UserClient(request);
      testUser = UserFactory.generateValidUser();
      
      // Create and login test user
      await userClient.register(testUser);
      await userClient.login({ email: testUser.email, password: testUser.password });
    });

    test('should successfully delete user account', async () => {
      const res = await userClient.delete();
      expect(res.status()).toBe(200);

      // Verify user is deleted by trying to login
      const loginRes = await userClient.login({ 
        email: testUser.email, 
        password: testUser.password 
      });
      expect(loginRes.status()).toBe(401);
    });

    test('should reject deletion without authentication', async ({ request }) => {
      const unauthenticatedClient = new UserClient(request);
      
      const res = await unauthenticatedClient.delete();
      expect(res.status()).toBe(401);
    });

    test('should reject deletion with invalid token', async ({ request }) => {
      const invalidTokenClient = new UserClient(request);
      invalidTokenClient.token = 'invalid-token';
      
      const res = await invalidTokenClient.delete();
      expect(res.status()).toBe(401);
    });
  });
});
