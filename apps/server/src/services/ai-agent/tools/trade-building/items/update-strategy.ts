import { createTool } from "@mastra/core";
import { z } from "zod";

import { db } from "@/database/turso-connection";
import { AgentRuntimeContextSchema } from "@/services/ai-agent/context";
import { strategyAnalysisService } from "@/services/trading/strategy-analysis-service";

export const updateStrategyTool = createTool({
  id: "updateStrategy",
  description:
    "Modifies existing strategies by requiring full parameter matching for safety.",
  inputSchema: z.object({
    current_strategy: z.object({
      type: z.string(),
      params: z.record(z.any()),
    }),
    updated_strategy: z.object({
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
    const { current_strategy, updated_strategy } = context;
    const { tradeActionId } = AgentRuntimeContextSchema.parse({
      userId: runtimeContext.get("userId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    const result = await db
      .updateTable("trade_strategies")
      .set({ strategy_params_json: JSON.stringify(updated_strategy.params) })
      .where("trade_action_id", "=", tradeActionId)
      .where("strategy_type", "=", current_strategy.type)
      .where("strategy_params_json", "=", current_strategy.params)
      .executeTakeFirst();

    const strategies = await db
      .selectFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .selectAll()
      .execute();

    if (result.numUpdatedRows === 0n) {
      return {
        success: false,
        current_strategies: strategies,
        error_message: "No matching strategy found to update.",
      };
    }

    const analysis = strategyAnalysisService.analyze(strategies, "updateStrategy");

    return {
      success: true,
      current_strategies: strategies,
      warnings: analysis.warnings,
      suggestions: analysis.suggestions,
    };
  },
});
