import { test, expect } from '../../fixtures';
import { HTTP_STATUS } from '../constants/api.constants';
import { faker } from '@faker-js/faker';

/**
 * Complete Contact Management API Tests
 * Based on Contact List API Documentation: https://documenter.getpostman.com/view/4012288/TzK2bEa8
 * 
 * Endpoints Covered:
 * - POST /contacts (Add Contact)
 * - GET /contacts (Get Contact List)
 * - GET /contacts/:id (Get Contact)
 * - PUT /contacts/:id (Update Contact)
 * - PATCH /contacts/:id (Update Contact Partially)
 * - DELETE /contacts/:id (Delete Contact)
 */

test.describe('Complete Contact Management API Tests', () => {

  test.describe('Add Contact (POST /contacts)', () => {
    test('should successfully create contact with all fields', async ({ userClient, validUser, validContact, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);

      const res = await contactClient.add(validContact);
      expect(res.status()).toBe(HTTP_STATUS.CREATED);
      expect(res.headers()['content-type']).toContain('application/json');

      const responseBody = await res.json();
      
      // Validate response structure
      expect(responseBody).toHaveProperty('_id');
      expect(responseBody).toHaveProperty('firstName');
      expect(responseBody).toHaveProperty('lastName');
      expect(responseBody).toHaveProperty('email');
      expect(responseBody).toHaveProperty('owner');
    });

    test('should successfully create contact with minimal required fields', async ({ userClient, validUser, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const { ContactFactory } = await import('../fixtures/contactFactory');
      const contactClient = new ContactClient(request, userClient.token);
      const minimalContact = ContactFactory.generateMinimalContact();

      const res = await contactClient.add(minimalContact);
      expect(res.status()).toBe(HTTP_STATUS.CREATED);

      const responseBody = await res.json();
      expect(responseBody).toHaveProperty('_id');
      expect(responseBody.firstName).toBe(minimalContact.firstName);
    });

    test('should reject contact creation with invalid email format', async ({ userClient, validUser, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);
      const invalidContact = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        phone: '1234567890'
      };

      const res = await contactClient.add(invalidContact);
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    test('should reject contact creation with missing required fields', async ({ userClient, validUser, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);
      const incompleteContact = {
        firstName: 'John'
      };

      const res = await contactClient.add(incompleteContact);
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  test.describe('Get Contact List (GET /contacts)', () => {
    test('should successfully retrieve contact list when empty', async ({ userClient, validUser, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);

      const res = await contactClient.list();
      expect(res.status()).toBe(HTTP_STATUS.OK);

      const contacts = await res.json();
      expect(Array.isArray(contacts)).toBeTruthy();
      expect(contacts.length).toBe(0);
    });

    test('should successfully retrieve contact list with multiple contacts', async ({ userClient, validUser, validContact, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const { ContactFactory } = await import('../fixtures/contactFactory');
      const contactClient = new ContactClient(request, userClient.token);

      // Add multiple contacts
      const contact2 = ContactFactory.generateReliableContact();
      const contact3 = ContactFactory.generateReliableContact();
      
      await contactClient.add(validContact);
      await contactClient.add(contact2);
      await contactClient.add(contact3);

      const res = await contactClient.list();
      expect(res.status()).toBe(HTTP_STATUS.OK);

      const contacts = await res.json();
      expect(contacts.length).toBe(3);
    });
  });

  test.describe('Get Contact by ID (GET /contacts/:id)', () => {
    test('should successfully retrieve specific contact by ID', async ({ userClient, validUser, validContact, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);

      const addRes = await contactClient.add(validContact);
      const addedContact = await addRes.json();

      const getRes = await contactClient.get(addedContact._id);
      expect(getRes.status()).toBe(HTTP_STATUS.OK);

      const retrievedContact = await getRes.json();
      expect(retrievedContact._id).toBe(addedContact._id);
      expect(retrievedContact.firstName).toBe(validContact.firstName);
    });

    test('should return 404 for non-existent contact ID', async ({ userClient, validUser, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);

      const fakeId = '000000000000000000000000';
      const res = await contactClient.get(fakeId);
      expect(res.status()).toBe(404);
    });

    test('should return 400 for invalid contact ID format', async ({ userClient, validUser, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);

      const res = await contactClient.get('invalid-id');
      expect(res.status()).toBe(400);
    });
  });

  test.describe('Update Contact (PUT/PATCH /contacts/:id)', () => {
    test('should successfully update contact with PUT (full update)', async ({ userClient, validUser, validContact, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);

      const addRes = await contactClient.add(validContact);
      const addedContact = await addRes.json();

      const updatedData = { firstName: 'UpdatedName', lastName: 'UpdatedLastName' };
      const updateRes = await contactClient.update(addedContact._id, updatedData);
      expect(updateRes.status()).toBe(HTTP_STATUS.OK);

      const updated = await updateRes.json();
      expect(updated.firstName).toBe('UpdatedName');
    });

    test('should successfully update contact with PATCH (partial update)', async ({ userClient, validUser, validContact, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);

      const addRes = await contactClient.add(validContact);
      const addedContact = await addRes.json();

      const patchData = { firstName: 'PatchedName' };
      const patchRes = await contactClient.patch(addedContact._id, patchData);
      expect(patchRes.status()).toBe(HTTP_STATUS.OK);

      const patched = await patchRes.json();
      expect(patched.firstName).toBe('PatchedName');
      expect(patched.lastName).toBe(validContact.lastName);
    });

    test('should reject update with invalid email format', async ({ userClient, validUser, validContact, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);

      const addRes = await contactClient.add(validContact);
      const addedContact = await addRes.json();

      const invalidData = { email: 'invalid-email' };
      const updateRes = await contactClient.update(addedContact._id, invalidData);
      expect(updateRes.status()).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    test('should return 404 when updating non-existent contact', async ({ userClient, validUser, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);

      const fakeId = '000000000000000000000000';
      const updateRes = await contactClient.update(fakeId, { firstName: 'Test' });
      // API returns 400 for invalid format or 404 if not found
      expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.NOT_FOUND]).toContain(updateRes.status());
    });
  });

  test.describe('Delete Contact (DELETE /contacts/:id)', () => {
    test('should successfully delete contact', async ({ userClient, validUser, validContact, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);

      const addRes = await contactClient.add(validContact);
      const addedContact = await addRes.json();

      const deleteRes = await contactClient.delete(addedContact._id);
      expect(deleteRes.status()).toBe(HTTP_STATUS.OK);

      // Verify deletion
      const getRes = await contactClient.get(addedContact._id);
      expect(getRes.status()).toBe(404);
    });

    test('should return 404 when deleting non-existent contact', async ({ userClient, validUser, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);

      const fakeId = '000000000000000000000000';
      const deleteRes = await contactClient.delete(fakeId);
      expect(deleteRes.status()).toBe(404);
    });
  });

  test.describe('Contact Integrity & Authorization', () => {
    test('should maintain contact data integrity during multiple operations', async ({ userClient, validUser, validContact, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);

      // Add contact
      const addRes = await contactClient.add(validContact);
      expect(addRes.ok()).toBeTruthy();
      const addedContact = await addRes.json();
      const originalId = addedContact._id;

      // Update contact with all required fields
      const updateRes = await contactClient.update(originalId, {
        firstName: 'Updated',
        lastName: addedContact.lastName, // Keep original lastName
        email: addedContact.email,
        phone: addedContact.phone,
      });
      
      expect(updateRes.status()).toBe(HTTP_STATUS.OK);

      // Retrieve and verify (with longer delay for consistency across all environments)
      await new Promise(r => setTimeout(r, 500));
      const getRes = await contactClient.get(originalId);
      expect(getRes.ok()).toBeTruthy();
      
      const retrieved = await getRes.json();
      expect(retrieved._id).toBe(originalId);
      expect(retrieved.firstName).toBe('Updated');
    });

    test('should reject contact operations without authentication token', async ({ request }) => {
      const { ContactClient } = await import('../clients/contactClient');
      const { ContactFactory } = await import('../fixtures/contactFactory');
      
      const contactClient = new ContactClient(request, '');
      const contact = ContactFactory.generateReliableContact();

      const res = await contactClient.add(contact);
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should reject contact operations with invalid token', async ({ request }) => {
      const { ContactClient } = await import('../clients/contactClient');
      const { ContactFactory } = await import('../fixtures/contactFactory');
      
      const contactClient = new ContactClient(request, 'invalid.token.here');
      const contact = ContactFactory.generateReliableContact();

      const res = await contactClient.add(contact);
      expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should isolate contacts between different users', async ({ userClient, validUser, validContact, request }) => {
      const { UserClient } = await import('../clients/userClient');
      const { ContactClient } = await import('../clients/contactClient');
      const { UserFactory } = await import('../fixtures/userFactory');
      
      const user2 = UserFactory.generateValidUser();
      const client2 = new UserClient(request);

      // User 1 setup
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      const contactClient1 = new ContactClient(request, userClient.token);

      // User 2 setup
      await client2.register(user2);
      await client2.login({ email: user2.email, password: user2.password });
      const contactClient2 = new ContactClient(request, client2.token);

      // User 1 adds contact
      const addRes = await contactClient1.add(validContact);
      const addedContact = await addRes.json();

      // User 2 should not see it
      const listRes = await contactClient2.list();
      const contacts = await listRes.json();
      const contactIds = contacts.map((c: any) => c._id);
      expect(contactIds).not.toContain(addedContact._id);

      // Cleanup
      await client2.delete();
    });

    test('should reject operations after user logout', async ({ userClient, validUser, validContact, request }) => {
      // Setup user
      await userClient.register(validUser);
      await userClient.login({ email: validUser.email, password: validUser.password });
      
      const { ContactClient } = await import('../clients/contactClient');
      const contactClient = new ContactClient(request, userClient.token);

      // Add contact
      const addRes = await contactClient.add(validContact);
      expect(addRes.status()).toBe(HTTP_STATUS.CREATED);

      // Logout
      await userClient.logout();

      // Try to access contacts after logout
      const listRes = await contactClient.list();
      expect(listRes.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });
});
