import { Network } from '@prisma/client';

export const AUTO_WITHDRAWAL_MAX_USDT = parseFloat(process.env.AUTO_WITHDRAWAL_MAX_USDT ?? '100');

const DEFAULT_GAS_FEE_USDT: Partial<Record<Network, number>> = {
  TRC20: 1,
  ERC20: 5,
  BEP20: 0.5,
  POLYGON: 0.2,
  ARBITRUM: 0.5,
  OPTIMISM: 0.5,
  SOLANA: 0.1,
};

const GAS_FEE_ENV_VAR: Partial<Record<Network, string>> = {
  TRC20: 'WITHDRAWAL_GAS_FEE_USDT_TRC20',
  ERC20: 'WITHDRAWAL_GAS_FEE_USDT_ERC20',
  BEP20: 'WITHDRAWAL_GAS_FEE_USDT_BEP20',
  POLYGON: 'WITHDRAWAL_GAS_FEE_USDT_POLYGON',
  ARBITRUM: 'WITHDRAWAL_GAS_FEE_USDT_ARBITRUM',
  OPTIMISM: 'WITHDRAWAL_GAS_FEE_USDT_OPTIMISM',
  SOLANA: 'WITHDRAWAL_GAS_FEE_USDT_SOLANA',
};

export function gasFeeUsdt(network: Network): number {
  const envVar = GAS_FEE_ENV_VAR[network];
  const fromEnv = envVar && process.env[envVar];
  return fromEnv ? parseFloat(fromEnv) : (DEFAULT_GAS_FEE_USDT[network] ?? 0);
}
