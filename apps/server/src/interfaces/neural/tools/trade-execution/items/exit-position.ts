import { createTool } from "@mastra/core";
import { z } from "zod";

import { strategyQueue } from "@/infrastructure/queues/definitions";
import { AgentRuntimeContextSchema } from "@/types/context";
import { createJournalEntry, updateTradeStatus } from "@/services/trading/trade-service";

export const exitPositionTool = createTool({
  id: "exitPosition",
  description: "Immediately closes active positions regardless of strategy conditions.",
  inputSchema: z.object({
    reason: z.string(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { reason } = context;
    const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
      sectorId: runtimeContext.get("sectorId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    const schedulerId = `monitor-trade-${tradeActionId}`;
    try {
      await strategyQueue.removeJobScheduler(schedulerId);
    } catch (error) {
      console.error(
        `[exitPositionTool] Failed to remove job scheduler for key ${schedulerId}:`,
        error
      );
    }

    await updateTradeStatus(tradeActionId, "SUCCEEDED");

    await createJournalEntry({
      sectorId,
      tradeActionId,
      type: "SYSTEM_ALERT",
      content: {
        contentType: "SYSTEM_ALERT",
        message: `Trade exited with reason: ${reason}`,
        alert_type: "info",
        severity: "low",
        requires_action: false,
      },
    });

    return {
      success: true,
      message: `Trade ${tradeActionId} has been exited.`,
    };
  },
});
