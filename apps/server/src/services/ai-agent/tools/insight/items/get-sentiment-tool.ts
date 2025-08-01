import { createTool } from "@mastra/core";
import { z } from "zod";

import { sentimentService } from "@/services/trading/sentiment-service";

export const getSentimentTool = createTool({
  id: "getSentiment",
  description:
    "Get market sentiment for a specific coin from various sources, with optional date ranges.",
  inputSchema: z.object({
    symbol: z.string().describe("The coin's symbol (e.g., 'BTC', 'ETH')."),
    sources: z
      .array(z.string())
      .optional()
      .describe("Optional list of sources (domains) to search."),
    startPublishedDate: z
      .string()
      .optional()
      .describe("The start date for published results (e.g., YYYY-MM-DD)."),
    endPublishedDate: z
      .string()
      .optional()
      .describe("The end date for published results (e.g., YYYY-MM-DD)."),
    startCrawlDate: z
      .string()
      .optional()
      .describe("The start date for crawled results (e.g., YYYY-MM-DD)."),
    endCrawlDate: z
      .string()
      .optional()
      .describe("The end date for crawled results (e.g., YYYY-MM-DD)."),
  }),
  outputSchema: z.any(), // The Exa response is complex, any is acceptable here
  execute: async ({ context }) => {
    return sentimentService.getSentiment(context);
  },
});
