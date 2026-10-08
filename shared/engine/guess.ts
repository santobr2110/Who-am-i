import type { Identity } from '../types';

/** Lowercase, strip accents, articles and punctuation so "the Amazon!" matches "Amazon". */
export function normalizeGuess(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/^\s*(the|a|an)\s+/, '')
    .replace(/\s+/g, '');
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/** Small typos are forgiven — spelling is not what this game is testing. */
export function isCorrectGuess(identity: Identity, text: string): boolean {
  const guess = normalizeGuess(text);
  if (!guess) return false;
  return [identity.name, ...identity.acceptableAnswers].some((candidate) => {
    const target = normalizeGuess(candidate);
    if (guess === target) return true;
    const tolerance = target.length >= 9 ? 2 : target.length >= 5 ? 1 : 0;
    return tolerance > 0 && editDistance(guess, target) <= tolerance;
  });
}
