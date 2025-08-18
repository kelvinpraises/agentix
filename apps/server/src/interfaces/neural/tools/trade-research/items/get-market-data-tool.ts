import { createTool } from "@mastra/core";
import { z } from "zod";

import {
  marketDataResultSchema,
  marketDataService,
} from "@/services/trading/market-data-service";
import { AgentRuntimeContextSchema } from "@/types/context";
import { createJournalEntry } from "@/services/trading/trade-service";

export const getMarketDataTool = createTool({
  id: "getMarketData",
  description:
    "Get all detailed market data for a specific coin, including price, sentiment, and developer metrics. After using this tool, consider using the logAIThought tool to interpret the market data with a `type` input of MARKET_DATA_ANALYSIS.",
  inputSchema: z.object({
    id: z.string().describe("The coin's ID (e.g., 'bitcoin')."),
  }),
  outputSchema: marketDataResultSchema,
  execute: async ({ context, runtimeContext }) => {
    const { id } = context;
    const result = await marketDataService.getMarketData(id);

    // Log journal entry for data retrieval
    try {
      const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
        sectorId: runtimeContext.get("sectorId"),
        tradeActionId: runtimeContext.get("tradeActionId"),
      });

      await createJournalEntry({
        sectorId,
        tradeActionId,
        type: "MARKET_DATA_RETRIEVED",
        content: {
          rawData: result,
        },
        isInternal: false,
      });
    } catch (error) {
      console.error("Failed to log market data retrieval:", error);
    }

    return result;
  },
});
