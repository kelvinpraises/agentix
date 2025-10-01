import { Request, Response } from "express";

import { tradespaceService } from "@/services/user/tradespace-service";
import { ThreadType } from "@/types/orb";

interface CreateThreadRequestBody {
  orb_id: number;
  type: ThreadType;
  provider: string;
  enabled?: boolean;
  config_json: Record<string, any>;
  description?: string;
}

interface UpdateThreadRequestBody {
  provider?: string;
  enabled?: boolean;
  config_json?: Record<string, any>;
  description?: string;
}

const threadController = {
  // GET /threads/:orbId - Get all threads for an orb
  async getThreadsByOrb(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const orbId = parseInt(req.params.orbId);

      const threads = await tradespaceService.getThreadsByOrb(orbId, userId);
      res.json({ threads });
    } catch (error) {
      console.error("Error fetching threads:", error);
      if (error instanceof Error && error.message === "Orb not found") {
        res.status(404).json({ error: "Orb not found" });
      } else {
        res.status(500).json({ error: "Failed to fetch threads" });
      }
    }
  },

  // GET /threads/detail/:id - Get specific thread
  async getThreadById(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const threadId = parseInt(req.params.id);

      const thread = await tradespaceService.getThreadById(threadId, userId);
      if (!thread) {
        res.status(404).json({ error: "Thread not found" });
        return;
      }

      res.json({ thread });
    } catch (error) {
      console.error("Error fetching thread:", error);
      res.status(500).json({ error: "Failed to fetch thread" });
    }
  },

  // POST /threads - Create new thread
  async createThread(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const threadData: CreateThreadRequestBody = req.body;

      const result = await tradespaceService.createThread(userId, {
        orb_id: threadData.orb_id,
        type: threadData.type,
        provider: threadData.provider,
        enabled: threadData.enabled,
        config_json: threadData.config_json,
        description: threadData.description,
      });

      res.status(201).json({ thread: result });
    } catch (error) {
      console.error("Error creating thread:", error);
      if (error instanceof Error && error.message === "Orb not found") {
        res.status(404).json({ error: "Orb not found" });
      } else {
        res.status(500).json({ error: "Failed to create thread" });
      }
    }
  },

  // PUT /threads/:id - Update thread
  async updateThread(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const threadId = parseInt(req.params.id);
      const updates: UpdateThreadRequestBody = req.body;

      const result = await tradespaceService.updateThread(threadId, userId, updates);
      res.json({ thread: result });
    } catch (error) {
      console.error("Error updating thread:", error);
      if (error instanceof Error && error.message === "Thread not found") {
        res.status(404).json({ error: "Thread not found" });
      } else {
        res.status(500).json({ error: "Failed to update thread" });
      }
    }
  },

  // DELETE /threads/:id - Delete thread
  async deleteThread(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const threadId = parseInt(req.params.id);

      await tradespaceService.deleteThread(threadId, userId);
      res.json({ message: "Thread deleted successfully" });
    } catch (error) {
      console.error("Error deleting thread:", error);
      if (error instanceof Error && error.message === "Thread not found") {
        res.status(404).json({ error: "Thread not found" });
      } else {
        res.status(500).json({ error: "Failed to delete thread" });
      }
    }
  },

  // POST /threads/:id/toggle - Toggle thread enabled/disabled
  async toggleThread(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const threadId = parseInt(req.params.id);

      // Get current thread state
      const thread = await tradespaceService.getThreadById(threadId, userId);
      if (!thread) {
        res.status(404).json({ error: "Thread not found" });
        return;
      }

      // Toggle the enabled state
      const result = await tradespaceService.updateThread(threadId, userId, {
        enabled: !thread.enabled,
      });

      res.json({ thread: result });
    } catch (error) {
      console.error("Error toggling thread:", error);
      if (error instanceof Error && error.message === "Thread not found") {
        res.status(404).json({ error: "Thread not found" });
      } else {
        res.status(500).json({ error: "Failed to toggle thread" });
      }
    }
  },
};

export default threadController;
