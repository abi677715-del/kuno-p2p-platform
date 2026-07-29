import { Network } from '@prisma/client';
import { verifyEvmDeposit } from './evm';
import { verifyTronDeposit } from './tron';
import { verifySolanaDeposit } from './solana';
import { VerifyResult } from './types';

export { VerifyResult } from './types';

const EVM_NETWORKS: Network[] = [
  Network.ERC20,
  Network.BEP20,
  Network.POLYGON,
  Network.ARBITRUM,
  Network.OPTIMISM,
];

export async function verifyDeposit(
  network: Network,
  txHash: string,
  expectedAddress: string,
  expectedAmount: string,
): Promise<VerifyResult> {
  try {
    if (EVM_NETWORKS.includes(network)) return await verifyEvmDeposit(network, txHash, expectedAddress, expectedAmount);
    if (network === Network.TRC20) return await verifyTronDeposit(txHash, expectedAddress, expectedAmount);
    if (network === Network.SOLANA) return await verifySolanaDeposit(txHash, expectedAddress, expectedAmount);
    return { verified: false, reason: 'automatic verification not supported for this network yet' };
  } catch (err: any) {
    return { verified: false, reason: err?.message ?? 'verification error' };
  }
}
