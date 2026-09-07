/** Agoda lists the ages as sentences, and the first two are irregular. */
export function ageOptionLabel(age: number): string {
  if (age < 1) return '<1 year old';
  return age === 1 ? '1 year old' : `${age} years old`;
}
