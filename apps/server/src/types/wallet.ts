import z from "zod";

import { CHAINS, ChainType } from "@/types/orb";

// Wallet generation result
export type IWalletGenerationResult = z.infer<typeof ZWalletGenerationResult>;
export const ZWalletGenerationResult = z.object({
  address: z.string().min(1),
  publicKey: z.optional(z.string()),
  chainType: z.string(),
});

// Transaction signature result
export type ISignatureResult = z.infer<typeof ZSignatureResult>;
export const ZSignatureResult = z.object({
  signature: z.string().min(1),
  transactionHash: z.optional(z.string()),
  encoding: z.optional(z.string()),
});

// Base EVM transaction properties
const ZBaseEVMTransaction = z.object({
  gasLimit: z.optional(z.string()),
  gasPrice: z.optional(z.string()),
  maxFeePerGas: z.optional(z.string()),
  maxPriorityFeePerGas: z.optional(z.string()),
  chainId: z.number().positive(),
  nonce: z.optional(z.number().nonnegative()),
});

// Native token transfer (ETH, SEI, etc.)
export type INativeTransfer = z.infer<typeof ZNativeTransfer>;
export const ZNativeTransfer = ZBaseEVMTransaction.extend({
  type: z.literal("native"),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/), // recipient address
  value: z.string(), // amount in native token (wei)
});

// ERC-20 token transfer
export type ITokenTransfer = z.infer<typeof ZTokenTransfer>;
export const ZTokenTransfer = ZBaseEVMTransaction.extend({
  type: z.literal("token"),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/), // token contract
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/), // recipient address
  amount: z.string(), // token amount (in token units)
  decimals: z.number().int().min(0).max(77), // Required: token decimals (0-77 is ERC-20 valid range)
  value: z.optional(z.literal("0x0")), // always 0 for token transfers
});

// Unified EVM transfer request
export type IEVMTransferRequest = z.infer<typeof ZEVMTransferRequest>;
export const ZEVMTransferRequest = z.union([ZNativeTransfer, ZTokenTransfer]);

// Raw EVM transaction (for internal use with Privy)
export type IEVMTransactionRequest = z.infer<typeof ZEVMTransactionRequest>;
export const ZEVMTransactionRequest = ZBaseEVMTransaction.extend({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  value: z.optional(z.string()),
  data: z.optional(z.string()),
});

// Orb data interface for wallet operations
export type IOrbData = z.infer<typeof ZOrbData>;
export const ZOrbData = z.object({
  id: z.string().min(1),
  chain: z.enum(CHAINS),
  wallet_address: z.string(),
  privy_wallet_id: z.string(),
  sectorType: z.enum(["live_trading", "paper_trading"]),
});

export interface WalletError extends Error {
  code: string;
  chainType: ChainType;
  orbId: string;
}

// Paper wallet types
export type PaperTransferRequest = z.infer<typeof ZPaperTransferRequest>;
export const ZPaperTransferRequest = z.object({
  to: z.string().min(1),
  asset: z.string().min(1),
  amount: z.string().min(1),
});
