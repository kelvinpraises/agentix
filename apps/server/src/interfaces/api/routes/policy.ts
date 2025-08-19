import { Router } from "express";
import { z } from "zod";

import policyController from "@/interfaces/api/controllers/policyController";
import { protect } from "@/interfaces/api/middleware/auth";
import { validate } from "@/interfaces/api/middleware/validation";
import { policyDocumentSchema } from "@/types/policy";

const router = Router();

const createPolicySchema = z.object({
  params: z.object({
    sectorId: z.string().regex(/^\d+$/),
  }),
  body: z.object({
    policy_document: policyDocumentSchema,
    ai_critique: z.string().optional(),
  }),
});

const updatePolicySchema = z.object({
  params: z.object({
    sectorId: z.string().regex(/^\d+$/),
  }),
  body: z.object({
    policy_document: policyDocumentSchema.optional(),
    version: z.number().optional(),
    is_active: z.boolean().optional(),
    ai_critique: z.string().optional().nullable(),
  }),
});

const sectorParamsSchema = z.object({
  params: z.object({
    sectorId: z.string().regex(/^\d+$/),
  }),
});

const versionParamsSchema = z.object({
  params: z.object({
    sectorId: z.string().regex(/^\d+$/),
    version: z.string().regex(/^\d+$/),
  }),
});

router.use(protect);

// GET /api/policies/:sectorId - Get active policy for authenticated user's sector
router.get("/:sectorId", validate(sectorParamsSchema), policyController.getSectorPolicy);

// GET /api/policies/:sectorId/history - Get policy history for authenticated user's sector
router.get(
  "/:sectorId/history",
  validate(sectorParamsSchema),
  policyController.getSectorPolicyHistory
);

// POST /api/policies/:sectorId - Create new policy version for authenticated user's sector
router.post(
  "/:sectorId",
  validate(createPolicySchema),
  policyController.createSectorPolicy
);

// PUT /api/policies/:sectorId - Update active policy for authenticated user's sector
router.put("/:sectorId", validate(updatePolicySchema), policyController.updateSectorPolicy);

// POST /api/policies/:sectorId/activate/:version - Activate policy version for authenticated user's sector
router.post(
  "/:sectorId/activate/:version",
  validate(versionParamsSchema),
  policyController.activatePolicyVersion
);

export default router;
