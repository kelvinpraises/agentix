import { Request, Response } from "express";
import { db } from "@/database/turso-connection";
import { NewSector, SectorUpdate } from "@/models/Sector";

interface CreateSectorRequestBody {
  name: string;
  type: "live_trading" | "paper_trading";
  settings?: Record<string, any>;
}

interface UpdateSectorRequestBody {
  name?: string;
  type?: "live_trading" | "paper_trading";
  settings?: Record<string, any>;
}

export const sectorController = {
  // GET /sectors - Get all sectors for authenticated user
  async getAllSectors(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const sectors = await db
        .selectFrom("sectors")
        .selectAll()
        .where("user_id", "=", userId)
        .orderBy("created_at", "desc")
        .execute();

      res.json({ sectors });
    } catch (error) {
      console.error("Error fetching sectors:", error);
      res.status(500).json({ error: "Failed to fetch sectors" });
    }
  },

  // GET /sectors/:id - Get specific sector with orbs
  async getSectorById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const sectorId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const sector = await db
        .selectFrom("sectors")
        .selectAll()
        .where("id", "=", sectorId)
        .where("user_id", "=", userId)
        .executeTakeFirst();

      if (!sector) {
        return res.status(404).json({ error: "Sector not found" });
      }

      // Get orbs for this sector
      const orbs = await db
        .selectFrom("orbs")
        .selectAll()
        .where("sector_id", "=", sectorId)
        .execute();

      res.json({ sector: { ...sector, orbs } });
    } catch (error) {
      console.error("Error fetching sector:", error);
      res.status(500).json({ error: "Failed to fetch sector" });
    }
  },

  // POST /sectors - Create new sector
  async createSector(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { name, type, settings }: CreateSectorRequestBody = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!name || !type) {
        return res.status(400).json({ error: "Name and type are required" });
      }

      const newSector: NewSector = {
        user_id: userId,
        name,
        type,
        settings: settings || null,
      };

      const result = await db
        .insertInto("sectors")
        .values(newSector)
        .returningAll()
        .executeTakeFirstOrThrow();

      res.status(201).json({ sector: result });
    } catch (error) {
      console.error("Error creating sector:", error);
      res.status(500).json({ error: "Failed to create sector" });
    }
  },

  // PUT /sectors/:id - Update sector
  async updateSector(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const sectorId = parseInt(req.params.id);
      const updates: UpdateSectorRequestBody = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify sector belongs to user
      const existingSector = await db
        .selectFrom("sectors")
        .select("id")
        .where("id", "=", sectorId)
        .where("user_id", "=", userId)
        .executeTakeFirst();

      if (!existingSector) {
        return res.status(404).json({ error: "Sector not found" });
      }

      const updateData: SectorUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const result = await db
        .updateTable("sectors")
        .set(updateData)
        .where("id", "=", sectorId)
        .returningAll()
        .executeTakeFirstOrThrow();

      res.json({ sector: result });
    } catch (error) {
      console.error("Error updating sector:", error);
      res.status(500).json({ error: "Failed to update sector" });
    }
  },

  // DELETE /sectors/:id - Delete sector
  async deleteSector(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const sectorId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify sector belongs to user
      const existingSector = await db
        .selectFrom("sectors")
        .select("id")
        .where("id", "=", sectorId)
        .where("user_id", "=", userId)
        .executeTakeFirst();

      if (!existingSector) {
        return res.status(404).json({ error: "Sector not found" });
      }

      await db
        .deleteFrom("sectors")
        .where("id", "=", sectorId)
        .execute();

      res.json({ message: "Sector deleted successfully" });
    } catch (error) {
      console.error("Error deleting sector:", error);
      res.status(500).json({ error: "Failed to delete sector" });
    }
  },
};