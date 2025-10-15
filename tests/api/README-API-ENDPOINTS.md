# API Endpoints Reference

This document provides a comprehensive guide to using centralized API endpoints and constants in the testing framework.

## 🎯 Overview

All API endpoints are centralized in `constants/api.constants.ts` to ensure:
- **Single source of truth** for all API endpoints
- **Easy maintenance** when endpoints change
- **Consistent usage** across all tests
- **Better code readability** and maintainability

## 📁 File Structure

```
tests/api/constants/
└── api.constants.ts    # Centralized endpoints, status codes, and constraints
```

## 🔗 Available Endpoints

### User Endpoints
```typescript
import { API_ENDPOINTS } from '../constants/api.constants';

// User registration
API_ENDPOINTS.USERS.REGISTER    // '/users'

// User authentication
API_ENDPOINTS.USERS.LOGIN       // '/users/login'
API_ENDPOINTS.USERS.LOGOUT      // '/users/logout'

// User profile management
API_ENDPOINTS.USERS.PROFILE     // '/users/me'
API_ENDPOINTS.USERS.DELETE      // '/users/me'
```

### Contact Endpoints
```typescript
// Basic contact operations
API_ENDPOINTS.CONTACTS.BASE     // '/contacts'
API_ENDPOINTS.CONTACTS.CREATE   // '/contacts'
API_ENDPOINTS.CONTACTS.LIST     // '/contacts'

// Contact operations with ID
API_ENDPOINTS.CONTACTS.BY_ID(id)    // '/contacts/{id}'
API_ENDPOINTS.CONTACTS.UPDATE(id)   // '/contacts/{id}'
API_ENDPOINTS.CONTACTS.PATCH(id)    // '/contacts/{id}'
API_ENDPOINTS.CONTACTS.DELETE(id)   // '/contacts/{id}'
```

## 📊 HTTP Status Codes

```typescript
import { HTTP_STATUS } from '../constants/api.constants';

// Success codes
HTTP_STATUS.OK                  // 200
HTTP_STATUS.CREATED            // 201

// Error codes
HTTP_STATUS.BAD_REQUEST        // 400
HTTP_STATUS.UNAUTHORIZED       // 401
HTTP_STATUS.FORBIDDEN          // 403
HTTP_STATUS.NOT_FOUND          // 404
HTTP_STATUS.METHOD_NOT_ALLOWED // 405
HTTP_STATUS.INTERNAL_SERVER_ERROR // 500
```

## 🏗️ Usage Examples

### In API Clients
```typescript
import { API_ENDPOINTS } from '../constants/api.constants';

export class UserClient {
  async register(user: any): Promise<APIResponse> {
    return await this.requestContext.post(API_ENDPOINTS.USERS.REGISTER, {
      data: user
    });
  }

  async login(credentials: any): Promise<APIResponse> {
    return await this.requestContext.post(API_ENDPOINTS.USERS.LOGIN, {
      data: credentials
    });
  }
}
```

### In Test Files
```typescript
import { API_ENDPOINTS, HTTP_STATUS } from '../constants/api.constants';

test('should register user successfully', async ({ request }) => {
  const response = await request.post(API_ENDPOINTS.USERS.REGISTER, {
    data: userData
  });
  
  expect(response.status()).toBe(HTTP_STATUS.CREATED);
});
```

### With Dynamic IDs
```typescript
// For contact operations requiring ID
const contactId = '507f1f77bcf86cd799439011';

// Get specific contact
await request.get(API_ENDPOINTS.CONTACTS.BY_ID(contactId));

// Update contact
await request.put(API_ENDPOINTS.CONTACTS.UPDATE(contactId), { data: updateData });

// Delete contact
await request.delete(API_ENDPOINTS.CONTACTS.DELETE(contactId));
```

## 🔧 Field Constraints

```typescript
import { FIELD_CONSTRAINTS } from '../constants/api.constants';

// User field limits
FIELD_CONSTRAINTS.USER.FIRST_NAME_MAX    // 20
FIELD_CONSTRAINTS.USER.LAST_NAME_MAX     // 20
FIELD_CONSTRAINTS.USER.PASSWORD_MIN      // 7

// Contact field limits
FIELD_CONSTRAINTS.CONTACT.FIRST_NAME_MAX // 20
FIELD_CONSTRAINTS.CONTACT.PHONE_MAX      // 15
FIELD_CONSTRAINTS.CONTACT.STREET_MAX     // 40
// ... and more
```

## 📝 Test Data Constants

```typescript
import { TEST_DATA } from '../constants/api.constants';

// Common test values
TEST_DATA.VALID_BIRTHDATE    // '1990-01-01'
TEST_DATA.VALID_POSTAL_CODE  // '12345'
TEST_DATA.TEST_DOMAIN        // '@example.com'
```

## ✅ Benefits

### 1. **Maintainability**
- Change endpoint once, updates everywhere
- No more hunting for hardcoded URLs
- Easy to refactor when API changes

### 2. **Consistency**
- Same endpoint format across all tests
- Standardized status code usage
- Uniform error handling

### 3. **Developer Experience**
- IntelliSense support for all endpoints
- Type safety with TypeScript
- Clear documentation and examples

### 4. **Code Quality**
- Eliminates magic strings
- Follows DRY principles
- Professional code organization

## 🚀 Migration Guide

### Before (Hardcoded)
```typescript
// ❌ Old way - hardcoded endpoints
await request.post('/users', { data: user });
await request.get('/contacts/123');
expect(response.status()).toBe(201);
```

### After (Centralized)
```typescript
// ✅ New way - centralized constants
await request.post(API_ENDPOINTS.USERS.REGISTER, { data: user });
await request.get(API_ENDPOINTS.CONTACTS.BY_ID('123'));
expect(response.status()).toBe(HTTP_STATUS.CREATED);
```

## 🎯 Best Practices

1. **Always import constants** at the top of your files
2. **Use descriptive endpoint names** instead of hardcoded strings
3. **Leverage HTTP status constants** for better readability
4. **Document any new endpoints** you add to the constants file
5. **Keep endpoints organized** by feature/resource

## 📚 Related Files

- `tests/api/constants/api.constants.ts` - Main constants file
- `tests/api/clients/userClient.ts` - Example usage in UserClient
- `tests/api/clients/contactClient.ts` - Example usage in ContactClient
- `tests/api/e2e/dataValidationApi.spec.ts` - Example usage in tests

---

This centralized approach makes the testing framework more professional, maintainable, and easier to work with for development teams.
