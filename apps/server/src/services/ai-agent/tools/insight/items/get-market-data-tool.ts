import { createTool } from "@mastra/core";
import { z } from "zod";

import {
  marketDataResultSchema,
  marketDataService,
} from "@/services/trading/market-data-service";

export const getMarketDataTool = createTool({
  id: "getMarketData",
  description:
    "Get all detailed market data for a specific coin, including price, sentiment, and developer metrics.",
  inputSchema: z.object({
    id: z.string().describe("The coin's ID (e.g., 'bitcoin')."),
  }),
  outputSchema: marketDataResultSchema,
  execute: async ({ context }) => {
    const { id } = context;
    return marketDataService.getMarketData(id);
  },
});
