import { RpcTarget } from "capnweb";

import { db } from "@/infrastructure/database/turso-connection";

/**
 * Storage RPC Target
 * Provides thread storage access via Cap'n Web RPC (HTTP batch mode)
 */
export class StorageTarget extends RpcTarget {
  async getIsolatedStorage(config: {
    orbId: number;
    providerId: string;
  }): Promise<any | null> {
    const row = await db
      .selectFrom("thread_isolated_storage")
      .selectAll()
      .where("orb_id", "=", config.orbId)
      .where("provider_id", "=", config.providerId)
      .executeTakeFirst();

    if (!row) return null;

    return row.storage_json;
  }

  async setIsolatedStorage(config: {
    orbId: number;
    providerId: string;
    data: any;
  }): Promise<void> {
    await db
      .insertInto("thread_isolated_storage")
      .values({
        orb_id: config.orbId,
        provider_id: config.providerId,
        storage_json: config.data,
        updated_at: new Date().toISOString(),
      })
      .onConflict((oc) =>
        oc.columns(["orb_id", "provider_id"]).doUpdateSet({
          storage_json: config.data,
          updated_at: new Date().toISOString(),
        })
      )
      .execute();
  }

  async deleteIsolatedStorage(config: {
    orbId: number;
    providerId: string;
  }): Promise<void> {
    await db
      .deleteFrom("thread_isolated_storage")
      .where("orb_id", "=", config.orbId)
      .where("provider_id", "=", config.providerId)
      .execute();
  }

  async getNetworkStorage(config: {
    sectorId: number;
    chain: string;
    providerId: string;
  }): Promise<any | null> {
    const row = await db
      .selectFrom("thread_network_storage")
      .selectAll()
      .where("sector_id", "=", config.sectorId)
      .where("chain", "=", config.chain)
      .where("provider_id", "=", config.providerId)
      .executeTakeFirst();

    if (!row) return null;

    return row.storage_json;
  }

  async setNetworkStorage(config: {
    sectorId: number;
    chain: string;
    providerId: string;
    data: any;
  }): Promise<void> {
    await db
      .insertInto("thread_network_storage")
      .values({
        sector_id: config.sectorId,
        chain: config.chain,
        provider_id: config.providerId,
        storage_json: config.data,
        updated_at: new Date().toISOString(),
      })
      .onConflict((oc) =>
        oc.columns(["sector_id", "chain", "provider_id"]).doUpdateSet({
          storage_json: config.data,
          updated_at: new Date().toISOString(),
        })
      )
      .execute();
  }

  async deleteNetworkStorage(config: {
    sectorId: number;
    chain: string;
    providerId: string;
  }): Promise<void> {
    await db
      .deleteFrom("thread_network_storage")
      .where("sector_id", "=", config.sectorId)
      .where("chain", "=", config.chain)
      .where("provider_id", "=", config.providerId)
      .execute();
  }
}
