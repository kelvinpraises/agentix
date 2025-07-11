import { Request, Response } from "express";

import { portfolioService } from "@/services/user/portfolio-service";

const portfolioController = {
  async getSnapshots(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const snapshots = await portfolioService.getPortfolioSnapshots(req.user.id);
      res.json(snapshots);
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while fetching portfolio snapshots." });
    }
  },
};

export default portfolioController;