import { Request, Response } from "express";

import { tradespaceService } from "@/services/user/tradespace-service";
import { ChainType } from "@/types/orb";

interface CreateOrbRequestBody {
  sector_id: number;
  name: string;
  chain: ChainType;
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

const orbController = {
  async getOrbsBySector(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const sectorId = parseInt(req.params.sectorId);

      const orbs = await tradespaceService.getOrbsBySector(sectorId, userId);
      res.json({ orbs });
    } catch (error) {
      console.error("Error fetching orbs:", error);
      if (error instanceof Error && error.message === "Sector not found") {
        res.status(404).json({ error: "Sector not found" });
      } else {
        res.status(500).json({ error: "Failed to fetch orbs" });
      }
    }
  },

  async getOrbById(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const orbId = parseInt(req.params.id);

      const orb = await tradespaceService.getOrbWithThreads(orbId, userId);

      if (!orb) {
        res.status(404).json({ error: "Orb not found" });
        return;
      }

      res.json({ orb });
    } catch (error) {
      console.error("Error fetching orb:", error);
      res.status(500).json({ error: "Failed to fetch orb" });
    }
  },

  async createOrb(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const orbData: CreateOrbRequestBody = req.body;

      const result = await tradespaceService.createOrb(userId, orbData);
      res.status(201).json({ orb: result });
    } catch (error) {
      console.error("Error creating orb:", error);
      if (error instanceof Error && error.message === "Sector not found") {
        res.status(404).json({ error: "Sector not found" });
      } else {
        res.status(500).json({ error: "Failed to create orb" });
      }
    }
  },

  async updateOrb(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const orbId = parseInt(req.params.id);
      const updates: UpdateOrbRequestBody = req.body;

      const result = await tradespaceService.updateOrb(orbId, userId, updates);
      res.json({ orb: result });
    } catch (error) {
      console.error("Error updating orb:", error);
      if (error instanceof Error && error.message === "Orb not found") {
        res.status(404).json({ error: "Orb not found" });
      } else {
        res.status(500).json({ error: "Failed to update orb" });
      }
    }
  },

  async deleteOrb(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const orbId = parseInt(req.params.id);

      await tradespaceService.deleteOrb(orbId, userId);
      res.json({ message: "Orb deleted successfully" });
    } catch (error) {
      console.error("Error deleting orb:", error);
      if (error instanceof Error && error.message === "Orb not found") {
        res.status(404).json({ error: "Orb not found" });
      } else {
        res.status(500).json({ error: "Failed to delete orb" });
      }
    }
  },
};

export default orbController;
