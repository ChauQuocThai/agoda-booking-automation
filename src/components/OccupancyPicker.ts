import { expect, Locator, Page } from '@playwright/test';
import { ChildAges, Occupancy } from '../data/types';
import { byElementName, bySelenium } from '../utils/locators';

interface CounterSpec {
  /** Agoda's own hook for the number shown between the two buttons. */
  value: string;
  add: RegExp;
  subtract: RegExp;
}

/**
 * The buttons are relabelled as the count changes — "Add Children" becomes
 * "Add Child" once one is selected — so each control matches both forms.
 */
const COUNTERS = {
  rooms: {
    value: bySelenium('desktop-occ-room-value'),
    add: /^Add Rooms?$/,
    subtract: /^Subtract Rooms?$/,
  },
  adults: {
    value: bySelenium('desktop-occ-adult-value'),
    add: /^Add Adults?$/,
    subtract: /^Subtract Adults?$/,
  },
  children: {
    value: bySelenium('desktop-occ-children-value'),
    add: /^Add Child(ren)?$/,
    subtract: /^Subtract Child(ren)?$/,
  },
} as const satisfies Record<string, CounterSpec>;

type CounterName = keyof typeof COUNTERS;

function ageOptionLabel(age: number): string {
  if (age < 1) return '<1 year old';
  return age === 1 ? '1 year old' : `${age} years old`;
}

export class OccupancyPicker {
  private readonly trigger: Locator;
  private readonly panel: Locator;
  private readonly childAgeFields: Locator;

  constructor(private readonly page: Page) {
    this.trigger = page.locator(byElementName('occupancy-box'));
    this.panel = page.locator(byElementName('occupancy-selector-panel'));
    this.childAgeFields = page.locator(byElementName('occ-child-age-dropdown'));
  }

  async apply(occupancy: Occupancy): Promise<void> {
    await this.open();
    await this.setCounter('rooms', occupancy.rooms);
    await this.setCounter('adults', occupancy.adults);
    await this.setCounter('children', occupancy.childAges.length);
    await this.setChildAges(occupancy.childAges);
  }

  private async open(): Promise<void> {
    if (!(await this.panel.isVisible().catch(() => false))) {
      await this.trigger.click();
    }
    await expect(this.panel).toBeVisible();
  }

  private async setCounter(counter: CounterName, target: number): Promise<void> {
    const spec = COUNTERS[counter];
    const value = this.panel.locator(spec.value);

    for (let current = await this.read(value); current !== target; current = await this.read(value)) {
      const button = this.panel.getByRole('button', { name: current < target ? spec.add : spec.subtract });
      await button.click();
      await expect(value).not.toHaveText(String(current));
    }

    await expect(value).toHaveText(String(target));
  }

  private async read(value: Locator): Promise<number> {
    return Number((await value.innerText()).trim());
  }

  /**
   * Each age field is a button that opens its own list, not a <select>, so
   * selectOption() does not apply. The click is forced because Agoda paints a
   * decorative "(Required)" hint over the control until an age is chosen.
   */
  private async setChildAges(ages: ChildAges): Promise<void> {
    await expect(this.childAgeFields).toHaveCount(ages.length);

    for (const [index, age] of ages.entries()) {
      const field = this.childAgeFields.nth(index);
      const label = ageOptionLabel(age);

      await field.scrollIntoViewIfNeeded();
      await field.click({ force: true });

      // The list is portalled to the end of the body and does not always expose
      // an option role, so the entry is matched on its label instead.
      await this.page.getByText(label, { exact: true }).last().click();
      await expect(field).toContainText(label);
    }
  }

  async summary(): Promise<string> {
    return (await this.trigger.innerText()).replace(/\s+/g, ' ').trim();
  }
}
