/**
 * 🖥️ UI Helper Functions
 * 
 * Reusable UI operations and utilities
 */

import { Page, Locator } from '@playwright/test';
import testConfig from '../config/testConfig';

/**
 * Wait for element to be visible
 */
export async function waitForElement(page: Page, selector: string, timeout?: number): Promise<Locator> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout: timeout || testConfig.timeouts.medium });
  return element;
}

/**
 * Wait for element to be hidden
 */
export async function waitForElementHidden(page: Page, selector: string, timeout?: number): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'hidden', timeout: timeout || testConfig.timeouts.medium });
}

/**
 * Fill input field and verify
 */
export async function fillInputField(
  page: Page,
  selector: string,
  value: string,
): Promise<void> {
  const input = page.locator(selector);
  await input.fill(value);
  const filledValue = await input.inputValue();
  if (filledValue !== value) {
    throw new Error(`Failed to fill input. Expected: ${value}, Got: ${filledValue}`);
  }
}

/**
 * Click element and wait for navigation
 */
export async function clickAndWaitForNavigation(page: Page, selector: string): Promise<void> {
  await Promise.all([
    page.waitForNavigation(),
    page.locator(selector).click(),
  ]);
}

/**
 * Get element text
 */
export async function getElementText(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });
  return (await element.textContent()) || '';
}

/**
 * Check if element is visible
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  return element.isVisible().catch(() => false);
}

/**
 * Check if element is enabled
 */
export async function isElementEnabled(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);
  return element.isEnabled().catch(() => false);
}

/**
 * Get element count
 */
export async function getElementCount(page: Page, selector: string): Promise<number> {
  return page.locator(selector).count();
}

/**
 * Clear input field
 */
export async function clearInputField(page: Page, selector: string): Promise<void> {
  const input = page.locator(selector);
  await input.fill('');
  const value = await input.inputValue();
  if (value) {
    throw new Error('Failed to clear input field');
  }
}

/**
 * Select option from dropdown
 */
export async function selectDropdownOption(page: Page, selector: string, value: string): Promise<void> {
  const select = page.locator(selector);
  await select.selectOption(value);
}

/**
 * Get selected option from dropdown
 */
export async function getSelectedDropdownOption(page: Page, selector: string): Promise<string> {
  const select = page.locator(selector);
  return select.inputValue();
}

/**
 * Check checkbox
 */
export async function checkCheckbox(page: Page, selector: string): Promise<void> {
  const checkbox = page.locator(selector);
  if (!(await checkbox.isChecked())) {
    await checkbox.click();
  }
}

/**
 * Uncheck checkbox
 */
export async function uncheckCheckbox(page: Page, selector: string): Promise<void> {
  const checkbox = page.locator(selector);
  if (await checkbox.isChecked()) {
    await checkbox.click();
  }
}

/**
 * Take screenshot
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  if (testConfig.ui.takeScreenshots !== 'off') {
    await page.screenshot({ path: `./screenshots/${name}.png` });
  }
}

/**
 * Get page URL
 */
export async function getCurrentURL(page: Page): Promise<string> {
  return page.url();
}

/**
 * Navigate to URL
 */
export async function navigateToURL(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'networkidle' });
}

/**
 * Wait for URL to match pattern
 */
export async function waitForURLMatch(page: Page, urlPattern: string | RegExp, timeout?: number): Promise<void> {
  await page.waitForURL(urlPattern, { timeout: timeout || testConfig.timeouts.medium });
}

/**
 * Reload page
 */
export async function reloadPage(page: Page): Promise<void> {
  await page.reload();
}

/**
 * Handle dialog/alert
 */
export async function handleDialog(page: Page, action: 'accept' | 'dismiss' = 'accept'): Promise<void> {
  page.once('dialog', (dialog) => {
    if (action === 'accept') {
      dialog.accept();
    } else {
      dialog.dismiss();
    }
  });
}

export default {
  waitForElement,
  waitForElementHidden,
  fillInputField,
  clickAndWaitForNavigation,
  getElementText,
  isElementVisible,
  isElementEnabled,
  getElementCount,
  clearInputField,
  selectDropdownOption,
  getSelectedDropdownOption,
  checkCheckbox,
  uncheckCheckbox,
  takeScreenshot,
  getCurrentURL,
  navigateToURL,
  waitForURLMatch,
  reloadPage,
  handleDialog,
};
