import { ChainType } from "@/types/orb";
import { IEVMTransferRequest, IOrbData, PaperTransferRequest } from "@/types/wallet";

export type ChainTransaction = IEVMTransferRequest | PaperTransferRequest;

// Middleware function to transform orbData for paper trading
export function transformOrbDataForPaperTrading(orbData: IOrbData): {
  transformedOrbData: IOrbData;
  targetChain: ChainType;
} {
  const targetChain = orbData.chain as ChainType;

  if (orbData.sectorType === "paper_trading") {
    const transformedOrbData: IOrbData = {
      ...orbData,
      chain: "paper",
    };
    return { transformedOrbData, targetChain };
  }
  return { transformedOrbData: orbData, targetChain };
}

export function isEVMTransaction(
  transaction: ChainTransaction
): transaction is IEVMTransferRequest {
  return "chainId" in transaction && "to" in transaction && "type" in transaction;
}

export function isPaperTransaction(
  transaction: ChainTransaction
): transaction is PaperTransferRequest {
  return (
    "to" in transaction &&
    "asset" in transaction &&
    "amount" in transaction &&
    !("chainId" in transaction) &&
    !("canisterId" in transaction)
  );
}
