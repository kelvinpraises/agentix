import { Request, Response } from "express";

import { tradespaceService } from "@/services/user/tradespace-service";

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

const sectorController = {
  async getAllSectors(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const sectors = await tradespaceService.getUserSectors(userId);
      res.json({ sectors });
    } catch (error) {
      console.error("Error fetching sectors:", error);
      res.status(500).json({ error: "Failed to fetch sectors" });
    }
  },

  async getSectorById(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const sectorId = parseInt(req.params.id);

      const sector = await tradespaceService.getSectorById(sectorId, userId);
      if (!sector) {
        res.status(404).json({ error: "Sector not found" });
        return;
      }

      const orbs = await tradespaceService.getOrbsBySector(sectorId, userId);
      res.json({ sector: { ...sector, orbs } });
    } catch (error) {
      console.error("Error fetching sector:", error);
      if (error instanceof Error && error.message === "Sector not found") {
        res.status(404).json({ error: "Sector not found" });
      } else {
        res.status(500).json({ error: "Failed to fetch sector" });
      }
    }
  },

  async createSector(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const sectorData: CreateSectorRequestBody = req.body;

      const result = await tradespaceService.createSector(userId, {
        name: sectorData.name,
        type: sectorData.type,
        settings: sectorData.settings ? JSON.stringify(sectorData.settings) : "{}",
      });

      res.status(201).json({ sector: result });
    } catch (error) {
      console.error("Error creating sector:", error);
      res.status(500).json({ error: "Failed to create sector" });
    }
  },

  async updateSector(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const sectorId = parseInt(req.params.id);
      const updates: UpdateSectorRequestBody = req.body;

      const { settings, ...otherUpdates } = updates;
      const updateData = {
        ...otherUpdates,
        ...(settings && { settings: JSON.stringify(settings) }),
      };

      const result = await tradespaceService.updateSector(sectorId, userId, updateData);
      res.json({ sector: result });
    } catch (error) {
      console.error("Error updating sector:", error);
      if (error instanceof Error && error.message === "Sector not found") {
        res.status(404).json({ error: "Sector not found" });
      } else {
        res.status(500).json({ error: "Failed to update sector" });
      }
    }
  },

  async deleteSector(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const sectorId = parseInt(req.params.id);

      await tradespaceService.deleteSector(sectorId, userId);
      res.json({ message: "Sector deleted successfully" });
    } catch (error) {
      console.error("Error deleting sector:", error);
      if (error instanceof Error && error.message === "Sector not found") {
        res.status(404).json({ error: "Sector not found" });
      } else {
        res.status(500).json({ error: "Failed to delete sector" });
      }
    }
  },
};

export default sectorController;
