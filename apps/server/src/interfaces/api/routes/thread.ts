import { Router } from "express";
import { z } from "zod";

import threadController from "@/interfaces/api/controllers/threadController";
import { protect } from "@/interfaces/api/middleware/auth";
import { validate } from "@/interfaces/api/middleware/validation";

const router = Router();

const createThreadSchema = z.object({
  body: z.object({
    orb_id: z.number().int().positive({ message: "Valid orb ID is required" }),
    type: z.enum(["dex", "bridge", "lending", "yield_farming"], { message: "Invalid thread type" }),
    provider: z.string().min(1, { message: "Provider is required" }),
    enabled: z.boolean().optional(),
    config_json: z.record(z.any(), { message: "Config is required" }),
  }),
});

const updateThreadSchema = z.object({
  body: z.object({
    type: z.enum(["dex", "bridge", "lending", "yield_farming"]).optional(),
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

// All routes require authentication
router.use(protect);

// GET /threads/:orbId - Get all threads for an orb
router.get("/:orbId", validate(orbIdSchema), threadController.getThreadsByOrb);

// GET /threads/detail/:id - Get specific thread
router.get("/detail/:id", validate(threadIdSchema), threadController.getThreadById);

// POST /threads - Create new thread
router.post("/", validate(createThreadSchema), threadController.createThread);

// PUT /threads/:id - Update thread
router.put("/:id", validate(threadIdSchema), validate(updateThreadSchema), threadController.updateThread);

// DELETE /threads/:id - Delete thread
router.delete("/:id", validate(threadIdSchema), threadController.deleteThread);

// POST /threads/:id/toggle - Toggle thread enabled/disabled
router.post("/:id/toggle", validate(threadIdSchema), threadController.toggleThread);

export default router;