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
  params: z.object({
    id: z.string().regex(/^\d+$/, { message: "Invalid sector ID" }),
  }),
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

router.use(protect);

// GET /api/sectors - Get all sectors for authenticated user
router.get("/", sectorController.getAllSectors);

// GET /api/sectors/:id - Get specific sector with orbs for authenticated user
router.get("/:id", validate(sectorIdSchema), sectorController.getSectorById);

// POST /api/sectors - Create new sector for authenticated user
router.post("/", validate(createSectorSchema), sectorController.createSector);

// PUT /api/sectors/:id - Update authenticated user's sector
router.put("/:id", validate(updateSectorSchema), sectorController.updateSector);

// DELETE /api/sectors/:id - Delete authenticated user's sector
router.delete("/:id", validate(sectorIdSchema), sectorController.deleteSector);

export default router;
