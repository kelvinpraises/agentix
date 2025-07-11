import { createTool } from "@mastra/core";
import { z } from "zod";
import { createJournalEntry } from "@/services/core/journal-service";
import { JournalEntryType, JournalEntryContent } from "@/types/journal";

export const journalTools = {
  logDecision: createTool({
    id: "logDecision",
    description: "Logs a decision or event to the user's trade journal.",
    inputSchema: z.object({
      userId: z.number(),
      tradeActionId: z.number().optional(),
      type: z.custom<JournalEntryType>(),
      content: z.custom<JournalEntryContent>(),
      metadata: z.record(z.string(), z.any()).optional(),
      confidenceScore: z.number().optional(),
      isInternal: z.boolean().default(false),
    }),
    outputSchema: z.any(),
    execute: async ({ context }) => {
      const {
        userId,
        tradeActionId,
        type,
        content,
        metadata,
        confidenceScore,
        isInternal,
      } = context;

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
        // Decide if the agent should see this error
        return { success: false, error: "Failed to log journal entry." };
      }
    },
  }),
};