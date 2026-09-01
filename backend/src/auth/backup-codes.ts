import { randomInt } from 'crypto';

// Excludes visually ambiguous characters (0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_COUNT = 10;
const GROUP_LENGTH = 4;

function randomGroup(): string {
  let group = '';
  for (let i = 0; i < GROUP_LENGTH; i++) {
    group += ALPHABET[randomInt(ALPHABET.length)];
  }
  return group;
}

/** Generates a fresh batch of one-time 2FA backup codes, e.g. "A1B2-C3D4". */
export function generateBackupCodes(): string[] {
  return Array.from({ length: CODE_COUNT }, () => `${randomGroup()}-${randomGroup()}`);
}

/** Normalizes user input for comparison — case-insensitive, tolerates missing/extra dashes and spaces. */
export function normalizeBackupCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]/g, '');
}
