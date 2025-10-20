import { test, expect, testDataHelpers } from '../../fixtures';
import { HTTP_STATUS } from '../constants/api.constants';
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
    test('should successfully register a new user with all required fields', async ({ userClient, validUser }) => {
      const res = await userClient.register(validUser);
      
      expect(res.status()).toBe(HTTP_STATUS.CREATED);
      expect(res.headers()['content-type']).toContain('application/json');

      const responseBody = await res.json();
      
      expect(responseBody).toHaveProperty('user');
      expect(responseBody).toHaveProperty('token');
      expect(responseBody.user).toHaveProperty('_id');
      expect(responseBody.user).toHaveProperty('firstName');
      expect(responseBody.user).toHaveProperty('lastName');
      expect(responseBody.user).toHaveProperty('email');
      expect(responseBody.user).not.toHaveProperty('password');
      
      expect(responseBody.user.firstName).toBe(validUser.firstName);
      expect(responseBody.user.lastName).toBe(validUser.lastName);
      expect(responseBody.user.email.toLowerCase()).toBe(validUser.email.toLowerCase());
      
      expect(typeof responseBody.token).toBe('string');
      expect(responseBody.token.length).toBeGreaterThan(0);
    });

    test('should reject registration with missing firstName', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const userClient = new UserClient(request);
      const invalidUser = {
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        password: faker.internet.password({ length: 8 })
      };

      const res = await userClient.register(invalidUser);
      
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toMatch(/firstName|first name/i);
    });

    test('should reject registration with missing lastName', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const userClient = new UserClient(request);
      const invalidUser = {
        firstName: faker.person.firstName(),
        email: faker.internet.email(),
        password: faker.internet.password({ length: 8 })
      };

      const res = await userClient.register(invalidUser);
      
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toMatch(/lastName|last name/i);
    });

    test('should reject registration with missing email', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const userClient = new UserClient(request);
      const invalidUser = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password({ length: 8 })
      };

      const res = await userClient.register(invalidUser);
      
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toMatch(/email/i);
    });

    test('should reject registration with missing password', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const userClient = new UserClient(request);
      const invalidUser = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email()
      };

      const res = await userClient.register(invalidUser);
      
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toMatch(/password/i);
    });

    test('should reject registration with invalid email format', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
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
        const user = testDataHelpers.createUser({ email: invalidEmail });
        const res = await userClient.register(user);
        
        expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
        const errorBody = await res.json();
        expect(errorBody).toHaveProperty('message');
        expect(errorBody.message).toMatch(/email/i);
      }
    });

    test('should reject registration with password shorter than 7 characters', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const userClient = new UserClient(request);
      const user = testDataHelpers.createUser({ password: '123456' });

      const res = await userClient.register(user);
      
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toMatch(/password.*7/i);
    });

    test('should reject registration with duplicate email', async ({ userClient, validUser, request }) => {
      const { UserClient } = await import('../clients/userClient');
      const userClient2 = new UserClient(request);

      let res = await userClient.register(validUser);
      expect(res.status()).toBe(HTTP_STATUS.CREATED);

      const user2 = testDataHelpers.createUser({ email: validUser.email });
      res = await userClient2.register(user2);
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      expect(errorBody.message).toContain('Email address is already in use');
    });

    test('should handle case-insensitive email duplicates', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const userClient = new UserClient(request);
      const baseEmail = faker.internet.email().toLowerCase();
      const user1 = testDataHelpers.createUser({ email: baseEmail });
      const user2 = testDataHelpers.createUser({ email: baseEmail.toUpperCase() });

      let res = await userClient.register(user1);
      expect(res.status()).toBe(HTTP_STATUS.CREATED);

      res = await userClient.register(user2);
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      
      const errorBody = await res.json();
      expect(errorBody.message).toContain('Email address is already in use');

      await userClient.login({ email: user1.email, password: user1.password });
      await userClient.delete();
    });
  });

  test.describe('User Login (POST /users/login)', () => {
    test('should successfully login with valid credentials', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      
      const res = await userClient.login({ 
        email: validUser.email, 
        password: validUser.password 
      });
      
      expect(res.status()).toBe(HTTP_STATUS.OK);
      expect(res.headers()['content-type']).toContain('application/json');

      const responseBody = await res.json();
      
      expect(responseBody).toHaveProperty('user');
      expect(responseBody).toHaveProperty('token');
      
      expect(responseBody.user.firstName).toBe(validUser.firstName);
      expect(responseBody.user.lastName).toBe(validUser.lastName);
      expect(responseBody.user.email.toLowerCase()).toBe(validUser.email.toLowerCase());
      expect(responseBody.user).not.toHaveProperty('password');
      
      expect(typeof responseBody.token).toBe('string');
      expect(responseBody.token.length).toBeGreaterThan(0);
      expect(userClient.token).toBe(responseBody.token);
    });

    test('should reject login with invalid email', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      
      const res = await userClient.login({ 
        email: 'nonexistent@example.com', 
        password: validUser.password 
      });
      
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should reject login with invalid password', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      
      const res = await userClient.login({ 
        email: validUser.email, 
        password: 'wrongpassword' 
      });
      
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should reject login with missing email', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      
      const res = await userClient.login({ 
        password: validUser.password 
      } as any);
      
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should reject login with missing password', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      
      const res = await userClient.login({ 
        email: validUser.email 
      } as any);
      
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should handle case-insensitive email login', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      
      const res = await userClient.login({ 
        email: validUser.email.toUpperCase(), 
        password: validUser.password 
      });
      
      expect(res.status()).toBe(HTTP_STATUS.OK);
      const responseBody = await res.json();
      expect(responseBody.user.email.toLowerCase()).toBe(validUser.email.toLowerCase());
    });
  });

  test.describe('User Profile Management (GET /users/me)', () => {
    test('should successfully retrieve user profile', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const res = await userClient.profile();
      
      expect(res.status()).toBe(HTTP_STATUS.OK);
      expect(res.headers()['content-type']).toContain('application/json');

      const profile = await res.json();
      
      expect(profile).toHaveProperty('_id');
      expect(profile).toHaveProperty('firstName');
      expect(profile).toHaveProperty('lastName');
      expect(profile).toHaveProperty('email');
      expect(profile).not.toHaveProperty('password');
      
      expect(profile.firstName).toBe(validUser.firstName);
      expect(profile.lastName).toBe(validUser.lastName);
      expect(profile.email.toLowerCase()).toBe(validUser.email.toLowerCase());
    });

    test('should reject profile request without authentication', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const unauthenticatedClient = new UserClient(request);
      
      const res = await unauthenticatedClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should reject profile request with invalid token', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const invalidTokenClient = new UserClient(request);
      invalidTokenClient.token = 'invalid-token-12345';
      
      const res = await invalidTokenClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  test.describe('User Profile Update (PATCH /users/me)', () => {
    test('should successfully update firstName', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const updateData = { firstName: 'UpdatedFirstName' };
      
      const res = await userClient.updateProfile(updateData);
      expect(res.status()).toBe(HTTP_STATUS.OK);

      const updatedProfile = await res.json();
      expect(updatedProfile.firstName).toBe(updateData.firstName);
      expect(updatedProfile.lastName).toBe(validUser.lastName);
      expect(updatedProfile.email.toLowerCase()).toBe(validUser.email.toLowerCase());
    });

    test('should successfully update lastName', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const updateData = { lastName: 'UpdatedLastName' };
      
      const res = await userClient.updateProfile(updateData);
      expect(res.status()).toBe(HTTP_STATUS.OK);

      const updatedProfile = await res.json();
      expect(updatedProfile.firstName).toBe(validUser.firstName);
      expect(updatedProfile.lastName).toBe(updateData.lastName);
      expect(updatedProfile.email.toLowerCase()).toBe(validUser.email.toLowerCase());
    });

    test('should successfully update both firstName and lastName', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const updateData = { 
        firstName: 'NewFirstName',
        lastName: 'NewLastName'
      };
      
      const res = await userClient.updateProfile(updateData);
      expect(res.status()).toBe(HTTP_STATUS.OK);

      const updatedProfile = await res.json();
      expect(updatedProfile.firstName).toBe(updateData.firstName);
      expect(updatedProfile.lastName).toBe(updateData.lastName);
      expect(updatedProfile.email.toLowerCase()).toBe(validUser.email.toLowerCase());
    });

    test('should reject update with invalid email format', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const updateData = { email: 'invalid-email-format' };
      
      const res = await userClient.updateProfile(updateData);
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
    });

    test('should reject update without authentication', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const unauthenticatedClient = new UserClient(request);
      
      const res = await unauthenticatedClient.updateProfile({ firstName: 'Test' });
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should handle empty update request', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const res = await userClient.updateProfile({});
      expect(res.status()).toBe(HTTP_STATUS.OK);
      
      const profile = await res.json();
      expect(profile.firstName).toBe(validUser.firstName);
      expect(profile.lastName).toBe(validUser.lastName);
    });
  });

  test.describe('User Logout (POST /users/logout)', () => {
    test('should successfully logout user', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const res = await userClient.logout();
      expect(res.status()).toBe(HTTP_STATUS.OK);

      const profileRes = await userClient.profile();
      expect(profileRes.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should reject logout without authentication', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const unauthenticatedClient = new UserClient(request);
      
      const res = await unauthenticatedClient.logout();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should reject second logout attempt', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      let res = await userClient.logout();
      expect(res.status()).toBe(HTTP_STATUS.OK);

      res = await userClient.logout();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  test.describe('User Deletion (DELETE /users/me)', () => {
    test('should successfully delete user account', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const res = await userClient.delete();
      expect(res.status()).toBe(HTTP_STATUS.OK);

      const loginRes = await userClient.login({ 
        email: validUser.email, 
        password: validUser.password 
      });
      expect(loginRes.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should reject deletion without authentication', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const unauthenticatedClient = new UserClient(request);
      
      const res = await unauthenticatedClient.delete();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should reject deletion with invalid token', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const invalidTokenClient = new UserClient(request);
      invalidTokenClient.token = 'invalid-token';
      
      const res = await invalidTokenClient.delete();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });
});
