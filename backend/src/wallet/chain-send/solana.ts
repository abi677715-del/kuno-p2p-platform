import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, createTransferCheckedInstruction } from '@solana/spl-token';
import bs58 from 'bs58';

const USDT_MINT_SOLANA = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
const USDT_DECIMALS_SOLANA = 6;

function connection(): Connection {
  return new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
}

export async function sendSolanaUsdt(toAddress: string, amount: string): Promise<{ txHash: string }> {
  const privateKey = process.env.WITHDRAWAL_SIGNER_SOLANA_PRIVATE_KEY;
  if (!privateKey) throw new Error('Solana withdrawal signer not configured');

  const conn = connection();
  const payer = Keypair.fromSecretKey(bs58.decode(privateKey));
  const mint = new PublicKey(USDT_MINT_SOLANA);
  const toOwner = new PublicKey(toAddress);

  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(conn, payer, mint, payer.publicKey);
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(conn, payer, mint, toOwner);

  const amountRaw = BigInt(Math.round(parseFloat(amount) * 10 ** USDT_DECIMALS_SOLANA));

  const transaction = new Transaction().add(
    createTransferCheckedInstruction(
      fromTokenAccount.address,
      mint,
      toTokenAccount.address,
      payer.publicKey,
      amountRaw,
      USDT_DECIMALS_SOLANA,
    ),
  );

  const txHash = await sendAndConfirmTransaction(conn, transaction, [payer]);
  return { txHash };
}
