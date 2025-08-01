import { createTool } from "@mastra/core";
import { z } from "zod";

import { db } from "@/database/turso-connection";
import { AgentRuntimeContextSchema } from "@/services/ai-agent/context";
import { strategyAnalysisService } from "@/services/trading/strategy-analysis-service";

export const viewBuildStateTool = createTool({
  id: "viewBuildState",
  description:
    "Provides a comprehensive view of the current trade build without modifications.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    current_strategies: z.array(z.any()),
    warnings: z.array(z.string()).optional(),
    suggestions: z.array(z.string()).optional(),
    build_completeness: z.string(),
  }),
  execute: async ({ runtimeContext }) => {
    const { tradeActionId } = AgentRuntimeContextSchema.parse({
      userId: runtimeContext.get("userId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    const strategies = await db
      .selectFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .selectAll()
      .execute();

    const analysis = strategyAnalysisService.analyze(strategies, "viewBuildState");

    const hasPositionMonitor = strategies.some(
      (s) => s.strategy_type === "positionMonitor"
    );

    return {
      success: true,
      current_strategies: strategies,
      warnings: analysis.warnings,
      suggestions: analysis.suggestions,
      build_completeness: hasPositionMonitor
        ? "Ready for execution"
        : "Incomplete: Missing position monitor",
    };
  },
});
