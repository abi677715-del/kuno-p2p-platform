import { ethers } from 'ethers';
import { Network } from '@prisma/client';
import { USDT_CONTRACT, USDT_DECIMALS, rpcUrl } from '../chain-common/evm';
import { VerifyResult } from './types';

const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');
const MIN_CONFIRMATIONS = 3;

export async function verifyEvmDeposit(
  network: Network,
  txHash: string,
  expectedAddress: string,
  expectedAmount: string,
): Promise<VerifyResult> {
  const contract = USDT_CONTRACT[network];
  const decimals = USDT_DECIMALS[network];
  if (!contract || decimals === undefined) return { verified: false, reason: 'unsupported network' };

  const provider = new ethers.JsonRpcProvider(rpcUrl(network));
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1) return { verified: false, reason: 'transaction not found or failed' };

  const latestBlock = await provider.getBlockNumber();
  const confirmations = latestBlock - receipt.blockNumber + 1;
  if (confirmations < MIN_CONFIRMATIONS) return { verified: false, reason: 'awaiting confirmations' };

  const wanted = ethers.parseUnits(expectedAmount, decimals);
  const matched = receipt.logs.some((log) => {
    if (log.address.toLowerCase() !== contract.toLowerCase()) return false;
    if (log.topics[0] !== TRANSFER_TOPIC || log.topics.length < 3) return false;
    const to = ethers.getAddress('0x' + log.topics[2].slice(26));
    if (to.toLowerCase() !== expectedAddress.toLowerCase()) return false;
    const value = BigInt(log.data);
    return value >= wanted;
  });

  return matched ? { verified: true } : { verified: false, reason: 'no matching transfer found in this transaction' };
}
