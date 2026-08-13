// Excludes 0/O/1/I/L so a code read aloud or handwritten in a support chat
// can't be misread as a different character.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** A short human-friendly reference for one trade, shown to users and admins in place of the raw id. */
export function generateTradeCode(): string {
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `TRD-${suffix}`;
}
