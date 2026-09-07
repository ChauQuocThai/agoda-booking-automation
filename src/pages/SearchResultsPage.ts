import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { PropertyPage } from './PropertyPage';
import { HotelOffer } from '../data/types';
import { byElementName } from '../utils/locators';

export class SearchResultsPage extends BasePage {
  private readonly cards: Locator;

  constructor(page: Page) {
    super(page);
    this.cards = page.locator(byElementName('property-card-content'));
  }

  get target(): Page {
    return this.page;
  }

  async waitForResults(): Promise<void> {
    await expect(this.cards.first()).toBeVisible();
    await this.dismissOverlays();
  }

  card(index: number): Locator {
    return this.cards.nth(index);
  }

  cardTitle(index: number): Locator {
    return this.card(index).locator(byElementName('ssr-property-card-title'));
  }

  /** The card price is the "suggested price" the test case asks to check for. */
  cardPrice(index: number): Locator {
    return this.card(index).locator(byElementName('final-price')).first();
  }

  async offerAt(index: number): Promise<HotelOffer> {
    return {
      name: (await this.cardTitle(index).innerText()).trim(),
      price: (await this.cardPrice(index).innerText()).trim(),
    };
  }

  async openProperty(index: number): Promise<PropertyPage> {
    const target = await this.navigateTo('/hotel/', () => this.cardTitle(index).click());
    return new PropertyPage(target);
  }
}
