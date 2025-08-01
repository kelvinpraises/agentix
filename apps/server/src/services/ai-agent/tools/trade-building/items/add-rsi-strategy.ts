import { createTool } from "@mastra/core";
import { z } from "zod";

import { db } from "@/database/turso-connection";
import { AgentRuntimeContextSchema } from "@/services/ai-agent/context";
import { strategyAnalysisService } from "@/services/trading/strategy-analysis-service";

export const addRsiStrategyTool = createTool({
  id: "addRsiStrategy",
  description: "Adds RSI-based exit conditions to the trade strategy composition.",
  inputSchema: z.object({
    period: z.number().describe("RSI calculation period"),
    overbought: z.number().describe("Overbought threshold"),
    oversold: z.number().describe("Oversold threshold"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    current_strategies: z.array(z.any()),
    warnings: z.array(z.string()).optional(),
    suggestions: z.array(z.string()).optional(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { period, overbought, oversold } = context;
    const { tradeActionId } = AgentRuntimeContextSchema.parse({
      userId: runtimeContext.get("userId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    await db
      .insertInto("trade_strategies")
      .values({
        trade_action_id: tradeActionId,
        strategy_type: "rsi",
        strategy_params_json: JSON.stringify({ period, overbought, oversold }),
        is_active: true,
      })
      .execute();

    const strategies = await db
      .selectFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .selectAll()
      .execute();
    const analysis = strategyAnalysisService.analyze(strategies, "addRsiStrategy");

    return {
      success: true,
      current_strategies: strategies,
      warnings: analysis.warnings,
      suggestions: analysis.suggestions,
    };
  },
});
