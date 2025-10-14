import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  protected async fillField(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.fill(value);
    // Verify the value was filled correctly
    await expect(locator).toHaveValue(value);
  }

  protected async clickButton(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  protected async waitForElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: 10000 });
  }

  protected async getText(locator: Locator): Promise<string> {
    return await locator.textContent() || '';
  }

  protected async isVisible(locator: Locator): Promise<boolean> {
    try {
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  protected async waitForElementToBeHidden(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout: 10000 });
  }

  protected async getElementCount(locator: Locator): Promise<number> {
    return await locator.count();
  }

  protected async selectOption(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.selectOption(value);
  }
}
