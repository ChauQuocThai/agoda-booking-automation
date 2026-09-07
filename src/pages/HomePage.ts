import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { SearchResultsPage } from './SearchResultsPage';
import { DestinationAutosuggest } from '../components/DestinationAutosuggest';
import { OccupancyPicker } from '../components/OccupancyPicker';
import { StayDatePicker } from '../components/StayDatePicker';
import { byElementName } from '../utils/locators';

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
    this.searchButton = page.locator(byElementName('search-button'));
  }

  async open(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(this.searchButton).toBeVisible();
    await this.dismissOverlays();
  }

  /** Results replace the current page on some variants and open a tab on others. */
  async submitSearch(): Promise<SearchResultsPage> {
    const target = await this.navigateTo('/search', () => this.searchButton.click());
    return new SearchResultsPage(target);
  }
}
