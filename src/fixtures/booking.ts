import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

interface BookingFixtures {
  /** An Agoda home page that is loaded and clear of promotional overlays. */
  homePage: HomePage;
}

export const test = base.extend<BookingFixtures>({
  homePage: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.open();
    await use(home);
  },
});

export { expect } from '@playwright/test';
