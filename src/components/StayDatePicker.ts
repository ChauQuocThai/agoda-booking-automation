import { expect, Locator, Page } from '@playwright/test';
import { monthsBetween, toIsoDate } from '../utils/date';

/**
 * Agoda tags every day in the calendar with its own ISO date attribute. That
 * attribute is the single DOM detail this component depends on: picking a day
 * by its value avoids counting cells or parsing the visible month heading.
 */
const DAY_CELL = (isoDate: string) => `[data-selenium-date="${isoDate}"]`;

export class StayDatePicker {
  private readonly checkInBox: Locator;
  private readonly checkOutBox: Locator;
  private readonly nextMonth: Locator;

  constructor(private readonly page: Page) {
    this.checkInBox = page.getByTestId('check-in-box');
    this.checkOutBox = page.getByTestId('check-out-box');
    this.nextMonth = page.getByRole('button', { name: 'Next Month' });
  }

  async selectStay(checkInIso: string, checkOutIso: string): Promise<void> {
    await this.open();
    await this.pickDay(checkInIso);
    await this.pickDay(checkOutIso);

    await expect(this.checkInBox).toContainText(dayOfMonth(checkInIso));
    await expect(this.checkOutBox).toContainText(dayOfMonth(checkOutIso));
  }

  /** Choosing a property opens the calendar on its own, so only click when it is closed. */
  private async open(): Promise<void> {
    const anyDay = this.page.locator('[data-selenium-date]').first();
    if (!(await anyDay.isVisible().catch(() => false))) {
      await this.checkInBox.click();
    }
    await expect(anyDay).toBeVisible();
  }

  private async pickDay(isoDate: string): Promise<void> {
    const cell = this.page.locator(DAY_CELL(isoDate)).first();

    // The calendar renders two months; anything further ahead needs paging.
    const monthsAhead = monthsBetween(toIsoDate(new Date()), isoDate);
    for (let page = 0; page < monthsAhead && !(await cell.isVisible()); page++) {
      await this.nextMonth.click();
    }

    await expect(cell).toBeVisible();
    await cell.click();
  }
}

function dayOfMonth(isoDate: string): string {
  return String(Number(isoDate.split('-')[2]));
}
