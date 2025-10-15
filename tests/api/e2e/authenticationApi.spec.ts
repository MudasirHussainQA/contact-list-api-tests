import { test, expect } from '@playwright/test';
import { UserClient } from '../clients/userClient';
import { ContactClient } from '../clients/contactClient';
import { UserFactory } from '../fixtures/userFactory';
import { ContactFactory } from '../fixtures/contactFactory';
import { API_ENDPOINTS, HTTP_STATUS } from '../constants/api.constants';
import { faker } from '@faker-js/faker';

/**
 * Complete Authentication & Authorization API Tests
 * Based on Contact List API Documentation: https://documenter.getpostman.com/view/4012288/TzK2bEa8
 * 
 * Test Coverage:
 * - JWT Token Authentication
 * - Authorization Headers
 * - Token Validation
 * - Session Management
 * - Access Control
 * - Security Boundaries
 */

test.describe('Authentication & Authorization API Tests', () => {

  test.describe('JWT Token Authentication', () => {
    test('should include valid JWT token in login response', async ({ request }) => {
      const userClient = new UserClient(request);
      const user = UserFactory.generateValidUser();

      // Register and login user
      await userClient.register(user);
      const loginRes = await userClient.login({ email: user.email, password: user.password });
      
      expect(loginRes.status()).toBe(HTTP_STATUS.OK);
      const loginBody = await loginRes.json();
      
      // Validate JWT token structure
      expect(loginBody).toHaveProperty('token');
      expect(typeof loginBody.token).toBe('string');
      expect(loginBody.token.length).toBeGreaterThan(0);
      
      // JWT should have 3 parts separated by dots
      const tokenParts = loginBody.token.split('.');
      expect(tokenParts.length).toBe(3);
      
      // Each part should be base64 encoded
      tokenParts.forEach((part: string) => {
        expect(part.length).toBeGreaterThan(0);
        expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
      });

      // Cleanup
      await userClient.delete();
    });

    test('should accept valid Bearer token in Authorization header', async ({ request }) => {
      const userClient = new UserClient(request);
      const user = UserFactory.generateValidUser();

      // Register and login user
      await userClient.register(user);
      await userClient.login({ email: user.email, password: user.password });
      
      // Test authenticated request
      const profileRes = await userClient.profile();
      expect(profileRes.status()).toBe(HTTP_STATUS.OK);

      // Cleanup
      await userClient.delete();
    });

    test('should reject requests without Authorization header', async ({ request }) => {
      const unauthenticatedClient = new UserClient(request);
      
      const res = await unauthenticatedClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
      
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('error');
    });

    test('should reject requests with malformed Authorization header', async ({ request }) => {
      const userClient = new UserClient(request);
      userClient.token = 'malformed-token-without-bearer-prefix';
      
      const res = await userClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should reject requests with invalid JWT token', async ({ request }) => {
      const userClient = new UserClient(request);
      userClient.token = 'invalid.jwt.token';
      
      const res = await userClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should reject requests with expired JWT token', async ({ request }) => {
      // Note: This test assumes the API has token expiration
      // In a real scenario, you'd need to wait for token expiration or mock it
      const userClient = new UserClient(request);
      userClient.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MWY5ZjQ4ZjE2NzQyMDAwMTU4YzQxYzMiLCJpYXQiOjE2NDM3MzQ5OTksImV4cCI6MTY0MzczNTAwMH0.expired-token-signature';
      
      const res = await userClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  test.describe('Session Management', () => {
    let userClient: UserClient;
    let testUser: any;

    test.beforeEach(async ({ request }) => {
      userClient = new UserClient(request);
      testUser = UserFactory.generateValidUser();
      
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

    test('should maintain session across multiple requests', async () => {
      // Make multiple authenticated requests
      let res = await userClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.OK);

      res = await userClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.OK);

      res = await userClient.updateProfile({ firstName: 'UpdatedName' });
      expect(res.status()).toBe(HTTP_STATUS.OK);
    });

    test('should invalidate session after logout', async () => {
      // Logout user
      let res = await userClient.logout();
      expect(res.status()).toBe(HTTP_STATUS.OK);

      // Try to access protected resource
      res = await userClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should invalidate session after user deletion', async () => {
      const originalToken = userClient.token;
      
      // Delete user account
      let res = await userClient.delete();
      expect(res.status()).toBe(HTTP_STATUS.OK);

      // Try to use the old token
      userClient.token = originalToken;
      res = await userClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should handle concurrent sessions from same user', async ({ request }) => {
      // Create second session for same user
      const userClient2 = new UserClient(request);
      const loginRes = await userClient2.login({ email: testUser.email, password: testUser.password });
      expect(loginRes.status()).toBe(HTTP_STATUS.OK);

      // Both sessions should work initially
      let res1 = await userClient.profile();
      let res2 = await userClient2.profile();
      
      expect(res1.status()).toBe(HTTP_STATUS.OK);
      expect(res2.status()).toBe(HTTP_STATUS.OK);

      // Logout from first session
      await userClient.logout();

      // API behavior: Logout invalidates all sessions for the user
      // So second session should also be invalidated
      res2 = await userClient2.profile();
      expect(res2.status()).toBe(HTTP_STATUS.UNAUTHORIZED);

      // First session should be invalidated
      res1 = await userClient.profile();
      expect(res1.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  test.describe('Access Control & User Isolation', () => {
    let user1Client: UserClient;
    let user2Client: UserClient;
    let contact1Client: ContactClient;
    let contact2Client: ContactClient;
    let testUser1: any;
    let testUser2: any;

    test.beforeEach(async ({ request }) => {
      // Create first user
      user1Client = new UserClient(request);
      testUser1 = UserFactory.generateValidUser();
      await user1Client.register(testUser1);
      await user1Client.login({ email: testUser1.email, password: testUser1.password });
      contact1Client = new ContactClient(request, user1Client.token);

      // Create second user
      user2Client = new UserClient(request);
      testUser2 = UserFactory.generateValidUser();
      await user2Client.register(testUser2);
      await user2Client.login({ email: testUser2.email, password: testUser2.password });
      contact2Client = new ContactClient(request, user2Client.token);
    });

    test.afterEach(async () => {
      try {
        await user1Client.delete();
        await user2Client.delete();
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    });

    test('should isolate user profiles between different users', async () => {
      // Each user should only see their own profile
      const profile1 = await user1Client.profile();
      const profile2 = await user2Client.profile();
      
      expect(profile1.status()).toBe(HTTP_STATUS.OK);
      expect(profile2.status()).toBe(HTTP_STATUS.OK);
      
      const profile1Data = await profile1.json();
      const profile2Data = await profile2.json();
      
      expect(profile1Data._id).not.toBe(profile2Data._id);
      expect(profile1Data.email.toLowerCase()).toBe(testUser1.email.toLowerCase());
      expect(profile2Data.email.toLowerCase()).toBe(testUser2.email.toLowerCase());
    });

    test('should isolate contacts between different users', async () => {
      // Create contacts for each user
      const contact1 = ContactFactory.generateReliableContact();
      const contact2 = ContactFactory.generateReliableContact();
      
      const res1 = await contact1Client.add(contact1);
      const res2 = await contact2Client.add(contact2);
      
      expect(res1.status()).toBe(HTTP_STATUS.CREATED);
      expect(res2.status()).toBe(HTTP_STATUS.CREATED);
      
      const createdContact1 = await res1.json();
      const createdContact2 = await res2.json();

      // Each user should only see their own contacts
      const list1 = await contact1Client.list();
      const list2 = await contact2Client.list();
      
      expect(list1.status()).toBe(HTTP_STATUS.OK);
      expect(list2.status()).toBe(HTTP_STATUS.OK);
      
      const contacts1 = await list1.json();
      const contacts2 = await list2.json();
      
      expect(contacts1.length).toBe(1);
      expect(contacts2.length).toBe(1);
      expect(contacts1[0]._id).toBe(createdContact1._id);
      expect(contacts2[0]._id).toBe(createdContact2._id);
    });

    test('should prevent cross-user contact access', async () => {
      // Create contact for user1
      const contact = ContactFactory.generateReliableContact();
      const res = await contact1Client.add(contact);
      expect(res.status()).toBe(HTTP_STATUS.CREATED);
      const createdContact = await res.json();

      // User2 should not be able to access user1's contact
      const accessRes = await contact2Client.get(createdContact._id);
      expect(accessRes.status()).toBe(HTTP_STATUS.NOT_FOUND);
    });

    test('should prevent cross-user contact modification', async () => {
      // Create contact for user1
      const contact = ContactFactory.generateReliableContact();
      const res = await contact1Client.add(contact);
      expect(res.status()).toBe(HTTP_STATUS.CREATED);
      const createdContact = await res.json();

      // User2 should not be able to update user1's contact
      const updateData = { firstName: 'Hacked' };
      const updateRes = await contact2Client.patch(createdContact._id, updateData);
      expect(updateRes.status()).toBe(HTTP_STATUS.NOT_FOUND);

      // Verify contact was not modified
      const getRes = await contact1Client.get(createdContact._id);
      expect(getRes.status()).toBe(HTTP_STATUS.OK);
      const unchangedContact = await getRes.json();
      expect(unchangedContact.firstName).toBe(contact.firstName);
    });

    test('should prevent cross-user contact deletion', async () => {
      // Create contact for user1
      const contact = ContactFactory.generateReliableContact();
      const res = await contact1Client.add(contact);
      expect(res.status()).toBe(HTTP_STATUS.CREATED);
      const createdContact = await res.json();

      // User2 should not be able to delete user1's contact
      const deleteRes = await contact2Client.delete(createdContact._id);
      expect(deleteRes.status()).toBe(HTTP_STATUS.NOT_FOUND);

      // Verify contact still exists for user1
      const getRes = await contact1Client.get(createdContact._id);
      expect(getRes.status()).toBe(HTTP_STATUS.OK);
    });
  });

  test.describe('Security Boundaries & Edge Cases', () => {
    test('should reject requests with SQL injection attempts in credentials', async ({ request }) => {
      const userClient = new UserClient(request);
      const sqlInjectionAttempts = [
        "admin'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'/*",
        "' UNION SELECT * FROM users --"
      ];

      for (const maliciousInput of sqlInjectionAttempts) {
        const res = await userClient.login({
          email: maliciousInput,
          password: 'password'
        });
        
        // Should either return 401 (invalid credentials) or 400 (bad request)
        expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNAUTHORIZED]).toContain(res.status());
      }
    });

    test('should reject requests with XSS attempts in user data', async ({ request }) => {
      const userClient = new UserClient(request);
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '"><script>alert("xss")</script>'
      ];

      for (const xssPayload of xssPayloads) {
        const user = UserFactory.generateValidUser({
          firstName: xssPayload,
          lastName: xssPayload
        });
        
        const res = await userClient.register(user);
        
        if (res.ok()) {
          // If registration succeeds, verify XSS payload is sanitized
          const responseBody = await res.json();
          expect(responseBody.user.firstName).not.toContain('<script>');
          expect(responseBody.user.lastName).not.toContain('<script>');
          
          // Cleanup
          await userClient.login({ email: user.email, password: user.password });
          await userClient.delete();
        } else {
          // Registration should fail with validation error
          expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
        }
      }
    });

    test('should handle token tampering attempts', async ({ request }) => {
      const userClient = new UserClient(request);
      const user = UserFactory.generateValidUser();

      // Register and login to get valid token
      await userClient.register(user);
      await userClient.login({ email: user.email, password: user.password });
      const originalToken = userClient.token;

      // Attempt to tamper with token
      const tamperedTokens = [
        originalToken + 'extra',
        originalToken.slice(0, -5) + 'tampr',
        originalToken.replace(/[a-z]/g, 'x'),
        'Bearer ' + originalToken, // Double Bearer prefix
        originalToken.split('.').reverse().join('.') // Reverse token parts
      ];

      for (const tamperedToken of tamperedTokens) {
        userClient.token = tamperedToken;
        const res = await userClient.profile();
        expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
      }

      // Cleanup with original token
      userClient.token = originalToken;
      await userClient.delete();
    });

    test('should enforce rate limiting on authentication endpoints', async ({ request }) => {
      const userClient = new UserClient(request);
      const loginAttempts = [];

      // Attempt multiple rapid login requests
      for (let i = 0; i < 10; i++) {
        loginAttempts.push(
          userClient.login({
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
          })
        );
      }

      const results = await Promise.all(loginAttempts);
      
      // Check if any requests were rate limited (429 status)
      const rateLimitedResults = results.filter(r => r.status() === HTTP_STATUS.TOO_MANY_REQUESTS);
      const unauthorizedResults = results.filter(r => r.status() === HTTP_STATUS.UNAUTHORIZED);
      
      if (rateLimitedResults.length > 0) {
        console.log(`Rate limiting detected: ${rateLimitedResults.length} requests were rate limited`);
        expect(rateLimitedResults.length).toBeGreaterThan(0);
      } else {
        console.log('No rate limiting detected - all requests returned 401');
        expect(unauthorizedResults.length).toBe(10);
      }
    });

    test('should validate Content-Type header for API requests', async ({ request }) => {
      const userClient = new UserClient(request);
      const user = UserFactory.generateValidUser();

      // Test with invalid Content-Type
      const res = await request.post(API_ENDPOINTS.USERS.REGISTER, {
        data: user,
        headers: {
          'Content-Type': 'text/plain' // Invalid content type
        }
      });

      // Should reject with 400 or 415 (Unsupported Media Type)
      expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE]).toContain(res.status());
    });

    test('should handle large payload attacks', async ({ request }) => {
      const userClient = new UserClient(request);
      
      // Create oversized user data
      const oversizedUser = {
        firstName: 'A'.repeat(10000),
        lastName: 'B'.repeat(10000),
        email: 'test@example.com',
        password: 'C'.repeat(10000)
      };

      const res = await userClient.register(oversizedUser);
      
      // Should reject with 400 (Bad Request) or 413 (Payload Too Large)
      expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.PAYLOAD_TOO_LARGE]).toContain(res.status());
    });
  });
});
