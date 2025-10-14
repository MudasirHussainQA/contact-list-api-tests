import { Page, Locator } from '@playwright/test';
import { BasePage } from './basePage';

export class ContactListPage extends BasePage {
  readonly addContactButton: Locator;
  readonly contactTable: Locator;
  readonly logoutButton: Locator;
  readonly welcomeMessage: Locator;
  readonly noContactsMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.addContactButton = page.getByRole('button', { name: /add contact/i }).or(page.locator('#add-contact'));
    this.contactTable = page.getByRole('table').or(page.locator('#myTable')).or(page.locator('table'));
    this.logoutButton = page.getByRole('button', { name: /logout|sign out/i }).or(page.locator('#logout'));
    this.welcomeMessage = page.getByRole('heading', { level: 1 }).or(page.locator('h1'));
    this.noContactsMessage = page.getByText(/no contacts/i).or(page.locator('text=No contacts'));
  }

  async navigateToContactList(): Promise<void> {
    await this.navigateTo('/contactList');
    await this.waitForPageLoad();
  }

  async isContactListVisible(): Promise<boolean> {
    return await this.isVisible(this.welcomeMessage);
  }

  async getWelcomeMessage(): Promise<string> {
    return await this.getText(this.welcomeMessage);
  }

  async logout(): Promise<void> {
    await this.clickButton(this.logoutButton);
  }

  async addContact(): Promise<void> {
    await this.clickButton(this.addContactButton);
  }

  async getContactCount(): Promise<number> {
    const rows = await this.contactTable.locator('tr').count();
    return Math.max(0, rows - 1); // Subtract header row
  }

  async isNoContactsMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.noContactsMessage);
  }
}
