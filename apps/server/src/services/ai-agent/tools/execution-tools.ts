import { createTool } from "@mastra/core";
import { z } from "zod";
import { journalTools } from "./journal-tools";
import { sendTradeProposal } from "@/services/core/notification-service";
import {
  EnterPositionProposal,
  ExitPositionProposal,
  AdjustPositionProposal,
  SwapProposal,
} from "@/types/journal";

export const executionTools = {
  enterPosition: createTool({
    id: "enterPosition",
    description: "Proposes a new trade, logs it, and notifies the user for approval.",
    inputSchema: z.object({
      userId: z.number(),
      tradeActionId: z.number(),
      fromToken: z.string(),
      toToken: z.string(),
      amount: z.string(),
      chain: z.enum(["ethereum", "solana"]),
      dex: z.string(),
      strategy: z.string(),
      slippagePercent: z.number().default(0.5),
      stopLossPrice: z.number().optional(),
      takeProfitPrice: z.number().optional(),
      riskLevel: z.enum(["low", "medium", "high"]),
      reasoning: z.string(),
      confidenceScore: z.number(),
    }),
    outputSchema: z.any(),
    execute: async ({ context, runtimeContext }) => {
      const { userId, tradeActionId, reasoning, confidenceScore, ...tradeDetails } = context;

      const proposal: EnterPositionProposal = {
        proposalType: "ENTER_POSITION",
        pair: `${tradeDetails.toToken}/${tradeDetails.fromToken}`,
        ...tradeDetails,
      };

      const logResult = await journalTools.logDecision.execute({
        context: {
          userId,
          tradeActionId,
          type: "TRADE_EXECUTION",
          content: {
            contentType: "TRADE_EXECUTION",
            message: `AI proposes entering a position: ${reasoning}`,
            trade_details: proposal,
            status: "pending",
            confidence_score: confidenceScore,
          },
          isInternal: false,
        },
        runtimeContext,
      });

      if (!logResult.success || !logResult.entryId) {
        return { success: false, error: "Failed to log trade execution." };
      }

      await sendTradeProposal(userId, tradeActionId, logResult.entryId, "ENTER_POSITION");

      return { success: true, status: "pending_user_action", entryId: logResult.entryId };
    },
  }),

  exitPosition: createTool({
    id: "exitPosition",
    description: "Proposes to exit a position, logs it, and notifies the user.",
    inputSchema: z.object({
      userId: z.number(),
      tradeActionId: z.number(),
      positionId: z.string(),
      exitAmount: z.string(),
      exitType: z.enum(["FULL", "PARTIAL", "STOP_LOSS", "TAKE_PROFIT"]),
      chain: z.enum(["ethereum", "solana"]),
      dex: z.string(),
      strategy: z.string(),
      slippagePercent: z.number().default(0.5),
      riskLevel: z.enum(["low", "medium", "high"]),
      reasoning: z.string(),
      confidenceScore: z.number(),
    }),
    outputSchema: z.any(),
    execute: async ({ context, runtimeContext }) => {
      const { userId, tradeActionId, reasoning, confidenceScore, ...tradeDetails } = context;

      const proposal: ExitPositionProposal = {
        proposalType: "EXIT_POSITION",
        ...tradeDetails,
      };

      const logResult = await journalTools.logDecision.execute({
        context: {
          userId,
          tradeActionId,
          type: "TRADE_EXECUTION",
          content: {
            contentType: "TRADE_EXECUTION",
            message: `AI proposes exiting position ${tradeDetails.positionId}: ${reasoning}`,
            trade_details: proposal,
            status: "pending",
            confidence_score: confidenceScore,
          },
          isInternal: false,
        },
        runtimeContext,
      });

      if (!logResult.success || !logResult.entryId) {
        return { success: false, error: "Failed to log position exit." };
      }
      
      await sendTradeProposal(userId, tradeActionId, logResult.entryId, "EXIT_POSITION");

      return { success: true, status: "pending_user_action", entryId: logResult.entryId };
    },
  }),

  adjustPosition: createTool({
    id: "adjustPosition",
    description: "Proposes to adjust a position, logs it, and notifies the user.",
    inputSchema: z.object({
      userId: z.number(),
      tradeActionId: z.number(),
      positionId: z.string(),
      adjustmentType: z.enum(["STOP_LOSS", "TAKE_PROFIT", "BOTH"]),
      newStopLossPrice: z.number().optional(),
      newTakeProfitPrice: z.number().optional(),
      reason: z.string(),
      riskLevel: z.enum(["low", "medium", "high"]),
      confidenceScore: z.number(),
    }),
    outputSchema: z.any(),
    execute: async ({ context, runtimeContext }) => {
      const { userId, tradeActionId, confidenceScore, ...tradeDetails } = context;

      const proposal: AdjustPositionProposal = {
        proposalType: "ADJUST_POSITION",
        ...tradeDetails,
      };

      const logResult = await journalTools.logDecision.execute({
        context: {
          userId,
          tradeActionId,
          type: "TRADE_EXECUTION",
          content: {
            contentType: "TRADE_EXECUTION",
            message: `AI proposes adjusting position ${tradeDetails.positionId}: ${tradeDetails.reason}`,
            trade_details: proposal,
            status: "pending",
            confidence_score: confidenceScore,
          },
          isInternal: false,
        },
        runtimeContext,
      });

      if (!logResult.success || !logResult.entryId) {
        return { success: false, error: "Failed to log position adjustment." };
      }

      await sendTradeProposal(userId, tradeActionId, logResult.entryId, "ADJUST_POSITION");

      return { success: true, status: "pending_user_action", entryId: logResult.entryId };
    },
  }),

  swapPosition: createTool({
    id: "swapPosition",
    description: "Proposes a token swap, logs it, and notifies the user.",
    inputSchema: z.object({
      userId: z.number(),
      tradeActionId: z.number(),
      fromToken: z.string(),
      toToken: z.string(),
      amount: z.string(),
      chain: z.enum(["ethereum", "solana"]),
      dex: z.string(),
      strategy: z.string(),
      slippagePercent: z.number().default(0.5),
      riskLevel: z.enum(["low", "medium", "high"]),
      reasoning: z.string(),
      confidenceScore: z.number(),
    }),
    outputSchema: z.any(),
    execute: async ({ context, runtimeContext }) => {
      const { userId, tradeActionId, reasoning, confidenceScore, ...tradeDetails } = context;

      const proposal: SwapProposal = {
        proposalType: "SWAP",
        ...tradeDetails,
      };

      const logResult = await journalTools.logDecision.execute({
        context: {
          userId,
          tradeActionId,
          type: "TRADE_EXECUTION",
          content: {
            contentType: "TRADE_EXECUTION",
            message: `AI proposes swapping ${tradeDetails.amount} ${tradeDetails.fromToken} for ${tradeDetails.toToken}: ${reasoning}`,
            trade_details: proposal,
            status: "pending",
            confidence_score: confidenceScore,
          },
          isInternal: false,
        },
        runtimeContext,
      });

      if (!logResult.success || !logResult.entryId) {
        return { success: false, error: "Failed to log swap proposal." };
      }
      
      await sendTradeProposal(userId, tradeActionId, logResult.entryId, "SWAP");

      return { success: true, status: "pending_user_action", entryId: logResult.entryId };
    },
  }),
};