// Scrambles the sequential id so trader IDs look like BID7K3F9A instead of
// BID000001, BID000002... — sequential IDs leak signup order and user count.
// The multiplier is odd and not a multiple of 3, so it's coprime with
// MODULUS (36^6 = 2^12 * 3^12), which makes the mapping a bijection: distinct
// bidNumbers always scramble to distinct codes.
const MULTIPLIER = 2654435761n;
const MODULUS = 36n ** 6n; // 2,176,782,336 — fits in six base36 digits

/** Formats a user's internal sequence number into their public-facing trader ID, e.g. BID7K3F9A. */
export function formatBid(bidNumber: number): string {
  const scrambled = (BigInt(bidNumber) * MULTIPLIER) % MODULUS;
  return `BID${scrambled.toString(36).toUpperCase().padStart(6, '0')}`;
}
