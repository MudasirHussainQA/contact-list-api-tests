import { Page, Locator } from '@playwright/test';
import { BasePage } from './basePage';

export class SignupPage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByLabel('First Name').or(page.locator('input[name="firstName"]')).or(page.locator('#firstName'));
    this.lastNameInput = page.getByLabel('Last Name').or(page.locator('input[name="lastName"]')).or(page.locator('#lastName'));
    this.emailInput = page.getByLabel('Email').or(page.locator('input[type="email"]')).or(page.locator('#email'));
    this.passwordInput = page.getByLabel('Password').or(page.locator('input[type="password"]')).or(page.locator('#password'));
    this.submitButton = page.getByRole('button', { name: /submit|sign up|register/i }).or(page.locator('#submit'));
    this.errorMessage = page.locator('#error').or(page.getByText(/email address is already in use/i)).or(page.locator('[class*="error"]')).or(page.getByRole('alert'));
    this.successMessage = page.getByRole('alert').filter({ hasText: /success|welcome/i }).or(page.locator('.success-message'));
    this.loginLink = page.getByText('Cancel').or(page.getByRole('button', { name: /cancel/i }));
  }

  async navigateToSignup(): Promise<void> {
    await this.navigateTo('/addUser');
    await this.waitForPageLoad();
  }

  async fillSignupForm(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<void> {
    await this.fillField(this.firstNameInput, userData.firstName);
    await this.fillField(this.lastNameInput, userData.lastName);
    await this.fillField(this.emailInput, userData.email);
    await this.fillField(this.passwordInput, userData.password);
  }

  async submitSignup(): Promise<void> {
    await this.clickButton(this.submitButton);
  }

  async signupUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<void> {
    await this.fillSignupForm(userData);
    await this.submitSignup();
  }

  async getErrorMessage(): Promise<string> {
    // Wait for error message to appear
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    const text = await this.errorMessage.textContent();
    return text?.trim() || '';
  }

  async isErrorMessageVisible(): Promise<boolean> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async isSuccessMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.successMessage);
  }

  async clickLoginLink(): Promise<void> {
    await this.clickButton(this.loginLink);
  }

  async clickCancel(): Promise<void> {
    await this.clickButton(this.loginLink);
  }

  async isSignupFormVisible(): Promise<boolean> {
    return await this.isVisible(this.firstNameInput) &&
           await this.isVisible(this.lastNameInput) &&
           await this.isVisible(this.emailInput) &&
           await this.isVisible(this.passwordInput) &&
           await this.isVisible(this.submitButton);
  }

  async clearForm(): Promise<void> {
    await this.firstNameInput.clear();
    await this.lastNameInput.clear();
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }
}
