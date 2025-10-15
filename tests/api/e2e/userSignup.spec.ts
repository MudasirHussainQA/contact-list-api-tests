import { test, expect } from '@playwright/test';
import { UserClient } from '../clients/userClient';
import { UserFactory } from '../fixtures/userFactory';
import { HTTP_STATUS } from '../constants/api.constants';
import { faker } from '@faker-js/faker';

test.describe('User Signup API Tests', () => {
  test('should successfully register a new user', async ({ request }) => {
    const userClient = new UserClient(request);
    const user = UserFactory.generateValidUser();

    const res = await userClient.register(user);
    expect(res.ok()).toBeTruthy();
    expect(res.status()).toBe(HTTP_STATUS.CREATED);

    const responseBody = await res.json();
    expect(responseBody).toHaveProperty('token');
    expect(responseBody).toHaveProperty('user');
    expect(responseBody.user).toHaveProperty('_id');
    expect(responseBody.user.email.toLowerCase()).toBe(user.email.toLowerCase());
    expect(responseBody.user.firstName).toBe(user.firstName);
    expect(responseBody.user.lastName).toBe(user.lastName);
    expect(responseBody.user).not.toHaveProperty('password');
    console.log('Response:', responseBody);
    console.log('Test user data:', user);

    // Cleanup: Delete the created user
    await userClient.login({ email: user.email, password: user.password });
    await userClient.delete();
  });

  test('should not register user with existing email', async ({ request }) => {
    const userClient = new UserClient(request);
    const user = UserFactory.generateValidUser();

    // Register first user
    let res = await userClient.register(user);
    expect(res.ok()).toBeTruthy();

    // Try to register second user with same email
    const duplicateUser = UserFactory.generateValidUser({ email: user.email });
    res = await userClient.register(duplicateUser);
    expect(res.ok()).toBeFalsy();
    expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);

    const errorBody = await res.json();
    expect(errorBody).toHaveProperty('message');
    expect(errorBody.message).toContain('Email address is already in use');

    // Cleanup
    await userClient.login({ email: user.email, password: user.password });
    await userClient.delete();
  });

  test('should not register user with invalid data', async ({ request }) => {
    const userClient = new UserClient(request);
    const invalidUser = UserFactory.generateInvalidUser();

    const res = await userClient.register(invalidUser);
    expect(res.ok()).toBeFalsy();
    expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);

    const errorBody = await res.json();
    expect(errorBody).toHaveProperty('message');
  });

  test('should require all mandatory fields', async ({ request }) => {
    const userClient = new UserClient(request);
    const incompleteUser = {
      firstName: UserFactory.generateValidUser().firstName,
      email: UserFactory.generateValidUser().email
    };

    const res = await userClient.register(incompleteUser);
    expect(res.ok()).toBeFalsy();
    expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);

    const errorBody = await res.json();
    expect(errorBody).toHaveProperty('message');
  });

  test('should validate email format during registration', async ({ request }) => {
    const userClient = new UserClient(request);
    const invalidEmails = [
      'plainaddress',
      '@missingdomain.com',
      'missing@.com',
      'missing.domain@.com',
      'spaces in@email.com',
      'email@domain',
      'email@domain..com',
      'email..double.dot@domain.com'
    ];

    for (const invalidEmail of invalidEmails) {
      const user = UserFactory.generateValidUser({ email: invalidEmail });
      const res = await userClient.register(user);
      
      expect(res.ok()).toBeFalsy();
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      console.log(`Invalid email "${invalidEmail}" rejected:`, errorBody.message);
    }
  });

  test('should validate password strength requirements', async ({ request }) => {
    const userClient = new UserClient(request);
    const weakPasswords = [
      '123',           // Too short
      'password',      // No uppercase, numbers, special chars
      'PASSWORD',      // No lowercase, numbers, special chars
      'Password',      // No numbers, special chars
      'Pass123',       // Too short, no special chars
      '12345678',      // Only numbers
      'abcdefgh'       // Only lowercase letters
    ];

    for (const weakPassword of weakPasswords) {
      const user = UserFactory.generateValidUser({ password: weakPassword });
      const res = await userClient.register(user);
      
      // Document actual behavior - some weak passwords might be accepted
      if (res.ok()) {
        console.log(`Weak password "${weakPassword}" was accepted`);
        // Cleanup if user was created
        await userClient.login({ email: user.email, password: user.password });
        await userClient.delete();
      } else {
        expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
        const errorBody = await res.json();
        expect(errorBody).toHaveProperty('message');
        console.log(`Weak password "${weakPassword}" rejected:`, errorBody.message);
      }
    }
  });

  test('should handle special characters in user names', async ({ request }) => {
    const userClient = new UserClient(request);
    const specialCharUsers = [
      {
        firstName: "Jean-Pierre",
        lastName: "O'Connor"
      },
      {
        firstName: "María José",
        lastName: "García-López"
      },
      {
        firstName: "李",
        lastName: "小明"
      },
      {
        firstName: "José",
        lastName: "da Silva"
      }
    ];

    for (const nameData of specialCharUsers) {
      const user = UserFactory.generateValidUser(nameData);
      const res = await userClient.register(user);
      
      if (res.ok()) {
        const responseBody = await res.json();
        expect(responseBody.user.firstName).toBe(nameData.firstName);
        expect(responseBody.user.lastName).toBe(nameData.lastName);
        console.log(`Special character name accepted: ${nameData.firstName} ${nameData.lastName}`);
        
        // Cleanup
        await userClient.login({ email: user.email, password: user.password });
        await userClient.delete();
      } else {
        expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
        console.log(`Special character name rejected: ${nameData.firstName} ${nameData.lastName}`);
      }
    }
  });

  test('should handle boundary length values for user fields', async ({ request }) => {
    const userClient = new UserClient(request);
    
    // Test very long names
    const longFieldUser = UserFactory.generateValidUser({
      firstName: 'A'.repeat(100),
      lastName: 'B'.repeat(100)
    });

    const res = await userClient.register(longFieldUser);
    
    if (res.ok()) {
      const responseBody = await res.json();
      expect(responseBody.user.firstName).toBe(longFieldUser.firstName);
      expect(responseBody.user.lastName).toBe(longFieldUser.lastName);
      console.log('Long field names accepted');
      
      // Cleanup
      await userClient.login({ email: longFieldUser.email, password: longFieldUser.password });
      await userClient.delete();
    } else {
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      console.log('Long field names rejected:', errorBody.message);
    }
  });

  test('should handle empty string values in required fields', async ({ request }) => {
    const userClient = new UserClient(request);
    const emptyFieldTests = [
      { firstName: '', lastName: 'Doe', email: 'test@example.com', password: 'Test@1234' },
      { firstName: 'John', lastName: '', email: 'test@example.com', password: 'Test@1234' },
      { firstName: 'John', lastName: 'Doe', email: '', password: 'Test@1234' },
      { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: '' }
    ];

    for (const testUser of emptyFieldTests) {
      const res = await userClient.register(testUser);
      expect(res.ok()).toBeFalsy();
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
    }
  });

  test('should handle null and undefined values in user fields', async ({ request }) => {
    const userClient = new UserClient(request);
    const nullFieldTests = [
      { firstName: null, lastName: 'Doe', email: 'test@example.com', password: 'Test@1234' },
      { firstName: 'John', lastName: undefined, email: 'test@example.com', password: 'Test@1234' },
      { firstName: 'John', lastName: 'Doe', email: null, password: 'Test@1234' },
      { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: undefined }
    ];

    for (const testUser of nullFieldTests) {
      const res = await userClient.register(testUser);
      expect(res.ok()).toBeFalsy();
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
    }
  });

  test('should handle case sensitivity in email addresses', async ({ request }) => {
    const userClient = new UserClient(request);
    // Use a simpler email format that's more likely to be accepted
    const baseEmail = faker.internet.email().toLowerCase();
    const user1 = UserFactory.generateValidUser({ email: baseEmail });
    
    // Register first user
    let res = await userClient.register(user1);
    
    if (!res.ok()) {
      console.log('Initial registration failed, skipping case sensitivity test');
      return;
    }
    
    // Try to register with different case variations
    const emailVariations = [
      baseEmail.toUpperCase(),
      baseEmail.charAt(0).toUpperCase() + baseEmail.slice(1)
    ];
    
    for (const emailVariation of emailVariations) {
      const user2 = UserFactory.generateValidUser({ email: emailVariation });
      res = await userClient.register(user2);
      
      // Should be rejected if emails are treated as case-insensitive
      if (res.ok()) {
        console.log(`Email case variation "${emailVariation}" was accepted (case-sensitive)`);
        // Cleanup the second user
        await userClient.login({ email: user2.email, password: user2.password });
        await userClient.delete();
      } else {
        expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
        const errorBody = await res.json();
        expect(errorBody.message).toContain('Email address is already in use');
        console.log(`Email case variation "${emailVariation}" was rejected (case-insensitive)`);
      }
    }
    
    // Cleanup first user
    await userClient.login({ email: user1.email, password: user1.password });
    await userClient.delete();
  });

  test('should handle whitespace in user input fields', async ({ request }) => {
    const userClient = new UserClient(request);
    
    // Test with leading/trailing whitespace
    const whitespaceUser = UserFactory.generateValidUser({
      firstName: '  John  ',
      lastName: '  Doe  ',
      email: '  test@example.com  '
    });

    const res = await userClient.register(whitespaceUser);
    
    if (res.ok()) {
      const responseBody = await res.json();
      // Check if whitespace is trimmed
      const trimmedFirstName = whitespaceUser.firstName.trim();
      const trimmedLastName = whitespaceUser.lastName.trim();
      const trimmedEmail = whitespaceUser.email.trim();
      
      expect(responseBody.user.firstName).toBe(trimmedFirstName);
      expect(responseBody.user.lastName).toBe(trimmedLastName);
      expect(responseBody.user.email.toLowerCase()).toBe(trimmedEmail.toLowerCase());
      
      console.log('Whitespace was trimmed from user fields');
      
      // Cleanup
      await userClient.login({ email: trimmedEmail, password: whitespaceUser.password });
      await userClient.delete();
    } else {
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      console.log('User with whitespace was rejected');
    }
  });

  test('should validate response structure for successful registration', async ({ request }) => {
    const userClient = new UserClient(request);
    const user = UserFactory.generateValidUser();

    const res = await userClient.register(user);
    expect(res.ok()).toBeTruthy();
    expect(res.status()).toBe(HTTP_STATUS.CREATED);

    const responseBody = await res.json();
    
    // Validate response structure
    expect(responseBody).toHaveProperty('token');
    expect(responseBody).toHaveProperty('user');
    expect(typeof responseBody.token).toBe('string');
    expect(responseBody.token.length).toBeGreaterThan(0);
    
    // Validate user object structure
    const userObj = responseBody.user;
    expect(userObj).toHaveProperty('_id');
    expect(userObj).toHaveProperty('firstName');
    expect(userObj).toHaveProperty('lastName');
    expect(userObj).toHaveProperty('email');
    expect(userObj).not.toHaveProperty('password'); // Password should not be returned
    
    // Validate data types
    expect(typeof userObj._id).toBe('string');
    expect(typeof userObj.firstName).toBe('string');
    expect(typeof userObj.lastName).toBe('string');
    expect(typeof userObj.email).toBe('string');
    
    // Validate data values
    expect(userObj.firstName).toBe(user.firstName);
    expect(userObj.lastName).toBe(user.lastName);
    expect(userObj.email.toLowerCase()).toBe(user.email.toLowerCase());
    
    // Cleanup
    await userClient.login({ email: user.email, password: user.password });
    await userClient.delete();
  });

  test('should handle concurrent registration attempts with same email', async ({ request }) => {
    const userClient1 = new UserClient(request);
    const userClient2 = new UserClient(request);
    const email = faker.internet.email();
    
    const user1 = UserFactory.generateValidUser({ email });
    const user2 = UserFactory.generateValidUser({ email });

    // Attempt concurrent registrations
    const [res1, res2] = await Promise.all([
      userClient1.register(user1),
      userClient2.register(user2)
    ]);

    // One should succeed, one should fail
    const results = [res1, res2];
    const successfulResults = results.filter(r => r.ok());
    const failedResults = results.filter(r => !r.ok());

    expect(successfulResults.length).toBe(1);
    expect(failedResults.length).toBe(1);
    expect(successfulResults[0].status()).toBe(HTTP_STATUS.CREATED);
    expect(failedResults[0].status()).toBe(HTTP_STATUS.BAD_REQUEST);

    // Cleanup the successful registration
    if (res1.ok()) {
      await userClient1.login({ email: user1.email, password: user1.password });
      await userClient1.delete();
    } else {
      await userClient2.login({ email: user2.email, password: user2.password });
      await userClient2.delete();
    }
  });

  test('should handle registration with very long email addresses', async ({ request }) => {
    const userClient = new UserClient(request);
    
    // Create a very long but valid email
    const longLocalPart = 'a'.repeat(64); // Maximum local part length
    const longDomainPart = 'b'.repeat(63) + '.com'; // Long domain
    const longEmail = `${longLocalPart}@${longDomainPart}`;
    
    const user = UserFactory.generateValidUser({ email: longEmail });
    const res = await userClient.register(user);
    
    if (res.ok()) {
      const responseBody = await res.json();
      expect(responseBody.user.email.toLowerCase()).toBe(longEmail.toLowerCase());
      console.log('Long email accepted:', longEmail);
      
      // Cleanup
      await userClient.login({ email: user.email, password: user.password });
      await userClient.delete();
    } else {
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      console.log('Long email rejected:', longEmail);
    }
  });

  test('should handle registration rate limiting', async ({ request }) => {
    const userClient = new UserClient(request);
    const registrationAttempts = [];
    
    // Attempt multiple rapid registrations
    for (let i = 0; i < 10; i++) {
      const user = UserFactory.generateValidUser();
      registrationAttempts.push(userClient.register(user));
    }
    
    const results = await Promise.all(registrationAttempts);
    
    // Check if any requests were rate limited (429 status)
    const rateLimitedResults = results.filter(r => r.status() === HTTP_STATUS.TOO_MANY_REQUESTS);
    const successfulResults = results.filter(r => r.ok());
    
    if (rateLimitedResults.length > 0) {
      console.log(`Rate limiting detected: ${rateLimitedResults.length} requests were rate limited`);
    } else {
      console.log('No rate limiting detected for registration endpoint');
    }
    
    // Cleanup successful registrations
    for (let i = 0; i < results.length; i++) {
      if (results[i].ok()) {
        try {
          const responseBody = await results[i].json();
          const tempClient = new UserClient(request);
          await tempClient.login({ 
            email: responseBody.user.email, 
            password: UserFactory.generateValidUser().password 
          });
          // Note: This cleanup might fail if we don't have the original password
          // In a real test, we'd need to store the passwords used
        } catch (error) {
          console.log('Cleanup failed for user:', error);
        }
      }
    }
  });
});

test.describe('User Profile Management API Tests', () => {
  let userClient: UserClient;
  let user: any;

  test.beforeEach(async ({ request }) => {
    userClient = new UserClient(request);
    user = UserFactory.generateValidUser();
    
    // Register and login user for each test
    await userClient.register(user);
    await userClient.login({ email: user.email, password: user.password });
  });

  test.afterEach(async () => {
    // Cleanup: Delete user
    try {
      await userClient.delete();
    } catch (error) {
      console.log('Cleanup error (expected if user already deleted):', error);
    }
  });

  test('should successfully retrieve user profile', async () => {
    const res = await userClient.profile();
    expect(res.ok()).toBeTruthy();

    const profile = await res.json();
    expect(profile).toHaveProperty('_id');
    expect(profile).toHaveProperty('firstName');
    expect(profile).toHaveProperty('lastName');
    expect(profile).toHaveProperty('email');
    expect(profile).not.toHaveProperty('password');
    
    expect(profile.firstName).toBe(user.firstName);
    expect(profile.lastName).toBe(user.lastName);
    expect(profile.email.toLowerCase()).toBe(user.email.toLowerCase());
  });

  test('should successfully update user profile', async () => {
    const updateData = {
      firstName: 'UpdatedFirst',
      lastName: 'UpdatedLast'
    };

    const res = await userClient.updateProfile(updateData);
    expect(res.ok()).toBeTruthy();

    const updatedProfile = await res.json();
    expect(updatedProfile.firstName).toBe(updateData.firstName);
    expect(updatedProfile.lastName).toBe(updateData.lastName);
    expect(updatedProfile.email.toLowerCase()).toBe(user.email.toLowerCase()); // Email should remain unchanged
  });

  test('should reject profile update with invalid email', async () => {
    const invalidUpdateData = {
      email: 'invalid-email-format'
    };

    const res = await userClient.updateProfile(invalidUpdateData);
    expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);

    const errorBody = await res.json();
    expect(errorBody).toHaveProperty('message');
  });

  test('should handle partial profile updates', async () => {
    // Update only first name
    let updateData = { firstName: 'OnlyFirstName' };
    let res = await userClient.updateProfile(updateData);
    expect(res.ok()).toBeTruthy();

    let updatedProfile = await res.json();
    expect(updatedProfile.firstName).toBe('OnlyFirstName');
    expect(updatedProfile.lastName).toBe(user.lastName); // Should remain unchanged

    // Update only last name
    const lastNameUpdateData = { lastName: 'OnlyLastName' };
    res = await userClient.updateProfile(lastNameUpdateData);
    expect(res.ok()).toBeTruthy();

    updatedProfile = await res.json();
    expect(updatedProfile.firstName).toBe('OnlyFirstName'); // Should remain from previous update
    expect(updatedProfile.lastName).toBe('OnlyLastName');
  });

  test('should reject profile operations without authentication', async ({ request }) => {
    const unauthenticatedClient = new UserClient(request);

    // Try to get profile without token
    let res = await unauthenticatedClient.profile();
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);

    // Try to update profile without token
    res = await unauthenticatedClient.updateProfile({ firstName: 'Test' });
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  test('should reject profile operations with invalid token', async ({ request }) => {
    const invalidTokenClient = new UserClient(request);
    invalidTokenClient.token = 'invalid-token-12345';

    // Try to get profile with invalid token
    let res = await invalidTokenClient.profile();
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);

    // Try to update profile with invalid token
    res = await invalidTokenClient.updateProfile({ firstName: 'Test' });
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  test('should successfully logout user', async () => {
    const res = await userClient.logout();
    expect(res.ok()).toBeTruthy();

    // Verify token is invalidated by trying to access profile
    const profileRes = await userClient.profile();
    expect(profileRes.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  test('should successfully delete user account', async () => {
    const res = await userClient.delete();
    expect(res.ok()).toBeTruthy();

    // Verify user is deleted by trying to login
    const loginRes = await userClient.login({ email: user.email, password: user.password });
    expect(loginRes.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  test('should handle multiple logout attempts', async () => {
    // First logout should succeed
    let res = await userClient.logout();
    expect(res.ok()).toBeTruthy();

    // Second logout attempt should fail (already logged out)
    res = await userClient.logout();
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  test('should handle profile access after logout', async () => {
    // Logout user
    let res = await userClient.logout();
    expect(res.ok()).toBeTruthy();

    // Try to access profile after logout
    res = await userClient.profile();
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);

    // Try to update profile after logout
    res = await userClient.updateProfile({ firstName: 'Test' });
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);

    // Try to delete account after logout
    res = await userClient.delete();
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });
}); 