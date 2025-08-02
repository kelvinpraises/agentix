import { Request, Response } from "express";

import { aiAgentService } from "@/services/ai-agent";
import {
  addUserAction,
  addUserFeedback,
  getJournalForTradeAction,
  getTradeActionById,
  getTradesBySector,
  getTradesByOrb,
  interruptTradeAction,
} from "@/services/trading/trade-service";

const tradeController = {
  async getTradesBySector(req: Request, res: Response) {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { sectorId } = req.params;
    const userId = req.user.id;

    try {
      const trades = await getTradesBySector(parseInt(sectorId, 10), userId);
      res.status(200).json(trades);
      return;
    } catch (error) {
      console.error("Error fetching trades by sector:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },

  async getTradesByOrb(req: Request, res: Response) {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { orbId } = req.params;
    const userId = req.user.id;

    try {
      const trades = await getTradesByOrb(parseInt(orbId, 10), userId);
      res.status(200).json(trades);
      return;
    } catch (error) {
      console.error("Error fetching trades by orb:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },

  async getTradeDetails(req: Request, res: Response) {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { tradeId } = req.params;
    const userId = req.user.id;

    try {
      const tradeAction = await getTradeActionById(parseInt(tradeId, 10), userId);

      if (!tradeAction) {
        res.status(404).json({ error: "Trade action not found" });
        return;
      }

      const journalEntries = await getJournalForTradeAction(
        tradeAction.id,
        false // Do not include internal entries
      );

      res.status(200).json({
        ...tradeAction,
        journal: journalEntries,
      });
      return;
    } catch (error) {
      console.error("Error fetching trade action details:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },

  async postUserAction(req: Request, res: Response) {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { tradeId } = req.params;
    const content = req.body; // Zod validation handles the shape
    const userId = req.user.id;

    try {
      const entry = await addUserAction(userId, parseInt(tradeId, 10), content);
      res.status(201).json(entry);
      return;
    } catch (error) {
      console.error("Error posting user action:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },

  async interruptTrade(req: Request, res: Response) {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { tradeId } = req.params;
    const userId = req.user.id;

    try {
      // First, log the user's intent to interrupt.
      await interruptTradeAction(userId, parseInt(tradeId, 10));

      // Then, signal the AI agent service to stop the analysis.
      const wasRunning = aiAgentService.interruptAnalysis(parseInt(tradeId, 10));

      if (wasRunning) {
        res.status(200).json({ message: "Trade analysis interrupted successfully." });
      } else {
        res
          .status(404)
          .json({ error: "No active analysis found for this trade to interrupt." });
      }
      return;
    } catch (error) {
      console.error("Error interrupting trade action:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },

  async postUserFeedback(req: Request, res: Response) {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { tradeId } = req.params;
    const content = req.body; // Zod validation handles the shape
    const userId = req.user.id;

    try {
      const entry = await addUserFeedback(userId, parseInt(tradeId, 10), content);
      res.status(201).json(entry);
      return;
    } catch (error) {
      console.error("Error posting user feedback:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  },
};

export default tradeController;
