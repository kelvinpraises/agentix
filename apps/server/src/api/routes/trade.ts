import { Router } from "express";
import { z } from "zod";

import tradeController from "@/api/controllers/tradeController";
import { protect } from "@/api/middleware/auth";
import { validate } from "@/api/middleware/validation";

const router = Router();

router.use(protect);

// Schema for UserActionContent
const userActionSchema = z.object({
  body: z.object({
    contentType: z.literal("USER_ACTION"),
    message: z.string(),
    action_type: z.enum([
      "approve",
      "reject",
      "modify",
      "manual_trade",
      "stop_ai",
      "resume_ai",
    ]),
    target_entry_id: z.number().optional(),
    details: z.record(z.any()).optional(),
    timestamp: z.string().datetime(),
  }),
});

// Schema for UserFeedbackContent
const userFeedbackSchema = z.object({
  body: z.object({
    contentType: z.literal("USER_FEEDBACK"),
    message: z.string(),
    target_entry_id: z.number(),
    feedback_type: z.enum(["rating", "comment", "suggestion"]),
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
    helpful: z.boolean(),
  }),
});

router.get("/:tradeId", tradeController.getTradeDetails);
router.post("/:tradeId/action", validate(userActionSchema), tradeController.postUserAction);
router.post("/:tradeId/interrupt", tradeController.interruptTrade);
router.post(
  "/:tradeId/feedback",
  validate(userFeedbackSchema),
  tradeController.postUserFeedback
);

export default router;