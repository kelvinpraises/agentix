import { createTool } from "@mastra/core";
import { z } from "zod";

import { db } from "@/database/turso-connection";
import { AgentRuntimeContextSchema } from "@/services/ai-agent/context";
import { strategyAnalysisService } from "@/services/trading/strategy-analysis-service";

export const addSmaCrossStrategyTool = createTool({
  id: "addSmaCrossStrategy",
  description: "Adds simple moving average crossover exit conditions.",
  inputSchema: z.object({
    fast_period: z.number().describe("Fast moving average period"),
    slow_period: z.number().describe("Slow moving average period"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    current_strategies: z.array(z.any()),
    warnings: z.array(z.string()).optional(),
    suggestions: z.array(z.string()).optional(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { fast_period, slow_period } = context;
    const { tradeActionId } = AgentRuntimeContextSchema.parse({
      userId: runtimeContext.get("userId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    await db
      .insertInto("trade_strategies")
      .values({
        trade_action_id: tradeActionId,
        strategy_type: "smaCross",
        strategy_params_json: JSON.stringify({ fast_period, slow_period }),
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
      "addSmaCrossStrategy"
    );

    return {
      success: true,
      current_strategies: strategies,
      warnings: analysis.warnings,
      suggestions: analysis.suggestions,
    };
  },
});
