import { createTool } from "@mastra/core";
import { z } from "zod";

import { marketDataService } from "@/services/trading/market-data-service";

export const getMarketChartTool = createTool({
  id: "getMarketChart",
  description:
    "Get historical market data (price, market cap, volume) for a specific coin.",
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
  execute: async ({ context }) => {
    const { id, vs_currency, days } = context;
    return marketDataService.getMarketChart(id, vs_currency, days);
  },
});
