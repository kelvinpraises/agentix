import { Router } from "express";
import { z } from "zod";

import profileController from "@/api/controllers/profileController";
import { protect } from "@/api/middleware/auth";
import { validate } from "@/api/middleware/validation";

const router = Router();

router.use(protect);

const updateProfileSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    wallet_address_eth: z.string().optional().nullable(),
    wallet_address_sol: z.string().optional().nullable(),
  }),
});

router.get("/", profileController.getProfile);
router.put("/", validate(updateProfileSchema), profileController.updateProfile);

export default router;