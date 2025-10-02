declare module 'agentix-internal:wallet-impl' {
  interface WalletConfig {
    orbId: number;
    sectorId: number;
    chain: string;
  }

  export class WalletExtension {
    constructor(config: WalletConfig, apiBaseUrl?: string);
    getAddress(): Promise<string>;
    getBalance(): Promise<string | number>;
    getTokenBalance(tokenAddress: string): Promise<string | number>;
    sendTransaction(transaction: any): Promise<string>;
    signTransaction(transaction: any): Promise<string>;
    getTransaction(txHash: string): Promise<any>;
    estimateGas(transaction: any): Promise<string>;
    getGasPrice(): Promise<string>;
    getChainInfo(): Promise<any>;
  }
}
