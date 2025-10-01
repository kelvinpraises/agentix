// Internal implementation of wallet extension
// Uses Cap'n Web RPC to communicate with Agentix wallet service

import { RpcTarget, newHttpBatchRpcSession } from 'capnweb';

interface WalletConfig {
  orbId: number;
  sectorId: number;
  chain: string;
}

interface WalletRpcApi extends RpcTarget {
  wallet: {
    getAddress(config: WalletConfig): Promise<{ address: string }>;
    getBalance(config: WalletConfig & { tokenAddress?: string }): Promise<string | number>;
    sendTransaction(config: WalletConfig & { transaction: any }): Promise<string>;
    signTransaction(config: WalletConfig & { transaction: any }): Promise<string>;
    signMessage(config: WalletConfig & { message: string }): Promise<string>;
  };
}

export class WalletExtension {
  #config: WalletConfig;
  #rpcUrl: string;

  constructor(config: WalletConfig, rpcUrl = 'http://localhost:4848/rpc') {
    this.#config = config;
    this.#rpcUrl = rpcUrl;
  }

  /**
   * Get wallet address for this orb
   */
  async getAddress(): Promise<string> {
    const batch = newHttpBatchRpcSession<WalletRpcApi>(this.#rpcUrl);
    const result = await batch.wallet.getAddress(this.#config);
    return result.address;
  }

  /**
   * Get wallet balance
   * For EVM chains, returns Wei (string)
   * For Solana, returns lamports (number)
   */
  async getBalance(): Promise<string | number> {
    const batch = newHttpBatchRpcSession<WalletRpcApi>(this.#rpcUrl);
    return await batch.wallet.getBalance(this.#config);
  }

  /**
   * Get token balance for specific token
   * @param tokenAddress - Token contract address or mint address
   */
  async getTokenBalance(tokenAddress: string): Promise<string | number> {
    const batch = newHttpBatchRpcSession<WalletRpcApi>(this.#rpcUrl);
    return await batch.wallet.getBalance({
      ...this.#config,
      tokenAddress,
    });
  }

  /**
   * Sign and send transaction
   * @param transaction - Chain-specific transaction object
   */
  async sendTransaction(transaction: any): Promise<string> {
    const batch = newHttpBatchRpcSession<WalletRpcApi>(this.#rpcUrl);
    return await batch.wallet.sendTransaction({
      ...this.#config,
      transaction,
    });
  }

  /**
   * Sign transaction without sending
   * @param transaction - Chain-specific transaction object
   */
  async signTransaction(transaction: any): Promise<string> {
    const batch = newHttpBatchRpcSession<WalletRpcApi>(this.#rpcUrl);
    return await batch.wallet.signTransaction({
      ...this.#config,
      transaction,
    });
  }

  /**
   * Sign message
   * @param message - Message to sign
   */
  async signMessage(message: string): Promise<string> {
    const batch = newHttpBatchRpcSession<WalletRpcApi>(this.#rpcUrl);
    return await batch.wallet.signMessage({
      ...this.#config,
      message,
    });
  }
}
