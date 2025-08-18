import { createTool } from "@mastra/core";
import { z } from "zod";

import { sentimentService } from "@/services/trading/sentiment-service";
import { createJournalEntry } from "@/services/trading/trade-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const getSentimentTool = createTool({
  id: "getSentiment",
  description:
    "Get market sentiment for a specific coin from various sources, with optional date ranges. After using this tool, consider using the logAIThought tool to interpret the sentiment data with a `type` input of SENTIMENT_ANALYSIS.",
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
  execute: async ({ context, runtimeContext }) => {
    const result = await sentimentService.getSentiment(context);

    // Log journal entry for sentiment data retrieval
    try {
      const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
        sectorId: runtimeContext.get("sectorId"),
        tradeActionId: runtimeContext.get("tradeActionId"),
      });

      await createJournalEntry({
        sectorId,
        tradeActionId,
        type: "SENTIMENT_DATA_RETRIEVED",
        content: {
          rawData: result,
        },
        isInternal: false,
      });
    } catch (error) {
      console.error("Failed to log sentiment data retrieval:", error);
    }

    return result;
  },
});
