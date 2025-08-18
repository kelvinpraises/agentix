import { createTool } from "@mastra/core";
import { z } from "zod";

import { marketDataService } from "@/services/trading/market-data-service";
import { createJournalEntry } from "@/services/trading/trade-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const getMarketChartTool = createTool({
  id: "getMarketChart",
  description:
    "Get historical market data (price, market cap, volume) for a specific coin. After using this tool, consider using the logAIThought tool to interpret the technical data with a `type` input of TECHNICAL_ANALYSIS.",
  inputSchema: z.object({
    id: z
      .string()
      .describe(
        "The coin's ID (e.g., 'bitcoin', 'ethereum'). Use getCoinList to find the ID."
      ),
    vs_currency: z.string().default("usd").describe("The target currency."),
    days: z.number().describe("Number of days of historical data."),
  }),
  outputSchema: z.array(
    z.object({
      timestamp: z.number(),
      price: z.number(),
      marketCap: z.number(),
      volume: z.number(),
    })
  ),
  execute: async ({ context, runtimeContext }) => {
    const { id, vs_currency, days } = context;
    const result = await marketDataService.getMarketChart(id, vs_currency, days);

    // Log journal entry for technical data retrieval
    try {
      const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
        sectorId: runtimeContext.get("sectorId"),
        tradeActionId: runtimeContext.get("tradeActionId"),
      });

      await createJournalEntry({
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
