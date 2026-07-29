// Excludes 0/O/1/I/L so a code read aloud or handwritten in a support chat
// can't be misread as a different character.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** A short human-friendly reference for one ledger entry, shown to users and admins in place of the raw id/txHash. */
export function generateTxCode(): string {
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `TX-${suffix}`;
}
