import { test, expect } from '@playwright/test';
import { UserClient } from '../clients/userClient';
import { UserFactory } from '../fixtures/userFactory';

test.describe('User Signup API Tests', () => {
  test('should successfully register a new user', async ({ request }) => {
    const userClient = new UserClient(request);
    const user = UserFactory.generateValidUser();

    const res = await userClient.register(user);
    expect(res.ok()).toBeTruthy();
    expect(res.status()).toBe(201);

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
    expect(res.status()).toBe(400);

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
    expect(res.status()).toBe(400);

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
    expect(res.status()).toBe(400);

    const errorBody = await res.json();
    expect(errorBody).toHaveProperty('message');
  });
}); 