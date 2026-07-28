/** Formats a user's internal sequence number into their public-facing trader ID, e.g. BID000234. */
export function formatBid(bidNumber: number): string {
  return `BID${bidNumber.toString().padStart(6, '0')}`;
}
