import { db } from "@/infrastructure/database/turso-connection";
import { NewOrb, OrbUpdate } from "@/models/Orb";
import { PolicyUpdate } from "@/models/Policy";
import { NewSector, SectorUpdate } from "@/models/Sector";
import { NewThread, ThreadUpdate } from "@/models/Thread";
import { ChainType, ThreadType } from "@/types/orb";
import { PolicyDocument } from "@/types/policy";

// TypeScript interfaces for getUserTradespace return type
interface TradespaceThread {
  id: number;
  type: ThreadType;
  provider: string;
  enabled: boolean;
  config_json: Record<string, any>;
}

interface TradespaceOrb {
  id: number;
  name: string;
  chain: ChainType;
  wallet_address: string | null;
  asset_pairs: Record<string, number> | null;
  config_json: Record<string, any> | null;
  threads: TradespaceThread[];
}

interface TradespaceSector {
  id: number;
  name: string;
  type: "live_trading" | "paper_trading";
  settings: Record<string, any> | null;
  created_at: Date;
  orbs: TradespaceOrb[];
}

interface UserTradespace {
  id: number;
  email: string;
  created_at: Date;
  updated_at: Date | null;
  password_hash: string;
  sectors: TradespaceSector[];
}

export const tradespaceService = {
  // ==================== SECTOR OPERATIONS ====================

  async getUserSectors(userId: number) {
    return await db
      .selectFrom("sectors")
      .selectAll()
      .where("user_id", "=", userId)
      .orderBy("created_at", "desc")
      .execute();
  },

  async getSectorById(sectorId: number, userId: number) {
    return await db
      .selectFrom("sectors")
      .selectAll()
      .where("id", "=", sectorId)
      .where("user_id", "=", userId)
      .executeTakeFirst();
  },

  async createSector(userId: number, sectorData: Omit<NewSector, "user_id">) {
    const newSector: NewSector = {
      ...sectorData,
      user_id: userId,
    };

    return await db
      .insertInto("sectors")
      .values(newSector)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async updateSector(sectorId: number, userId: number, updates: SectorUpdate) {
    // Verify ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    const updateData: SectorUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    return await db
      .updateTable("sectors")
      .set(updateData)
      .where("id", "=", sectorId)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async deleteSector(sectorId: number, userId: number) {
    // Verify ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    await db.deleteFrom("sectors").where("id", "=", sectorId).execute();
  },

  // ==================== ORB OPERATIONS ====================

  async getOrbsBySector(sectorId: number, userId: number) {
    // Verify sector ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    return await db
      .selectFrom("orbs")
      .selectAll()
      .where("sector_id", "=", sectorId)
      .orderBy("created_at", "desc")
      .execute();
  },

  async getOrbById(orbId: number, userId: number) {
    return await db
      .selectFrom("orbs")
      .innerJoin("sectors", "orbs.sector_id", "sectors.id")
      .selectAll("orbs")
      .where("orbs.id", "=", orbId)
      .where("sectors.user_id", "=", userId)
      .executeTakeFirst();
  },

  async getOrbWithThreads(orbId: number, userId: number) {
    const orb = await this.getOrbById(orbId, userId);
    if (!orb) {
      return null;
    }

    const threads = await db
      .selectFrom("threads")
      .selectAll()
      .where("orb_id", "=", orbId)
      .execute();

    return { ...orb, threads };
  },

  async createOrb(
    userId: number,
    orbData: {
      sector_id: number;
      name: string;
      chain: ChainType;
      wallet_address?: string;
      asset_pairs?: Record<string, number>;
      config_json?: Record<string, any>;
    }
  ) {
    // Verify sector ownership
    const sector = await this.getSectorById(orbData.sector_id, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    const newOrb: NewOrb = {
      sector_id: orbData.sector_id,
      name: orbData.name,
      chain: orbData.chain,
      wallet_address: orbData.wallet_address || null,
      asset_pairs: orbData.asset_pairs ? JSON.stringify(orbData.asset_pairs) : "{}",
      config_json: orbData.config_json ? JSON.stringify(orbData.config_json) : "{}",
    };

    return await db
      .insertInto("orbs")
      .values(newOrb)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async updateOrb(
    orbId: number,
    userId: number,
    updates: {
      name?: string;
      wallet_address?: string;
      asset_pairs?: Record<string, number>;
      config_json?: Record<string, any>;
    }
  ) {
    // Verify ownership through sector
    const orb = await this.getOrbById(orbId, userId);
    if (!orb) {
      throw new Error("Orb not found");
    }

    const { asset_pairs, config_json, ...otherUpdates } = updates;
    const updateData: OrbUpdate = {
      ...otherUpdates,
      ...(asset_pairs && { asset_pairs: JSON.stringify(asset_pairs) }),
      ...(config_json && { config_json: JSON.stringify(config_json) }),
      updated_at: new Date().toISOString(),
    };

    return await db
      .updateTable("orbs")
      .set(updateData)
      .where("id", "=", orbId)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async deleteOrb(orbId: number, userId: number) {
    // Verify ownership through sector
    const orb = await this.getOrbById(orbId, userId);
    if (!orb) {
      throw new Error("Orb not found");
    }

    await db.deleteFrom("orbs").where("id", "=", orbId).execute();
  },

  // ==================== THREAD OPERATIONS ====================

  async getThreadsByOrb(orbId: number, userId: number) {
    // Verify orb ownership
    const orb = await this.getOrbById(orbId, userId);
    if (!orb) {
      throw new Error("Orb not found");
    }

    return await db
      .selectFrom("threads")
      .selectAll()
      .where("orb_id", "=", orbId)
      .orderBy("created_at", "desc")
      .execute();
  },

  async getThreadById(threadId: number, userId: number) {
    return await db
      .selectFrom("threads")
      .innerJoin("orbs", "threads.orb_id", "orbs.id")
      .innerJoin("sectors", "orbs.sector_id", "sectors.id")
      .selectAll("threads")
      .where("threads.id", "=", threadId)
      .where("sectors.user_id", "=", userId)
      .executeTakeFirst();
  },

  async createThread(
    userId: number,
    threadData: {
      orb_id: number;
      type: ThreadType;
      provider: string;
      enabled?: boolean;
      config_json?: Record<string, any>;
    }
  ) {
    // Verify orb ownership
    const orb = await this.getOrbById(threadData.orb_id, userId);
    if (!orb) {
      throw new Error("Orb not found");
    }

    const newThread: NewThread = {
      orb_id: threadData.orb_id,
      type: threadData.type,
      provider: threadData.provider,
      enabled: threadData.enabled ?? true,
      config_json: threadData.config_json ? JSON.stringify(threadData.config_json) : "{}",
    };

    return await db
      .insertInto("threads")
      .values(newThread)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async updateThread(
    threadId: number,
    userId: number,
    updates: {
      provider?: string;
      enabled?: boolean;
      config_json?: Record<string, any>;
    }
  ) {
    // Verify ownership through orb->sector
    const thread = await this.getThreadById(threadId, userId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    const { config_json, ...otherUpdates } = updates;
    const updateData: ThreadUpdate = {
      ...otherUpdates,
      ...(config_json && { config_json: JSON.stringify(config_json) }),
      updated_at: new Date().toISOString(),
    };

    return await db
      .updateTable("threads")
      .set(updateData)
      .where("id", "=", threadId)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async deleteThread(threadId: number, userId: number) {
    // Verify ownership through orb->sector
    const thread = await this.getThreadById(threadId, userId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    await db.deleteFrom("threads").where("id", "=", threadId).execute();
  },

  // ==================== POLICY OPERATIONS ====================

  async getSectorPolicy(sectorId: number, userId: number) {
    // Verify sector ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    return await db
      .selectFrom("sector_policies")
      .where("sector_id", "=", sectorId)
      .where("is_active", "=", true)
      .selectAll()
      .executeTakeFirst();
  },

  async getSectorPolicyByVersion(sectorId: number, userId: number, version: number) {
    // Verify sector ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    return await db
      .selectFrom("sector_policies")
      .where("sector_id", "=", sectorId)
      .where("version", "=", version)
      .selectAll()
      .executeTakeFirst();
  },

  async createSectorPolicy(
    sectorId: number,
    userId: number,
    policyDocument: PolicyDocument,
    aiCritique?: string
  ) {
    // Verify sector ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    const maxVersionResult = await db
      .selectFrom("sector_policies")
      .where("sector_id", "=", sectorId)
      .select(db.fn.max("version").as("max_version"))
      .executeTakeFirst();

    const nextVersion = (maxVersionResult?.max_version || 0) + 1;

    // Deactivate current active policy
    await db
      .updateTable("sector_policies")
      .set({ is_active: false })
      .where("sector_id", "=", sectorId)
      .where("is_active", "=", true)
      .execute();

    // Create new policy version
    const newPolicy = await db
      .insertInto("sector_policies")
      .values({
        sector_id: sectorId,
        policy_document: JSON.stringify(policyDocument),
        version: nextVersion,
        is_active: true,
        ai_critique: aiCritique || null,
      })
      .returningAll()
      .executeTakeFirst();

    // Update sector to reference this policy version
    if (newPolicy) {
      await db
        .updateTable("sectors")
        .set({ active_policy_version: nextVersion })
        .where("id", "=", sectorId)
        .execute();
    }

    return newPolicy;
  },

  async updateSectorPolicy(sectorId: number, userId: number, policyUpdate: PolicyUpdate) {
    // Verify sector ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    return await db
      .updateTable("sector_policies")
      .set(policyUpdate)
      .where("sector_id", "=", sectorId)
      .where("is_active", "=", true)
      .execute();
  },

  async getSectorPolicyHistory(sectorId: number, userId: number) {
    // Verify sector ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    return await db
      .selectFrom("sector_policies")
      .where("sector_id", "=", sectorId)
      .orderBy("version", "desc")
      .selectAll()
      .execute();
  },

  async activatePolicyVersion(sectorId: number, userId: number, version: number) {
    // Verify sector ownership
    const sector = await this.getSectorById(sectorId, userId);
    if (!sector) {
      throw new Error("Sector not found");
    }

    // Deactivate current active policy
    await db
      .updateTable("sector_policies")
      .set({ is_active: false })
      .where("sector_id", "=", sectorId)
      .where("is_active", "=", true)
      .execute();

    // Activate specified version
    await db
      .updateTable("sector_policies")
      .set({ is_active: true })
      .where("sector_id", "=", sectorId)
      .where("version", "=", version)
      .execute();

    // Update sector to reference this policy version
    await db
      .updateTable("sectors")
      .set({ active_policy_version: version })
      .where("id", "=", sectorId)
      .execute();

    return await this.getSectorPolicyByVersion(sectorId, userId, version);
  },

  // ==================== COMPLEX QUERIES ====================

  async getUserTradespace(userId: number): Promise<UserTradespace | null> {
    // Get user first
    const user = await db
      .selectFrom("users")
      .where("id", "=", userId)
      .selectAll()
      .executeTakeFirst();

    if (!user) return null;

    // Get user's sectors using existing method
    const sectors = await this.getUserSectors(userId);

    // For each sector, get its orbs with threads using existing methods
    const sectorsWithOrbs: TradespaceSector[] = await Promise.all(
      sectors.map(async (sector) => {
        const orbs = await this.getOrbsBySector(sector.id, userId);

        // For each orb, get its threads using existing method
        const orbsWithThreads: TradespaceOrb[] = await Promise.all(
          orbs.map(async (orb) => {
            const threads = await this.getThreadsByOrb(orb.id, userId);

            return {
              id: orb.id,
              name: orb.name,
              chain: orb.chain,
              wallet_address: orb.wallet_address,
              asset_pairs: orb.asset_pairs,
              config_json: orb.config_json,
              threads: threads.map((thread) => ({
                id: thread.id,
                type: thread.type,
                provider: thread.provider,
                enabled: thread.enabled,
                config_json: thread.config_json,
              })),
            };
          })
        );

        return {
          id: sector.id,
          name: sector.name,
          type: sector.type,
          settings: sector.settings,
          created_at: sector.created_at,
          orbs: orbsWithThreads,
        };
      })
    );

    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      password_hash: user.password_hash,
      sectors: sectorsWithOrbs,
    };
  },
};
