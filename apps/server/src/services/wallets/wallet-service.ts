import { PrivyClient } from "@privy-io/server-auth";

import {
  createTransferRequest,
  generateEVMWallet,
  signEVMTransaction,
} from "@/services/wallets/chains/evm/evm-wallet";
import {
  executeICPTransfer,
  generateICPWallet,
  getICPWalletAddress,
  queryICRC1Balance,
  signICPTransaction,
} from "@/services/wallets/chains/icp/icp-wallet";
import {
  depositPaperAssets,
  executePaperTransfer,
  generatePaperWallet,
  getPaperWalletAddress,
  queryPaperBalance,
  signPaperTransaction,
} from "@/services/wallets/chains/paper/paper-wallet";
import { validateOrbId } from "@/services/wallets/shared/providers/base-provider";
import { createPrivyClient } from "@/services/wallets/shared/providers/privy-provider";
import {
  ChainTransaction,
  isEVMTransaction,
  isICPTransaction,
  isPaperTransaction,
  transformOrbDataForPaperTrading,
} from "@/services/wallets/shared/utils";
import {
  IOrbData,
  ISignatureResult,
  IWalletGenerationResult,
  PaperDepositRequest,
} from "@/types/wallet";

function createWalletService(privyClient?: PrivyClient, privyWalletAddress?: string) {
  const client = privyClient || createPrivyClient();
  const walletAddress = privyWalletAddress || "default-privy-wallet";

  return {
    async generateWallet(orbData: IOrbData): Promise<IWalletGenerationResult> {
      validateOrbId(orbData.id);

      const { transformedOrbData, targetChain } = transformOrbDataForPaperTrading(orbData);

      switch (transformedOrbData.chain) {
        case "paper":
          return generatePaperWallet(orbData.id, targetChain!);

        case "icp":
          return generateICPWallet(orbData.id, walletAddress, client);

        case "ethereum":
        case "sei":
        case "hyperliquid":
          return generateEVMWallet(orbData.id, transformedOrbData.chain, client);

        case "solana":
          throw new Error("Solana wallet generation not yet fully implemented");

        default:
          throw new Error(`Unsupported chain type: ${transformedOrbData.chain}`);
      }
    },

    async sign(
      orbData: IOrbData,
      transaction: ChainTransaction
    ): Promise<ISignatureResult> {
      validateOrbId(orbData.id);

      const { transformedOrbData, targetChain } = transformOrbDataForPaperTrading(orbData);

      switch (transformedOrbData.chain) {
        case "paper":
          return signPaperTransaction(orbData.id, transaction, targetChain!);

        case "icp":
          if (!isICPTransaction(transaction)) {
            throw new Error("Invalid transaction type for ICP");
          }
          return signICPTransaction(orbData.id, transaction, walletAddress, client);

        case "ethereum":
        case "sei":
        case "hyperliquid":
          if (!isEVMTransaction(transaction)) {
            throw new Error(`Invalid transaction type for ${transformedOrbData.chain}`);
          }
          if (!orbData.privy_wallet_id) {
            throw new Error(
              `Privy wallet ID required for ${transformedOrbData.chain} transactions`
            );
          }
          const rawTx = createTransferRequest(transformedOrbData.chain, transaction);
          return signEVMTransaction(orbData.id, rawTx, orbData.privy_wallet_id, client);

        case "solana":
          throw new Error("Solana transaction signing not yet implemented");

        default:
          throw new Error(`Unsupported chain type: ${transformedOrbData.chain}`);
      }
    },

    async getWalletAddress(orbData: IOrbData): Promise<string> {
      validateOrbId(orbData.id);

      const { transformedOrbData, targetChain } = transformOrbDataForPaperTrading(orbData);

      // If address is already cached, return it (except for paper wallets)
      if (orbData.wallet_address && transformedOrbData.chain !== "paper") {
        return orbData.wallet_address;
      }

      switch (transformedOrbData.chain) {
        case "paper":
          return getPaperWalletAddress(orbData.id, targetChain!);

        case "icp":
          return getICPWalletAddress(orbData.id, walletAddress, client);

        case "ethereum":
        case "sei":
        case "hyperliquid":
        case "solana":
          if (!orbData.privy_wallet_id) {
            throw new Error(
              `Privy wallet ID required to get ${transformedOrbData.chain} address`
            );
          }
          const wallet = await client.walletApi.getWallet({ id: orbData.privy_wallet_id });
          return wallet.address;

        default:
          throw new Error(`Unsupported chain type: ${transformedOrbData.chain}`);
      }
    },

    async transfer(
      orbData: IOrbData,
      transferRequest: ChainTransaction
    ): Promise<ISignatureResult | { transactionIndex: bigint; requestId: string }> {
      validateOrbId(orbData.id);

      const { transformedOrbData, targetChain } = transformOrbDataForPaperTrading(orbData);

      switch (transformedOrbData.chain) {
        case "paper":
          if (!isPaperTransaction(transferRequest)) {
            throw new Error("Invalid transaction type for paper trading");
          }
          return executePaperTransfer(orbData.id, transferRequest);

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
            throw new Error(`Invalid transaction type for ${transformedOrbData.chain}`);
          }
          if (!orbData.privy_wallet_id) {
            throw new Error(
              `Privy wallet ID required for ${transformedOrbData.chain} transfer`
            );
          }
          const rawTransaction = createTransferRequest(
            transformedOrbData.chain,
            transferRequest
          );
          return signEVMTransaction(
            orbData.id,
            rawTransaction,
            orbData.privy_wallet_id,
            client
          );

        case "solana":
          throw new Error("Solana transfers not yet implemented");

        default:
          throw new Error(`Unsupported chain type: ${transformedOrbData.chain}`);
      }
    },

    async getBalance(
      orbData: IOrbData,
      tokenAddress?: string,
      subaccount?: Uint8Array
    ): Promise<bigint> {
      validateOrbId(orbData.id);

      const { transformedOrbData, targetChain } = transformOrbDataForPaperTrading(orbData);

      switch (transformedOrbData.chain) {
        case "paper":
          if (!tokenAddress) {
            throw new Error("Asset symbol required for paper wallet balance queries");
          }
          const balance = await queryPaperBalance(orbData.id, tokenAddress);
          return BigInt(balance);

        case "icp":
          if (!tokenAddress) {
            throw new Error("Token canister ID required for ICP balance queries");
          }
          return queryICRC1Balance(
            orbData.id,
            tokenAddress,
            walletAddress,
            client,
            subaccount
          );

        case "ethereum":
        case "sei":
        case "hyperliquid":
        case "solana":
          throw new Error(
            `Balance queries not yet implemented for ${transformedOrbData.chain}`
          );

        default:
          throw new Error(`Unsupported chain type: ${transformedOrbData.chain}`);
      }
    },

    async deposit(orbData: IOrbData, request: PaperDepositRequest): Promise<void> {
      validateOrbId(orbData.id);

      if (orbData.sectorType !== "paper_trading") {
        throw new Error("Deposit method only available for paper trading sectors");
      }

      return depositPaperAssets(orbData.id, request);
    },
  };
}

export const walletService = createWalletService();
