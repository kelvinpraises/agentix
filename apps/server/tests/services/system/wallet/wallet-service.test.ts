import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  IOrbData,
  IWalletGenerationResult,
  ISignatureResult,
  INativeTransfer,
} from "@/types/wallet";
import { ChainTransaction } from "@/services/system/wallet/shared/utils";

type MockEvmWallet = {
  generateEVMWallet: ReturnType<typeof vi.fn>;
  signEVMTransaction: ReturnType<typeof vi.fn>;
};

type MockPrivyClient = {
  walletApi: {
    getWallet: ReturnType<typeof vi.fn>;
  };
};

type MockSharedUtils = {
  isEVMTransaction: ReturnType<typeof vi.fn>;
};

vi.mock("@/services/system/wallet/chains/evm/evm-wallet", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/services/system/wallet/chains/evm/evm-wallet")
  >();
  return {
    ...actual,
    generateEVMWallet: vi.fn(),
    signEVMTransaction: vi.fn(),
  };
});

vi.mock("@/services/system/wallet/shared/providers/privy-provider", () => {
  const client = {
    walletApi: {
      getWallet: vi.fn(),
    },
  };
  return {
    createPrivyClient: vi.fn(() => client),
  };
});

vi.mock("@/services/system/wallet/shared/utils", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/services/system/wallet/shared/utils")
  >();
  return {
    ...actual,
    isEVMTransaction: vi.fn(),
  };
});

import * as evmWallet from "@/services/system/wallet/chains/evm/evm-wallet";
import * as sharedUtils from "@/services/system/wallet/shared/utils";
import { createPrivyClient } from "@/services/system/wallet/shared/providers/privy-provider";
import { walletService } from "@/services/system/wallet/wallet-service";

const mockEvmWallet = evmWallet as unknown as MockEvmWallet;
const mockSharedUtils = sharedUtils as unknown as MockSharedUtils;
const mockPrivyClientInstance = createPrivyClient() as unknown as MockPrivyClient;

describe("Wallet Service", () => {
  const paperOrb: IOrbData = {
    id: "1",
    chain: "paper",
    wallet_address: "paper_orb_1",
    privy_wallet_id: "N/A",
    sectorType: "paper_trading",
  };

  const ethOrb: IOrbData = {
    id: "2",
    chain: "ethereum",
    wallet_address: "0xETH_ADDRESS",
    privy_wallet_id: "privy-eth-123",
    sectorType: "live_trading",
  };

  const seiOrb: IOrbData = { ...ethOrb, id: "3", chain: "sei" };
  const hyperliquidOrb: IOrbData = { ...ethOrb, id: "4", chain: "hyperliquid" };
  const solanaOrb: IOrbData = { ...ethOrb, id: "5", chain: "solana" };
  const unsupportedOrb: IOrbData = { ...ethOrb, id: "6", chain: "unsupported" as any };

  const mockTx: INativeTransfer = {
    type: "native",
    to: "0x123",
    value: "1",
    chainId: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSharedUtils.isEVMTransaction.mockReturnValue(true);
  });

  describe("generateWallet", () => {
    test.each([
      { id: null, case: "null" },
      { id: undefined, case: "undefined" },
      { id: "", case: "empty string" },
    ])("should throw an error if orbId is $case", async ({ id }) => {
      const invalidOrb = { ...paperOrb, id: id as any };
      await expect(walletService.generateWallet(invalidOrb)).rejects.toThrow(
        `Invalid orbId: ${id}`
      );
    });

    test("should generate a robust paper wallet address", async () => {
      const result = await walletService.generateWallet(paperOrb);
      const expectedAddress = `paper_orb_${paperOrb.id}`;
      expect(result.address).toBe(expectedAddress);
      expect(result.publicKey).toBe(expectedAddress);
    });

    test.each([{ orb: ethOrb }, { orb: seiOrb }, { orb: hyperliquidOrb }])(
      "should delegate to generateEVMWallet for $orb.chain chain and return its result",
      async ({ orb }) => {
        const mockResult: IWalletGenerationResult = {
          address: "0xGENERATED_ADDRESS",
          chainType: orb.chain,
          publicKey: "0xPUBLIC_KEY",
        };
        mockEvmWallet.generateEVMWallet.mockResolvedValue(mockResult);

        const result = await walletService.generateWallet(orb);

        expect(mockEvmWallet.generateEVMWallet).toHaveBeenCalledWith(
          orb.id,
          orb.chain,
          expect.any(Object)
        );
        expect(result).toEqual(mockResult);
      }
    );

    test("should throw error for Solana wallet generation", async () => {
      await expect(walletService.generateWallet(solanaOrb)).rejects.toThrow(
        "Solana wallet generation not yet fully implemented"
      );
    });

    test("should throw an error for unsupported chains", async () => {
      await expect(walletService.generateWallet(unsupportedOrb)).rejects.toThrow(
        `Unsupported chain type: ${unsupportedOrb.chain}`
      );
    });
  });

  describe("sign", () => {
    test("should throw correct error for 'paper' chain", async () => {
      await expect(
        walletService.sign(paperOrb, mockTx as ChainTransaction)
      ).rejects.toThrow(
        "Paper transactions should be handled by network infra threads, not wallet service"
      );
    });

    test("should throw error if privy_wallet_id is missing for EVM chain", async () => {
      const orbNoPrivy = { ...ethOrb, privy_wallet_id: undefined as any };
      await expect(
        walletService.sign(orbNoPrivy, mockTx as ChainTransaction)
      ).rejects.toThrow(`Privy wallet ID required for ${ethOrb.chain} transactions`);
    });

    test("should throw error for non-EVM transaction types", async () => {
      mockSharedUtils.isEVMTransaction.mockReturnValue(false);
      await expect(walletService.sign(ethOrb, mockTx as ChainTransaction)).rejects.toThrow(
        `Invalid transaction type for ${ethOrb.chain}`
      );
    });

    test("should call signEVMTransaction for EVM chains", async () => {
      const signature: ISignatureResult = { signature: "0xSIGNED_TX" };
      mockEvmWallet.signEVMTransaction.mockResolvedValue(signature);

      const result = await walletService.sign(ethOrb, mockTx as ChainTransaction);

      expect(mockEvmWallet.signEVMTransaction).toHaveBeenCalledWith(
        ethOrb.id,
        expect.objectContaining({
          to: mockTx.to,
          value: mockTx.value,
          chainId: 1,
        }),
        ethOrb.privy_wallet_id,
        expect.any(Object)
      );
      expect(result).toEqual(signature);
    });

    test("should throw error for Solana transaction signing", async () => {
      await expect(
        walletService.sign(solanaOrb, mockTx as ChainTransaction)
      ).rejects.toThrow("Solana transaction signing not yet implemented");
    });

    test("should throw an error for unsupported chains", async () => {
      await expect(
        walletService.sign(unsupportedOrb, mockTx as ChainTransaction)
      ).rejects.toThrow(`Unsupported chain type: ${unsupportedOrb.chain}`);
    });
  });

  describe("getWalletAddress", () => {
    test("should return static address for paper chain", async () => {
      const address = await walletService.getWalletAddress(paperOrb);
      expect(address).toBe(paperOrb.wallet_address);
      expect(mockPrivyClientInstance.walletApi.getWallet).not.toHaveBeenCalled();
    });

    test("should throw error if privy_wallet_id is missing for EVM chain", async () => {
      const orbNoPrivy = { ...ethOrb, privy_wallet_id: undefined as any };
      await expect(walletService.getWalletAddress(orbNoPrivy)).rejects.toThrow(
        `Privy wallet ID required to get ${ethOrb.chain} address`
      );
    });

    test("should fetch address from Privy client for EVM chains", async () => {
      const mockWallet = { address: "0xPRIVY_ADDRESS" };
      mockPrivyClientInstance.walletApi.getWallet.mockResolvedValue(mockWallet);

      const address = await walletService.getWalletAddress(ethOrb);

      expect(address).toBe(mockWallet.address);
    });

    test("should throw an error for unsupported chains", async () => {
      await expect(walletService.getWalletAddress(unsupportedOrb)).rejects.toThrow(
        `Unsupported chain type: ${unsupportedOrb.chain}`
      );
    });
  });

  describe("transfer", () => {
    test("should throw correct error for 'paper' chain", async () => {
      await expect(
        walletService.transfer(paperOrb, mockTx as ChainTransaction)
      ).rejects.toThrow(
        "Paper transfers should be handled by network infra threads, not wallet service"
      );
    });

    test("should have dedicated logic, not be an alias for sign", async () => {
      const signature: ISignatureResult = { signature: "0xSIGNED_TX_TRANSFER" };
      mockEvmWallet.signEVMTransaction.mockResolvedValue(signature);

      const result = await walletService.transfer(ethOrb, mockTx as ChainTransaction);

      expect(mockEvmWallet.signEVMTransaction).toHaveBeenCalledWith(
        ethOrb.id,
        expect.objectContaining({
          to: mockTx.to,
          value: mockTx.value,
          chainId: 1,
        }),
        ethOrb.privy_wallet_id,
        expect.any(Object)
      );
      expect(result).toEqual(signature);
    });

    test("should throw error if privy_wallet_id is missing for EVM transfer", async () => {
      const orbNoPrivy = { ...ethOrb, privy_wallet_id: undefined as any };
      await expect(
        walletService.transfer(orbNoPrivy, mockTx as ChainTransaction)
      ).rejects.toThrow(`Privy wallet ID required for ${ethOrb.chain} transfer`);
    });

    test("should throw error for non-EVM transaction types", async () => {
      mockSharedUtils.isEVMTransaction.mockReturnValue(false);
      await expect(
        walletService.transfer(ethOrb, mockTx as ChainTransaction)
      ).rejects.toThrow(`Invalid transaction type for ${ethOrb.chain}`);
    });

    test("should throw error for Solana transfers", async () => {
      await expect(
        walletService.transfer(solanaOrb, mockTx as ChainTransaction)
      ).rejects.toThrow("Solana transfers not yet implemented");
    });

    test("should throw an error for unsupported chains", async () => {
      await expect(
        walletService.transfer(unsupportedOrb, mockTx as ChainTransaction)
      ).rejects.toThrow(`Unsupported chain type: ${unsupportedOrb.chain}`);
    });
  });

  describe("getBalance", () => {
    test("should throw correct error for 'paper' chain", async () => {
      await expect(walletService.getBalance(paperOrb)).rejects.toThrow(
        "Paper balances should be queried from network infra thread storage, not wallet service"
      );
    });

    test("should throw error for EVM chains", async () => {
      await expect(walletService.getBalance(ethOrb)).rejects.toThrow(
        `Balance queries not yet implemented for ${ethOrb.chain}`
      );
    });

    test("should throw an error for unsupported chains", async () => {
      await expect(walletService.getBalance(unsupportedOrb)).rejects.toThrow(
        `Unsupported chain type: ${unsupportedOrb.chain}`
      );
    });
  });
});
