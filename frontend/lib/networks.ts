// Brand colors are approximate official chain colors, used the same way
// PAYMENT_METHODS uses colored initials badges instead of real logo images.
export const NETWORK_STYLE: Record<string, { short: string; color: string }> = {
  TRC20: { short: 'TRX', color: '#EB0029' },
  ERC20: { short: 'ETH', color: '#627EEA' },
  BEP20: { short: 'BSC', color: '#F0B90B' },
  POLYGON: { short: 'POLY', color: '#8247E5' },
  ARBITRUM: { short: 'ARB', color: '#28A0F0' },
  OPTIMISM: { short: 'OP', color: '#FF0420' },
  SOLANA: { short: 'SOL', color: '#14F195' },
  TON: { short: 'TON', color: '#0088CC' },
};

export function shortFor(network: string): string {
  return NETWORK_STYLE[network]?.short ?? network.slice(0, 3).toUpperCase();
}

export function colorForNetwork(network: string): string {
  return NETWORK_STYLE[network]?.color ?? '#475569';
}
