import { faker } from '@faker-js/faker';
import { Contact } from '../types/api.types';

export class ContactFactory {
  /**
   * Generates a valid contact with random data that respects API limits
   */
  static generateValidContact(overrides: Partial<Contact> = {}): Contact {
    return {
      firstName: faker.person.firstName().substring(0, 20), // Max 20 chars
      lastName: faker.person.lastName().substring(0, 20),   // Max 20 chars
      birthdate: faker.date.birthdate().toISOString().split('T')[0],
      email: faker.internet.email(),
      phone: faker.string.numeric({ length: { min: 10, max: 10 } }), // Exactly 10 digits
      street1: faker.location.streetAddress().substring(0, 40), // Max 40 chars
      street2: faker.location.secondaryAddress().substring(0, 40), // Max 40 chars
      city: faker.location.city().substring(0, 40), // Max 40 chars
      stateProvince: faker.location.state().substring(0, 20), // Max 20 chars
      postalCode: faker.location.zipCode().substring(0, 10), // Max 10 chars
      country: faker.location.country().substring(0, 40), // Max 40 chars
      ...overrides
    };
  }

  /**
   * Generates a guaranteed valid contact for reliable testing
   */
  static generateReliableContact(overrides: Partial<Contact> = {}): Contact {
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits for uniqueness
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const uniqueId = `${timestamp}${randomSuffix}`;
    
    return {
      firstName: `John${uniqueId}`.substring(0, 20),
      lastName: `Doe${uniqueId}`.substring(0, 20),
      birthdate: '1990-01-01',
      email: `test${uniqueId}@example.com`,
      phone: `5550${uniqueId}`.substring(0, 10).padEnd(10, '0'),
      street1: `123 Main St ${uniqueId}`.substring(0, 40),
      street2: `Apt ${uniqueId}`.substring(0, 40),
      city: `TestCity${uniqueId}`.substring(0, 40),
      stateProvince: `TestState`.substring(0, 20),
      postalCode: `12345`,
      country: `TestCountry`.substring(0, 40),
      ...overrides
    };
  }

  /**
   * Generates a contact with fixed test data
   */
  static generateFixedTestContact(): Contact {
    const timestamp = Date.now();
    return {
      firstName: 'John',
      lastName: 'Doe',
      birthdate: '1990-01-01',
      email: `john.doe${timestamp}@test.com`,
      phone: '1234567890',
      street1: '123 Main St',
      street2: 'Apt 1',
      city: 'Test City',
      stateProvince: 'Test State',
      postalCode: '12345',
      country: 'Test Country'
    };
  }

  /**
   * Generates multiple valid contacts
   */
  static generateValidContacts(count: number): Contact[] {
    return Array.from({ length: count }, () => this.generateValidContact());
  }

  /**
   * Generates a contact with invalid data for negative testing
   */
  static generateInvalidContact(invalidFields: Partial<Contact> = {}): Partial<Contact> {
    return {
      firstName: '',
      lastName: '',
      birthdate: 'invalid-date',
      email: 'invalid-email',
      phone: 'invalid-phone',
      street1: '',
      street2: '',
      city: '',
      stateProvince: '',
      postalCode: 'invalid-postal',
      country: '',
      ...invalidFields
    };
  }

  /**
   * Generates a contact with minimal required fields only
   */
  static generateMinimalContact(): Partial<Contact> {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email()
    };
  }

  /**
   * Generates a contact with boundary values
   */
  static generateBoundaryContact(): Contact {
    return {
      firstName: 'A'.repeat(50), // Test long names
      lastName: 'B'.repeat(50),
      birthdate: '1900-01-01', // Very old date
      email: `${'a'.repeat(50)}@${'b'.repeat(50)}.com`, // Long email
      phone: '1'.repeat(20), // Long phone
      street1: 'C'.repeat(100), // Long address
      street2: 'D'.repeat(100),
      city: 'E'.repeat(50),
      stateProvince: 'F'.repeat(50),
      postalCode: 'G'.repeat(20),
      country: 'H'.repeat(50)
    };
  }

  /**
   * Generates contacts with special characters
   */
  static generateSpecialCharacterContact(): Contact {
    return {
      firstName: "Jean-Pierre O'Connor",
      lastName: "Van Der Berg-Smith",
      birthdate: '1985-12-25',
      email: 'test+special@example-domain.co.uk',
      phone: '+1-555-123-4567',
      street1: '123 Main St. #456',
      street2: 'Suite 789 & Co.',
      city: 'São Paulo',
      stateProvince: 'São Paulo',
      postalCode: 'SW1A 1AA',
      country: 'United Kingdom'
    };
  }
}
