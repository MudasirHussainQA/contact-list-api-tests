import { APIRequestContext, APIResponse } from '@playwright/test';
import { ApiError } from '../types/api.types';

export abstract class BaseApiClient {
  protected readonly requestContext: APIRequestContext;
  protected readonly baseHeaders: Record<string, string>;

  constructor(requestContext: APIRequestContext) {
    this.requestContext = requestContext;
    this.baseHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  protected async handleResponse(response: APIResponse): Promise<any> {
    if (!response.ok()) {
      const errorText = await response.text();
      let errorBody: ApiError = {};
      
      try {
        errorBody = JSON.parse(errorText);
      } catch {
        errorBody = { message: errorText || `HTTP ${response.status()}` };
      }
      
      throw new Error(`API Error ${response.status()}: ${errorBody.message || errorBody.error || 'Unknown error'}`);
    }

    const contentType = response.headers()['content-type'];
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  protected getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      ...this.baseHeaders,
      ...additionalHeaders,
    };
  }

  protected getAuthHeaders(token: string): Record<string, string> {
    return this.getHeaders({
      'Authorization': `Bearer ${token}`,
    });
  }
}
