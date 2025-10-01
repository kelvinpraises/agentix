// Internal implementation of storage extension
// Uses Cap'n Web RPC to communicate with Agentix storage service

import { RpcTarget, newHttpBatchRpcSession } from "capnweb";

interface StorageConfig {
  orbId?: number;
  sectorId?: number;
  chain?: string;
  providerId: string;
  scope: "isolated" | "network";
}

interface StorageRpcApi extends RpcTarget {
  storage: {
    getIsolatedStorage(params: { orbId: number; providerId: string }): Promise<any | null>;
    setIsolatedStorage(params: { orbId: number; providerId: string; data: any }): Promise<void>;
    deleteIsolatedStorage(params: { orbId: number; providerId: string }): Promise<void>;
    getNetworkStorage(params: { sectorId: number; chain: string; providerId: string }): Promise<any | null>;
    setNetworkStorage(params: { sectorId: number; chain: string; providerId: string; data: any }): Promise<void>;
    deleteNetworkStorage(params: { sectorId: number; chain: string; providerId: string }): Promise<void>;
  };
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

  /**
   * Get the entire storage_json for this scoped entity
   * Returns null if no storage exists yet
   */
  async get(): Promise<any | null> {
    const batch = newHttpBatchRpcSession<StorageRpcApi>(this.#rpcUrl);

    if (this.#config.scope === "isolated") {
      return await batch.storage.getIsolatedStorage({
        orbId: this.#config.orbId!,
        providerId: this.#config.providerId,
      });
    } else {
      return await batch.storage.getNetworkStorage({
        sectorId: this.#config.sectorId!,
        chain: this.#config.chain!,
        providerId: this.#config.providerId,
      });
    }
  }

  /**
   * Set the entire storage_json for this scoped entity
   * Replaces any existing data
   */
  async set(data: any): Promise<void> {
    const batch = newHttpBatchRpcSession<StorageRpcApi>(this.#rpcUrl);

    if (this.#config.scope === "isolated") {
      await batch.storage.setIsolatedStorage({
        orbId: this.#config.orbId!,
        providerId: this.#config.providerId,
        data,
      });
    } else {
      await batch.storage.setNetworkStorage({
        sectorId: this.#config.sectorId!,
        chain: this.#config.chain!,
        providerId: this.#config.providerId,
        data,
      });
    }
  }

  /**
   * Delete storage for this scoped entity
   */
  async delete(): Promise<void> {
    const batch = newHttpBatchRpcSession<StorageRpcApi>(this.#rpcUrl);

    if (this.#config.scope === "isolated") {
      await batch.storage.deleteIsolatedStorage({
        orbId: this.#config.orbId!,
        providerId: this.#config.providerId,
      });
    } else {
      await batch.storage.deleteNetworkStorage({
        sectorId: this.#config.sectorId!,
        chain: this.#config.chain!,
        providerId: this.#config.providerId,
      });
    }
  }
}
