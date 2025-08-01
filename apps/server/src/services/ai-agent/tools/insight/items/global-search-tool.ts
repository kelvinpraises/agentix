import { createTool } from "@mastra/core";
import { z } from "zod";

import { sentimentService } from "@/services/trading/sentiment-service";

export const globalSearchTool = createTool({
  id: "globalSearch",
  description: "Performs a global search for any query, with optional date ranges.",
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
  execute: async ({ context }) => {
    return sentimentService.globalSearch(context);
  },
});
