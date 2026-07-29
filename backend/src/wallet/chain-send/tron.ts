import { TronWeb } from 'tronweb';

const USDT_CONTRACT_TRON = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const USDT_DECIMALS_TRON = 6;

export async function sendTronUsdt(toAddress: string, amount: string): Promise<{ txHash: string }> {
  const privateKey = process.env.WITHDRAWAL_SIGNER_TRON_PRIVATE_KEY;
  if (!privateKey) throw new Error('Tron withdrawal signer not configured');

  const headers = process.env.TRONGRID_API_KEY ? { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY } : undefined;
  const tronWeb = new (TronWeb as any)({
    fullHost: process.env.TRON_RPC_URL || 'https://api.trongrid.io',
    headers,
    privateKey,
  });

  const amountSun = BigInt(Math.round(parseFloat(amount) * 10 ** USDT_DECIMALS_TRON)).toString();
  const contract = await tronWeb.contract().at(USDT_CONTRACT_TRON);
  const txHash: string = await contract.transfer(toAddress, amountSun).send({ feeLimit: 50_000_000 });
  return { txHash };
}
