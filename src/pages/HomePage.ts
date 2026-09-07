import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { DestinationAutosuggest } from '../components/DestinationAutosuggest';
import { OccupancyPicker } from '../components/OccupancyPicker';
import { StayDatePicker } from '../components/StayDatePicker';
import { BookingSearch } from '../data/types';
import { isoDateFromToday } from '../utils/date';

export class HomePage extends BasePage {
  readonly destination: DestinationAutosuggest;
  readonly dates: StayDatePicker;
  readonly occupancy: OccupancyPicker;
  private readonly searchButton: Locator;

  constructor(page: Page) {
    super(page);
    this.destination = new DestinationAutosuggest(page);
    this.dates = new StayDatePicker(page);
    this.occupancy = new OccupancyPicker(page);
    this.searchButton = page.getByTestId('search-button');
  }

  async open(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(this.searchButton).toBeVisible();
    await this.dismissOverlays();
  }

  async fillSearchForm(booking: BookingSearch): Promise<void> {
    await this.destination.chooseProperty(booking.searchKeyword, booking.expectedSuggestion);

    await this.dates.selectStay(
      isoDateFromToday(booking.dates.checkInOffsetDays),
      isoDateFromToday(booking.dates.checkOutOffsetDays),
    );

    await this.occupancy.apply(booking.occupancy);
  }

  /**
   * Search normally navigates in place, but some variants open a tab instead,
   * so both are accepted and whichever appears becomes the results page.
   */
  async submitSearch(): Promise<Page> {
    const newTab = this.page.context().waitForEvent('page', { timeout: 5_000 }).catch(() => null);
    await this.searchButton.click();

    const results = (await newTab) ?? this.page;
    await results.waitForLoadState('domcontentloaded');
    return results;
  }
}
