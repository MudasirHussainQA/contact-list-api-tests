import { APIResponse } from '@playwright/test';
import { ApiError } from '../types/api.types';

/**
 * Utility functions for API testing
 */
export class TestUtils {
  /**
   * Safely parse JSON response, handling empty or non-JSON responses
   */
  static async safeJsonParse(response: APIResponse): Promise<any> {
    const responseText = await response.text();
    
    if (!responseText.trim()) {
      return null;
    }

    try {
      return JSON.parse(responseText);
    } catch (error) {
      console.warn(`Failed to parse JSON response: ${responseText}`);
      return { message: responseText };
    }
  }

  /**
   * Extract error message from API response
   */
  static async getErrorMessage(response: APIResponse): Promise<string> {
    const errorBody: ApiError = await this.safeJsonParse(response);
    return errorBody?.message || errorBody?.error || `HTTP ${response.status()}`;
  }

  /**
   * Generate unique identifier for test data
   */
  static generateUniqueId(): string {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${random}`;
  }

  /**
   * Generate unique email for testing
   */
  static generateUniqueEmail(prefix = 'test'): string {
    return `${prefix}${this.generateUniqueId()}@example.com`;
  }

  /**
   * Validate JWT token structure
   */
  static isValidJwtToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Check if each part is base64 encoded
    return parts.every(part => /^[A-Za-z0-9_-]+$/.test(part));
  }

  /**
   * Wait for a specified amount of time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry a function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.wait(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Truncate string to specified length
   */
  static truncateString(str: string, maxLength: number): string {
    return str.length > maxLength ? str.substring(0, maxLength) : str;
  }

  /**
   * Generate random string of specified length
   */
  static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
