import { Router } from "express";
import { z } from "zod";

import orbController from "@/interfaces/api/controllers/orbController";
import { protect } from "@/interfaces/api/middleware/auth";
import { validate } from "@/interfaces/api/middleware/validation";
import { CHAINS } from "@/types/orb";

const router = Router();

const createOrbSchema = z.object({
  body: z.object({
    sector_id: z.number().int().positive({ message: "Valid sector ID is required" }),
    name: z.string().min(1, { message: "Name is required" }),
    chain: z.enum(CHAINS, { message: "Invalid chain type" }),
    wallet_address: z.string().optional(),
    asset_pairs: z.record(z.number().min(0).max(100)).optional(),
    config_json: z.record(z.any()).optional(),
  }),
});

const updateOrbSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    wallet_address: z.string().optional(),
    asset_pairs: z.record(z.number().min(0).max(100)).optional(),
    config_json: z.record(z.any()).optional(),
  }),
});

const orbIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, { message: "Invalid orb ID" }),
  }),
});

const sectorIdSchema = z.object({
  params: z.object({
    sectorId: z.string().regex(/^\d+$/, { message: "Invalid sector ID" }),
  }),
});

// All routes require authentication
router.use(protect);

// GET /orbs/:sectorId - Get all orbs for a sector
router.get("/:sectorId", validate(sectorIdSchema), orbController.getOrbsBySector);

// GET /orbs/detail/:id - Get specific orb with threads
router.get("/detail/:id", validate(orbIdSchema), orbController.getOrbById);

// POST /orbs - Create new orb
router.post("/", validate(createOrbSchema), orbController.createOrb);

// PUT /orbs/:id - Update orb
router.put("/:id", validate(orbIdSchema), validate(updateOrbSchema), orbController.updateOrb);

// DELETE /orbs/:id - Delete orb
router.delete("/:id", validate(orbIdSchema), orbController.deleteOrb);

export default router;