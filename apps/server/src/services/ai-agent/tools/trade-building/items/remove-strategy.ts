import { createTool } from "@mastra/core";
import { z } from "zod";

import { db } from "@/database/turso-connection";
import { AgentRuntimeContextSchema } from "@/services/ai-agent/context";
import { strategyAnalysisService } from "@/services/trading/strategy-analysis-service";

export const removeStrategyTool = createTool({
  id: "removeStrategy",
  description: "Removes strategies from the current build by exact parameter matching.",
  inputSchema: z.object({
    strategy: z.object({
      type: z.string(),
      params: z.record(z.any()),
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    current_strategies: z.array(z.any()),
    warnings: z.array(z.string()).optional(),
    suggestions: z.array(z.string()).optional(),
    error_message: z.string().optional(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { strategy } = context;
    const { tradeActionId } = AgentRuntimeContextSchema.parse({
      userId: runtimeContext.get("userId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    if (strategy.type === "positionMonitor") {
      const otherStrategies = await db
        .selectFrom("trade_strategies")
        .where("trade_action_id", "=", tradeActionId)
        .where("strategy_type", "!=", "positionMonitor")
        .selectAll()
        .execute();
      if (otherStrategies.length > 0) {
        return {
          success: false,
          current_strategies: await db
            .selectFrom("trade_strategies")
            .where("trade_action_id", "=", tradeActionId)
            .selectAll()
            .execute(),
          error_message: "Cannot remove position monitor when other strategies exist.",
        };
      }
    }

    const result = await db
      .deleteFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .where("strategy_type", "=", strategy.type)
      .where("strategy_params_json", "=", strategy.params)
      .executeTakeFirst();

    const strategies = await db
      .selectFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .selectAll()
      .execute();

    if (result.numDeletedRows === 0n) {
      return {
        success: false,
        current_strategies: strategies,
        error_message: "No matching strategy found to remove.",
      };
    }

    const analysis = strategyAnalysisService.analyze(strategies, "removeStrategy");

    return {
      success: true,
      current_strategies: strategies,
      warnings: analysis.warnings,
      suggestions: analysis.suggestions,
    };
  },
});
