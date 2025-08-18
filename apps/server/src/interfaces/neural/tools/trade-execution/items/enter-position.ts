import { createTool } from "@mastra/core";
import { z } from "zod";

import { strategyQueue } from "@/infrastructure/queues/definitions";
import { db } from "@/infrastructure/database/turso-connection";
import { AgentRuntimeContextSchema } from "@/types/context";
import { strategyAnalysisService } from "@/services/trading/strategy-analysis-service";
import { updateTradeStatus } from "@/services/trading/trade-service";

export const enterPositionTool = createTool({
  id: "enterPosition",
  description: "Executes the built trade plan after validation.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    error_message: z.string().optional(),
  }),
  execute: async ({ runtimeContext }) => {
    const { tradeActionId } = AgentRuntimeContextSchema.parse({
      sectorId: runtimeContext.get("sectorId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    const strategies = await db
      .selectFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .selectAll()
      .execute();

    const analysis = strategyAnalysisService.analyze(strategies);

    const hasPositionMonitor = strategies.some(
      (s) => s.strategy_type === "positionMonitor"
    );
    if (!hasPositionMonitor) {
      return {
        success: false,
        message: "Validation failed: A position monitor is required before execution.",
        error_message:
          "Validation failed: A position monitor is required before execution.",
      };
    }

    if (analysis.warnings.length > 0) {
      return {
        success: false,
        message: `Validation failed: ${analysis.warnings.join(" ")}`,
        error_message: `Validation failed: ${analysis.warnings.join(" ")}`,
      };
    }

    const schedulerId = `monitor-trade-${tradeActionId}`;
    await strategyQueue.upsertJobScheduler(
      schedulerId,
      { every: 20 * 1000 },
      {
        name: "monitor-trade",
        data: { tradeActionId },
      }
    );

    await updateTradeStatus(tradeActionId, "EXECUTING");

    return {
      success: true,
      message: `Trade ${tradeActionId} has been executed and is now being monitored.`,
    };
  },
});
