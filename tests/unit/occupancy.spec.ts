import { expect, test } from '@playwright/test';
import { ageOptionLabel } from '../../src/utils/occupancy';

const AGES = [
  { age: 0, label: '<1 year old' },
  { age: 1, label: '1 year old' },
  { age: 12, label: '12 years old' },
  { age: 17, label: '17 years old' },
] as const;

test('every child age maps to the entry Agoda offers', () => {
  for (const { age, label } of AGES) {
    expect(ageOptionLabel(age), `age ${age}`).toBe(label);
  }
});
