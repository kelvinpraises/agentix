import { Request, Response } from "express";
import { db } from "@/database/turso-connection";
import { NewThread, ThreadUpdate } from "@/models/Thread";

interface CreateThreadRequestBody {
  orb_id: number;
  type: "dex" | "bridge" | "lending" | "yield_farming";
  provider: string;
  enabled?: boolean;
  config_json: Record<string, any>;
}

interface UpdateThreadRequestBody {
  type?: "dex" | "bridge" | "lending" | "yield_farming";
  provider?: string;
  enabled?: boolean;
  config_json?: Record<string, any>;
}

export const threadController = {
  // GET /threads/:orbId - Get all threads for an orb
  async getThreadsByOrb(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const orbId = parseInt(req.params.orbId);

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify orb belongs to user's sector
      const orb = await db
        .selectFrom("orbs")
        .innerJoin("sectors", "orbs.sector_id", "sectors.id")
        .select("orbs.id")
        .where("orbs.id", "=", orbId)
        .where("sectors.user_id", "=", userId)
        .executeTakeFirst();

      if (!orb) {
        return res.status(404).json({ error: "Orb not found" });
      }

      const threads = await db
        .selectFrom("threads")
        .selectAll()
        .where("orb_id", "=", orbId)
        .orderBy("type")
        .orderBy("provider")
        .execute();

      res.json({ threads });
    } catch (error) {
      console.error("Error fetching threads:", error);
      res.status(500).json({ error: "Failed to fetch threads" });
    }
  },

  // GET /threads/detail/:id - Get specific thread
  async getThreadById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const threadId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get thread with ownership verification
      const thread = await db
        .selectFrom("threads")
        .innerJoin("orbs", "threads.orb_id", "orbs.id")
        .innerJoin("sectors", "orbs.sector_id", "sectors.id")
        .selectAll("threads")
        .where("threads.id", "=", threadId)
        .where("sectors.user_id", "=", userId)
        .executeTakeFirst();

      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
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
      const userId = req.user?.id;
      const {
        orb_id,
        type,
        provider,
        enabled = true,
        config_json,
      }: CreateThreadRequestBody = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!orb_id || !type || !provider || !config_json) {
        return res
          .status(400)
          .json({ error: "Orb ID, type, provider, and config are required" });
      }

      // Verify orb belongs to user's sector
      const orb = await db
        .selectFrom("orbs")
        .innerJoin("sectors", "orbs.sector_id", "sectors.id")
        .select("orbs.id")
        .where("orbs.id", "=", orb_id)
        .where("sectors.user_id", "=", userId)
        .executeTakeFirst();

      if (!orb) {
        return res.status(404).json({ error: "Orb not found" });
      }

      const newThread: NewThread = {
        orb_id,
        type,
        provider,
        enabled,
        config_json,
      };

      const result = await db
        .insertInto("threads")
        .values(newThread)
        .returningAll()
        .executeTakeFirstOrThrow();

      res.status(201).json({ thread: result });
    } catch (error) {
      console.error("Error creating thread:", error);
      res.status(500).json({ error: "Failed to create thread" });
    }
  },

  // PUT /threads/:id - Update thread
  async updateThread(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const threadId = parseInt(req.params.id);
      const updates: UpdateThreadRequestBody = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify thread belongs to user's orb/sector
      const existingThread = await db
        .selectFrom("threads")
        .innerJoin("orbs", "threads.orb_id", "orbs.id")
        .innerJoin("sectors", "orbs.sector_id", "sectors.id")
        .select("threads.id")
        .where("threads.id", "=", threadId)
        .where("sectors.user_id", "=", userId)
        .executeTakeFirst();

      if (!existingThread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      const updateData: ThreadUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const result = await db
        .updateTable("threads")
        .set(updateData)
        .where("id", "=", threadId)
        .returningAll()
        .executeTakeFirstOrThrow();

      res.json({ thread: result });
    } catch (error) {
      console.error("Error updating thread:", error);
      res.status(500).json({ error: "Failed to update thread" });
    }
  },

  // DELETE /threads/:id - Delete thread
  async deleteThread(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const threadId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify thread belongs to user's orb/sector
      const existingThread = await db
        .selectFrom("threads")
        .innerJoin("orbs", "threads.orb_id", "orbs.id")
        .innerJoin("sectors", "orbs.sector_id", "sectors.id")
        .select("threads.id")
        .where("threads.id", "=", threadId)
        .where("sectors.user_id", "=", userId)
        .executeTakeFirst();

      if (!existingThread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      await db.deleteFrom("threads").where("id", "=", threadId).execute();

      res.json({ message: "Thread deleted successfully" });
    } catch (error) {
      console.error("Error deleting thread:", error);
      res.status(500).json({ error: "Failed to delete thread" });
    }
  },

  // POST /threads/:id/toggle - Toggle thread enabled/disabled
  async toggleThread(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const threadId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get current thread state with ownership verification
      const thread = await db
        .selectFrom("threads")
        .innerJoin("orbs", "threads.orb_id", "orbs.id")
        .innerJoin("sectors", "orbs.sector_id", "sectors.id")
        .select(["threads.id", "threads.enabled"])
        .where("threads.id", "=", threadId)
        .where("sectors.user_id", "=", userId)
        .executeTakeFirst();

      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      const result = await db
        .updateTable("threads")
        .set({
          enabled: !thread.enabled,
          updated_at: new Date().toISOString(),
        })
        .where("id", "=", threadId)
        .returningAll()
        .executeTakeFirstOrThrow();

      res.json({ thread: result });
    } catch (error) {
      console.error("Error toggling thread:", error);
      res.status(500).json({ error: "Failed to toggle thread" });
    }
  },
};
