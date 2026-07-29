import { Network } from '@prisma/client';
import { sendEvmUsdt } from './evm';
import { sendTronUsdt } from './tron';
import { sendSolanaUsdt } from './solana';

const EVM_NETWORKS: Network[] = [
  Network.ERC20,
  Network.BEP20,
  Network.POLYGON,
  Network.ARBITRUM,
  Network.OPTIMISM,
];

export function signerConfigured(network: Network): boolean {
  if (EVM_NETWORKS.includes(network)) return !!process.env.WITHDRAWAL_SIGNER_EVM_PRIVATE_KEY;
  if (network === Network.TRC20) return !!process.env.WITHDRAWAL_SIGNER_TRON_PRIVATE_KEY;
  if (network === Network.SOLANA) return !!process.env.WITHDRAWAL_SIGNER_SOLANA_PRIVATE_KEY;
  return false;
}

export async function sendUsdt(network: Network, toAddress: string, amount: string): Promise<{ txHash: string }> {
  if (EVM_NETWORKS.includes(network)) return sendEvmUsdt(network, toAddress, amount);
  if (network === Network.TRC20) return sendTronUsdt(toAddress, amount);
  if (network === Network.SOLANA) return sendSolanaUsdt(toAddress, amount);
  throw new Error('automatic withdrawal not supported for this network');
}
