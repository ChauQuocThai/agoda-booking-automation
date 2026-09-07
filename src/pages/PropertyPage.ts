import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { PaymentPage } from './PaymentPage';
import { byElementName, bySelenium, byTestId } from '../utils/locators';

const BOOK_BUTTON = byElementName('mob-room-tile-book-now');

export class PropertyPage extends BasePage {
  private readonly heading: Locator;
  private readonly roomGrid: Locator;
  private readonly roomNames: Locator;

  constructor(page: Page) {
    super(page);
    // The review score is also an h1 and the header wrapper differs between
    // layout variants, so the title is taken from its own hook.
    this.heading = page.locator(bySelenium('hotel-header-name'));
    this.roomGrid = page.locator(byElementName('roomgrid'));
    this.roomNames = page.locator(byTestId('room-name'));
  }

  get hotelName(): Locator {
    return this.heading;
  }

  get price(): Locator {
    return this.page.locator(byElementName('cheapest-room-price-property-nav-bar')).first();
  }

  /**
   * The grid ships with the page but fetches its rows once it enters the
   * viewport. A sold-out property renders no rows at all, so this reports
   * rather than throws and the caller can move on to the next result.
   */
  async openBookingDetails(minRoomTypes: number): Promise<boolean> {
    await this.roomGrid.scrollIntoViewIfNeeded();
    return this.roomNames
      .nth(minRoomTypes - 1)
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
  }

  async roomTypeName(index: number): Promise<string> {
    return (await this.roomNames.nth(index).innerText()).trim();
  }

  async hasBookableRooms(): Promise<boolean> {
    return (await this.page.locator(BOOK_BUTTON).count()) > 0;
  }

  /**
   * A room type carries no hook of its own. Its block is the nearest ancestor of
   * the room name that also holds that room's Book buttons, which keeps "the
   * first Book button of the second room type" distinct from "the second Book
   * button on the page" — one room type usually offers several rates, so the
   * two are not the same element.
   */
  private roomBlock(index: number): Locator {
    return this.roomNames
      .nth(index)
      .locator(`xpath=ancestor::div[.//button[@data-element-name="mob-room-tile-book-now"]][1]`);
  }

  async bookFirstRateOf(roomTypeIndex: number): Promise<PaymentPage> {
    const bookButton = this.roomBlock(roomTypeIndex).locator(BOOK_BUTTON).first();

    await bookButton.scrollIntoViewIfNeeded();
    await expect(bookButton).toBeVisible();

    const target = await this.navigateTo('/book/', () => bookButton.click());
    return new PaymentPage(target);
  }

  /** Leave this property and return to the results it was opened from. */
  async dispose(): Promise<void> {
    if (this.page.context().pages().length > 1) {
      await this.page.close();
    } else {
      await this.page.goBack();
    }
  }
}
