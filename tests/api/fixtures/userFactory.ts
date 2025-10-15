import { faker } from '@faker-js/faker';
import { User } from '../types/api.types';

export class UserFactory {
  /**
   * Generates a valid user with random data
   */
  static generateValidUser(overrides: Partial<User> = {}): User {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: 10, memorable: true }),
      ...overrides
    };
  }

  /**
   * Generates a valid user with fixed test data
   */
  static generateFixedTestUser(): User {
    const timestamp = Date.now();
    return {
      firstName: 'John',
      lastName: 'Tester',
      email: `john${timestamp}@test.com`,
      password: 'Test@1234'
    };
  }

  /**
   * Generates multiple valid users
   */
  static generateValidUsers(count: number): User[] {
    return Array.from({ length: count }, () => this.generateValidUser());
  }

  /**
   * Generates a user with invalid data for negative testing
   */
  static generateInvalidUser(invalidFields: Partial<User> = {}): Partial<User> {
    return {
      firstName: '',
      lastName: '',
      email: 'invalid-email',
      password: '123', // too short
      ...invalidFields
    };
  }
}