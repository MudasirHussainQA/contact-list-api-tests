import { test, expect } from '@playwright/test';
import { UserClient } from '../clients/userClient';
import { ContactClient } from '../clients/contactClient';
import { UserFactory } from '../fixtures/userFactory';
import { faker } from '@faker-js/faker';

test('Full E2E Contact List API Test - Design Pattern with Dynamic Data', async ({ request }) => {
  const userClient = new UserClient(request);
  const user = UserFactory.generateValidUser();

  let res = await userClient.register(user);
  expect(res.ok()).toBeTruthy();

  res = await userClient.login({ email: user.email, password: user.password });
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
  expect(res.status()).toBe(201);
  const newContact = await res.json();
  const contactId = newContact._id;

  res = await contactClient.list();
  expect(res.ok()).toBeTruthy();
  const contacts = await res.json();
  expect(contacts.map(c => c._id)).toContain(contactId);

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

  res = await userClient.login({ email: user.email, password: user.password });
  expect(res.ok()).toBeTruthy();
  res = await userClient.delete();
  expect(res.ok()).toBeTruthy();
});
