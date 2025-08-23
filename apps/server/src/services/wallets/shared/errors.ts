import { ChainType } from "@/types/orb";
import { WalletError } from "@/types/wallet";

export class BaseWalletError extends Error implements WalletError {
  code: string;
  chainType: ChainType;
  orbId: string;

  constructor(message: string, code: string, chainType: ChainType, orbId: string) {
    super(message);
    this.name = "BaseWalletError";
    this.code = code;
    this.chainType = chainType;
    this.orbId = orbId;
  }
}

export class WalletGenerationError extends BaseWalletError {
  constructor(message: string, chainType: ChainType, orbId: string) {
    super(message, "WALLET_GENERATION_ERROR", chainType, orbId);
    this.name = "WalletGenerationError";
  }
}

export class TransactionSigningError extends BaseWalletError {
  constructor(message: string, chainType: ChainType, orbId: string) {
    super(message, "TRANSACTION_SIGNING_ERROR", chainType, orbId);
    this.name = "TransactionSigningError";
  }
}

export class InvalidTransactionError extends BaseWalletError {
  constructor(message: string, chainType: ChainType, orbId: string) {
    super(message, "INVALID_TRANSACTION_ERROR", chainType, orbId);
    this.name = "InvalidTransactionError";
  }
}

export class NetworkError extends BaseWalletError {
  constructor(message: string, chainType: ChainType, orbId: string) {
    super(message, "NETWORK_ERROR", chainType, orbId);
    this.name = "NetworkError";
  }
}
