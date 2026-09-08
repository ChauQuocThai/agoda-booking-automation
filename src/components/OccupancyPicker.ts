import { expect, Locator, Page } from '@playwright/test';
import { ChildAges, Occupancy } from '../data/types';
import { byElementName, bySelenium } from '../utils/locators';
import { ageOptionLabel } from '../utils/occupancy';

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

export class OccupancyPicker {
  /** The closed control, which summarises the current selection. */
  readonly box: Locator;
  private readonly panel: Locator;
  private readonly childAgeFields: Locator;

  constructor(private readonly page: Page) {
    this.box = page.locator(byElementName('occupancy-box'));
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
      await this.box.click();
    }
    await expect(this.panel).toBeVisible();
  }

  private async setCounter(counter: CounterName, target: number): Promise<void> {
    const spec = COUNTERS[counter];
    const value = this.panel.locator(spec.value);

    for (let current = await this.read(value, counter); current !== target; current = await this.read(value, counter)) {
      const button = this.panel.getByRole('button', { name: current < target ? spec.add : spec.subtract });
      await button.click();

      // At its own limits Agoda disables the control in one direction and simply
      // ignores the click in the other, so progress is what gets checked rather
      // than the button's state. Without this the loop spins until the test
      // timeout and reports only that the value is still what it was.
      try {
        await expect(value).not.toHaveText(String(current), { timeout: 5_000 });
      } catch {
        throw new Error(`Agoda stopped at ${current} ${counter}; ${target} was asked for`);
      }
    }

    await expect(value).toHaveText(String(target));
  }

  private async read(value: Locator, counter: CounterName): Promise<number> {
    const shown = (await value.innerText()).trim();
    const count = Number(shown);

    // A non-numeric read would compare false against the target and send the
    // loop off in the subtract direction.
    if (!Number.isInteger(count)) {
      throw new Error(`The ${counter} counter showed "${shown}", not a number`);
    }
    return count;
  }

  /**
   * Each age field is a button that opens its own list, not a <select>, so
   * selectOption() does not apply. The click is forced because Agoda paints a
   * decorative "(Required)" hint over the control until an age is chosen.
   *
   * Agoda also leaves the list mounted after a pick on some renders, and that
   * leftover swallows the click meant for the next field - which either strands
   * it unset or applies the age to the field before it. Reopening the panel
   * between children is what clears it; targeting the list directly cannot,
   * because nothing in the DOM says which field it currently belongs to.
   */
  private async setChildAges(ages: ChildAges): Promise<void> {
    for (const [index, age] of ages.entries()) {
      if (index > 0) {
        await this.reopen();
      }

      await expect(this.childAgeFields).toHaveCount(ages.length);
      const field = this.childAgeFields.nth(index);
      const label = ageOptionLabel(age);

      await field.scrollIntoViewIfNeeded();
      await field.click({ force: true });

      // The list is portalled to the end of the body and does not always expose
      // an option role, so the entry is matched on its label instead.
      await this.page.getByText(label, { exact: true }).last().click();
      await expect(field).toContainText(label);
    }

    // Checked again as a set: each field was green when it was set, so an age
    // overwritten afterwards would otherwise go unnoticed.
    for (const [index, age] of ages.entries()) {
      await expect(this.childAgeFields.nth(index), `child ${index + 1}`).toContainText(ageOptionLabel(age));
    }
  }

  private async reopen(): Promise<void> {
    await this.box.click();
    await expect(this.panel).toBeHidden();
    await this.box.click();
    await expect(this.panel).toBeVisible();
  }
}
