import { expect, test } from '@playwright/test';
import { isoDateFromToday, monthsBetween, toPaymentDate, toSearchBoxDate } from '../../src/utils/date';

const STAYS = [
  { note: 'a January end rolls into March', from: new Date(2026, 0, 31), expected: '2026-03-02' },
  { note: 'a December start rolls into the next year', from: new Date(2026, 11, 15), expected: '2027-01-14' },
] as const;

test('a stay 30 days out lands correctly across month and year ends', () => {
  for (const stay of STAYS) {
    expect(isoDateFromToday(30, stay.from), stay.note).toBe(stay.expected);
  }
});

test('the date it is given is left alone', () => {
  const from = new Date(2026, 0, 31);
  isoDateFromToday(30, from);
  expect(from.getDate()).toBe(31);
});

test('each label matches the format the page it is compared against prints', () => {
  expect(toPaymentDate('2026-10-07')).toBe('Oct 7');
  expect(toSearchBoxDate('2026-10-07')).toBe('7 Oct 2026');
});

test('the month gap the calendar has to page across counts over a year end', () => {
  expect(monthsBetween('2026-12-20', '2027-01-19')).toBe(1);
});
