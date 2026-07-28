// Scrambles the sequential id so trader IDs look like BID7K3F9A instead of
// BID000001, BID000002... — sequential IDs leak signup order and user count.
// The multiplier is odd and not a multiple of 3, so it's coprime with
// MODULUS (36^6 = 2^12 * 3^12), which makes the mapping a bijection: distinct
// bidNumbers always scramble to distinct codes.
const MULTIPLIER = 2654435761n;
const MODULUS = 36n ** 6n; // 2,176,782,336 — fits in six base36 digits

function modInverse(a: bigint, m: bigint): bigint {
  let [oldR, r] = [a, m];
  let [oldS, s] = [1n, 0n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  return ((oldS % m) + m) % m;
}

const INVERSE = modInverse(MULTIPLIER, MODULUS);

/** Formats a user's internal sequence number into their public-facing trader ID, e.g. BID7K3F9A. */
export function formatBid(bidNumber: number): string {
  const scrambled = (BigInt(bidNumber) * MULTIPLIER) % MODULUS;
  return `BID${scrambled.toString(36).toUpperCase().padStart(6, '0')}`;
}

/** Inverse of formatBid — used to resolve a referral code (someone's trader ID) back to their bidNumber. */
export function parseBid(bid: string): number | null {
  const match = /^BID([0-9A-Z]{6})$/i.exec(bid.trim());
  if (!match) return null;
  const scrambled = BigInt(parseInt(match[1], 36));
  if (scrambled < 0n || scrambled >= MODULUS) return null;
  return Number((scrambled * INVERSE) % MODULUS);
}
