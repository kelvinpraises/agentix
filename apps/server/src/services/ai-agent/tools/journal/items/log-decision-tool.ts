import { createTool } from "@mastra/core";
import { z } from "zod";

import { AgentRuntimeContextSchema } from "@/services/ai-agent/context";
import { createJournalEntry } from "@/services/trading/trade-service";
import { JournalEntryContent, JournalEntryType } from "@/types/journal";

export const logDecisionTool = createTool({
  id: "logDecision",
  description: "Logs a decision or event to the user's trade journal.",
  inputSchema: z.object({
    type: z.custom<JournalEntryType>(),
    content: z.custom<JournalEntryContent>(),
    metadata: z.record(z.string(), z.any()).optional(),
    confidenceScore: z.number().optional(),
    isInternal: z.boolean().default(false),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { type, content, metadata, confidenceScore, isInternal } = context;
    const { userId, tradeActionId } = AgentRuntimeContextSchema.parse({
      userId: runtimeContext.get("userId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    try {
      const entry = await createJournalEntry({
        userId,
        tradeActionId,
        type,
        content,
        metadata,
        confidenceScore,
        isInternal,
      });
      return { success: true, entryId: entry.id };
    } catch (error) {
      console.error("Failed to log journal entry:", error);
      return { success: false, error: "Failed to log journal entry." };
    }
  },
});
