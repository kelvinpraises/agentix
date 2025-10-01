// Internal implementation of wallet extension
// Handles scoped wallet operations via JSON-RPC to Agentix API

interface WalletConfig {
  orbId: number;
  sectorId: number;
  chain: string;
}

interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any[];
  id: number | string;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number | string;
}

export class WalletExtension {
  #config: WalletConfig;
  #rpcUrl: string;
  #requestId: number = 0;

  constructor(config: WalletConfig, apiBaseUrl = "http://localhost:3000") {
    this.#config = config;
    this.#rpcUrl = `${apiBaseUrl}/internal/wallet/rpc`;
  }

  /**
   * Make a JSON-RPC call to the wallet service
   */
  async #rpc(method: string, params?: any[]): Promise<any> {
    this.#requestId++;

    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      method,
      params: [this.#config, ...(params || [])],
      id: this.#requestId,
    };

    const res = await fetch(this.#rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      throw new Error(`Wallet RPC failed: ${res.status} ${await res.text()}`);
    }

    const response: JsonRpcResponse = await res.json();

    if (response.error) {
      throw new Error(`Wallet RPC error: ${response.error.message}`);
    }

    return response.result;
  }

  /**
   * Get wallet address for this orb
   */
  async getAddress(): Promise<string> {
    return this.#rpc("wallet_getAddress");
  }

  /**
   * Get wallet balance
   * For EVM chains, returns Wei (string)
   * For Solana, returns lamports (number)
   */
  async getBalance(): Promise<string | number> {
    return this.#rpc("wallet_getBalance");
  }

  /**
   * Get token balance for specific token
   * @param tokenAddress - Token contract address or mint address
   */
  async getTokenBalance(tokenAddress: string): Promise<string | number> {
    return this.#rpc("wallet_getTokenBalance", [tokenAddress]);
  }

  /**
   * Sign and send transaction
   * @param transaction - Chain-specific transaction object
   */
  async sendTransaction(transaction: any): Promise<string> {
    return this.#rpc("wallet_sendTransaction", [transaction]);
  }

  /**
   * Sign transaction without sending
   * @param transaction - Chain-specific transaction object
   */
  async signTransaction(transaction: any): Promise<string> {
    return this.#rpc("wallet_signTransaction", [transaction]);
  }

  /**
   * Get transaction status
   * @param txHash - Transaction hash
   */
  async getTransaction(txHash: string): Promise<any> {
    return this.#rpc("wallet_getTransaction", [txHash]);
  }

  /**
   * Estimate gas for transaction (EVM only)
   * @param transaction - Transaction object
   */
  async estimateGas(transaction: any): Promise<string> {
    return this.#rpc("wallet_estimateGas", [transaction]);
  }

  /**
   * Get current gas price (EVM only)
   */
  async getGasPrice(): Promise<string> {
    return this.#rpc("wallet_getGasPrice");
  }

  /**
   * Get chain-specific info (block number, slot, etc.)
   */
  async getChainInfo(): Promise<any> {
    return this.#rpc("wallet_getChainInfo");
  }
}
