/**
 * 🔌 API Helper Functions
 * 
 * Reusable API operations and utilities
 */

import { APIRequestContext, APIResponse } from '@playwright/test';
import testConfig from '../config/testConfig';

/**
 * Make a GET request
 */
export async function apiGet(
  request: APIRequestContext,
  endpoint: string,
  options?: { token?: string; headers?: Record<string, string> },
): Promise<APIResponse> {
  const headers = {
    ...testConfig.api.headers,
    ...(options?.token && { Authorization: `Bearer ${options.token}` }),
    ...options?.headers,
  };

  return request.get(`${testConfig.baseURL}${endpoint}`, { headers });
}

/**
 * Make a POST request
 */
export async function apiPost(
  request: APIRequestContext,
  endpoint: string,
  data?: any,
  options?: { token?: string; headers?: Record<string, string> },
): Promise<APIResponse> {
  const headers = {
    ...testConfig.api.headers,
    ...(options?.token && { Authorization: `Bearer ${options.token}` }),
    ...options?.headers,
  };

  return request.post(`${testConfig.baseURL}${endpoint}`, {
    data,
    headers,
  });
}

/**
 * Make a PUT request
 */
export async function apiPut(
  request: APIRequestContext,
  endpoint: string,
  data?: any,
  options?: { token?: string; headers?: Record<string, string> },
): Promise<APIResponse> {
  const headers = {
    ...testConfig.api.headers,
    ...(options?.token && { Authorization: `Bearer ${options.token}` }),
    ...options?.headers,
  };

  return request.put(`${testConfig.baseURL}${endpoint}`, {
    data,
    headers,
  });
}

/**
 * Make a DELETE request
 */
export async function apiDelete(
  request: APIRequestContext,
  endpoint: string,
  options?: { token?: string; headers?: Record<string, string> },
): Promise<APIResponse> {
  const headers = {
    ...testConfig.api.headers,
    ...(options?.token && { Authorization: `Bearer ${options.token}` }),
    ...options?.headers,
  };

  return request.delete(`${testConfig.baseURL}${endpoint}`, { headers });
}

/**
 * Verify API response is successful
 */
export async function verifySuccessResponse(response: APIResponse, expectedStatus?: number): Promise<any> {
  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`API request failed with status ${response.status()}: ${text}`);
  }

  if (expectedStatus && response.status() !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status()}`);
  }

  const contentType = response.headers()['content-type'];
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

/**
 * Extract token from response
 */
export async function extractToken(response: APIResponse): Promise<string> {
  const body = await response.json();
  if (!body.token) {
    throw new Error('No token found in response');
  }
  return body.token;
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  request: APIRequestContext,
  endpoint: string,
  condition: (response: APIResponse) => Promise<boolean>,
  timeout: number = testConfig.timeouts.medium,
): Promise<APIResponse> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const response = await apiGet(request, endpoint);
    if (await condition(response)) {
      return response;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`API response condition not met within ${timeout}ms`);
}

export default {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  verifySuccessResponse,
  extractToken,
  waitForApiResponse,
};
