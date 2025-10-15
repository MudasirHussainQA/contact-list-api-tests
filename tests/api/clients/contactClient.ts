import { APIRequestContext, APIResponse } from '@playwright/test';
import { Contact, IContactClient } from '../types/api.types';
import { API_ENDPOINTS } from '../constants/api.constants';

export class ContactClient implements IContactClient {
  readonly requestContext: APIRequestContext;
  readonly token: string;

  constructor(requestContext: APIRequestContext, token: string) {
    this.requestContext = requestContext;
    this.token = token;
  }

  async add(contact: any): Promise<APIResponse> {
    return await this.requestContext.post(API_ENDPOINTS.CONTACTS.BASE, { 
      headers: this.getAuthHeaders(), 
      data: contact 
    });
  }

  async list(): Promise<APIResponse> {
    return await this.requestContext.get(API_ENDPOINTS.CONTACTS.BASE, { 
      headers: this.getAuthHeaders() 
    });
  }

  async get(contactId: string): Promise<APIResponse> {
    return await this.requestContext.get(API_ENDPOINTS.CONTACTS.BY_ID(contactId), { 
      headers: this.getAuthHeaders() 
    });
  }

  async update(contactId: string, contactData: any): Promise<APIResponse> {
    return await this.requestContext.put(API_ENDPOINTS.CONTACTS.BY_ID(contactId), { 
      headers: this.getAuthHeaders(), 
      data: contactData 
    });
  }

  async patch(contactId: string, patchData: any): Promise<APIResponse> {
    return await this.requestContext.patch(API_ENDPOINTS.CONTACTS.BY_ID(contactId), { 
      headers: this.getAuthHeaders(), 
      data: patchData 
    });
  }

  async delete(contactId: string): Promise<APIResponse> {
    return await this.requestContext.delete(API_ENDPOINTS.CONTACTS.BY_ID(contactId), { 
      headers: this.getAuthHeaders() 
    });
  }

  private getAuthHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.token}` };
  }
}