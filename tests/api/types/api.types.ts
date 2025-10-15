import { APIRequestContext, APIResponse } from '@playwright/test';

// User related types
export interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface UserResponse {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    __v: number;
  };
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Contact related types
export interface Contact {
  firstName: string;
  lastName: string;
  birthdate: string;
  email: string;
  phone: string;
  street1: string;
  street2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
}

export interface ContactResponse extends Contact {
  _id: string;
  owner: string;
  __v: number;
}

// API Error types
export interface ApiError {
  message?: string;
  error?: string;
}

// Client interfaces - using any for flexibility in testing invalid data
export interface IUserClient {
  token: string;
  register(user: any): Promise<APIResponse>;
  login(credentials: any): Promise<APIResponse>;
  profile(): Promise<APIResponse>;
  updateProfile(updateData: any): Promise<APIResponse>;
  logout(): Promise<APIResponse>;
  delete(): Promise<APIResponse>;
}

export interface IContactClient {
  add(contact: any): Promise<APIResponse>;
  list(): Promise<APIResponse>;
  get(contactId: string): Promise<APIResponse>;
  update(contactId: string, contactData: any): Promise<APIResponse>;
  patch(contactId: string, patchData: any): Promise<APIResponse>;
  delete(contactId: string): Promise<APIResponse>;
}
