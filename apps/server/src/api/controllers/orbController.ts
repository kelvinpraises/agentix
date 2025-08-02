import { Request, Response } from "express";
import { db } from "@/database/turso-connection";
import { NewOrb, OrbUpdate } from "@/models/Orb";

interface CreateOrbRequestBody {
  sector_id: number;
  name: string;
  chain: "ethereum" | "solana" | "morph" | "stellar";
  wallet_address?: string;
  asset_pairs?: Record<string, number>;
  config_json?: Record<string, any>;
}

interface UpdateOrbRequestBody {
  name?: string;
  wallet_address?: string;
  asset_pairs?: Record<string, number>;
  config_json?: Record<string, any>;
}

export const orbController = {
  // GET /orbs/:sectorId - Get all orbs for a sector
  async getOrbsBySector(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const sectorId = parseInt(req.params.sectorId);

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify sector belongs to user
      const sector = await db
        .selectFrom("sectors")
        .select("id")
        .where("id", "=", sectorId)
        .where("user_id", "=", userId)
        .executeTakeFirst();

      if (!sector) {
        return res.status(404).json({ error: "Sector not found" });
      }

      const orbs = await db
        .selectFrom("orbs")
        .selectAll()
        .where("sector_id", "=", sectorId)
        .orderBy("created_at", "desc")
        .execute();

      res.json({ orbs });
    } catch (error) {
      console.error("Error fetching orbs:", error);
      res.status(500).json({ error: "Failed to fetch orbs" });
    }
  },

  // GET /orbs/detail/:id - Get specific orb with threads
  async getOrbById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const orbId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get orb with sector ownership verification
      const orb = await db
        .selectFrom("orbs")
        .innerJoin("sectors", "orbs.sector_id", "sectors.id")
        .selectAll("orbs")
        .where("orbs.id", "=", orbId)
        .where("sectors.user_id", "=", userId)
        .executeTakeFirst();

      if (!orb) {
        return res.status(404).json({ error: "Orb not found" });
      }

      // Get threads for this orb
      const threads = await db
        .selectFrom("threads")
        .selectAll()
        .where("orb_id", "=", orbId)
        .execute();

      res.json({ orb: { ...orb, threads } });
    } catch (error) {
      console.error("Error fetching orb:", error);
      res.status(500).json({ error: "Failed to fetch orb" });
    }
  },

  // POST /orbs - Create new orb
  async createOrb(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { sector_id, name, chain, wallet_address, asset_pairs, config_json }: CreateOrbRequestBody = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!sector_id || !name || !chain) {
        return res.status(400).json({ error: "Sector ID, name, and chain are required" });
      }

      // Verify sector belongs to user
      const sector = await db
        .selectFrom("sectors")
        .select("id")
        .where("id", "=", sector_id)
        .where("user_id", "=", userId)
        .executeTakeFirst();

      if (!sector) {
        return res.status(404).json({ error: "Sector not found" });
      }

      const newOrb: NewOrb = {
        sector_id,
        name,
        chain,
        wallet_address: wallet_address || null,
        asset_pairs: asset_pairs || null,
        config_json: config_json || null,
      };

      const result = await db
        .insertInto("orbs")
        .values(newOrb)
        .returningAll()
        .executeTakeFirstOrThrow();

      res.status(201).json({ orb: result });
    } catch (error) {
      console.error("Error creating orb:", error);
      res.status(500).json({ error: "Failed to create orb" });
    }
  },

  // PUT /orbs/:id - Update orb
  async updateOrb(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const orbId = parseInt(req.params.id);
      const updates: UpdateOrbRequestBody = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify orb belongs to user's sector
      const existingOrb = await db
        .selectFrom("orbs")
        .innerJoin("sectors", "orbs.sector_id", "sectors.id")
        .select("orbs.id")
        .where("orbs.id", "=", orbId)
        .where("sectors.user_id", "=", userId)
        .executeTakeFirst();

      if (!existingOrb) {
        return res.status(404).json({ error: "Orb not found" });
      }

      const updateData: OrbUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const result = await db
        .updateTable("orbs")
        .set(updateData)
        .where("id", "=", orbId)
        .returningAll()
        .executeTakeFirstOrThrow();

      res.json({ orb: result });
    } catch (error) {
      console.error("Error updating orb:", error);
      res.status(500).json({ error: "Failed to update orb" });
    }
  },

  // DELETE /orbs/:id - Delete orb
  async deleteOrb(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const orbId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify orb belongs to user's sector
      const existingOrb = await db
        .selectFrom("orbs")
        .innerJoin("sectors", "orbs.sector_id", "sectors.id")
        .select("orbs.id")
        .where("orbs.id", "=", orbId)
        .where("sectors.user_id", "=", userId)
        .executeTakeFirst();

      if (!existingOrb) {
        return res.status(404).json({ error: "Orb not found" });
      }

      await db
        .deleteFrom("orbs")
        .where("id", "=", orbId)
        .execute();

      res.json({ message: "Orb deleted successfully" });
    } catch (error) {
      console.error("Error deleting orb:", error);
      res.status(500).json({ error: "Failed to delete orb" });
    }
  },
};