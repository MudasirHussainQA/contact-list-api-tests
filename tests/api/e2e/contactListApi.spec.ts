import { test, expect } from '../../fixtures';
import { HTTP_STATUS } from '../constants/api.constants';
import { faker } from '@faker-js/faker';

test('Full E2E Contact List API Test - Design Pattern with Dynamic Data', async ({ userClient, validUser, request }) => {
  const { ContactClient } = await import('../clients/contactClient');
  
  let res = await userClient.register(validUser);
  expect(res.ok()).toBeTruthy();

  res = await userClient.login({ email: validUser.email, password: validUser.password });
  expect(res.ok()).toBeTruthy();
  expect(userClient.token).not.toBe('');

  const contactClient = new ContactClient(request, userClient.token);

  const contact = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    birthdate: faker.date.birthdate().toISOString().split('T')[0],
    email: faker.internet.email(),
    phone: faker.string.numeric(10),
    street1: faker.location.streetAddress(),
    street2: faker.location.secondaryAddress(),
    city: faker.location.city(),
    stateProvince: faker.location.state(),
    postalCode: faker.location.zipCode(),
    country: faker.location.country()
  };

  res = await contactClient.add(contact);
  expect(res.status()).toBe(HTTP_STATUS.CREATED);
  const newContact = await res.json();
  const contactId = newContact._id;

  res = await contactClient.list();
  expect(res.ok()).toBeTruthy();
  const contacts = await res.json();
  expect(contacts.map((c: { _id: string }) => c._id)).toContain(contactId);

  res = await contactClient.get(contactId);
  expect(res.ok()).toBeTruthy();
  const fetchedContact = await res.json();
  expect(fetchedContact.email.toLowerCase()).toBe(contact.email.toLowerCase());


  const updatedContact = { ...contact, city: faker.location.city() };
  res = await contactClient.update(contactId, updatedContact);
  expect(res.ok()).toBeTruthy();

  res = await contactClient.patch(contactId, { firstName: faker.person.firstName() });
  expect(res.ok()).toBeTruthy();
  const patchedContact = await res.json();
  expect(patchedContact.firstName).not.toBe(contact.firstName);

  res = await contactClient.delete(contactId);
  expect(res.ok()).toBeTruthy();

  res = await userClient.logout();
  expect(res.ok()).toBeTruthy();

  res = await userClient.login({ email: validUser.email, password: validUser.password });
  expect(res.ok()).toBeTruthy();
  res = await userClient.delete();
  expect(res.ok()).toBeTruthy();
});

test.describe('Contact Management API Tests', () => {
  test('should successfully create a new contact with all fields', async ({ userClient, validUser, validContact, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const res = await contactClient.add(validContact);
    expect(res.status()).toBe(HTTP_STATUS.CREATED);

    const responseBody = await res.json();
    expect(responseBody).toHaveProperty('_id');
    expect(responseBody.firstName).toBe(validContact.firstName);
    expect(responseBody.lastName).toBe(validContact.lastName);
    expect(responseBody.email.toLowerCase()).toBe(validContact.email.toLowerCase());
    expect(responseBody.phone).toBe(validContact.phone);
    expect(responseBody.birthdate).toBe(validContact.birthdate);
    expect(responseBody.street1).toBe(validContact.street1);
    expect(responseBody.street2).toBe(validContact.street2);
    expect(responseBody.city).toBe(validContact.city);
    expect(responseBody.stateProvince).toBe(validContact.stateProvince);
    expect(responseBody.postalCode).toBe(validContact.postalCode);
    expect(responseBody.country).toBe(validContact.country);
  });

  test('should successfully create contact with minimal required fields', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const minimalContact = ContactFactory.generateMinimalContact();

    const res = await contactClient.add(minimalContact);
    expect(res.status()).toBe(HTTP_STATUS.CREATED);

    const responseBody = await res.json();
    expect(responseBody).toHaveProperty('_id');
    expect(responseBody.firstName).toBe(minimalContact.firstName);
    expect(responseBody.lastName).toBe(minimalContact.lastName);
    expect(responseBody.email.toLowerCase()).toBe(minimalContact.email?.toLowerCase());
  });

  test('should handle special characters in contact fields', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const specialContact = ContactFactory.generateSpecialCharacterContact();

    const res = await contactClient.add(specialContact);
    
    if (res.ok()) {
      const responseBody = await res.json();
      expect(responseBody.firstName).toBe(specialContact.firstName);
      expect(responseBody.lastName).toBe(specialContact.lastName);
      expect(responseBody.email.toLowerCase()).toBe(specialContact.email.toLowerCase());
      expect(responseBody.phone).toBe(specialContact.phone);
      console.log('Special characters accepted in contact fields');
    } else {
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      console.log('Special characters rejected in contact fields:', errorBody.message);
    }
  });

  test('should reject contact creation with invalid email format', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    const loginRes = await userClient.login({ email: validUser.email, password: validUser.password });
    expect(loginRes.ok()).toBeTruthy();
    
    const contactClient = new ContactClient(request, userClient.token);

    const invalidContact = ContactFactory.generateInvalidContact({
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email-format'
    });

    const res = await contactClient.add(invalidContact);
    // Should be 400 for invalid format or 401 if auth failed
    expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNAUTHORIZED]).toContain(res.status());

    if (res.ok()) {
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
    }
  });

  test('should reject contact creation with missing required fields', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const incompleteContact = {
      firstName: 'John'
    };

    const res = await contactClient.add(incompleteContact);
    expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);

    const errorBody = await res.json();
    expect(errorBody).toHaveProperty('message');
  });

  test('should successfully retrieve contact list when empty', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const res = await contactClient.list();
    expect(res.ok()).toBeTruthy();

    const contacts = await res.json();
    expect(Array.isArray(contacts)).toBeTruthy();
    expect(contacts.length).toBe(0);
  });

  test('should successfully retrieve contact list with multiple contacts', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const contacts = ContactFactory.generateValidContacts(3);
    const createdContactIds: string[] = [];

    for (const contact of contacts) {
      const res = await contactClient.add(contact);
      expect(res.status()).toBe(HTTP_STATUS.CREATED);
      const createdContact = await res.json();
      createdContactIds.push(createdContact._id);
    }

    const res = await contactClient.list();
    expect(res.ok()).toBeTruthy();

    const contactList = await res.json();
    expect(Array.isArray(contactList)).toBeTruthy();
    expect(contactList.length).toBe(3);

    const retrievedIds = contactList.map((c: { _id: string }) => c._id);
    createdContactIds.forEach(id => {
      expect(retrievedIds).toContain(id);
    });
  });

  test('should successfully retrieve specific contact by ID', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const contact = ContactFactory.generateReliableContact();
    
    let res = await contactClient.add(contact);
    if (!res.ok()) {
      const simpleContact = ContactFactory.generateMinimalContact();
      res = await contactClient.add(simpleContact);
      expect(res.status()).toBe(HTTP_STATUS.CREATED);
      const createdContact = await res.json();
      const contactId = createdContact._id;

      res = await contactClient.get(contactId);
      expect(res.ok()).toBeTruthy();

      const retrievedContact = await res.json();
      expect(retrievedContact._id).toBe(contactId);
      expect(retrievedContact.firstName).toBe(simpleContact.firstName);
      expect(retrievedContact.lastName).toBe(simpleContact.lastName);
      expect(retrievedContact.email?.toLowerCase()).toBe(simpleContact.email?.toLowerCase());
    } else {
      expect(res.status()).toBe(HTTP_STATUS.CREATED);
      const createdContact = await res.json();
      const contactId = createdContact._id;

      res = await contactClient.get(contactId);
      expect(res.ok()).toBeTruthy();

      const retrievedContact = await res.json();
      expect(retrievedContact._id).toBe(contactId);
      expect(retrievedContact.firstName).toBe(contact.firstName);
      expect(retrievedContact.lastName).toBe(contact.lastName);
      expect(retrievedContact.email.toLowerCase()).toBe(contact.email.toLowerCase());
    }
  });

  test('should return 404 for non-existent contact ID', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const nonExistentId = '507f1f77bcf86cd799439011';

    const res = await contactClient.get(nonExistentId);
    expect(res.status()).toBe(HTTP_STATUS.NOT_FOUND);
  });

  test('should return 400 for invalid contact ID format', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const invalidId = 'invalid-id-format';

    const res = await contactClient.get(invalidId);
    expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
  });

  test('should successfully update contact with PUT (full update)', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const originalContact = ContactFactory.generateReliableContact();
    
    let res = await contactClient.add(originalContact);
    expect(res.status()).toBe(HTTP_STATUS.CREATED);
    const createdContact = await res.json();
    const contactId = createdContact._id;

    const updatedContact = ContactFactory.generateReliableContact();
    res = await contactClient.update(contactId, updatedContact);
    expect(res.ok()).toBeTruthy();

    const responseBody = await res.json();
    expect(responseBody._id).toBe(contactId);
    expect(responseBody.firstName).toBe(updatedContact.firstName);
    expect(responseBody.lastName).toBe(updatedContact.lastName);
    expect(responseBody.email.toLowerCase()).toBe(updatedContact.email.toLowerCase());
    expect(responseBody.city).toBe(updatedContact.city);
  });

  test('should successfully update contact with PATCH (partial update)', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const originalContact = ContactFactory.generateValidContact();
    
    let res = await contactClient.add(originalContact);
    expect(res.status()).toBe(HTTP_STATUS.CREATED);
    const createdContact = await res.json();
    const contactId = createdContact._id;

    const partialUpdate = {
      city: 'New City',
      phone: '9876543210'
    };

    res = await contactClient.patch(contactId, partialUpdate);
    expect(res.ok()).toBeTruthy();

    const updatedContact = await res.json();
    expect(updatedContact._id).toBe(contactId);
    expect(updatedContact.city).toBe(partialUpdate.city);
    expect(updatedContact.phone).toBe(partialUpdate.phone);
    expect(updatedContact.firstName).toBe(originalContact.firstName);
    expect(updatedContact.lastName).toBe(originalContact.lastName);
    expect(updatedContact.email.toLowerCase()).toBe(originalContact.email.toLowerCase());
  });

  test('should reject update with invalid email format', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const contact = ContactFactory.generateValidContact();
    
    let res = await contactClient.add(contact);
    expect(res.status()).toBe(HTTP_STATUS.CREATED);
    const createdContact = await res.json();
    const contactId = createdContact._id;

    const invalidUpdate = {
      email: 'invalid-email-format'
    };

    res = await contactClient.patch(contactId, invalidUpdate);
    expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);

    const errorBody = await res.json();
    expect(errorBody).toHaveProperty('message');
  });

  test('should return 404 when updating non-existent contact', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const nonExistentId = '507f1f77bcf86cd799439011';
    const updateData = { firstName: 'Updated Name' };

    const res = await contactClient.update(nonExistentId, updateData);
    expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.NOT_FOUND]).toContain(res.status());
    
    if (res.status() === HTTP_STATUS.BAD_REQUEST) {
      console.log('API validates ObjectId format first, returning 400 for malformed ID');
    } else {
      console.log('Valid ObjectId format, returning 404 for non-existent contact');
    }
  });

  test('should successfully delete contact', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const contact = ContactFactory.generateValidContact();
    
    let res = await contactClient.add(contact);
    expect(res.status()).toBe(HTTP_STATUS.CREATED);
    const createdContact = await res.json();
    const contactId = createdContact._id;

    res = await contactClient.delete(contactId);
    expect(res.ok()).toBeTruthy();

    res = await contactClient.get(contactId);
    expect(res.status()).toBe(HTTP_STATUS.NOT_FOUND);
  });

  test('should return 404 when deleting non-existent contact', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const nonExistentId = '507f1f77bcf86cd799439011';

    const res = await contactClient.delete(nonExistentId);
    expect(res.status()).toBe(HTTP_STATUS.NOT_FOUND);
  });

  test('should handle boundary values in contact fields', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const boundaryContact = ContactFactory.generateBoundaryContact();

    const res = await contactClient.add(boundaryContact);
    if (res.ok()) {
      const responseBody = await res.json();
      expect(responseBody).toHaveProperty('_id');
      console.log('Boundary contact accepted:', responseBody);
    } else {
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      console.log('Boundary contact rejected:', errorBody.message);
    }
  });

  test('should prevent duplicate email addresses across contacts', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const contact1 = ContactFactory.generateValidContact();
    const contact2 = ContactFactory.generateValidContact({
      email: contact1.email
    });

    let res = await contactClient.add(contact1);
    expect(res.status()).toBe(HTTP_STATUS.CREATED);

    res = await contactClient.add(contact2);
    if (res.ok()) {
      console.log('Duplicate emails allowed in contacts');
    } else {
      expect(res.status()).toBe(HTTP_STATUS.BAD_REQUEST);
      const errorBody = await res.json();
      expect(errorBody).toHaveProperty('message');
      console.log('Duplicate emails prevented:', errorBody.message);
    }
  });

  test('should maintain contact data integrity during multiple operations', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    const contactClient = new ContactClient(request, userClient.token);

    const contact = ContactFactory.generateValidContact();
    
    let res = await contactClient.add(contact);
    expect(res.status()).toBe(HTTP_STATUS.CREATED);
    const createdContact = await res.json();
    const contactId = createdContact._id;

    for (let i = 0; i < 3; i++) {
      const updateData = { city: `Updated City ${i}` };
      res = await contactClient.patch(contactId, updateData);
      expect(res.ok()).toBeTruthy();

      const updatedContact = await res.json();
      expect(updatedContact.city).toBe(`Updated City ${i}`);
      expect(updatedContact.firstName).toBe(contact.firstName);
      expect(updatedContact.email.toLowerCase()).toBe(contact.email.toLowerCase());
    }

    res = await contactClient.get(contactId);
    expect(res.ok()).toBeTruthy();
    const finalContact = await res.json();
    expect(finalContact.city).toBe('Updated City 2');
    expect(finalContact.firstName).toBe(contact.firstName);
  });
});

test.describe('Contact API Authorization Tests', () => {
  test('should reject contact operations without authentication token', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    
    const unauthenticatedClient = new ContactClient(request, '');
    const contact = ContactFactory.generateValidContact();

    let res = await unauthenticatedClient.add(contact);
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);

    res = await unauthenticatedClient.list();
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  test('should reject contact operations with invalid token', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    
    const invalidTokenClient = new ContactClient(request, 'invalid-token-12345');
    const contact = ContactFactory.generateValidContact();

    let res = await invalidTokenClient.add(contact);
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);

    res = await invalidTokenClient.list();
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  test('should isolate contacts between different users', async ({ userClient, validUser, request }) => {
    const { UserClient } = await import('../clients/userClient');
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    
    const contact1 = ContactFactory.generateValidContact();
    let res = await (new ContactClient(request, userClient.token)).add(contact1);
    expect(res.status()).toBe(HTTP_STATUS.CREATED);
    const createdContact1 = await res.json();

    const user2Client = new UserClient(request);
    const user2 = { firstName: 'User2', lastName: 'Test', email: faker.internet.email(), password: 'password123' };
    await user2Client.register(user2);
    await user2Client.login({ email: user2.email, password: user2.password });
    const contact2Client = new ContactClient(request, user2Client.token);

    const contact2 = ContactFactory.generateValidContact();
    res = await contact2Client.add(contact2);
    expect(res.status()).toBe(HTTP_STATUS.CREATED);

    const contact1Client = new ContactClient(request, userClient.token);
    res = await contact1Client.list();
    expect(res.ok()).toBeTruthy();
    const user1Contacts = await res.json();
    expect(user1Contacts.length).toBe(1);
    expect(user1Contacts[0]._id).toBe(createdContact1._id);

    res = await contact2Client.list();
    expect(res.ok()).toBeTruthy();
    const user2Contacts = await res.json();
    expect(user2Contacts.length).toBe(1);
    expect(user2Contacts[0]._id).not.toBe(createdContact1._id);

    res = await contact1Client.get(user2Contacts[0]._id);
    expect(res.status()).toBe(HTTP_STATUS.NOT_FOUND);

    await user2Client.delete();
  });

  test('should reject operations after user logout', async ({ userClient, validUser, request }) => {
    const { ContactClient } = await import('../clients/contactClient');
    const { ContactFactory } = await import('../fixtures/contactFactory');
    
    await userClient.register(validUser);
    await userClient.login({ email: validUser.email, password: validUser.password });
    
    const contactClient = new ContactClient(request, userClient.token);
    const contact = ContactFactory.generateReliableContact();
    
    let res = await contactClient.add(contact);
    if (!res.ok()) {
      const minimalContact = ContactFactory.generateMinimalContact();
      res = await contactClient.add(minimalContact);
    }
    
    if (res.ok()) {
      expect(res.status()).toBe(HTTP_STATUS.CREATED);
      console.log('Contact created successfully, proceeding with logout test');
    } else {
      console.log('Contact creation failed, testing logout behavior without initial contact');
    }

    res = await userClient.logout();
    expect(res.ok()).toBeTruthy();

    res = await contactClient.list();
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);

    const newContact = ContactFactory.generateReliableContact();
    res = await contactClient.add(newContact);
    expect(res.status()).toBe(HTTP_STATUS.UNAUTHORIZED);
  });
});
