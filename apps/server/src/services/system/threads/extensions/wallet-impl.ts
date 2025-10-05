import { RpcTarget, newHttpBatchRpcSession } from "capnweb";

interface WalletConfig {
  orbId: number;
  sectorId: number;
  chain: string;
}

interface WalletRpcApi extends RpcTarget {
  getAddress(config: WalletConfig): Promise<{ address: string }>;
  getBalance(config: WalletConfig & { tokenAddress?: string }): Promise<string | number>;
  sendTransaction(config: WalletConfig & { transaction: any }): Promise<string>;
  signTransaction(config: WalletConfig & { transaction: any }): Promise<string>;
  signMessage(config: WalletConfig & { message: string }): Promise<string>;
}

export class WalletExtension {
  #config: WalletConfig;
  #rpcUrl: string;

  constructor(config: WalletConfig, rpcUrl: string) {
    this.#config = config;
    this.#rpcUrl = rpcUrl;
  }

  async getAddress(): Promise<string> {
    const batch = newHttpBatchRpcSession<WalletRpcApi>(this.#rpcUrl);
    const result = await batch.getAddress(this.#config);
    return result.address;
  }

  async getBalance(): Promise<string | number> {
    const batch = newHttpBatchRpcSession<WalletRpcApi>(this.#rpcUrl);
    return await batch.getBalance(this.#config);
  }

  async getTokenBalance(tokenAddress: string): Promise<string | number> {
    const batch = newHttpBatchRpcSession<WalletRpcApi>(this.#rpcUrl);
    return await batch.getBalance({
      ...this.#config,
      tokenAddress,
    });
  }

  async sendTransaction(transaction: any): Promise<string> {
    const batch = newHttpBatchRpcSession<WalletRpcApi>(this.#rpcUrl);
    return await batch.sendTransaction({
      ...this.#config,
      transaction,
    });
  }

  async signTransaction(transaction: any): Promise<string> {
    const batch = newHttpBatchRpcSession<WalletRpcApi>(this.#rpcUrl);
    return await batch.signTransaction({
      ...this.#config,
      transaction,
    });
  }

  async signMessage(message: string): Promise<string> {
    const batch = newHttpBatchRpcSession<WalletRpcApi>(this.#rpcUrl);
    return await batch.signMessage({
      ...this.#config,
      message,
    });
  }

  ping() {
    return "echo from WalletExtension";
  }
}
