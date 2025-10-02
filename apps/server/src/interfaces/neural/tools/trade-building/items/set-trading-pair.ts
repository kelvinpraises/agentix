import { createTool } from "@mastra/core";
import { z } from "zod";

import { tokenService } from "@/services/system/token-service";
import { tradeActionService } from "@/services/trading/trade-action-service";
import { AgentRuntimeContextSchema } from "@/types/context";
import { ChainType } from "@/types/orb";

export const setTradingPairTool = createTool({
  id: "setTradingPair",
  description:
    "Sets the trading pair and orb for this trade action. Must be called before adding position monitor. Validates the pair exists on the selected orb and chain. This is the first step in building a trade strategy.",
  inputSchema: z.object({
    orbId: z.number().describe("The ID of the orb to use for this trade"),
    tradingPair: z.string().describe("Trading pair (e.g., 'ETH/USDC', 'SOL/USDT')"),
    reasoning: z
      .string()
      .describe(
        "Explain why you selected this orb and trading pair based on market analysis"
      ),
    confidenceScore: z
      .number()
      .min(0)
      .max(1)
      .describe("Confidence level for your selection (0-1)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    orbInfo: z
      .object({
        id: z.number(),
        chain: z.string(),
        tradingPair: z.string(),
      })
      .optional(),
    error_message: z.string().optional(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { orbId, tradingPair, reasoning, confidenceScore } = context;
    const { sectorId, tradeActionId } = AgentRuntimeContextSchema.parse({
      sectorId: runtimeContext.get("sectorId"),
      tradeActionId: runtimeContext.get("tradeActionId"),
    });

    try {
      const orbInfo = await tradeActionService.getOrbById(orbId);

      if (!orbInfo) {
        return {
          success: false,
          message: "Orb not found",
          error_message: "Orb not found",
        };
      }

      if (orbInfo.sector_id !== sectorId) {
        return {
          success: false,
          message: "Orb does not belong to the specified sector",
          error_message: "Orb does not belong to the specified sector",
        };
      }

      const chainValidation = tokenService.validateAssetPair(
        orbInfo.chain as ChainType,
        tradingPair
      );

      if (!chainValidation.isValid) {
        return {
          success: false,
          message: `Trading pair ${tradingPair} is not supported on ${orbInfo.chain} chain`,
          error_message: "Trading pair not supported on selected chain",
        };
      }

      await tradeActionService.setTradingPair(tradeActionId, orbId, tradingPair);

      await tradeActionService.createJournalEntry({
        sectorId,
        tradeActionId,
        type: "TRADING_PAIR_SELECTED",
        content: {
          orb_id: orbId,
          trading_pair: tradingPair,
          chain: orbInfo.chain,
          available_dexes: chainValidation.availableDexes || [],
          reasoning,
        },
        confidenceScore,
        isInternal: false,
      });

      return {
        success: true,
        message: `Trading pair ${tradingPair} set for orb on ${orbInfo.chain} chain`,
        orbInfo: {
          id: orbId,
          chain: orbInfo.chain,
          tradingPair,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      return {
        success: false,
        message: errorMessage,
        error_message: errorMessage,
      };
    }
  },
});
