import { Router } from "express";
import { z } from "zod";

import policyController from "@/interfaces/api/controllers/policyController";
import { protect } from "@/interfaces/api/middleware/auth";
import { validate } from "@/interfaces/api/middleware/validation";
import { policyDocumentSchema } from "@/types/policy";

const router = Router();

router.use(protect);

const updatePolicySchema = z.object({
  body: z.object({
    policy_document: policyDocumentSchema.optional(),
    version: z.number().optional(),
    is_active: z.boolean().optional(),
    ai_critique: z.string().optional().nullable(),
  }),
});

router.get("/", policyController.getPolicy);
router.put("/", validate(updatePolicySchema), policyController.updatePolicy);

export default router;
