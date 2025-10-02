import { createTool } from "@mastra/core";
import { z } from "zod";

import { strategyQueue } from "@/infrastructure/queues/config";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const exitPositionTool = createTool({
  id: "exitPosition",
  description:
    "Executes a SELL order (BID) - selling base currency to get back quote currency (USDC/USDT). Immediately closes active positions regardless of strategy conditions.",
  inputSchema: z.object({
    reason: z.string().describe("Reason for exiting the position"),
    exitType: z
      .enum(["stop_loss", "take_profit", "user"])
      .default("user")
      .describe("Type of exit"),
    exitAmount: z.string().optional().describe("Amount being exited"),
    pnl: z.string().optional().describe("Profit/Loss amount"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { reason, exitType, exitAmount, pnl } = context;
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

    const finalStatus = exitType === "stop_loss" ? "FAILED" : "SUCCEEDED";
    await tradeActionService.updateTradeStatus(tradeActionId, finalStatus);

    try {
      await tradeActionService.createJournalEntry({
        sectorId,
        tradeActionId,
        type: "POSITION_EXITED",
        content: {
          exit_type: exitType,
          exit_amount: exitAmount || "0",
          pnl: pnl || "0",
          reasoning: reason,
        },
      });
    } catch (error) {
      console.error("Failed to log position exit:", error);
    }

    return {
      success: true,
      message: `Trade ${tradeActionId} has been exited.`,
    };
  },
});
