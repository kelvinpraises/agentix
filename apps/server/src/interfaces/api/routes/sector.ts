import { Router } from "express";
import { z } from "zod";

import sectorController from "@/interfaces/api/controllers/sectorController";
import { protect } from "@/interfaces/api/middleware/auth";
import { validate } from "@/interfaces/api/middleware/validation";

const router = Router();

const createSectorSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Name is required" }),
    type: z.enum(["live_trading", "paper_trading"], { message: "Invalid sector type" }),
    settings: z.record(z.any()).optional(),
  }),
});

const updateSectorSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    type: z.enum(["live_trading", "paper_trading"]).optional(),
    settings: z.record(z.any()).optional(),
  }),
});

const sectorIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, { message: "Invalid sector ID" }),
  }),
});

// All routes require authentication
router.use(protect);

// GET /sectors - Get all sectors for user
router.get("/", sectorController.getAllSectors);

// GET /sectors/:id - Get specific sector with orbs
router.get("/:id", validate(sectorIdSchema), sectorController.getSectorById);

// POST /sectors - Create new sector
router.post("/", validate(createSectorSchema), sectorController.createSector);

// PUT /sectors/:id - Update sector
router.put("/:id", validate(sectorIdSchema), validate(updateSectorSchema), sectorController.updateSector);

// DELETE /sectors/:id - Delete sector
router.delete("/:id", validate(sectorIdSchema), sectorController.deleteSector);

export default router;