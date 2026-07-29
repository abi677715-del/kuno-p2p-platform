import { ethers } from 'ethers';
import { Network } from '@prisma/client';
import { USDT_CONTRACT, USDT_DECIMALS, rpcUrl } from '../chain-common/evm';

const ERC20_TRANSFER_ABI = ['function transfer(address to, uint256 amount) returns (bool)'];

export async function sendEvmUsdt(network: Network, toAddress: string, amount: string): Promise<{ txHash: string }> {
  const privateKey = process.env.WITHDRAWAL_SIGNER_EVM_PRIVATE_KEY;
  if (!privateKey) throw new Error('EVM withdrawal signer not configured');

  const contractAddress = USDT_CONTRACT[network];
  const decimals = USDT_DECIMALS[network];
  if (!contractAddress || decimals === undefined) throw new Error(`Unsupported EVM network ${network}`);

  const provider = new ethers.JsonRpcProvider(rpcUrl(network));
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, ERC20_TRANSFER_ABI, wallet);

  const tx = await contract.transfer(toAddress, ethers.parseUnits(amount, decimals));
  await tx.wait(1);
  return { txHash: tx.hash };
}
