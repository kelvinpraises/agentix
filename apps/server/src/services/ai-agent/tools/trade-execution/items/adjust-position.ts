import { createTool } from "@mastra/core";
import { z } from "zod";

import { db } from "@/database/turso-connection";
import { AgentRuntimeContextSchema } from "@/services/ai-agent/context";

export const adjustPositionTool = createTool({
  id: "adjustPosition",
  description: "Modifies position size or parameters for active trades.",
  inputSchema: z.object({
    newStopLoss: z.number().optional(),
    newTakeProfit: z.number().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { newStopLoss, newTakeProfit } = context;
    const { tradeActionId } = AgentRuntimeContextSchema.parse({
      userId: runtimeContext.get("userId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    const positionMonitor = await db
      .selectFrom("trade_strategies")
      .where("trade_action_id", "=", tradeActionId)
      .where("strategy_type", "=", "positionMonitor")
      .select("strategy_params_json")
      .executeTakeFirst();

    if (!positionMonitor) {
      return {
        success: false,
        message: "No position monitor found for this trade.",
      };
    }

    const params = JSON.parse(positionMonitor.strategy_params_json as string);

    if (newStopLoss) {
      params.stopLoss = newStopLoss;
    }
    if (newTakeProfit) {
      params.takeProfit = newTakeProfit;
    }

    await db
      .updateTable("trade_strategies")
      .set({ strategy_params_json: JSON.stringify(params) })
      .where("trade_action_id", "=", tradeActionId)
      .where("strategy_type", "=", "positionMonitor")
      .execute();

    return {
      success: true,
      message: `Position monitor for trade ${tradeActionId} has been updated.`,
    };
  },
});
