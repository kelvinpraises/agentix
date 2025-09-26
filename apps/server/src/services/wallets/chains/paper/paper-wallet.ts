import { bytesToHex } from "@noble/hashes/utils";
import { sql } from "kysely";

import { db } from "@/infrastructure/database/turso-connection";
import {
  extractOrbIdFromAddress,
  generatePaperWalletAddress,
  isBurnerAddress,
  isPaperWalletAddress,
} from "@/services/wallets/chains/paper/paper-utils";
import {
  TransactionSigningError,
  WalletGenerationError,
} from "@/services/wallets/shared/errors";
import { validateOrbId } from "@/services/wallets/shared/providers/base-provider";
import { ChainType } from "@/types/orb";
import {
  ISignatureResult,
  IWalletGenerationResult,
  PaperDepositRequest,
  PaperTransferRequest,
} from "@/types/wallet";

// Cache for paper wallets (similar to ICP wallet cache pattern)
const paperWalletCache = new Map<string, { address: string; targetChain: ChainType }>();

export async function generatePaperWallet(
  orbId: string,
  targetChain: ChainType
): Promise<IWalletGenerationResult> {
  validateOrbId(orbId);

  try {
    const walletAddress = generatePaperWalletAddress(orbId, targetChain);

    // Cache the wallet info for reuse
    paperWalletCache.set(orbId, { address: walletAddress, targetChain });

    // Insert new simulated wallet with empty balances
    await db
      .insertInto("simulated_wallet")
      .values({
        orb_id: parseInt(orbId),
        wallet_address: walletAddress,
        balances: JSON.stringify({}),
        target_chain: targetChain,
      })
      .execute();

    return {
      address: walletAddress,
      chainType: "paper",
      publicKey: "paper",
    };
  } catch (error) {
    throw new WalletGenerationError(
      `Failed to generate paper wallet for orb ${orbId}: ${error}`,
      targetChain,
      orbId
    );
  }
}

export async function getPaperWalletAddress(
  orbId: string,
  targetChain: ChainType
): Promise<string> {
  validateOrbId(orbId);

  // Check cache first
  const cached = paperWalletCache.get(orbId);
  if (cached) {
    return cached.address;
  }

  try {
    // Check if wallet already exists in database
    const existingWallet = await db
      .selectFrom("simulated_wallet")
      .select(["wallet_address", "target_chain"])
      .where("orb_id", "=", parseInt(orbId))
      .executeTakeFirst();

    if (existingWallet) {
      // Cache for future use
      paperWalletCache.set(orbId, {
        address: existingWallet.wallet_address,
        targetChain: existingWallet.target_chain as ChainType,
      });
      return existingWallet.wallet_address;
    }

    // Generate new wallet if doesn't exist
    const result = await generatePaperWallet(orbId, targetChain);
    return result.address;
  } catch (error) {
    throw new WalletGenerationError(
      `Failed to get paper wallet address for orb ${orbId}: ${error}`,
      targetChain,
      orbId
    );
  }
}

export async function signPaperTransaction(
  orbId: string,
  _transaction: any,
  _targetChain: ChainType
): Promise<ISignatureResult> {
  validateOrbId(orbId);

  // Generate mock signature and transaction hash
  const mockTxHash = `paper-sign-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 11)}`;
  const mockSignature = bytesToHex(new Uint8Array(64));

  return {
    signature: mockSignature,
    transactionHash: mockTxHash,
    encoding: "paper",
  };
}

export async function executePaperTransfer(
  orbId: string,
  transferRequest: PaperTransferRequest
): Promise<ISignatureResult> {
  validateOrbId(orbId);

  try {
    const { to, asset, amount } = transferRequest;

    // Validate amount is positive
    if (BigInt(amount) <= 0) {
      throw new Error("Transfer amount must be positive");
    }

    // Get current balance and validate sufficient funds
    const currentBalance = await queryPaperBalance(orbId, asset);
    if (BigInt(currentBalance) < BigInt(amount)) {
      throw new TransactionSigningError(
        `Insufficient ${asset} balance. Available: ${currentBalance}, Required: ${amount}`,
        "paper",
        orbId
      );
    }

    // Debit sender's balance
    await db
      .updateTable("simulated_wallet")
      .set({
        balances: sql`json_set(balances, ${`$.${asset}`}, 
          json_extract(balances, ${`$.${asset}`}) - ${amount})`,
        updated_at: new Date().toISOString(),
      })
      .where("orb_id", "=", parseInt(orbId))
      .execute();

    // Credit receiver if it's another paper wallet (not burner)
    if (isPaperWalletAddress(to) && !isBurnerAddress(to)) {
      const receiverOrbId = extractOrbIdFromAddress(to);
      if (receiverOrbId) {
        await depositPaperAssets(receiverOrbId, { asset, amount });
      }
    }

    // Generate mock transaction hash
    const mockTxHash = `paper-tx-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 11)}`;

    return {
      signature: bytesToHex(new Uint8Array(64)), // Mock signature
      transactionHash: mockTxHash,
      encoding: "paper",
    };
  } catch (error) {
    if (error instanceof TransactionSigningError) {
      throw error;
    }
    throw new TransactionSigningError(
      `Failed to transfer ${transferRequest.amount} ${transferRequest.asset}: ${error}`,
      "paper",
      orbId
    );
  }
}

export async function depositPaperAssets(
  orbId: string,
  request: PaperDepositRequest
): Promise<void> {
  validateOrbId(orbId);

  try {
    const { asset, amount } = request;

    // Validate amount is positive
    if (BigInt(amount) <= 0) {
      throw new Error("Deposit amount must be positive");
    }

    // Update balance using JSON functions
    await db
      .updateTable("simulated_wallet")
      .set({
        balances: sql`json_set(
          COALESCE(balances, '{}'), 
          ${`$.${asset}`}, 
          COALESCE(json_extract(balances, ${`$.${asset}`}), '0') + ${amount}
        )`,
        updated_at: new Date().toISOString(),
      })
      .where("orb_id", "=", parseInt(orbId))
      .execute();
  } catch (error) {
    throw new TransactionSigningError(
      `Failed to deposit ${request.amount} ${request.asset} to paper wallet: ${error}`,
      "paper",
      orbId
    );
  }
}

export async function queryPaperBalance(orbId: string, asset: string): Promise<string> {
  validateOrbId(orbId);

  try {
    const result = await db
      .selectFrom("simulated_wallet")
      .select([sql<string>`json_extract(balances, ${`$.${asset}`})`.as("balance")])
      .where("orb_id", "=", parseInt(orbId))
      .executeTakeFirst();

    return result?.balance || "0";
  } catch (error) {
    throw new TransactionSigningError(
      `Failed to get ${asset} balance for paper wallet: ${error}`,
      "paper",
      orbId
    );
  }
}

export async function getAllPaperBalances(orbId: string): Promise<Record<string, string>> {
  validateOrbId(orbId);

  try {
    const result = await db
      .selectFrom("simulated_wallet")
      .select(["balances"])
      .where("orb_id", "=", parseInt(orbId))
      .executeTakeFirst();

    return (result?.balances as Record<string, string>) || {};
  } catch (error) {
    throw new TransactionSigningError(
      `Failed to get all balances for paper wallet: ${error}`,
      "paper",
      orbId
    );
  }
}
