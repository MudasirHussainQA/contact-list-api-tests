// API Endpoints
export const API_ENDPOINTS = {
  USERS: {
    REGISTER: '/users',
    LOGIN: '/users/login',
    LOGOUT: '/users/logout',
    PROFILE: '/users/me',
  },
  CONTACTS: {
    BASE: '/contacts',
    BY_ID: (id: string) => `/contacts/${id}`,
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Field Constraints
export const FIELD_CONSTRAINTS = {
  USER: {
    FIRST_NAME_MAX: 20,
    LAST_NAME_MAX: 20,
    PASSWORD_MIN: 7,
  },
  CONTACT: {
    FIRST_NAME_MAX: 20,
    LAST_NAME_MAX: 20,
    PHONE_MAX: 15,
    STREET_MAX: 40,
    CITY_MAX: 40,
    STATE_MAX: 20,
    POSTAL_CODE_MAX: 10,
    COUNTRY_MAX: 40,
  },
} as const;

// Test Data
export const TEST_DATA = {
  VALID_BIRTHDATE: '1990-01-01',
  VALID_POSTAL_CODE: '12345',
  TEST_DOMAIN: '@example.com',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_EMAIL: 'Email is invalid',
  PASSWORD_TOO_SHORT: 'Password is too short',
  FIELD_TOO_LONG: (field: string, max: number) => `${field} is longer than the maximum allowed length (${max})`,
} as const;
