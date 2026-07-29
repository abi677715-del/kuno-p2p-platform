import { TronWeb } from 'tronweb';
import { VerifyResult } from './types';

const USDT_CONTRACT_TRON = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const USDT_DECIMALS_TRON = 6;
const MIN_CONFIRMATIONS_TRON = 19;
const TRANSFER_TOPIC = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function client(): any {
  const headers = process.env.TRONGRID_API_KEY ? { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY } : undefined;
  return new (TronWeb as any)({
    fullHost: process.env.TRON_RPC_URL || 'https://api.trongrid.io',
    headers,
  });
}

export async function verifyTronDeposit(
  txHash: string,
  expectedAddress: string,
  expectedAmount: string,
): Promise<VerifyResult> {
  const tronWeb = client();

  const info = await tronWeb.trx.getTransactionInfo(txHash);
  if (!info || !info.id || !info.receipt || info.receipt.result !== 'SUCCESS') {
    return { verified: false, reason: 'transaction not found or failed' };
  }

  const currentBlock = await tronWeb.trx.getCurrentBlock();
  const currentNumber = currentBlock?.block_header?.raw_data?.number;
  if (typeof currentNumber !== 'number' || typeof info.blockNumber !== 'number') {
    return { verified: false, reason: 'could not determine confirmations' };
  }
  const confirmations = currentNumber - info.blockNumber;
  if (confirmations < MIN_CONFIRMATIONS_TRON) return { verified: false, reason: 'awaiting confirmations' };

  const wanted = BigInt(Math.round(parseFloat(expectedAmount) * 10 ** USDT_DECIMALS_TRON));
  const expectedHex = tronWeb.address.toHex(expectedAddress).slice(-40).toLowerCase();

  const matched = (info.log || []).some((log: any) => {
    const contractAddress = tronWeb.address.fromHex('41' + log.address);
    if (contractAddress !== USDT_CONTRACT_TRON) return false;
    if (!log.topics || log.topics[0]?.toLowerCase() !== TRANSFER_TOPIC) return false;
    const to = (log.topics[2] || '').slice(-40).toLowerCase();
    if (to !== expectedHex) return false;
    const value = BigInt('0x' + log.data);
    return value >= wanted;
  });

  return matched ? { verified: true } : { verified: false, reason: 'no matching transfer found in this transaction' };
}
