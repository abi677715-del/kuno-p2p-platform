import { Connection } from '@solana/web3.js';
import { VerifyResult } from './types';

const USDT_MINT_SOLANA = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const USDT_DECIMALS_SOLANA = 6;
const MIN_CONFIRMATIONS_SOLANA = 32;

function connection(): Connection {
  return new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
}

export async function verifySolanaDeposit(
  txHash: string,
  expectedAddress: string,
  expectedAmount: string,
): Promise<VerifyResult> {
  const conn = connection();
  const tx = await conn.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 });
  if (!tx || tx.meta?.err) return { verified: false, reason: 'transaction not found or failed' };

  const currentSlot = await conn.getSlot('confirmed');
  const confirmations = currentSlot - tx.slot;
  if (confirmations < MIN_CONFIRMATIONS_SOLANA) return { verified: false, reason: 'awaiting confirmations' };

  const wanted = BigInt(Math.round(parseFloat(expectedAmount) * 10 ** USDT_DECIMALS_SOLANA));
  const post = tx.meta?.postTokenBalances ?? [];
  const pre = tx.meta?.preTokenBalances ?? [];

  const matched = post.some((postBal) => {
    if (postBal.mint !== USDT_MINT_SOLANA || postBal.owner !== expectedAddress) return false;
    const preBal = pre.find((p) => p.accountIndex === postBal.accountIndex);
    const preAmount = preBal ? BigInt(preBal.uiTokenAmount.amount) : 0n;
    const postAmount = BigInt(postBal.uiTokenAmount.amount);
    return postAmount - preAmount >= wanted;
  });

  return matched ? { verified: true } : { verified: false, reason: 'no matching transfer found in this transaction' };
}
