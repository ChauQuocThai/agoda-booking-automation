import { expect, Locator, Page } from '@playwright/test';
import { byElementName } from '../utils/locators';
import { monthsBetween, toIsoDate, toSearchBoxDate } from '../utils/date';

/**
 * Agoda tags every day in the calendar with its own ISO date attribute. That
 * attribute is the single DOM detail this component depends on: picking a day
 * by its value avoids counting cells or parsing the visible month heading.
 */
const DAY_CELL = (isoDate: string) => `[data-selenium-date="${isoDate}"]`;
const ANY_DAY_CELL = '[data-selenium-date]';

export class StayDatePicker {
  private readonly checkInBox: Locator;
  private readonly checkOutBox: Locator;
  private readonly nextMonth: Locator;

  constructor(private readonly page: Page) {
    this.checkInBox = page.locator(byElementName('check-in-box'));
    this.checkOutBox = page.locator(byElementName('check-out-box'));
    this.nextMonth = page.getByRole('button', { name: 'Next Month' });
  }

  async selectStay(checkInIso: string, checkOutIso: string): Promise<void> {
    await this.open();
    await this.pickDay(checkInIso);
    await this.pickDay(checkOutIso);

    await expect(this.checkInBox).toContainText(toSearchBoxDate(checkInIso));
    await expect(this.checkOutBox).toContainText(toSearchBoxDate(checkOutIso));
  }

  /**
   * Choosing a property opens the calendar on its own, but not instantly.
   * Give that a moment before clicking, or the click closes what just opened.
   */
  private async open(): Promise<void> {
    const anyDay = this.page.locator(ANY_DAY_CELL).first();
    const openedByItself = await anyDay
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false);

    if (!openedByItself) {
      await this.checkInBox.click();
    }
    await expect(anyDay).toBeVisible();
  }

  private async pickDay(isoDate: string): Promise<void> {
    const cell = this.page.locator(DAY_CELL(isoDate)).first();

    // Two months are rendered at a time; anything further ahead needs paging.
    const monthsAhead = monthsBetween(toIsoDate(new Date()), isoDate);
    for (let paged = 0; paged < monthsAhead && !(await cell.isVisible()); paged++) {
      await this.nextMonth.click();
    }

    await expect(cell).toBeVisible();
    await cell.click();
  }
}
