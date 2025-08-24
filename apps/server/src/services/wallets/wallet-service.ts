import { PrivyClient } from "@privy-io/server-auth";

import {
  createTransferRequest,
  generateEVMWallet,
  signEVMTransaction,
} from "@/services/wallets/chains/evm/evm-wallet";
import {
  generateICPWallet,
  getICPWalletAddress,
  signICPTransaction,
  executeICPTransfer,
  queryICRC1Balance,
} from "@/services/wallets/chains/icp/icp-wallet";
import { validateOrbId } from "@/services/wallets/shared/providers/base-provider";
import { createPrivyClient } from "@/services/wallets/shared/providers/privy-provider";
import { ChainType } from "@/types/orb";
import {
  IEVMTransferRequest,
  IICPTransferRequest,
  IOrbData,
  ISignatureResult,
  IWalletGenerationResult,
} from "@/types/wallet";

type ChainTransaction = IICPTransferRequest | IEVMTransferRequest;

function createWalletService(privyClient?: PrivyClient, privyWalletAddress?: string) {
  const client = privyClient || createPrivyClient();
  const walletAddress = privyWalletAddress || "default-privy-wallet";

  return {
    async generateWallet(
      orbId: string,
      chainType: ChainType
    ): Promise<IWalletGenerationResult> {
      validateOrbId(orbId);

      switch (chainType) {
        case "icp":
          return generateICPWallet(orbId, walletAddress, client);

        case "ethereum":
        case "sei":
        case "hyperliquid":
          return generateEVMWallet(orbId, chainType, client);

        case "solana":
          throw new Error("Solana wallet generation not yet fully implemented");

        default:
          throw new Error(`Unsupported chain type: ${chainType}`);
      }
    },

    async sign(
      orbData: IOrbData,
      transaction: ChainTransaction
    ): Promise<ISignatureResult> {
      validateOrbId(orbData.id);

      switch (orbData.chain) {
        case "icp":
          if (!isICPTransaction(transaction)) {
            throw new Error("Invalid transaction type for ICP");
          }
          return signICPTransaction(orbData.id, transaction, walletAddress, client);

        case "ethereum":
        case "sei":
        case "hyperliquid":
          if (!isEVMTransaction(transaction)) {
            throw new Error(`Invalid transaction type for ${orbData.chain}`);
          }
          if (!orbData.privy_wallet_id) {
            throw new Error(`Privy wallet ID required for ${orbData.chain} transactions`);
          }
          const rawTx = createTransferRequest(orbData.chain, transaction);
          return signEVMTransaction(orbData.id, rawTx, orbData.privy_wallet_id, client);

        case "solana":
          throw new Error("Solana transaction signing not yet implemented");

        default:
          throw new Error(`Unsupported chain type: ${orbData.chain}`);
      }
    },

    async getWalletAddress(orbData: IOrbData): Promise<string> {
      validateOrbId(orbData.id);

      // If address is already cached, return it
      if (orbData.wallet_address) {
        return orbData.wallet_address;
      }

      switch (orbData.chain) {
        case "icp":
          return getICPWalletAddress(orbData.id, walletAddress, client);

        case "ethereum":
        case "sei":
        case "hyperliquid":
        case "solana":
          if (!orbData.privy_wallet_id) {
            throw new Error(`Privy wallet ID required to get ${orbData.chain} address`);
          }
          const wallet = await client.walletApi.getWallet({ id: orbData.privy_wallet_id });
          return wallet.address;

        default:
          throw new Error(`Unsupported chain type: ${orbData.chain}`);
      }
    },

    async transfer(
      orbData: IOrbData,
      transferRequest: ChainTransaction
    ): Promise<ISignatureResult | { transactionIndex: bigint; requestId: string }> {
      validateOrbId(orbData.id);

      switch (orbData.chain) {
        case "icp":
          if (!isICPTransaction(transferRequest)) {
            throw new Error("Invalid transaction type for ICP");
          }
          // For ICP, actually execute the transfer on the network
          return executeICPTransfer(orbData.id, transferRequest, walletAddress, client);

        case "ethereum":
        case "sei":
        case "hyperliquid":
          if (!isEVMTransaction(transferRequest)) {
            throw new Error(`Invalid transaction type for ${orbData.chain}`);
          }
          if (!orbData.privy_wallet_id) {
            throw new Error(`Privy wallet ID required for ${orbData.chain} transfer`);
          }
          const rawTransaction = createTransferRequest(orbData.chain, transferRequest);
          return signEVMTransaction(
            orbData.id,
            rawTransaction,
            orbData.privy_wallet_id,
            client
          );

        case "solana":
          throw new Error("Solana transfers not yet implemented");

        default:
          throw new Error(`Unsupported chain type: ${orbData.chain}`);
      }
    },

    async getBalance(
      orbData: IOrbData,
      tokenAddress?: string,
      subaccount?: Uint8Array
    ): Promise<bigint> {
      validateOrbId(orbData.id);

      switch (orbData.chain) {
        case "icp":
          if (!tokenAddress) {
            throw new Error("Token canister ID required for ICP balance queries");
          }
          return queryICRC1Balance(orbData.id, tokenAddress, walletAddress, client, subaccount);

        case "ethereum":
        case "sei":
        case "hyperliquid":
        case "solana":
          throw new Error(`Balance queries not yet implemented for ${orbData.chain}`);

        default:
          throw new Error(`Unsupported chain type: ${orbData.chain}`);
      }
    },
  };
}

// Type guards
function isICPTransaction(
  transaction: ChainTransaction
): transaction is IICPTransferRequest {
  return "canisterId" in transaction && "fromOrbId" in transaction;
}

function isEVMTransaction(
  transaction: ChainTransaction
): transaction is IEVMTransferRequest {
  return "chainId" in transaction && "to" in transaction && "type" in transaction;
}

export const walletService = createWalletService();
