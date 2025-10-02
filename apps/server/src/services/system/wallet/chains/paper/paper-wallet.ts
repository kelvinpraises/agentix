import { RpcTarget, newHttpBatchRpcSession } from "capnweb";

import { db } from "@/infrastructure/database/turso-connection";
import { threadService } from "@/services/system/threads/thread-service";
import {
  TransactionSigningError,
  WalletGenerationError,
} from "@/services/system/wallet/shared/errors";
import { validateOrbId } from "@/services/system/wallet/shared/providers/base-provider";
import { ChainType } from "@/types/orb";
import {
  ISignatureResult,
  IWalletGenerationResult,
  PaperTransferRequest,
} from "@/types/wallet";

/**
 * Paper Wallet - Network Infra Thread Integration
 *
 * This service wraps network_infra thread RPC calls for paper trading.
 * Each orb's configured network_infra thread handles simulated blockchain state.
 * All methods query the orb's network_infra thread and communicate via RPC.
 */

interface NetworkInfraThread {
  orbId: number;
  sectorId: number;
  chain: string;
  providerId: string;
  config: Record<string, any>;
}

interface PaperWalletRpcApi extends RpcTarget {
  generateWallet(params: {
    orbId: number;
    targetChain: ChainType;
  }): Promise<{ address: string }>;
  getWalletAddress(params: {
    orbId: number;
    targetChain: ChainType;
  }): Promise<{ address: string }>;
  signTransaction(params: {
    orbId: number;
    transaction: any;
    targetChain: ChainType;
  }): Promise<{
    signature: string;
    transactionHash: string;
  }>;
  transfer(params: { orbId: number; to: string; asset: string; amount: string }): Promise<{
    signature: string;
    transactionHash: string;
  }>;
  getBalance(params: { orbId: number; asset: string }): Promise<{ balance: string }>;
}

async function getNetworkInfraThread(orbId: string): Promise<NetworkInfraThread> {
  validateOrbId(orbId);

  const thread = await db
    .selectFrom("threads as t")
    .innerJoin("orbs as o", "o.id", "t.orb_id")
    .select(["t.orb_id", "o.sector_id", "o.chain", "t.provider_id", "t.config_json"])
    .where("t.orb_id", "=", parseInt(orbId))
    .where("t.type", "=", "network_infra")
    .where("t.enabled", "=", true)
    .executeTakeFirst();

  if (!thread) {
    throw new WalletGenerationError(
      `No network infrastructure thread configured for orb ${orbId}`,
      "paper",
      orbId
    );
  }

  return {
    orbId: thread.orb_id,
    sectorId: thread.sector_id,
    chain: thread.chain,
    providerId: thread.provider_id,
    config: thread.config_json as Record<string, any>,
  };
}

async function getNetworkInfraRpcUrl(orbId: string): Promise<string> {
  const thread = await getNetworkInfraThread(orbId);
  const { port } = await threadService.getOrServeThread(
    thread.orbId,
    thread.sectorId,
    thread.chain,
    thread.providerId,
    thread.config
  );

  return `http://localhost:${port}/rpc`;
}

export async function generatePaperWallet(
  orbId: string,
  targetChain: ChainType
): Promise<IWalletGenerationResult> {
  validateOrbId(orbId);

  try {
    const rpcUrl = await getNetworkInfraRpcUrl(orbId);
    const batch = newHttpBatchRpcSession<PaperWalletRpcApi>(rpcUrl);

    const result = await batch.generateWallet({
      orbId: parseInt(orbId),
      targetChain,
    });

    return {
      address: result.address,
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

  try {
    const rpcUrl = await getNetworkInfraRpcUrl(orbId);
    const batch = newHttpBatchRpcSession<PaperWalletRpcApi>(rpcUrl);

    const result = await batch.getWalletAddress({
      orbId: parseInt(orbId),
      targetChain,
    });

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
  transaction: any,
  targetChain: ChainType
): Promise<ISignatureResult> {
  validateOrbId(orbId);

  try {
    const rpcUrl = await getNetworkInfraRpcUrl(orbId);
    const batch = newHttpBatchRpcSession<PaperWalletRpcApi>(rpcUrl);

    const result = await batch.signTransaction({
      orbId: parseInt(orbId),
      transaction,
      targetChain,
    });

    return {
      signature: result.signature,
      transactionHash: result.transactionHash,
      encoding: "paper",
    };
  } catch (error) {
    throw new TransactionSigningError(
      `Failed to sign paper transaction for orb ${orbId}: ${error}`,
      "paper",
      orbId
    );
  }
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

    const rpcUrl = await getNetworkInfraRpcUrl(orbId);
    const batch = newHttpBatchRpcSession<PaperWalletRpcApi>(rpcUrl);

    const result = await batch.transfer({
      orbId: parseInt(orbId),
      to,
      asset,
      amount,
    });

    return {
      signature: result.signature,
      transactionHash: result.transactionHash,
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

export async function queryPaperBalance(orbId: string, asset: string): Promise<string> {
  validateOrbId(orbId);

  try {
    const rpcUrl = await getNetworkInfraRpcUrl(orbId);
    const batch = newHttpBatchRpcSession<PaperWalletRpcApi>(rpcUrl);

    const result = await batch.getBalance({
      orbId: parseInt(orbId),
      asset,
    });

    return result.balance;
  } catch (error) {
    throw new TransactionSigningError(
      `Failed to get ${asset} balance for paper wallet: ${error}`,
      "paper",
      orbId
    );
  }
}
