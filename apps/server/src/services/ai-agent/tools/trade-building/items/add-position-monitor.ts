import { createTool } from "@mastra/core";
import { z } from "zod";

import { db } from "@/database/turso-connection";
import { AgentRuntimeContextSchema } from "@/services/ai-agent/context";
import { strategyAnalysisService } from "@/services/trading/strategy-analysis-service";

export const addPositionMonitorTool = createTool({
  id: "addPositionMonitor",
  description:
    "Establishes the foundational risk layer with stop-loss and take-profit parameters.",
  inputSchema: z.object({
    stopLoss: z.number().describe("Stop loss percentage"),
    takeProfit: z.number().describe("Take profit percentage"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    current_strategies: z.array(z.any()),
    warnings: z.array(z.string()).optional(),
    suggestions: z.array(z.string()).optional(),
    error_message: z.string().optional(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { stopLoss, takeProfit } = context;
    const { tradeActionId } = AgentRuntimeContextSchema.parse({
      userId: runtimeContext.get("userId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    const existingMonitor = await db
      .selectFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .where("strategy_type", "=", "positionMonitor")
      .executeTakeFirst();

    if (existingMonitor) {
      const strategies = await db
        .selectFrom("trade_strategies")
        .where("trade_action_id", "=", tradeActionId)
        .selectAll()
        .execute();
      return {
        success: false,
        current_strategies: strategies,
        error_message: "A position monitor already exists for this trade.",
        warnings: ["Duplicate position monitor found."],
      };
    }

    await db
      .insertInto("trade_strategies")
      .values({
        trade_action_id: tradeActionId,
        strategy_type: "positionMonitor",
        strategy_params_json: JSON.stringify({ stopLoss, takeProfit }),
        is_active: true,
      })
      .execute();

    const strategies = await db
      .selectFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .selectAll()
      .execute();
    const analysis = strategyAnalysisService.analyze(
      strategies,
      "addPositionMonitor"
    );

    return {
      success: true,
      current_strategies: strategies,
      warnings: analysis.warnings,
      suggestions: analysis.suggestions,
    };
  },
});
