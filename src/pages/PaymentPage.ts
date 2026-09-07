import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { byElementName, byTestId } from '../utils/locators';

export class PaymentPage extends BasePage {
  get hotelName(): Locator {
    return this.page.locator(byTestId('property-name-id'));
  }

  get checkInDate(): Locator {
    return this.page.locator(byTestId('checkin-date'));
  }

  get checkOutDate(): Locator {
    return this.page.locator(byTestId('checkout-date'));
  }

  /** Rendered as "1 x Deluxe Twin Ocean View with Breakfast". */
  get roomHeading(): Locator {
    return this.page.locator(byTestId('room-heading')).first();
  }

  get roomPrice(): Locator {
    return this.page.locator(byElementName('fpc-room-price')).first();
  }
}
