import { createTool } from "@mastra/core";
import { z } from "zod";

import { tradespaceService } from "@/services/user/tradespace-service";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const lockOrbSelectionTool = createTool({
  id: "lockOrbSelection",
  description:
    "Lock in your orb selection for this trade action. You must lock an orb before you can access its detailed context with getOrbContext. This ensures you commit to a specific orb before making trading decisions.",
  inputSchema: z.object({
    orbId: z.number().describe("The ID of the orb to lock in for this trade action"),
    reasoning: z
      .string()
      .describe("Explain why you chose this specific orb over others in the sector"),
    confidenceScore: z
      .number()
      .min(0)
      .max(1)
      .describe("Your confidence level in this orb selection (0-1)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    orbId: z.number(),
    orbName: z.string(),
    message: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { orbId, reasoning, confidenceScore } = context;
    const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
      sectorId: runtimeContext.get("sectorId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    // Verify orb exists and belongs to this sector
    const userId = 1; // TODO: Get from context when auth is integrated
    const orb = await tradespaceService.getOrbById(orbId, userId);

    if (!orb) {
      return {
        success: false,
        orbId,
        orbName: "",
        message: `Orb ${orbId} not found or does not belong to this sector`,
      };
    }

    if (orb.sector_id !== sectorId) {
      return {
        success: false,
        orbId,
        orbName: orb.name,
        message: `Orb ${orb.name} does not belong to the current sector`,
      };
    }

    // Store locked orb in runtime context
    runtimeContext.set("lockedOrbId", orbId);

    // Update trade action to associate with this orb
    await tradeActionService.updateTradeAction(tradeActionId, {
      orb_id: orbId,
    });

    // Log journal entry for orb lock
    try {
      await tradeActionService.createJournalEntry({
        sectorId,
        tradeActionId,
        type: "ORB_LOCKED",
        content: {
          orbId,
          orbName: orb.name,
          reasoning,
        },
        confidenceScore,
      });
    } catch (error) {
      console.error("Failed to log orb lock:", error);
    }

    return {
      success: true,
      orbId,
      orbName: orb.name,
      message: `Successfully locked orb: ${orb.name}. You can now use getOrbContext to access detailed information.`,
    };
  },
});