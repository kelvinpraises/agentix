import {
  createTransferRequest,
  generateEVMWallet,
  signEVMTransaction,
} from "@/services/system/wallet/chains/evm/evm-wallet";
import { validateOrbId } from "@/services/system/wallet/shared/providers/base-provider";
import { createPrivyClient } from "@/services/system/wallet/shared/providers/privy-provider";
import { ChainTransaction, isEVMTransaction } from "@/services/system/wallet/shared/utils";
import { IOrbData, ISignatureResult, IWalletGenerationResult } from "@/types/wallet";

const client = createPrivyClient();

export const walletService = {
  async generateWallet(orbData: IOrbData): Promise<IWalletGenerationResult> {
    validateOrbId(orbData.id);

    switch (orbData.chain) {
      case "paper":
        // Paper wallets are simple identifiers
        // Network infra threads handle balance/state via storage
        return {
          address: `paper_orb_${orbData.id}`,
          chainType: "paper",
          publicKey: `paper_orb_${orbData.id}`,
        };

      case "ethereum":
      case "sei":
      case "hyperliquid":
        return generateEVMWallet(orbData.id, orbData.chain, client);

      case "solana":
        throw new Error("Solana wallet generation not yet fully implemented");

      default:
        throw new Error(`Unsupported chain type: ${orbData.chain}`);
    }
  },

  async sign(orbData: IOrbData, transaction: ChainTransaction): Promise<ISignatureResult> {
    validateOrbId(orbData.id);

    switch (orbData.chain) {
      case "paper":
        // Paper transactions are handled by network infra threads
        throw new Error(
          "Paper transactions should be handled by network infra threads, not wallet service"
        );

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

    switch (orbData.chain) {
      case "paper":
        return `paper_orb_${orbData.id}`;

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
  ): Promise<ISignatureResult> {
    validateOrbId(orbData.id);

    switch (orbData.chain) {
      case "paper":
        // Paper transfers are handled by network infra threads
        throw new Error(
          "Paper transfers should be handled by network infra threads, not wallet service"
        );

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

  async getBalance(orbData: IOrbData, tokenAddress?: string): Promise<bigint> {
    validateOrbId(orbData.id);

    switch (orbData.chain) {
      case "paper":
        // Paper balances are managed by network infra threads via storage
        throw new Error(
          "Paper balances should be queried from network infra thread storage, not wallet service"
        );

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
