import { createTool } from "@mastra/core";
import { z } from "zod";

import { tradespaceService } from "@/services/user/tradespace-service";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";

export const getOrbContextTool = createTool({
  id: "getOrbContext",
  description:
    "Get detailed context for the locked orb, including its purpose/strategy description, available threads with descriptions, wallet balances, and active positions. You MUST call lockOrbSelection first before using this tool.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    orbId: z.number().optional(),
    orbName: z.string().optional(),
    chain: z.string().optional(),
    context: z.string().optional(),
    assetPairs: z.record(z.number()).optional(),
    threads: z
      .array(
        z.object({
          type: z.string(),
          providerId: z.string(),
          description: z.string().nullable(),
          enabled: z.boolean(),
        })
      )
      .optional(),
    walletAddress: z.string().optional(),
    message: z.string().optional(),
  }),
  execute: async ({ runtimeContext }) => {
    const { sectorId, tradeActionId, lockedOrbId } = AgentRuntimeContextSchema.parse({
      sectorId: runtimeContext.get("sectorId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
      lockedOrbId: runtimeContext.get("lockedOrbId"),
    });

    // Check if orb is locked
    if (!lockedOrbId) {
      return {
        success: false,
        message:
          "No orb has been locked yet. Please use lockOrbSelection first to choose an orb before accessing its context.",
      };
    }

    // Fetch orb with threads
    const userId = 1; // TODO: Get from context when auth is integrated
    const orbData = await tradespaceService.getOrbWithThreads(lockedOrbId, userId);

    if (!orbData) {
      return {
        success: false,
        message: `Locked orb ${lockedOrbId} not found`,
      };
    }

    // Parse asset pairs
    const assetPairs =
      typeof orbData.asset_pairs === "string"
        ? JSON.parse(orbData.asset_pairs)
        : orbData.asset_pairs;

    // Parse threads
    const threads = orbData.threads.map((thread) => ({
      type: thread.type,
      providerId: thread.provider_id,
      description: thread.description || null,
      enabled: thread.enabled,
    }));

    // Log journal entry for context retrieval
    try {
      await tradeActionService.createJournalEntry({
        sectorId,
        tradeActionId,
        type: "ORB_CONTEXT_RETRIEVED",
        content: {
          orbId: lockedOrbId,
          orbName: orbData.name,
          threadsCount: threads.length,
          context: orbData.context,
        },
        isInternal: false,
      });
    } catch (error) {
      console.error("Failed to log orb context retrieval:", error);
    }

    return {
      success: true,
      orbId: orbData.id,
      orbName: orbData.name,
      chain: orbData.chain,
      context: orbData.context || "No context provided for this orb",
      assetPairs,
      threads,
      walletAddress: orbData.wallet_address,
      message: `Successfully retrieved context for orb: ${orbData.name}`,
    };
  },
});