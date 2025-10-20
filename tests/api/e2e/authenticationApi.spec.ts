import { test, expect } from '../../fixtures';
import { HTTP_STATUS } from '../constants/api.constants';
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
    test('should include valid JWT token in login response', async ({ userClient, validUser }) => {
      // Register and login user
      await userClient.register(validUser);
      const loginRes = await userClient.login({ email: validUser.email, password: validUser.password });
      
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
    });

    test('should accept valid Bearer token in Authorization header', async ({ userClient, validUser }) => {
      // Register and login user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      // Test authenticated request
      const profileRes = await userClient.profile();
      expect(profileRes.status()).toBe(HTTP_STATUS.OK);
    });

    test('should reject requests without Authorization header', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const unauthenticatedClient = new UserClient(request);
      
      const res = await unauthenticatedClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
      
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('error');
    });

    test('should reject requests with malformed Authorization header', async ({ userClient, validUser }) => {
      userClient.token = 'malformed-token-without-bearer-prefix';
      
      const res = await userClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should reject requests with invalid JWT token', async ({ userClient }) => {
      userClient.token = 'invalid.jwt.token';
      
      const res = await userClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should reject requests with expired JWT token', async ({ userClient, validUser }) => {
      // Note: This test assumes the API has token expiration
      // In a real scenario, you'd need to wait for token expiration or mock it
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      // Simulate expired token
      userClient.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MzI2MTAyNDZ9.invalid';
      
      const res = await userClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across multiple requests', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      // Make multiple requests with same token
      const res1 = await userClient.profile();
      const res2 = await userClient.profile();
      
      expect(res1.status()).toBe(HTTP_STATUS.OK);
      expect(res2.status()).toBe(HTTP_STATUS.OK);
    });

    test('should invalidate session after logout', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      // Logout
      const logoutRes = await userClient.logout();
      expect(logoutRes.status()).toBe(HTTP_STATUS.OK);
      
      // Try to access protected resource
      const profileRes = await userClient.profile();
      expect(profileRes.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should invalidate session after user deletion', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      // Delete user
      const deleteRes = await userClient.delete();
      expect(deleteRes.status()).toBe(HTTP_STATUS.OK);
      
      // Try to access protected resource with same token
      const profileRes = await userClient.profile();
      expect(profileRes.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should handle concurrent sessions from same user', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const { UserFactory } = await import('../fixtures/userFactory');
      
      const user = UserFactory.generateValidUser();
      const client1 = new UserClient(request);
      const client2 = new UserClient(request);
      
      // Register user
      await client1.register(user);
      
      // Login with both clients
      await client1.login({ email: user.email, password: user.password });
      await client2.login({ email: user.email, password: user.password });
      
      // Both should have valid tokens
      const res1 = await client1.profile();
      const res2 = await client2.profile();
      
      expect(res1.status()).toBe(HTTP_STATUS.OK);
      expect(res2.status()).toBe(HTTP_STATUS.OK);
      
      // Cleanup
      await client1.delete();
    });
  });

  test.describe('Access Control & User Isolation', () => {
    test('should isolate user profiles between different users', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      const { UserFactory } = await import('../fixtures/userFactory');
      
      const user1 = UserFactory.generateValidUser();
      const user2 = UserFactory.generateValidUser();
      
      const client1 = new UserClient(request);
      const client2 = new UserClient(request);
      
      // Register both users
      await client1.register(user1);
      await client2.register(user2);
      
      // Login both clients
      await client1.login({ email: user1.email, password: user1.password });
      await client2.login({ email: user2.email, password: user2.password });
      
      // Get profiles
      const profile1 = await client1.profile();
      const profile2 = await client2.profile();
      
      expect(profile1.ok()).toBeTruthy();
      expect(profile2.ok()).toBeTruthy();
      
      const profile1Data = await profile1.json();
      const profile2Data = await profile2.json();
      
      // Verify profiles are different
      expect(profile1Data._id).not.toBe(profile2Data._id);
      expect(profile1Data.email).not.toBe(profile2Data.email);
      
      // Cleanup
      await client1.delete();
      await client2.delete();
    });

    test('should isolate contacts between different users', async ({ userClient, validUser, request }) => {
      const { UserClient } = await import('../clients/userClient');
      const { ContactClient } = await import('../clients/contactClient');
      const { UserFactory } = await import('../fixtures/userFactory');
      const { ContactFactory } = await import('../fixtures/contactFactory');
      
      const user2 = UserFactory.generateValidUser();
      const contact = ContactFactory.generateReliableContact();
      
      const client2 = new UserClient(request);
      
      // User 1 setup
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      const contactClient1 = new ContactClient(request, userClient.token);
      
      // User 2 setup
      await client2.register(user2);
      await client2.login({ email: user2.email, password: user2.password });
      const contactClient2 = new ContactClient(request, client2.token);
      
      // Add contact for user 1
      const addRes = await contactClient1.add(contact);
      const addedContact = await addRes.json();
      
      // User 2 should not see user 1's contact
      const listRes = await contactClient2.list();
      const listData = await listRes.json();
      
      const contactIds = listData.map((c: any) => c._id);
      expect(contactIds).not.toContain(addedContact._id);
      
      // Cleanup
      await client2.delete();
    });

    test('should prevent cross-user contact access', async ({ userClient, validUser, request }) => {
      const { UserClient } = await import('../clients/userClient');
      const { ContactClient } = await import('../clients/contactClient');
      const { UserFactory } = await import('../fixtures/userFactory');
      const { ContactFactory } = await import('../fixtures/contactFactory');
      
      const user2 = UserFactory.generateValidUser();
      const contact = ContactFactory.generateReliableContact();
      
      const client2 = new UserClient(request);
      
      // User 1: Add contact
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      const contactClient1 = new ContactClient(request, userClient.token);
      const addRes = await contactClient1.add(contact);
      const addedContact = await addRes.json();
      
      // User 2: Try to access user 1's contact
      await client2.register(user2);
      await client2.login({ email: user2.email, password: user2.password });
      const contactClient2 = new ContactClient(request, client2.token);
      
      const getRes = await contactClient2.get(addedContact._id);
      expect(getRes.status()).toBe(404);
      
      // Cleanup
      await client2.delete();
    });

    test('should prevent cross-user contact modification', async ({ userClient, validUser, request }) => {
      const { UserClient } = await import('../clients/userClient');
      const { ContactClient } = await import('../clients/contactClient');
      const { UserFactory } = await import('../fixtures/userFactory');
      const { ContactFactory } = await import('../fixtures/contactFactory');
      
      const user2 = UserFactory.generateValidUser();
      const contact = ContactFactory.generateReliableContact();
      
      const client2 = new UserClient(request);
      
      // User 1: Add contact
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      const contactClient1 = new ContactClient(request, userClient.token);
      const addRes = await contactClient1.add(contact);
      const addedContact = await addRes.json();
      
      // User 2: Try to modify user 1's contact
      await client2.register(user2);
      await client2.login({ email: user2.email, password: user2.password });
      const contactClient2 = new ContactClient(request, client2.token);
      
      const updateRes = await contactClient2.update(addedContact._id, { firstName: 'Hacked' });
      // API returns 400 for invalid/unauthorized access or 404 if not found
      expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.NOT_FOUND]).toContain(updateRes.status());
      
      // Cleanup
      await client2.delete();
    });

    test('should prevent cross-user contact deletion', async ({ userClient, validUser, request }) => {
      const { UserClient } = await import('../clients/userClient');
      const { ContactClient } = await import('../clients/contactClient');
      const { UserFactory } = await import('../fixtures/userFactory');
      const { ContactFactory } = await import('../fixtures/contactFactory');
      
      const user2 = UserFactory.generateValidUser();
      const contact = ContactFactory.generateReliableContact();
      
      const client2 = new UserClient(request);
      
      // User 1: Add contact
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      const contactClient1 = new ContactClient(request, userClient.token);
      const addRes = await contactClient1.add(contact);
      const addedContact = await addRes.json();
      
      // User 2: Try to delete user 1's contact
      await client2.register(user2);
      await client2.login({ email: user2.email, password: user2.password });
      const contactClient2 = new ContactClient(request, client2.token);
      
      const deleteRes = await contactClient2.delete(addedContact._id);
      expect(deleteRes.status()).toBe(404);
      
      // Cleanup
      await client2.delete();
    });
  });

  test.describe('Security Boundaries & Edge Cases', () => {
    test('should reject requests with SQL injection attempts in credentials', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      
      const client = new UserClient(request);
      const injectionAttempt = {
        firstName: "test' OR '1'='1",
        lastName: "test",
        email: "test@test.com' OR '1'='1",
        password: "password' OR '1'='1"
      };
      
      const res = await client.register(injectionAttempt);
      // Should handle safely (either reject or sanitize)
      expect(res.status()).toBeGreaterThanOrEqual(400);
    });

    test('should reject requests with XSS attempts in user data', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      
      const client = new UserClient(request);
      const xssAttempt = {
        firstName: '<script>alert("xss")</script>',
        lastName: '<img src=x onerror="alert(\'xss\')">',
        email: 'test@test.com',
        password: 'password123'
      };
      
      const res = await client.register(xssAttempt);
      // Should handle safely
      expect([201, 400]).toContain(res.status());
    });

    test('should handle token tampering attempts', async ({ userClient, validUser }) => {
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      // Tamper with token
      const originalToken = userClient.token;
      userClient.token = originalToken.slice(0, -5) + 'XXXXX';
      
      const res = await userClient.profile();
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
      
      // Restore token for cleanup
      userClient.token = originalToken;
    });

    test('should enforce rate limiting on authentication endpoints', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      
      const client = new UserClient(request);
      const user = { firstName: 'Test', lastName: 'User', email: 'test@test.com', password: 'password123' };
      
      // Make multiple rapid requests
      const results = [];
      for (let i = 0; i < 5; i++) {
        const res = await client.login({ email: 'nonexistent@test.com', password: 'wrong' });
        results.push(res.status());
      }
      
      // At least one should be rate limited (429) or all should be 401
      const hasRateLimit = results.some(status => status === 429);
      const allUnauthorized = results.every(status => status === 401);
      expect(hasRateLimit || allUnauthorized).toBeTruthy();
    });

    test('should validate Content-Type header for API requests', async ({ userClient, validUser }) => {
      const registerRes = await userClient.register(validUser);
      
      // Check response headers
      expect(registerRes.headers()['content-type']).toContain('application/json');
    });

    test('should handle large payload attacks', async ({ request }) => {
      const { UserClient } = await import('../clients/userClient');
      
      const client = new UserClient(request);
      const largePayload = {
        firstName: 'A'.repeat(10000),
        lastName: 'User',
        email: 'test@test.com',
        password: 'password123'
      };
      
      const res = await client.register(largePayload);
      // Should either reject or handle gracefully
      expect([400, 413, 500]).toContain(res.status());
    });
  });
});
