import { createTool } from "@mastra/core";
import { z } from "zod";

import { marketDataService } from "@/services/trading/market-data-service";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const getOHLCTool = createTool({
  id: "getOHLC",
  description:
    "Get historical Open, High, Low, Close (OHLC) data for a specific coin. After using this tool, consider using the logAIThought tool to interpret the technical data with a `type` input of TECHNICAL_ANALYSIS.",
  inputSchema: z.object({
    id: z.string().describe("The coin's ID (e.g., 'bitcoin')."),
    vs_currency: z.string().default("usd").describe("The target currency."),
    days: z
      .number()
      .describe("Number of days of historical data (1, 7, 14, 30, 90, 180, 365, max)."),
  }),
  outputSchema: z.array(
    z.object({
      x: z.number(),
      o: z.number(),
      h: z.number(),
      l: z.number(),
      c: z.number(),
    })
  ),
  execute: async ({ context, runtimeContext }) => {
    const { id, vs_currency, days } = context;
    const result = await marketDataService.getOHLC(id, vs_currency, days);

    // Log journal entry for technical data retrieval
    try {
      const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
        sectorId: runtimeContext.get("sectorId"),
        tradeActionId: runtimeContext.get("tradeActionId"),
      });

      await tradeActionService.createJournalEntry({
        sectorId,
        tradeActionId,
        type: "TECHNICAL_DATA_RETRIEVED",
        content: {
          rawData: result,
        },
        isInternal: false,
      });
    } catch (error) {
      console.error("Failed to log technical data retrieval:", error);
    }

    return result;
  },
});
