import { Page, Locator } from '@playwright/test';
import { BasePage } from './basePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly signupLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel('Email').or(page.locator('input[type="email"]')).or(page.locator('#email'));
    this.passwordInput = page.getByLabel('Password').or(page.locator('input[type="password"]')).or(page.locator('#password'));
    this.submitButton = page.getByRole('button', { name: /submit|sign in|login/i }).or(page.locator('#submit'));
    this.errorMessage = page.getByRole('alert').or(page.locator('#error')).or(page.locator('[class*="error"]'));
    this.signupLink = page.getByRole('link', { name: /sign up|register/i }).or(page.getByRole('button', { name: /sign up|register/i }));
    this.logoutButton = page.getByRole('button', { name: /logout|sign out/i }).or(page.locator('#logout'));
  }

  async navigateToLogin(): Promise<void> {
    await this.navigateTo('/login');
    await this.waitForPageLoad();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillField(this.emailInput, email);
    await this.fillField(this.passwordInput, password);
    await this.clickButton(this.submitButton);
  }

  async logout(): Promise<void> {
    if (await this.isVisible(this.logoutButton)) {
      await this.clickButton(this.logoutButton);
    }
  }

  async getErrorMessage(): Promise<string> {
    await this.waitForElement(this.errorMessage);
    return await this.getText(this.errorMessage);
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.errorMessage);
  }

  async clickSignupLink(): Promise<void> {
    await this.clickButton(this.signupLink);
  }

  async isLoginFormVisible(): Promise<boolean> {
    return await this.isVisible(this.emailInput) &&
           await this.isVisible(this.passwordInput) &&
           await this.isVisible(this.submitButton);
  }

  async isLoggedIn(): Promise<boolean> {
    return await this.isVisible(this.logoutButton);
  }
}
