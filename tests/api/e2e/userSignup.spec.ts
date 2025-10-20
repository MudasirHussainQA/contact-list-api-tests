import { test, expect, testDataHelpers } from '../../fixtures';
import { HTTP_STATUS } from '../constants/api.constants';
import { faker } from '@faker-js/faker';

test.describe('User Signup API Tests', () => {
  test('should successfully register a new user', async ({ userClient, validUser }) => {
    const res = await userClient.register(validUser);
    expect(res.ok()).toBeTruthy();
    expect(res.status()).toBe(HTTP_STATUS.CREATED);

    const responseBody = await res.json();
    expect(responseBody).toHaveProperty('token');
    expect(responseBody).toHaveProperty('user');
    expect(responseBody.user).toHaveProperty('_id');
    expect(responseBody.user.email.toLowerCase()).toBe(validUser.email.toLowerCase());
    expect(responseBody.user.firstName).toBe(validUser.firstName);
    expect(responseBody.user.lastName).toBe(validUser.lastName);
    expect(responseBody.user).not.toHaveProperty('password');
    console.log('Response:', responseBody);
    console.log('Test user data:', validUser);
  });

  test('should not register user with existing email', async ({ userClient, validUser, request }) => {
    const { UserClient } = await import('../clients/userClient');
    const userClient2 = new UserClient(request);

    let res = await userClient.register(validUser);
    expect(res.ok()).toBeTruthy();

    const duplicateUser = testDataHelpers.createUser({ email: validUser.email });
    res = await userClient2.register(duplicateUser);
    expect(res.ok()).toBeFalsy();
    expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);

    const errorBody = await res.json();
    expect(errorBody).toHaveProperty('message');
    expect(errorBody.message).toContain('Email address is already in use');
  });

  test('should not register user with invalid data', async ({ request }) => {
    const { UserClient } = await import('../clients/userClient');
    const userClient = new UserClient(request);
    const invalidUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'invalid-email',
      password: 'weak'
    };

    const res = await userClient.register(invalidUser);
    expect(res.ok()).toBeFalsy();
    expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);

    const errorBody = await res.json();
    expect(errorBody).toHaveProperty('message');
  });

  test('should require all mandatory fields', async ({ request }) => {
    const { UserClient } = await import('../clients/userClient');
    const userClient = new UserClient(request);
    const incompleteUser = {
      firstName: faker.person.firstName(),
      email: faker.internet.email()
    };

    const res = await userClient.register(incompleteUser);
    expect(res.ok()).toBeFalsy();
    expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);

    const errorBody = await res.json();
    expect(errorBody).toHaveProperty('message');
  });

  test('should validate email format during registration', async ({ request }) => {
    const { UserClient } = await import('../clients/userClient');
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
      const user = testDataHelpers.createUser({ email: invalidEmail });
      const res = await userClient.register(user);
      
      expect(res.ok()).toBeFalsy();
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      console.log(`Invalid email "${invalidEmail}" rejected:`, errorBody.message);
    }
  });

  test('should validate password strength requirements', async ({ request }) => {
    const { UserClient } = await import('../clients/userClient');
    const userClient = new UserClient(request);
    const weakPasswords = [
      '123',
      'password',
      'PASSWORD',
      'Password',
      'Pass123',
      '12345678',
      'abcdefgh'
    ];

    for (const weakPassword of weakPasswords) {
      const user = testDataHelpers.createUser({ password: weakPassword });
      const res = await userClient.register(user);
      
      if (res.ok()) {
        console.log(`Weak password "${weakPassword}" was accepted`);
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
    const { UserClient } = await import('../clients/userClient');
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
      const user = testDataHelpers.createUser(nameData);
      const res = await userClient.register(user);
      
      if (res.ok()) {
        const responseBody = await res.json();
        expect(responseBody.user.firstName).toBe(nameData.firstName);
        expect(responseBody.user.lastName).toBe(nameData.lastName);
        console.log(`Special character name accepted: ${nameData.firstName} ${nameData.lastName}`);
        
        await userClient.login({ email: user.email, password: user.password });
        await userClient.delete();
      } else {
        expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
        console.log(`Special character name rejected: ${nameData.firstName} ${nameData.lastName}`);
      }
    }
  });

  test('should handle boundary length values for user fields', async ({ request }) => {
    const { UserClient } = await import('../clients/userClient');
    const userClient = new UserClient(request);
    
    const longFieldUser = testDataHelpers.createUser({
      firstName: 'A'.repeat(100),
      lastName: 'B'.repeat(100)
    });

    const res = await userClient.register(longFieldUser);
    
    if (res.ok()) {
      const responseBody = await res.json();
      expect(responseBody.user.firstName).toBe(longFieldUser.firstName);
      expect(responseBody.user.lastName).toBe(longFieldUser.lastName);
      console.log('Long field names accepted');
      
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
    const { UserClient } = await import('../clients/userClient');
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
    const { UserClient } = await import('../clients/userClient');
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
    const { UserClient } = await import('../clients/userClient');
    const userClient = new UserClient(request);
    const baseEmail = faker.internet.email().toLowerCase();
    const user1 = testDataHelpers.createUser({ email: baseEmail });
    
    let res = await userClient.register(user1);
    
    if (!res.ok()) {
      console.log('Initial registration failed, skipping case sensitivity test');
      return;
    }
    
    const emailVariations = [
      baseEmail.toUpperCase(),
      baseEmail.charAt(0).toUpperCase() + baseEmail.slice(1)
    ];
    
    for (const emailVariation of emailVariations) {
      const user2 = testDataHelpers.createUser({ email: emailVariation });
      res = await userClient.register(user2);
      
      if (res.ok()) {
        console.log(`Email case variation "${emailVariation}" was accepted (case-sensitive)`);
        await userClient.login({ email: user2.email, password: user2.password });
        await userClient.delete();
      } else {
        expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
        const errorBody = await res.json();
        expect(errorBody.message).toContain('Email address is already in use');
        console.log(`Email case variation "${emailVariation}" was rejected (case-insensitive)`);
      }
    }
    
    await userClient.login({ email: user1.email, password: user1.password });
    await userClient.delete();
  });

  test('should handle whitespace in user input fields', async ({ request }) => {
    const { UserClient } = await import('../clients/userClient');
    const userClient = new UserClient(request);
    
    const whitespaceUser = testDataHelpers.createUser({
      firstName: '  John  ',
      lastName: '  Doe  ',
      email: '  test@example.com  '
    });

    const res = await userClient.register(whitespaceUser);
    
    if (res.ok()) {
      const responseBody = await res.json();
      const trimmedFirstName = whitespaceUser.firstName.trim();
      const trimmedLastName = whitespaceUser.lastName.trim();
      const trimmedEmail = whitespaceUser.email.trim();
      
      expect(responseBody.user.firstName).toBe(trimmedFirstName);
      expect(responseBody.user.lastName).toBe(trimmedLastName);
      expect(responseBody.user.email.toLowerCase()).toBe(trimmedEmail.toLowerCase());
      
      console.log('Whitespace was trimmed from user fields');
      
      await userClient.login({ email: trimmedEmail, password: whitespaceUser.password });
      await userClient.delete();
    } else {
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      console.log('User with whitespace was rejected');
    }
  });

  test('should validate response structure for successful registration', async ({ userClient, validUser }) => {
    const res = await userClient.register(validUser);
    expect(res.ok()).toBeTruthy();
    expect(res.status()).toBe(HTTP_STATUS.CREATED);

    const responseBody = await res.json();
    
    expect(responseBody).toHaveProperty('token');
    expect(responseBody).toHaveProperty('user');
    expect(typeof responseBody.token).toBe('string');
    expect(responseBody.token.length).toBeGreaterThan(0);
    
    const userObj = responseBody.user;
    expect(userObj).toHaveProperty('_id');
    expect(userObj).toHaveProperty('firstName');
    expect(userObj).toHaveProperty('lastName');
    expect(userObj).toHaveProperty('email');
    expect(userObj).not.toHaveProperty('password');
    
    expect(typeof userObj._id).toBe('string');
    expect(typeof userObj.firstName).toBe('string');
    expect(typeof userObj.lastName).toBe('string');
    expect(typeof userObj.email).toBe('string');
    
    expect(userObj.firstName).toBe(validUser.firstName);
    expect(userObj.lastName).toBe(validUser.lastName);
    expect(userObj.email.toLowerCase()).toBe(validUser.email.toLowerCase());
  });

  test('should handle concurrent registration attempts with same email', async ({ request }) => {
    const { UserClient } = await import('../clients/userClient');
    const userClient1 = new UserClient(request);
    const userClient2 = new UserClient(request);
    const email = faker.internet.email();
    
    const user1 = testDataHelpers.createUser({ email });
    const user2 = testDataHelpers.createUser({ email });

    const [res1, res2] = await Promise.all([
      userClient1.register(user1),
      userClient2.register(user2)
    ]);

    const results = [res1, res2];
    const successfulResults = results.filter(r => r.ok());
    const failedResults = results.filter(r => !r.ok());

    expect(successfulResults.length).toBe(1);
    expect(failedResults.length).toBe(1);
    expect(successfulResults[0].status()).toBe(HTTP_STATUS.CREATED);
    expect(failedResults[0].status()).toBe(HTTP_STATUS.BAD_REQUEST);

    if (res1.ok()) {
      await userClient1.login({ email: user1.email, password: user1.password });
      await userClient1.delete();
    } else {
      await userClient2.login({ email: user2.email, password: user2.password });
      await userClient2.delete();
    }
  });

  test('should handle registration with very long email addresses', async ({ request }) => {
    const { UserClient } = await import('../clients/userClient');
    const userClient = new UserClient(request);
    
    const longLocalPart = 'a'.repeat(64);
    const longDomainPart = 'b'.repeat(63) + '.com';
    const longEmail = `${longLocalPart}@${longDomainPart}`;
    
    const user = testDataHelpers.createUser({ email: longEmail });
    const res = await userClient.register(user);
    
    if (res.ok()) {
      const responseBody = await res.json();
      expect(responseBody.user.email.toLowerCase()).toBe(longEmail.toLowerCase());
      console.log('Long email accepted:', longEmail);
      
      await userClient.login({ email: user.email, password: user.password });
      await userClient.delete();
    } else {
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      console.log('Long email rejected:', longEmail);
    }
  });

  test('should handle registration rate limiting', async ({ request }) => {
    const { UserClient } = await import('../clients/userClient');
    const userClient = new UserClient(request);
    const registrationAttempts = [];
    
    for (let i = 0; i < 10; i++) {
      const user = testDataHelpers.createUser();
      registrationAttempts.push(userClient.register(user));
    }
    
    const results = await Promise.all(registrationAttempts);
    
    const rateLimitedResults = results.filter(r => r.status() === HTTP_STATUS.TOO_MANY_REQUESTS);
    const successfulResults = results.filter(r => r.ok());
    
    if (rateLimitedResults.length > 0) {
      console.log(`Rate limiting detected: ${rateLimitedResults.length} requests were rate limited`);
    } else {
      console.log('No rate limiting detected for registration endpoint');
    }
    
    for (let i = 0; i < results.length; i++) {
      if (results[i].ok()) {
        try {
          const responseBody = await results[i].json();
          const tempClient = new UserClient(request);
          await tempClient.login({ 
            email: responseBody.user.email, 
            password: faker.internet.password({ length: 8 })
          });
        } catch (error) {
          console.log('Cleanup failed for user:', error);
        }
      }
    }
  });
});

test.describe('User Profile Management API Tests', () => {
  test('should successfully retrieve user profile', async ({ userClient, validUser }) => {
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    
    const res = await userClient.profile();
    expect(res.ok()).toBeTruthy();

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

  test('should successfully update user profile', async ({ userClient, validUser }) => {
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    
    const updateData = {
      firstName: 'UpdatedFirst',
      lastName: 'UpdatedLast'
    };

    const res = await userClient.updateProfile(updateData);
    expect(res.ok()).toBeTruthy();

    const updatedProfile = await res.json();
    expect(updatedProfile.firstName).toBe(updateData.firstName);
    expect(updatedProfile.lastName).toBe(updateData.lastName);
    expect(updatedProfile.email.toLowerCase()).toBe(validUser.email.toLowerCase());
  });

  test('should reject profile update with invalid email', async ({ userClient, validUser }) => {
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    
    const invalidUpdateData = {
      email: 'invalid-email-format'
    };

    const res = await userClient.updateProfile(invalidUpdateData);
    expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);

    const errorBody = await res.json();
    expect(errorBody).toHaveProperty('message');
  });

  test('should handle partial profile updates', async ({ userClient, validUser }) => {
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    
    let updateData = { firstName: 'OnlyFirstName' };
    let res = await userClient.updateProfile(updateData);
    expect(res.ok()).toBeTruthy();

    let updatedProfile = await res.json();
    expect(updatedProfile.firstName).toBe('OnlyFirstName');
    expect(updatedProfile.lastName).toBe(validUser.lastName);

    const lastNameUpdateData = { lastName: 'OnlyLastName' };
    res = await userClient.updateProfile(lastNameUpdateData);
    expect(res.ok()).toBeTruthy();

    updatedProfile = await res.json();
    expect(updatedProfile.firstName).toBe('OnlyFirstName');
    expect(updatedProfile.lastName).toBe('OnlyLastName');
  });

  test('should reject profile operations without authentication', async ({ request }) => {
    const { UserClient } = await import('../clients/userClient');
    const unauthenticatedClient = new UserClient(request);

    let res = await unauthenticatedClient.profile();
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);

    res = await unauthenticatedClient.updateProfile({ firstName: 'Test' });
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  test('should reject profile operations with invalid token', async ({ request }) => {
    const { UserClient } = await import('../clients/userClient');
    const invalidTokenClient = new UserClient(request);
    invalidTokenClient.token = 'invalid-token-12345';

    let res = await invalidTokenClient.profile();
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);

    res = await invalidTokenClient.updateProfile({ firstName: 'Test' });
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  test('should successfully logout user', async ({ userClient, validUser }) => {
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    
    const res = await userClient.logout();
    expect(res.ok()).toBeTruthy();

    const profileRes = await userClient.profile();
    expect(profileRes.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  test('should successfully delete user account', async ({ userClient, validUser }) => {
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    
    const res = await userClient.delete();
    expect(res.ok()).toBeTruthy();

    const loginRes = await userClient.login({ email: validUser.email, password: validUser.password });
    expect(loginRes.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  test('should handle multiple logout attempts', async ({ userClient, validUser }) => {
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    
    let res = await userClient.logout();
    expect(res.ok()).toBeTruthy();

    res = await userClient.logout();
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  test('should handle profile access after logout', async ({ userClient, validUser }) => {
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    
    let res = await userClient.logout();
    expect(res.ok()).toBeTruthy();

    res = await userClient.profile();
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);

    res = await userClient.updateProfile({ firstName: 'Test' });
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);

    res = await userClient.delete();
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });
}); 