import z from "zod";

import { ChainType } from "@/types/orb";

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

// Principal string for ICP, e.g. aaaaa-aa
export const ZPrincipalStr = z.string().regex(/^[0-9a-zA-Z]{1,5}(\-[0-9a-zA-Z]{1,5})*$/);

// ICRC-1 subaccount
export const ZICRC1Subaccount = z.instanceof(Uint8Array);

// ICRC-1 account structure
export type IICRC1Account = z.infer<typeof ZICRC1Account>;
export const ZICRC1Account = z.object({
  owner: ZPrincipalStr,
  subaccount: z.optional(ZICRC1Subaccount),
});

// ICRC-1 transfer arguments (Candid format)
export type IICRC1TransferArgs = z.infer<typeof ZICRC1TransferArgs>;
export const ZICRC1TransferArgs = z.object({
  from_subaccount: z.union([z.array(z.never()), z.tuple([ZICRC1Subaccount])]), // [] | [Uint8Array]
  to: z.object({
    owner: ZPrincipalStr,
    subaccount: z.union([z.array(z.never()), z.tuple([ZICRC1Subaccount])]), // [] | [Uint8Array]
  }),
  amount: z.bigint().nonnegative(),
  fee: z.union([z.array(z.never()), z.tuple([z.bigint().nonnegative()])]), // [] | [bigint]
  memo: z.union([z.array(z.never()), z.tuple([ZICRC1Subaccount])]), // [] | [Uint8Array]
  created_at_time: z.union([z.array(z.never()), z.tuple([z.bigint().nonnegative()])]), // [] | [bigint]
});

// ICP transfer request for our service
export type IICPTransferRequest = z.infer<typeof ZICPTransferRequest>;
export const ZICPTransferRequest = z.object({
  fromOrbId: z.string().min(1),
  toAddress: ZPrincipalStr,
  canisterId: ZPrincipalStr,
  amount: z.bigint().nonnegative(),
  fee: z.optional(z.bigint().nonnegative()),
  memo: z.optional(ZICRC1Subaccount),
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
  chain: z.enum(["icp", "sei", "hyperliquid", "ethereum", "solana"] as const),
  wallet_address: z.optional(z.nullable(z.string())),
  privy_wallet_id: z.optional(z.string()),
});


export interface WalletError extends Error {
  code: string;
  chainType: ChainType;
  orbId: string;
}
