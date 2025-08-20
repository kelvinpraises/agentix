import { createTool } from "@mastra/core";
import { z } from "zod";

import { marketDataService } from "@/services/trading/market-data-service";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const getCoinListTool = createTool({
  id: "getCoinList",
  description:
    "Get a list of all supported coins to find their CoinGecko ID. Can be filtered by a search term. After using this tool, consider using the logAIThought tool to interpret the coin data with a `type` input of COIN_ANALYSIS.",
  inputSchema: z.object({
    searchTerm: z
      .string()
      .optional()
      .describe("An optional term to search for specific coins."),
  }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      symbol: z.string(),
      name: z.string(),
      platforms: z.record(z.string()).optional(),
    })
  ),
  execute: async ({ context, runtimeContext }) => {
    const result = await marketDataService.getCoinList(context.searchTerm);

    // Log journal entry for coin data retrieval
    try {
      const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
        sectorId: runtimeContext.get("sectorId"),
        tradeActionId: runtimeContext.get("tradeActionId"),
      });

      await tradeActionService.createJournalEntry({
        sectorId,
        tradeActionId,
        type: "COIN_DATA_RETRIEVED",
        content: {
          rawData: result,
        },
        isInternal: false,
      });
    } catch (error) {
      console.error("Failed to log coin data retrieval:", error);
    }

    return result;
  },
});
