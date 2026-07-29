import { Network } from '@prisma/client';

// Each network's platform deposit address comes from its own env var, so
// adding a new chain later is just a new env var — no code changes needed.
// PLATFORM_DEPOSIT_ADDRESS (no suffix) is kept as a fallback for TRC20 only,
// since that was the single address this platform used before multi-chain support.
const ENV_VAR_BY_NETWORK: Record<Network, string> = {
  TRC20: 'PLATFORM_DEPOSIT_ADDRESS_TRC20',
  ERC20: 'PLATFORM_DEPOSIT_ADDRESS_ERC20',
  BEP20: 'PLATFORM_DEPOSIT_ADDRESS_BEP20',
  POLYGON: 'PLATFORM_DEPOSIT_ADDRESS_POLYGON',
  ARBITRUM: 'PLATFORM_DEPOSIT_ADDRESS_ARBITRUM',
  OPTIMISM: 'PLATFORM_DEPOSIT_ADDRESS_OPTIMISM',
  SOLANA: 'PLATFORM_DEPOSIT_ADDRESS_SOLANA',
  TON: 'PLATFORM_DEPOSIT_ADDRESS_TON',
};

export const NETWORK_LABELS: Record<Network, string> = {
  TRC20: 'Tron (TRC20)',
  ERC20: 'Ethereum (ERC20)',
  BEP20: 'BNB Smart Chain (BEP20)',
  POLYGON: 'Polygon',
  ARBITRUM: 'Arbitrum One',
  OPTIMISM: 'Optimism',
  SOLANA: 'Solana',
  TON: 'TON',
};

export function addressForNetwork(network: Network): string | null {
  const address = process.env[ENV_VAR_BY_NETWORK[network]];
  if (address) return address;
  if (network === Network.TRC20) return process.env.PLATFORM_DEPOSIT_ADDRESS ?? null;
  return null;
}

/** Networks whose platform address is actually configured — the only ones offered to users. */
export function configuredNetworks(): Network[] {
  return (Object.keys(ENV_VAR_BY_NETWORK) as Network[]).filter((n) => !!addressForNetwork(n));
}
