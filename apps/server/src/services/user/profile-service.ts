import { db } from "@/database/turso-connection";
import { UserUpdate } from "@/models/User";

export const profileService = {
  async getUserProfile(userId: number) {
    return await db
      .selectFrom("users")
      .where("id", "=", userId)
      .selectAll()
      .executeTakeFirst();
  },

  async getUserProfileWithSectors(userId: number) {
    const user = await this.getUserProfile(userId);
    if (!user) return null;

    // Get user's sectors with their orbs and threads
    const sectors = await db
      .selectFrom("sectors")
      .leftJoin("orbs", "orbs.sector_id", "sectors.id")
      .leftJoin("threads", "threads.orb_id", "orbs.id")
      .where("sectors.user_id", "=", userId)
      .select([
        "sectors.id as sector_id",
        "sectors.name as sector_name",
        "sectors.type as sector_type",
        "sectors.settings as sector_settings",
        "sectors.created_at as sector_created_at",
        "orbs.id as orb_id",
        "orbs.name as orb_name",
        "orbs.chain as orb_chain",
        "orbs.wallet_address as orb_wallet_address",
        "orbs.asset_pairs as orb_asset_pairs",
        "orbs.config_json as orb_config_json",
        "threads.id as thread_id",
        "threads.type as thread_type",
        "threads.provider as thread_provider",
        "threads.enabled as thread_enabled",
        "threads.config_json as thread_config_json",
      ])
      .execute();

    // Group the results by sector and orb
    const sectorsMap = new Map();
    
    sectors.forEach((row) => {
      if (!sectorsMap.has(row.sector_id)) {
        sectorsMap.set(row.sector_id, {
          id: row.sector_id,
          name: row.sector_name,
          type: row.sector_type,
          settings: row.sector_settings,
          created_at: row.sector_created_at,
          orbs: new Map(),
        });
      }

      const sector = sectorsMap.get(row.sector_id);
      
      if (row.orb_id && !sector.orbs.has(row.orb_id)) {
        sector.orbs.set(row.orb_id, {
          id: row.orb_id,
          name: row.orb_name,
          chain: row.orb_chain,
          wallet_address: row.orb_wallet_address,
          asset_pairs: row.orb_asset_pairs,
          config_json: row.orb_config_json,
          threads: [],
        });
      }

      if (row.thread_id && row.orb_id) {
        const orb = sector.orbs.get(row.orb_id);
        orb.threads.push({
          id: row.thread_id,
          type: row.thread_type,
          provider: row.thread_provider,
          enabled: row.thread_enabled,
          config_json: row.thread_config_json,
        });
      }
    });

    // Convert maps to arrays
    const sectorsArray = Array.from(sectorsMap.values()).map((sector) => ({
      ...sector,
      orbs: Array.from(sector.orbs.values()),
    }));

    return {
      ...user,
      sectors: sectorsArray,
    };
  },

  async updateUserProfile(userId: number, userUpdate: UserUpdate) {
    return await db.updateTable("users").set(userUpdate).where("id", "=", userId).execute();
  },
};
