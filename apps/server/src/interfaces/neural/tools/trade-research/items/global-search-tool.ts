import { createTool } from "@mastra/core";
import { z } from "zod";

import { sentimentService } from "@/services/trading/sentiment-service";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const globalSearchTool = createTool({
  id: "globalSearch",
  description:
    "Performs a global search for any query, with optional date ranges. After using this tool, consider using the logAIThought tool to interpret the news data with a `type` input of NEWS_ANALYSIS.",
  inputSchema: z.object({
    searchTerm: z.string().describe("The search query."),
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
    const result = await sentimentService.globalSearch(context);

    // Log journal entry for news data retrieval
    try {
      const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
        sectorId: runtimeContext.get("sectorId"),
        tradeActionId: runtimeContext.get("tradeActionId"),
      });

      await tradeActionService.createJournalEntry({
        sectorId,
        tradeActionId,
        type: "NEWS_DATA_RETRIEVED",
        content: {
          rawData: result,
        },
        isInternal: false,
      });
    } catch (error) {
      console.error("Failed to log news data retrieval:", error);
    }

    return result;
  },
});
