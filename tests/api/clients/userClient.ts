import { APIRequestContext, APIResponse } from '@playwright/test';
import { User, LoginCredentials, IUserClient, UserResponse } from '../types/api.types';
import { API_ENDPOINTS } from '../constants/api.constants';

export class UserClient implements IUserClient {
  readonly requestContext: APIRequestContext;
  token = '';

  constructor(requestContext: APIRequestContext) {
    this.requestContext = requestContext;
  }

  async register(user: any): Promise<APIResponse> {
    return await this.requestContext.post(API_ENDPOINTS.USERS.REGISTER, {
      data: user,
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Pragma': 'no-cache'
      }
    });
  }

  async login(credentials: any): Promise<APIResponse> {
    const res = await this.requestContext.post(API_ENDPOINTS.USERS.LOGIN, { data: credentials });
    if (res.ok()) {
      const body: UserResponse = await res.json();
      this.token = body.token;
    }
    return res;
  }

  async profile(): Promise<APIResponse> {
    return await this.requestContext.get(API_ENDPOINTS.USERS.PROFILE, { 
      headers: { Authorization: `Bearer ${this.token}` } 
    });
  }

  async updateProfile(updateData: any): Promise<APIResponse> {
    return await this.requestContext.patch(API_ENDPOINTS.USERS.PROFILE, {
      headers: { Authorization: `Bearer ${this.token}` },
      data: updateData,
    });
  }

  async logout(): Promise<APIResponse> {
    return await this.requestContext.post(API_ENDPOINTS.USERS.LOGOUT, { 
      headers: { Authorization: `Bearer ${this.token}` } 
    });
  }

  async delete(): Promise<APIResponse> {
    return await this.requestContext.delete(API_ENDPOINTS.USERS.PROFILE, { 
      headers: { Authorization: `Bearer ${this.token}` } 
    });
  }

  private getAuthHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.token}` };
  }
}