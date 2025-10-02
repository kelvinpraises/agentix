import { RpcTarget, newHttpBatchRpcSession } from "capnweb";

interface StorageConfig {
  orbId?: number;
  sectorId?: number;
  chain?: string;
  providerId: string;
  scope: "isolated" | "network";
}

interface StorageRpcApi extends RpcTarget {
  getIsolatedStorage(params: { orbId: number; providerId: string }): Promise<string>;
  setIsolatedStorage(params: {
    orbId: number;
    providerId: string;
    data: any;
  }): Promise<void>;
  deleteIsolatedStorage(params: { orbId: number; providerId: string }): Promise<void>;
  getNetworkStorage(params: {
    sectorId: number;
    chain: string;
    providerId: string;
  }): Promise<string>;
  setNetworkStorage(params: {
    sectorId: number;
    chain: string;
    providerId: string;
    data: any;
  }): Promise<void>;
  deleteNetworkStorage(params: {
    sectorId: number;
    chain: string;
    providerId: string;
  }): Promise<void>;
}

export class StorageExtension {
  #config: StorageConfig;
  #rpcUrl: string;

  constructor(config: StorageConfig, rpcUrl = "http://localhost:4848/rpc") {
    this.#config = config;
    this.#rpcUrl = rpcUrl;

    // Validate scoping requirements
    if (config.scope === "isolated" && !config.orbId) {
      throw new Error("Isolated storage requires orbId");
    }
    if (config.scope === "network" && (!config.sectorId || !config.chain)) {
      throw new Error("Network storage requires sectorId and chain");
    }
  }

  async get(): Promise<string> {
    const batch = newHttpBatchRpcSession<StorageRpcApi>(this.#rpcUrl);

    if (this.#config.scope === "isolated") {
      return await batch.getIsolatedStorage({
        orbId: this.#config.orbId!,
        providerId: this.#config.providerId,
      });
    } else {
      return await batch.getNetworkStorage({
        sectorId: this.#config.sectorId!,
        chain: this.#config.chain!,
        providerId: this.#config.providerId,
      });
    }
  }

  async set(data: string): Promise<void> {
    const batch = newHttpBatchRpcSession<StorageRpcApi>(this.#rpcUrl);

    if (this.#config.scope === "isolated") {
      await batch.setIsolatedStorage({
        orbId: this.#config.orbId!,
        providerId: this.#config.providerId,
        data,
      });
    } else {
      await batch.setNetworkStorage({
        sectorId: this.#config.sectorId!,
        chain: this.#config.chain!,
        providerId: this.#config.providerId,
        data,
      });
    }
  }

  async delete(): Promise<void> {
    const batch = newHttpBatchRpcSession<StorageRpcApi>(this.#rpcUrl);

    if (this.#config.scope === "isolated") {
      await batch.deleteIsolatedStorage({
        orbId: this.#config.orbId!,
        providerId: this.#config.providerId,
      });
    } else {
      await batch.deleteNetworkStorage({
        sectorId: this.#config.sectorId!,
        chain: this.#config.chain!,
        providerId: this.#config.providerId,
      });
    }
  }
}
