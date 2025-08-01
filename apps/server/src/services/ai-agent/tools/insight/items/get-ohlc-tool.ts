import { createTool } from "@mastra/core";
import { z } from "zod";

import { marketDataService } from "@/services/trading/market-data-service";

export const getOHLCTool = createTool({
  id: "getOHLC",
  description: "Get historical Open, High, Low, Close (OHLC) data for a specific coin.",
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
  execute: async ({ context }) => {
    const { id, vs_currency, days } = context;
    return marketDataService.getOHLC(id, vs_currency, days);
  },
});
