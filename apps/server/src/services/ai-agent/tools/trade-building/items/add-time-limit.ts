import { createTool } from "@mastra/core";
import { z } from "zod";

import { db } from "@/database/turso-connection";
import { AgentRuntimeContextSchema } from "@/services/ai-agent/context";
import { strategyAnalysisService } from "@/services/trading/strategy-analysis-service";

export const addTimeLimitTool = createTool({
  id: "addTimeLimit",
  description: "Adds time-based exit conditions to prevent indefinite position holding.",
  inputSchema: z.object({
    duration_seconds: z.number().describe("Duration in seconds before forced exit"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    current_strategies: z.array(z.any()),
    warnings: z.array(z.string()).optional(),
    suggestions: z.array(z.string()).optional(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { duration_seconds } = context;
    const { tradeActionId } = AgentRuntimeContextSchema.parse({
      userId: runtimeContext.get("userId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    await db
      .insertInto("trade_strategies")
      .values({
        trade_action_id: tradeActionId,
        strategy_type: "timeLimit",
        strategy_params_json: JSON.stringify({ duration_seconds }),
        is_active: true,
      })
      .execute();

    const strategies = await db
      .selectFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .selectAll()
      .execute();
    const analysis = strategyAnalysisService.analyze(strategies, "addTimeLimit");

    return {
      success: true,
      current_strategies: strategies,
      warnings: analysis.warnings,
      suggestions: analysis.suggestions,
    };
  },
});
