/**
 * Agoda tags its markup with three different hook attributes and uses all of
 * them, sometimes for the same widget on different layout variants. None is
 * Playwright's default test id, so each is wrapped here rather than aliasing
 * one and leaving the others looking out of place at the call site.
 *
 * Roles and labels are preferred wherever the markup exposes them; these are
 * for the parts that expose nothing else.
 */
export const byElementName = (name: string): string => `[data-element-name="${name}"]`;

export const byTestId = (id: string): string => `[data-testid="${id}"]`;

export const bySelenium = (name: string): string => `[data-selenium="${name}"]`;
