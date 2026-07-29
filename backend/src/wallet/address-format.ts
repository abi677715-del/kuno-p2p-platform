import { Network } from '@prisma/client';
import { USDT_CONTRACT } from './chain-common/evm';

const EVM_NETWORKS: Network[] = [
  Network.ERC20,
  Network.BEP20,
  Network.POLYGON,
  Network.ARBITRUM,
  Network.OPTIMISM,
];

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const USDT_MINT_SOLANA = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const USDT_CONTRACT_TRON = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

const FORMAT_BY_NETWORK: Partial<Record<Network, RegExp>> = {
  ERC20: EVM_ADDRESS,
  BEP20: EVM_ADDRESS,
  POLYGON: EVM_ADDRESS,
  ARBITRUM: EVM_ADDRESS,
  OPTIMISM: EVM_ADDRESS,
  TRC20: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  SOLANA: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  TON: /^[EU]Q[A-Za-z0-9_-]{46}$/,
};

/**
 * A basic sanity check on a withdrawal destination — catches the two most
 * common ways to lose funds by mistake: pasting an address in the wrong
 * network's format, and sending straight to the USDT contract/mint address
 * itself. It can't verify a checksum or that the address is actually
 * reachable, but it's enough to reject an obviously wrong destination
 * before any balance gets locked against it.
 */
export function isPlausibleAddress(network: Network, address: string): boolean {
  const pattern = FORMAT_BY_NETWORK[network];
  if (!pattern || !pattern.test(address)) return false;

  if (EVM_NETWORKS.includes(network)) {
    const contract = USDT_CONTRACT[network];
    if (contract && address.toLowerCase() === contract.toLowerCase()) return false;
  }
  if (network === Network.TRC20 && address === USDT_CONTRACT_TRON) return false;
  if (network === Network.SOLANA && address === USDT_MINT_SOLANA) return false;

  return true;
}
