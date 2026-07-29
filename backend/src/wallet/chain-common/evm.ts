import { Network } from '@prisma/client';

export const USDT_CONTRACT: Partial<Record<Network, string>> = {
  ERC20: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  BEP20: '0x55d398326f99059fF775485246999027B3197955',
  POLYGON: '0xc2132D05D31c914a87C6611C10748AEb04B58e8D',
  ARBITRUM: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  OPTIMISM: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
};

export const USDT_DECIMALS: Partial<Record<Network, number>> = {
  ERC20: 6,
  BEP20: 18,
  POLYGON: 6,
  ARBITRUM: 6,
  OPTIMISM: 6,
};

const DEFAULT_RPC: Partial<Record<Network, string>> = {
  ERC20: 'https://eth.llamarpc.com',
  BEP20: 'https://bsc-dataseed.binance.org',
  POLYGON: 'https://polygon-rpc.com',
  ARBITRUM: 'https://arb1.arbitrum.io/rpc',
  OPTIMISM: 'https://mainnet.optimism.io',
};

const RPC_ENV_VAR: Partial<Record<Network, string>> = {
  ERC20: 'EVM_RPC_URL_ERC20',
  BEP20: 'EVM_RPC_URL_BEP20',
  POLYGON: 'EVM_RPC_URL_POLYGON',
  ARBITRUM: 'EVM_RPC_URL_ARBITRUM',
  OPTIMISM: 'EVM_RPC_URL_OPTIMISM',
};

export function rpcUrl(network: Network): string {
  const envVar = RPC_ENV_VAR[network];
  const fromEnv = envVar && process.env[envVar];
  const url = fromEnv || DEFAULT_RPC[network];
  if (!url) throw new Error(`No RPC configured for ${network}`);
  return url;
}
