/**
 * Agoda tags its markup with two hook attributes and uses both freely. Neither
 * is Playwright's default test id, so each is wrapped here instead of aliasing
 * one of them and leaving the other looking out of place at the call site.
 */
export const byElementName = (name: string): string => `[data-element-name="${name}"]`;

export const byTestId = (id: string): string => `[data-testid="${id}"]`;
