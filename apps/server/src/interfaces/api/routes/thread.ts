import { Router } from "express";
import { z } from "zod";

import threadController from "@/interfaces/api/controllers/threadController";
import { protect } from "@/interfaces/api/middleware/auth";
import { validate } from "@/interfaces/api/middleware/validation";

const router = Router();

const createThreadSchema = z.object({
  body: z.object({
    orb_id: z.number().int().positive({ message: "Valid orb ID is required" }),
    type: z.enum(["dex", "bridge", "lending", "yield_farming"], {
      message: "Invalid thread type",
    }),
    provider: z.string().min(1, { message: "Provider is required" }),
    enabled: z.boolean().optional(),
    config_json: z.record(z.any(), { message: "Config is required" }),
  }),
});

const updateThreadSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, { message: "Invalid thread ID" }),
  }),
  body: z.object({
    provider: z.string().min(1).optional(),
    enabled: z.boolean().optional(),
    config_json: z.record(z.any()).optional(),
  }),
});

const threadIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, { message: "Invalid thread ID" }),
  }),
});

const orbIdSchema = z.object({
  params: z.object({
    orbId: z.string().regex(/^\d+$/, { message: "Invalid orb ID" }),
  }),
});

router.use(protect);

// GET /api/threads/:orbId - Get all threads for authenticated user's orb
router.get("/:orbId", validate(orbIdSchema), threadController.getThreadsByOrb);

// GET /api/threads/detail/:id - Get specific thread for authenticated user
router.get("/detail/:id", validate(threadIdSchema), threadController.getThreadById);

// POST /api/threads - Create new thread in authenticated user's orb
router.post("/", validate(createThreadSchema), threadController.createThread);

// PUT /api/threads/:id - Update authenticated user's thread
router.put("/:id", validate(updateThreadSchema), threadController.updateThread);

// DELETE /api/threads/:id - Delete authenticated user's thread
router.delete("/:id", validate(threadIdSchema), threadController.deleteThread);

// POST /api/threads/:id/toggle - Toggle authenticated user's thread enabled/disabled
router.post("/:id/toggle", validate(threadIdSchema), threadController.toggleThread);

export default router;
