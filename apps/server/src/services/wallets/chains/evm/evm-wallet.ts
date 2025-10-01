import { PrivyClient } from "@privy-io/server-auth";
import {
  defineChain,
  encodeFunctionData,
  erc20Abi,
  parseEther,
  parseUnits,
  type Address,
  type Chain,
} from "viem";
import { mainnet, sei } from "viem/chains";

import {
  TransactionSigningError,
  WalletGenerationError,
} from "@/services/wallets/shared/errors";
import { validateOrbId } from "@/services/wallets/shared/providers/base-provider";
import { getAuthConfig } from "@/services/wallets/shared/providers/privy-provider";
import { ChainType } from "@/types/orb";
import {
  IEVMTransactionRequest,
  IEVMTransferRequest,
  ISignatureResult,
  IWalletGenerationResult,
} from "@/types/wallet";

// Define manually no viem support yet
const hyperliquidEvmMainnet = defineChain({
  id: 999,
  name: "Hyperliquid Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "HYPE",
    symbol: "HYPE",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.hyperliquid.xyz/evm"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hyperliquid Explorer",
      url: "https://hyperliquid.xyz/explorer",
    },
  },
});

const CHAIN_CONFIGS: Record<ChainType, Chain | null> = {
  ethereum: mainnet,
  sei: sei,
  hyperliquid: hyperliquidEvmMainnet,
  paper: null, // Not an EVM chain
  solana: null, // Not an EVM chain
  icp: null, // Not an EVM chain
};

export function getEVMChain(chainType: ChainType): Chain {
  const chain = CHAIN_CONFIGS[chainType];
  if (!chain) {
    throw new Error(`Unsupported EVM chain type: ${chainType}`);
  }
  return chain;
}

export async function generateEVMWallet(
  orbId: string,
  chainType: ChainType,
  privyClient: PrivyClient
): Promise<IWalletGenerationResult> {
  validateOrbId(orbId);

  try {
    const { authKeyId } = getAuthConfig();

    const wallet = await privyClient.walletApi.createWallet({
      chainType: "ethereum",
      owner: {
        publicKey: authKeyId,
      },
    });

    return {
      address: wallet.address,
      chainType,
      publicKey: wallet.id,
    };
  } catch (error) {
    throw new WalletGenerationError(
      `Failed to generate ${chainType} wallet for orb ${orbId}: ${error}`,
      chainType,
      orbId
    );
  }
}

export async function signEVMTransaction(
  orbId: string,
  transaction: IEVMTransactionRequest,
  privyWalletId: string,
  privyClient: PrivyClient
): Promise<ISignatureResult> {
  validateOrbId(orbId);

  try {
    const result = await privyClient.walletApi.ethereum.signTransaction({
      walletId: privyWalletId,
      transaction: {
        to: transaction.to as `0x${string}`,
        value: (transaction.value || "0x0") as `0x${string}`,
        chainId: transaction.chainId,
        data: transaction.data as `0x${string}` | undefined,
        gasLimit: transaction.gasLimit as `0x${string}` | undefined,
        gasPrice: transaction.gasPrice as `0x${string}` | undefined,
        maxFeePerGas: transaction.maxFeePerGas as `0x${string}` | undefined,
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas as `0x${string}` | undefined,
        nonce: transaction.nonce ? Number(transaction.nonce) : undefined,
      },
    });

    return {
      signature: result.signedTransaction,
      encoding: "rlp",
    };
  } catch (error) {
    throw new TransactionSigningError(
      `Failed to sign EVM transaction for orb ${orbId}: ${error}`,
      "ethereum",
      orbId
    );
  }
}

export async function sendNativeToken(
  orbId: string,
  chainType: ChainType,
  toAddress: Address,
  amount: string, // in ETH/SEI/HYPE units
  privyWalletId: string,
  privyClient: PrivyClient
): Promise<ISignatureResult> {
  validateOrbId(orbId);

  try {
    const chain = getEVMChain(chainType);

    const valueInWei = parseEther(amount);

    const transaction: IEVMTransactionRequest = {
      to: toAddress,
      value: `0x${valueInWei.toString(16)}`,
      chainId: chain.id,
    };

    return await signEVMTransaction(orbId, transaction, privyWalletId, privyClient);
  } catch (error) {
    throw new TransactionSigningError(
      `Failed to send native token for orb ${orbId}: ${error}`,
      chainType,
      orbId
    );
  }
}

export async function sendERC20Token(
  orbId: string,
  chainType: ChainType,
  tokenAddress: Address,
  toAddress: Address,
  amount: string, // in token units
  decimals: number = 18,
  privyWalletId: string,
  privyClient: PrivyClient
): Promise<ISignatureResult> {
  validateOrbId(orbId);

  try {
    const chain = getEVMChain(chainType);

    const amountInUnits = parseUnits(amount, decimals);

    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [toAddress, amountInUnits],
    });

    const transaction: IEVMTransactionRequest = {
      to: tokenAddress,
      value: "0x0",
      data: data,
      chainId: chain.id,
    };

    return await signEVMTransaction(orbId, transaction, privyWalletId, privyClient);
  } catch (error) {
    throw new TransactionSigningError(
      `Failed to send ERC-20 token for orb ${orbId}: ${error}`,
      chainType,
      orbId
    );
  }
}

// Utility function to create a unified transfer request
export function createTransferRequest(
  chainType: ChainType,
  transfer: IEVMTransferRequest
): IEVMTransactionRequest {
  const chain = getEVMChain(chainType);

  if (transfer.type === "native") {
    return {
      to: transfer.to,
      value: transfer.value,
      chainId: chain.id,
      gasLimit: transfer.gasLimit,
      gasPrice: transfer.gasPrice,
      maxFeePerGas: transfer.maxFeePerGas,
      maxPriorityFeePerGas: transfer.maxPriorityFeePerGas,
      nonce: transfer.nonce,
    };
  } else {
    // Never assume decimals - must be explicitly provided
    if (!transfer.decimals && transfer.decimals !== 0) {
      throw new Error('Token decimals must be specified for ERC-20 transfers - never assume 18');
    }
    const amountInUnits = parseUnits(transfer.amount, transfer.decimals);
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [transfer.to as Address, amountInUnits],
    });

    return {
      to: transfer.contractAddress,
      value: "0x0",
      data: data,
      chainId: chain.id,
      gasLimit: transfer.gasLimit,
      gasPrice: transfer.gasPrice,
      maxFeePerGas: transfer.maxFeePerGas,
      maxPriorityFeePerGas: transfer.maxPriorityFeePerGas,
      nonce: transfer.nonce,
    };
  }
}
