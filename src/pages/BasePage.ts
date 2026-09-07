import { Locator, Page } from '@playwright/test';

/**
 * Agoda opens promotional overlays on a timer, so any page may be covered a few
 * seconds after it settles. Every page object inherits the dismissal helper
 * rather than repeating it.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async dismissOverlays(): Promise<void> {
    const overlays: Locator[] = [
      this.page.getByTestId('prominent-app-download-popover').getByRole('button', { name: /close/i }),
      this.page.getByRole('button', { name: /^close$/i }),
      this.page.getByRole('button', { name: /no thanks|maybe later|dismiss/i }),
    ];

    for (const overlay of overlays) {
      const candidate = overlay.first();
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.click({ timeout: 3_000 }).catch(() => undefined);
      }
    }
  }
}
