import { createTool } from "@mastra/core";
import { z } from "zod";

import { marketDataService } from "@/services/trading/market-data-service";

export const getCoinListTool = createTool({
  id: "getCoinList",
  description:
    "Get a list of all supported coins to find their CoinGecko ID. Can be filtered by a search term.",
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
  execute: async ({ context }) => {
    return marketDataService.getCoinList(context.searchTerm);
  },
});
