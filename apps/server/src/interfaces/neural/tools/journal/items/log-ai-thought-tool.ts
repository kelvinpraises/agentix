import { createTool } from "@mastra/core";
import { z } from "zod";

import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";

// Define the AI analysis and reflection types
const aiAnalysisTypes = [
  "MARKET_DATA_ANALYSIS",
  "SENTIMENT_ANALYSIS",
  "TECHNICAL_ANALYSIS",
  "COIN_ANALYSIS",
  "NEWS_ANALYSIS",
] as const;

const aiReflectionTypes = [
  "RESEARCH_SYNTHESIS",
  "EXECUTION_CONFIDENCE",
  "TRADE_REFLECTION",
] as const;

const validTypes = [...aiAnalysisTypes, ...aiReflectionTypes] as const;

export const logAIThoughtTool = createTool({
  id: "logAIThought",
  description: `Log AI analysis or reflection entries to the trade journal. 
  
Analysis Types (follow research tool calls):
- MARKET_DATA_ANALYSIS: After getMarketData - analyze price trends, volume patterns, support/resistance levels
- SENTIMENT_ANALYSIS: After getSentiment - evaluate overall sentiment, key themes, contrarian signals  
- TECHNICAL_ANALYSIS: After getOHLC/getMarketChart - assess trend direction, indicators, trade signals
- COIN_ANALYSIS: After getCoinList - identify recommended coins, opportunities, risk factors
- NEWS_ANALYSIS: After globalSearch - determine market impact, key events, implications

Reflection Types (AI synthesis between phases):  
- RESEARCH_SYNTHESIS: Combine research findings, market outlook, opportunities, risks, recommended action
- EXECUTION_CONFIDENCE: Express execution readiness, confidence factors, concerns, backup plans
- TRADE_REFLECTION: Post-trade analysis - outcome, lessons learned, strategy performance, improvements`,

  inputSchema: z.object({
    type: z.enum(validTypes).describe("The type of AI thought to log"),
    message: z
      .string()
      .min(10)
      .describe("Your analysis, insights, or reflection - explain what you're thinking"),
    confidenceScore: z
      .number()
      .min(0)
      .max(1)
      .describe("Confidence level for your reasoning (0-1)"),
  }),

  execute: async ({ context, runtimeContext }) => {
    const { type, message, confidenceScore } = context;

    const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
      sectorId: runtimeContext.get("sectorId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    try {
      const entry = await tradeActionService.createJournalEntry({
        sectorId,
        tradeActionId,
        type,
        content: {
          reasoning: message,
        },
        confidenceScore,
        isInternal: false,
      });

      return {
        success: true,
        entryId: entry.id,
        message: `Logged ${type.toLowerCase().replace(/_/g, " ")}`,
      };
    } catch (error) {
      console.error("Failed to log AI thought:", error);
      return {
        success: false,
        error: "Failed to log AI thought to journal.",
      };
    }
  },
});
