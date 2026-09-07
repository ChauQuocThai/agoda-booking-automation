import { expect, Locator, Page } from '@playwright/test';
import { byElementName } from '../utils/locators';

export class DestinationAutosuggest {
  private readonly input: Locator;
  private readonly panel: Locator;

  constructor(page: Page) {
    // The field's accessible name is A/B tested between "Enter a destination or
    // property" and "Where would you like to go?", so it is reached through the
    // surrounding box, which stays put across variants.
    this.input = page.locator(byElementName('autocomplete-box')).getByRole('combobox');
    this.panel = page.locator(byElementName('search-box-autocomplete'));
  }

  /**
   * Suggestions are ranked per session, so a short keyword does not always
   * surface the wanted property. Type the keyword first and only extend the
   * query when the property is missing from the list it returns.
   */
  async chooseProperty(keyword: string, propertyName: string): Promise<void> {
    await this.type(keyword);

    if (!(await this.isOffered(propertyName))) {
      await this.type(propertyName);
    }

    const option = this.optionNamed(propertyName);
    await expect(option).toBeVisible();
    await option.click();
    await expect(this.input).toHaveValue(new RegExp(propertyName, 'i'));
  }

  private async type(keyword: string): Promise<void> {
    await this.input.click();
    await this.input.fill('');
    await this.input.pressSequentially(keyword, { delay: 120 });
    await expect(this.panel).toBeVisible();
    await expect(this.panel.getByRole('option').first()).toBeVisible();
  }

  private async isOffered(propertyName: string): Promise<boolean> {
    return this.optionNamed(propertyName)
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
  }

  /** Options carry React-generated ids that change on every render, so match on the name. */
  private optionNamed(propertyName: string): Locator {
    return this.panel.getByRole('option').filter({ hasText: propertyName }).first();
  }
}
