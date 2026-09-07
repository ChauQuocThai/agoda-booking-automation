import { expect, Locator, Page } from '@playwright/test';
import { byElementName } from '../utils/locators';

/**
 * Agoda opens promotional overlays on a timer and moves between steps in either
 * the current tab or a new one, so both behaviours are handled once here rather
 * than in every page object.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async dismissOverlays(): Promise<void> {
    const overlays: Locator[] = [
      this.page.locator(byElementName('prominent-app-download-popover')).getByRole('button', { name: /close/i }),
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

  /**
   * Waiting on a "page" event is not enough: Agoda also opens tabs for adverts,
   * so the destination is identified by its URL instead of by being new.
   */
  protected async navigateTo(urlPart: string, action: () => Promise<void>): Promise<Page> {
    const context = this.page.context();
    const before = new Set(context.pages());

    await action();

    let destination: Page | undefined;
    await expect
      .poll(
        () => {
          destination =
            context.pages().find((candidate) => !before.has(candidate) && candidate.url().includes(urlPart)) ??
            (this.page.url().includes(urlPart) ? this.page : undefined);
          return destination !== undefined;
        },
        { timeout: 60_000, message: `expected to land on a page containing "${urlPart}"` },
      )
      .toBe(true);

    if (!destination) {
      throw new Error(`No page reached "${urlPart}"`);
    }

    // A tab opened in the background is throttled by the browser, and Agoda's
    // lazily loaded sections never render there. Bring it forward first.
    await destination.bringToFront();
    await destination.waitForLoadState('domcontentloaded');
    return destination;
  }
}
